"""
Editable PPTX visual reconstruction pipeline.

This module owns the GPT-driven visual path:
1. analyze a rendered slide image into editable visual layers,
2. generate independent non-text PNG layers with the configured image model,
3. compose those layers back into a PPTX slide,
4. compare rendered output against the source image when a renderer is available.
"""
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from textwrap import dedent
from typing import Any, Dict, List, Optional

from PIL import Image, ImageChops, ImageStat

logger = logging.getLogger(__name__)


@dataclass
class SlideStructure:
    """
    Vision model output for a single slide.

    shapes are PPT-native vector candidates. image_layers are non-text visual
    elements that should be independently generated and placed back by bbox.
    """
    background_type: str = 'image'
    background_color: Optional[str] = None
    shapes: List[Dict[str, Any]] = field(default_factory=list)
    image_layers: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class VisualComparisonResult:
    """Pixel-level comparison result between source page and reconstructed render."""
    score: float
    mean_abs_error: float
    max_channel_error: float
    passed: bool
    reference_size: tuple[int, int]
    candidate_size: tuple[int, int]


class VisualPipelineServiceError(RuntimeError):
    """Provider/config/runtime error that should be shown directly to users."""


_VISUAL_STRUCTURE_PROMPT = """\
你是PPT视觉结构分析专家。目标：将幻灯片的视觉元素**尽可能多地分解为独立可编辑图层**。
请系统地从底层到顶层识别所有有颜色填充的形状和非文字图片元素，**只返回JSON，不要任何说明文字**。

## 背景分析
判断幻灯片整体背景类型：
- "solid"：整个背景是均匀纯色（包括深色/浅色纯色背景）
- "gradient"：背景有渐变色
- "image"：背景包含照片、纹理或复杂图案

## 形状识别（重要：请尽量多识别，宁多勿少）
**从底层到顶层**，识别所有以下类型的视觉形状：

1. **大面积背景色块**：占据幻灯片大部分区域的有色区域（如深色背景、标题背景色块）
2. **标题栏/顶部色条**：顶部或底部的横向色条
3. **内容卡片**：承载文字或图标的圆角矩形、矩形卡片，包括白色/浅色卡片
4. **信息面板/侧边栏**：左侧或右侧的纵向色块
5. **数字/序号背景**：圆形、菱形等小型编号容器
6. **标签/徽章**：小型标注、pill形状、tag形状
7. **进度条/时间线**：横向或纵向的条状色块
8. **图标容器**：承载图标的圆形或方形背景
9. **时间轴线条**：水平或垂直的渐变/纯色线条（任意宽度，哪怕只有2px，只要是独立的色条）
10. **时间轴节点**：线条上的小圆形/圆点（彩色实心圆），用 ellipse 类型识别
11. **分隔装饰**：有明显宽度（≥3px）的横线或竖线色块
12. **半透明蒙层**：带透明度的覆盖层
13. **信息图主体**：维恩图、重叠圆、半透明大圆、中心交叠高亮区域、矩阵/象限图、流程箭头、关系图节点
14. **版式辅助线**：页脚分隔线、标题下划线、角标线、细边框、品牌占位文字附近的装饰线

**关键提示：**
- 即使卡片/色块颜色接近背景色（如白色卡片在浅色背景上），只要有可见边框、阴影或轻微颜色差异，也必须识别
- 圆角矩形卡片哪怕边框只有1-2px细线也要识别，fill_color 取卡片内部填充色
- 时间轴上的彩色圆点（通常直径10-30px）必须用 ellipse 类型识别，fill_color 取圆点颜色
- 维恩图必须拆成多个 ellipse：左右半透明大圆、中心交叠区高亮形状都要独立识别；不要把它们当作背景
- 左右信息卡片组必须拆成 rounded_rect 卡片容器；图标本身放入 image_layers 或用 ellipse 图标底处理
- 右上角品牌占位、页脚分隔线、日期/密级区域附近的浅色线条也应作为独立 rect/line-like rect 识别
- 宁可多识别（后续可手动删除），不要漏识别
**只要能目视区分为独立色块/形状的，都应当识别出来。忽略：纯文字本身。**

## 非文字图片层识别（必须拆层，并由 GPT 图片模型重建）
请额外识别所有不能用普通 PPT 形状高保真表达、但应当在 PPT 中独立拖动的内容元素。
这些元素后续会逐个交给 GPT 图片模型生成独立 PNG 文件，再按 bbox 放回 PPT，所以 bbox 和提示词必须精确：
- 图标、复杂 icon、logo、徽章、钻石、贴纸、3D 插画、中心大图、人物/产品/设备图
- 卡片内的独立装饰图形、模块图标、复杂渐变图案
- 数据图中的非文字图形块（如果不是简单矩形/圆形）
- 任何无法用 rect / rounded_rect / ellipse 精确表达的视觉组件

不要把图标、文字和卡片合成一张图；卡片/容器应放在 shapes，图标/复杂插画应放在 image_layers。
背景圆环、连线、光效、点阵、纯装饰纹理可以作为 background/decorative 图层；承载内容的模块元素必须独立拆出来。
image_layers 中禁止包含文字；如果图层原本含文字，请只生成其非文字视觉部分，文字由 OCR/文本框单独重建。

图片分辨率：{width}x{height} 像素
已识别的文本元素坐标参考（用于辅助定位承载文字的容器）：
{text_elements_json}

返回格式（严格JSON，不要注释）：
{{
  "background": {{"type": "solid", "color": "#1A1A2E"}},
  "shapes": [
    {{
      "type": "rounded_rect",
      "bbox": [120, 200, 800, 500],
      "fill_color": "#2D2D44",
      "corner_radius": 0.1,
      "transparency": 0.0,
      "border_color": null,
      "border_width_px": 0,
      "shadow": {{"blur_pt": 6, "offset_y_pt": 3, "color": "#000000", "opacity": 0.25}}
    }}
  ],
  "image_layers": [
    {{
      "type": "icon",
      "bbox": [160, 260, 230, 330],
      "description": "white outline rocket icon inside the top-left module",
      "generation_prompt": "Generate only the white outline rocket icon, no text, transparent background, crisp vector-like edges, match the reference crop exactly.",
      "transparent_background": true,
      "role": "content"
    }}
  ]
}}

字段说明：
- type: "rect"（矩形）、"rounded_rect"（圆角矩形）、"ellipse"（椭圆/圆形）
- bbox: [x_left, y_top, x_right, y_bottom]，坐标必须在 [0,0,{width},{height}] 范围内
- fill_color: 十六进制颜色 "#RRGGBB"，必须填写
- corner_radius: 0.0~0.5，圆角程度（仅 rounded_rect 有效）
- transparency: 0.0（不透明）~ 1.0（完全透明）
- border_color: 边框颜色或 null
- border_width_px: 边框宽度像素，无边框填 0
- shadow: 有阴影填写 {{"blur_pt":..., "offset_y_pt":..., "color":"#000000", "opacity":...}}，无阴影填 null
- background.color：背景是纯色时填十六进制颜色，其他情况填 null
- shapes 和 image_layers 不允许同时为空；如果页面看似简单，也必须至少返回可见的背景色块、卡片、装饰线、图标或关键视觉元素
- image_layers 可以为空 []，但仅限所有非文字视觉元素都已可用 shapes 表达；role 为 "content" 或 "decorative"，内容模块内的图标/插画必须为 content
- image_layers.generation_prompt：给 GPT 图片模型生成该独立元素 PNG 的完整提示词；必须说明“只生成该元素、不要文字、透明背景/纯净背景、匹配参考裁切图”
"""

_VISUAL_STRUCTURE_STRICT_RETRY_SUFFIX = """\

上一次结果没有返回有效图层。请重新分析，必须返回至少一个 shapes 或 image_layers 项。
不要回答空数组。把所有可见非文字元素都拆出来，包括：
- 白色/浅色卡片容器、圆角卡片边框、页脚横线、标题装饰线
- 维恩图/重叠圆/半透明圆/中心交叠高亮
- 图标、logo、角标、页脚图标、品牌占位附近的装饰
- 背景中的可见色块、分隔线、模块容器
如果元素可用 PPT 矢量表达，放入 shapes；否则放入 image_layers 并提供 generation_prompt。
"""


class EditablePptxVisualPipeline:
    """Stable orchestration surface for GPT-driven editable PPTX reconstruction."""

    @staticmethod
    def is_ai_service_error(error: Exception) -> bool:
        text = str(error).lower()
        service_markers = (
            '429',
            'rate limit',
            'ratelimit',
            'usage_limit',
            'daily_limit',
            'quota',
            'insufficient_quota',
            'unauthorized',
            '401',
            '403',
            'api key',
            'caption_provider 不支持图片输入',
        )
        return any(marker in text for marker in service_markers)

    def analyze_slide_structure(
        self,
        image_path: str,
        text_elements: List[Dict[str, Any]],
        ai_service,
        image_width: int = 1920,
        image_height: int = 1080,
    ) -> Optional[SlideStructure]:
        """Run GPT visual structure analysis for one slide."""
        try:
            safe_elements = [
                {'id': e['id'], 'text': e['text'][:20], 'bbox': e['bbox']}
                for e in text_elements[:80]
            ]
            prompt = _VISUAL_STRUCTURE_PROMPT.format(
                width=image_width,
                height=image_height,
                text_elements_json=json.dumps(safe_elements, ensure_ascii=False),
            )
            prompts = [prompt, prompt + _VISUAL_STRUCTURE_STRICT_RETRY_SUFFIX]

            for attempt, attempt_prompt in enumerate(prompts, start=1):
                result = ai_service.generate_json_with_image(prompt=attempt_prompt, image_path=image_path)
                structure = self._parse_structure_result(result, image_width, image_height, attempt)
                if structure and (structure.shapes or structure.image_layers):
                    return structure
                logger.warning(
                    "视觉结构分析返回空图层，将重试: "
                    f"attempt={attempt}, result={json.dumps(result, ensure_ascii=False)[:1000]}"
                )
            return None
        except Exception as e:
            if isinstance(e, VisualPipelineServiceError):
                raise
            if self.is_ai_service_error(e):
                raise VisualPipelineServiceError(str(e)) from e
            logger.warning(f"视觉结构分析失败，将跳过形状渲染: {e}")
            return None

    def _parse_structure_result(
        self,
        result: Any,
        image_width: int,
        image_height: int,
        attempt: int,
    ) -> Optional[SlideStructure]:
        if not isinstance(result, dict):
            logger.warning(f"视觉结构分析: 第 {attempt} 次返回值不是 dict，跳过")
            return None

        bg = result.get('background', {}) or {}
        structure = SlideStructure(
            background_type=bg.get('type', 'image'),
            background_color=bg.get('color'),
        )

        for s in result.get('shapes', []) or []:
            bbox = s.get('bbox', [])
            if not self._is_valid_bbox(bbox, image_width, image_height):
                logger.debug(f"视觉结构分析: 无效 bbox {bbox}，跳过该形状")
                continue
            structure.shapes.append({
                'shape_type': s.get('type', 'rect'),
                'bbox': [int(v) for v in bbox],
                'fill_color': s.get('fill_color'),
                'corner_radius': float(s.get('corner_radius', 0.1)),
                'transparency': float(s.get('transparency', 0.0)),
                'border_color': s.get('border_color'),
                'border_width_px': float(s.get('border_width_px', 0)),
                'shadow': s.get('shadow'),
            })

        for layer in result.get('image_layers', []) or []:
            bbox = layer.get('bbox', [])
            if not self._is_valid_bbox(bbox, image_width, image_height):
                logger.debug(f"视觉结构分析: 无效 image_layer bbox {bbox}，跳过")
                continue
            structure.image_layers.append({
                'type': layer.get('type', 'image'),
                'bbox': [int(v) for v in bbox],
                'description': layer.get('description') or '',
                'generation_prompt': layer.get('generation_prompt') or layer.get('description') or '',
                'transparent_background': bool(layer.get('transparent_background', False)),
                'role': layer.get('role', 'content'),
            })

        logger.info(
            f"视觉结构分析第 {attempt} 次完成: background={structure.background_type}({structure.background_color}), "
            f"shapes={len(structure.shapes)}, image_layers={len(structure.image_layers)}"
        )
        return structure

    @staticmethod
    def _is_valid_bbox(bbox: Any, image_width: int, image_height: int) -> bool:
        return (
            isinstance(bbox, list)
            and len(bbox) == 4
            and bbox[2] > bbox[0]
            and bbox[3] > bbox[1]
            and bbox[0] >= 0
            and bbox[1] >= 0
            and bbox[2] <= image_width * 1.05
            and bbox[3] <= image_height * 1.05
        )

    @staticmethod
    def build_layer_generation_prompt(layer: Dict[str, Any]) -> str:
        base_prompt = (layer.get('generation_prompt') or layer.get('description') or '').strip()
        transparent = bool(layer.get('transparent_background', False))
        background_rule = (
            "Use a transparent background."
            if transparent
            else "Use a clean background only when it is part of this element; do not include surrounding slide background."
        )
        return dedent(f"""\
            Recreate exactly one independent visual layer from the reference crop.

            Layer description:
            {base_prompt}

            Requirements:
            - Generate only this single non-text visual element.
            - Do not generate any readable text, labels, captions, numbers, or page furniture.
            - Match the reference crop's shape, color, proportions, stroke style, opacity, and visual weight as closely as possible.
            - Keep edges crisp and presentation-ready.
            - {background_rule}
            - The output will be placed back into the PowerPoint at the original bbox, so do not add padding, margins, shadows, or neighboring objects unless they are part of this element.
        """)

    def materialize_image_layers(
        self,
        image_path: str,
        image_layers: List[Dict[str, Any]],
        output_dir: Path,
        page_idx: int,
        ai_service,
        *,
        warnings: Optional[Any] = None,
        fail_fast: bool = True,
    ) -> List[Dict[str, Any]]:
        """Generate independent non-text image-layer PNGs with the configured GPT image model."""
        if not image_layers:
            return []

        output_dir.mkdir(parents=True, exist_ok=True)
        materialized = []

        try:
            source = Image.open(image_path).convert('RGBA')
        except Exception as e:
            raise VisualPipelineServiceError(f"无法打开页面图片用于 GPT 图层生成: {e}") from e

        with source:
            for idx, layer in enumerate(image_layers):
                bbox = layer.get('bbox') or []
                if len(bbox) != 4:
                    continue

                crop_box = (
                    max(0, int(bbox[0])),
                    max(0, int(bbox[1])),
                    min(source.width, int(bbox[2])),
                    min(source.height, int(bbox[3])),
                )
                if crop_box[2] <= crop_box[0] or crop_box[3] <= crop_box[1]:
                    continue

                crop = source.crop(crop_box)
                prompt = self.build_layer_generation_prompt(layer)
                layer_path = output_dir / f"page_{page_idx + 1}_gpt_layer_{idx + 1}.png"

                try:
                    aspect_ratio = f"{max(1, crop.width)}:{max(1, crop.height)}"
                    generated = ai_service.generate_image(
                        prompt=prompt,
                        aspect_ratio=aspect_ratio,
                        resolution='2K',
                        additional_ref_images=[crop],
                    )
                    if generated is None:
                        raise ValueError("GPT image model returned no image")
                    if generated.mode != 'RGBA':
                        generated = generated.convert('RGBA')
                    generated.save(layer_path)

                    materialized.append({
                        **layer,
                        'image_path': str(layer_path),
                        'generation_model': getattr(getattr(ai_service, 'image_provider', None), 'model', None),
                        'generation_source': 'gpt-image',
                    })
                    logger.info(
                        f"GPT 图层生成完成: page={page_idx + 1}, layer={idx + 1}, "
                        f"bbox={bbox}, path={layer_path}"
                    )
                except Exception as e:
                    message = f"GPT 图层生成失败 page={page_idx + 1} layer={idx + 1}: {e}"
                    logger.warning(message)
                    if warnings:
                        warnings.add_image_failed(str(layer_path), message)
                    if fail_fast:
                        raise VisualPipelineServiceError(message) from e

        return materialized

    def build_background_without_layers(
        self,
        image_path: str,
        structure: Optional[SlideStructure],
        output_dir: Path,
        page_idx: int,
    ) -> Optional[str]:
        """Create a background image with GPT-discovered content regions removed."""
        if not structure or (not structure.shapes and not structure.image_layers):
            return None

        output_dir.mkdir(parents=True, exist_ok=True)
        try:
            with Image.open(image_path) as source:
                bg = source.convert('RGB')
                width, height = bg.size
                regions = self._layer_removal_regions(structure, width, height)
                if not regions:
                    return None

                for bbox in regions:
                    self._paint_region_from_border(bg, bbox)

                bg_path = output_dir / f"page_{page_idx + 1}_visual_background.png"
                bg.save(bg_path)
                return str(bg_path)
        except Exception as e:
            logger.warning(f"生成视觉拆层背景失败，已回退原背景: {e}")
            return None

    @staticmethod
    def _layer_removal_regions(structure: SlideStructure, width: int, height: int) -> List[List[int]]:
        regions = []
        for spec in structure.shapes:
            bbox = spec.get('bbox') or []
            if len(bbox) != 4:
                continue
            area = max(0, bbox[2] - bbox[0]) * max(0, bbox[3] - bbox[1])
            if area / max(1, width * height) < 0.75:
                regions.append(bbox)

        for layer in structure.image_layers:
            if layer.get('role', 'content') == 'content':
                bbox = layer.get('bbox') or []
                if len(bbox) == 4:
                    regions.append(bbox)
        return regions

    @staticmethod
    def _paint_region_from_border(image: Image.Image, bbox: List[int]) -> None:
        width, height = image.size
        x0, y0, x1, y1 = [int(v) for v in bbox]
        x0 = max(0, min(width - 1, x0))
        y0 = max(0, min(height - 1, y0))
        x1 = max(x0 + 1, min(width, x1))
        y1 = max(y0 + 1, min(height, y1))
        pad = max(6, int(min(x1 - x0, y1 - y0) * 0.08))

        sample_box = (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(width, x1 + pad),
            min(height, y1 + pad),
        )
        sample = image.crop(sample_box)
        pixels = list(sample.getdata())
        inner_x0 = x0 - sample_box[0]
        inner_y0 = y0 - sample_box[1]
        inner_x1 = x1 - sample_box[0]
        inner_y1 = y1 - sample_box[1]
        border_pixels = [
            pixel for idx, pixel in enumerate(pixels)
            if not (
                inner_x0 <= idx % sample.width < inner_x1
                and inner_y0 <= idx // sample.width < inner_y1
            )
        ] or pixels
        med = tuple(sorted(pixel[c] for pixel in border_pixels)[len(border_pixels) // 2] for c in range(3))
        image.paste(Image.new('RGB', (x1 - x0, y1 - y0), med), (x0, y0))

    def compose_visual_layers(
        self,
        *,
        builder,
        slide,
        editable_img,
        structure: Optional[SlideStructure],
        page_idx: int,
        ai_service,
        warnings: Optional[Any] = None,
        fail_fast: bool = True,
    ) -> None:
        """Add visual background, vector shapes, and generated image layers to one PPTX slide."""
        use_solid_bg = (
            structure is not None
            and structure.background_type == 'solid'
            and structure.background_color
        )
        if use_solid_bg:
            logger.info(f"    使用纯色矢量背景: {structure.background_color}")
            builder.set_slide_background_color(slide, structure.background_color)
        else:
            raw_bg_path = (
                editable_img.clean_background
                if editable_img.clean_background and Path(editable_img.clean_background).exists()
                else editable_img.image_path
            )
            visual_output_dir = Path(raw_bg_path).parent / 'visual_layers'
            bg_path = (
                self.build_background_without_layers(raw_bg_path, structure, visual_output_dir, page_idx)
                if structure is not None
                else None
            ) or raw_bg_path
            logger.info(f"    添加背景图: {bg_path}")
            slide.shapes.add_picture(
                bg_path,
                left=0,
                top=0,
                width=builder.prs.slide_width,
                height=builder.prs.slide_height,
            )

        if structure and structure.shapes:
            logger.info(f"    添加 {len(structure.shapes)} 个视觉结构形状")
            for spec in structure.shapes:
                try:
                    builder.add_shape_element(slide=slide, dpi=96, **spec)
                except Exception as e:
                    logger.warning(f"    形状渲染失败（已跳过）: {e}")

        if structure and structure.image_layers:
            visual_output_dir = Path(editable_img.image_path).parent / 'visual_layers'
            materialized_layers = self.materialize_image_layers(
                editable_img.image_path,
                structure.image_layers,
                visual_output_dir,
                page_idx,
                ai_service=ai_service,
                warnings=warnings,
                fail_fast=fail_fast,
            )
            logger.info(f"    添加 {len(materialized_layers)} 个视觉图片层")
            for layer in materialized_layers:
                try:
                    builder.add_image_element(slide=slide, image_path=layer['image_path'], bbox=layer['bbox'])
                except Exception as e:
                    logger.warning(f"    视觉图片层渲染失败（已跳过）: {e}")

    @staticmethod
    def compare_images(
        reference_path: str,
        candidate_path: str,
        *,
        pass_threshold: float = 0.92,
    ) -> VisualComparisonResult:
        """Compare two page renders. score=1 is identical; lower means more visual drift."""
        with Image.open(reference_path) as reference, Image.open(candidate_path) as candidate:
            ref = reference.convert('RGB')
            cand = candidate.convert('RGB')
            candidate_size = cand.size
            if cand.size != ref.size:
                cand = cand.resize(ref.size)
            diff = ImageChops.difference(ref, cand)
            stat = ImageStat.Stat(diff)
            mean_abs_error = sum(stat.mean) / (len(stat.mean) * 255.0)
            max_channel_error = max(stat.extrema[i][1] for i in range(len(stat.extrema))) / 255.0
            score = max(0.0, 1.0 - mean_abs_error)
            return VisualComparisonResult(
                score=score,
                mean_abs_error=mean_abs_error,
                max_channel_error=max_channel_error,
                passed=score >= pass_threshold,
                reference_size=ref.size,
                candidate_size=candidate_size,
            )

    @staticmethod
    def build_correction_prompt(comparison: VisualComparisonResult) -> str:
        """Create a concise correction instruction for the next GPT analysis/generation pass."""
        return (
            "The reconstructed PPTX render does not match the source image closely enough. "
            f"Similarity score={comparison.score:.4f}, mean_abs_error={comparison.mean_abs_error:.4f}, "
            f"max_channel_error={comparison.max_channel_error:.4f}. "
            "Re-analyze missing shapes, incorrect opacity, icon placement, background removal, and layer ordering."
        )
