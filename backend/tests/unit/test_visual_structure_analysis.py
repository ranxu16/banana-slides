"""
Unit tests for ExportService._analyze_slide_visual_structure and SlideStructure
"""
import pytest
import json
from unittest.mock import MagicMock, patch


# 辅助：构造一个 mock ai_service
def _mock_ai(return_value):
    ai = MagicMock()
    ai.generate_json_with_image.return_value = return_value
    return ai


# 测试用合法 JSON 响应
_VALID_RESPONSE = {
    "background": {"type": "solid", "color": "#1A1A2E"},
    "shapes": [
        {
            "type": "rounded_rect",
            "bbox": [100, 100, 800, 500],
            "fill_color": "#2D2D44",
            "corner_radius": 0.15,
            "transparency": 0.0,
            "border_color": None,
            "border_width_px": 0,
            "shadow": {"blur_pt": 6, "offset_y_pt": 3, "color": "#000000", "opacity": 0.25}
        },
        {
            "type": "rect",
            "bbox": [50, 50, 400, 200],
            "fill_color": "#3A3A5C",
            "corner_radius": 0.0,
            "transparency": 0.1,
            "border_color": None,
            "border_width_px": 0,
            "shadow": None
        }
    ]
}


class TestAnalyzeSlideVisualStructure:
    def setup_method(self):
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

    def _call(self, ai_service, image_width=1920, image_height=1080):
        from services.export_service import ExportService
        return ExportService._analyze_slide_visual_structure(
            image_path='/fake/path/slide.png',
            text_elements=[
                {'id': 'e1', 'text': '标题文字', 'bbox': [100, 50, 600, 120]},
                {'id': 'e2', 'text': '内容文字', 'bbox': [100, 200, 900, 350]},
            ],
            ai_service=ai_service,
            image_width=image_width,
            image_height=image_height,
        )

    def test_returns_slide_structure_on_valid_json(self):
        """合法 JSON → 返回 SlideStructure，背景和形状解析正确"""
        from services.export_service import SlideStructure
        ai = _mock_ai(_VALID_RESPONSE)
        result = self._call(ai)
        assert result is not None
        assert isinstance(result, SlideStructure)
        assert result.background_type == 'solid'
        assert result.background_color == '#1A1A2E'
        assert len(result.shapes) == 2

    def test_shape_fields_parsed_correctly(self):
        """shape 各字段正确解析"""
        ai = _mock_ai(_VALID_RESPONSE)
        result = self._call(ai)
        s = result.shapes[0]
        assert s['shape_type'] == 'rounded_rect'
        assert s['bbox'] == [100, 100, 800, 500]
        assert s['fill_color'] == '#2D2D44'
        assert s['corner_radius'] == 0.15
        assert s['shadow'] is not None

    def test_returns_none_on_exception(self):
        """ai_service 抛出异常 → 返回 None，不向上冒泡"""
        ai = MagicMock()
        ai.generate_json_with_image.side_effect = RuntimeError("API timeout")
        result = self._call(ai)
        assert result is None

    def test_returns_none_when_result_is_not_dict(self):
        """ai_service 返回非 dict（如字符串）→ 返回 None"""
        ai = _mock_ai("这不是一个字典")
        result = self._call(ai)
        assert result is None

    def test_returns_none_on_json_decode_error(self):
        """ai_service 抛出 json.JSONDecodeError → 返回 None"""
        ai = MagicMock()
        ai.generate_json_with_image.side_effect = json.JSONDecodeError("err", "", 0)
        result = self._call(ai)
        assert result is None

    def test_invalid_bbox_shapes_are_filtered(self):
        """非法 bbox 的 shape 被过滤掉，其余保留"""
        response = {
            "background": {"type": "image", "color": None},
            "shapes": [
                # 合法
                {"type": "rect", "bbox": [0, 0, 500, 300], "fill_color": "#AABBCC",
                 "corner_radius": 0, "transparency": 0, "border_color": None,
                 "border_width_px": 0, "shadow": None},
                # 非法：x2 <= x1
                {"type": "rect", "bbox": [300, 100, 100, 400], "fill_color": "#FFFFFF",
                 "corner_radius": 0, "transparency": 0, "border_color": None,
                 "border_width_px": 0, "shadow": None},
                # 非法：长度不为 4
                {"type": "rect", "bbox": [100, 200], "fill_color": "#FFFFFF",
                 "corner_radius": 0, "transparency": 0, "border_color": None,
                 "border_width_px": 0, "shadow": None},
                # 非法：坐标超出图片范围（宽度 1920，超出 5% 容差）
                {"type": "rect", "bbox": [0, 0, 9999, 300], "fill_color": "#FFFFFF",
                 "corner_radius": 0, "transparency": 0, "border_color": None,
                 "border_width_px": 0, "shadow": None},
            ]
        }
        ai = _mock_ai(response)
        result = self._call(ai)
        assert result is not None
        assert len(result.shapes) == 1   # 只保留第一个合法 shape

    def test_background_types_parsed(self):
        """solid / gradient / image 三种背景类型均可正确解析"""
        from services.export_service import SlideStructure
        for bg_type in ('solid', 'gradient', 'image'):
            ai = _mock_ai({"background": {"type": bg_type, "color": None}, "shapes": []})
            result = self._call(ai)
            assert result is not None
            assert result.background_type == bg_type

    def test_empty_shapes_list_is_valid(self):
        """shapes 为空数组 → 合法，返回 SlideStructure"""
        ai = _mock_ai({"background": {"type": "image", "color": None}, "shapes": []})
        result = self._call(ai)
        assert result is not None
        assert result.shapes == []

    def test_text_elements_truncated_in_prompt(self):
        """超过 80 个文本元素时，ai_service 只被传入 80 个"""
        from services.export_service import ExportService
        ai = _mock_ai({"background": {"type": "image", "color": None}, "shapes": []})
        many_elements = [
            {'id': f'e{i}', 'text': f'文字{i}', 'bbox': [0, i * 10, 100, i * 10 + 8]}
            for i in range(120)
        ]
        ExportService._analyze_slide_visual_structure(
            image_path='/fake/path.png',
            text_elements=many_elements,
            ai_service=ai,
            image_width=1920,
            image_height=1080,
        )
        call_args = ai.generate_json_with_image.call_args
        prompt_text = call_args.kwargs.get('prompt') or call_args.args[0]
        # prompt 中的 text_elements_json 最多含 80 个元素
        parsed = json.loads(
            prompt_text.split('已识别的文本元素坐标参考：\n')[1].split('\n\n返回格式')[0]
        )
        assert len(parsed) <= 80
