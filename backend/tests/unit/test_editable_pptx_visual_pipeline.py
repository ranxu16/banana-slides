from types import SimpleNamespace
from unittest.mock import MagicMock

from PIL import Image

from services.editable_pptx_pipeline import (
    EditablePptxVisualPipeline,
    SlideStructure,
)


def test_compare_images_scores_identical_images_as_passed(tmp_path):
    reference = tmp_path / "reference.png"
    candidate = tmp_path / "candidate.png"
    Image.new("RGB", (20, 20), (255, 255, 255)).save(reference)
    Image.new("RGB", (20, 20), (255, 255, 255)).save(candidate)

    result = EditablePptxVisualPipeline.compare_images(str(reference), str(candidate))

    assert result.passed is True
    assert result.score == 1.0
    assert result.mean_abs_error == 0.0


def test_compare_images_scores_visual_drift_as_failed(tmp_path):
    reference = tmp_path / "reference.png"
    candidate = tmp_path / "candidate.png"
    Image.new("RGB", (20, 20), (255, 255, 255)).save(reference)
    Image.new("RGB", (20, 20), (0, 0, 0)).save(candidate)

    result = EditablePptxVisualPipeline.compare_images(
        str(reference),
        str(candidate),
        pass_threshold=0.92,
    )

    assert result.passed is False
    assert result.score < 0.92
    assert result.max_channel_error == 1.0


def test_compose_visual_layers_adds_shapes_and_generated_image_layers(tmp_path):
    source_path = tmp_path / "slide.png"
    Image.new("RGBA", (120, 80), (255, 255, 255, 255)).save(source_path)

    generated = Image.new("RGBA", (24, 24), (255, 106, 0, 255))
    ai_service = MagicMock()
    ai_service.generate_image.return_value = generated
    ai_service.image_provider = MagicMock(model="gpt-image-2")

    builder = MagicMock()
    builder.prs = SimpleNamespace(slide_width=1000, slide_height=562)
    slide = MagicMock()
    editable_img = SimpleNamespace(
        image_path=str(source_path),
        clean_background=None,
    )
    structure = SlideStructure(
        background_type="image",
        shapes=[
            {
                "shape_type": "rounded_rect",
                "bbox": [10, 10, 80, 40],
                "fill_color": "#FFFFFF",
                "corner_radius": 0.1,
                "transparency": 0.0,
                "border_color": "#EEEEEE",
                "border_width_px": 1,
                "shadow": None,
            }
        ],
        image_layers=[
            {
                "type": "icon",
                "bbox": [20, 20, 40, 40],
                "description": "orange target icon",
                "generation_prompt": "Generate only an orange target icon.",
                "transparent_background": True,
                "role": "content",
            }
        ],
    )

    EditablePptxVisualPipeline().compose_visual_layers(
        builder=builder,
        slide=slide,
        editable_img=editable_img,
        structure=structure,
        page_idx=0,
        ai_service=ai_service,
        fail_fast=True,
    )

    slide.shapes.add_picture.assert_called_once()
    builder.add_shape_element.assert_called_once()
    builder.add_image_element.assert_called_once()
    ai_service.generate_image.assert_called_once()
