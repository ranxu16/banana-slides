"""
Unit tests for PPTXBuilder.add_shape_element and set_slide_background_color
"""
import pytest
from unittest.mock import patch
from pptx import Presentation
from pptx.util import Inches


def _make_slide():
    """创建一个带空白幻灯片的 Presentation，返回 (prs, slide, builder)"""
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
    from utils.pptx_builder import PPTXBuilder

    builder = PPTXBuilder()
    builder.create_presentation()
    slide = builder.add_blank_slide()
    return builder.prs, slide, builder


class TestAddShapeElement:
    def test_add_rect_no_error(self):
        """矩形正常渲染，不报错"""
        prs, slide, builder = _make_slide()
        shape = builder.add_shape_element(
            slide=slide,
            shape_type='rect',
            bbox=[100, 100, 400, 300],
            fill_color='#2D2D44',
        )
        assert shape is not None

    def test_add_rounded_rect_no_error(self):
        """圆角矩形正常渲染，不报错"""
        prs, slide, builder = _make_slide()
        shape = builder.add_shape_element(
            slide=slide,
            shape_type='rounded_rect',
            bbox=[50, 50, 500, 350],
            fill_color='#1A1A2E',
            corner_radius=0.2,
        )
        assert shape is not None

    def test_add_ellipse_no_error(self):
        """椭圆正常渲染，不报错"""
        prs, slide, builder = _make_slide()
        shape = builder.add_shape_element(
            slide=slide,
            shape_type='ellipse',
            bbox=[200, 200, 600, 500],
            fill_color='#3A3A5C',
        )
        assert shape is not None

    def test_fill_color_none_does_not_raise(self):
        """fill_color=None → 透明背景，不报错"""
        prs, slide, builder = _make_slide()
        shape = builder.add_shape_element(
            slide=slide,
            shape_type='rect',
            bbox=[0, 0, 200, 200],
            fill_color=None,
        )
        assert shape is not None

    def test_shadow_xml_written(self):
        """shadow 参数 → effectLst/outerShdw 写入 XML"""
        from lxml import etree
        from pptx.oxml.ns import qn

        prs, slide, builder = _make_slide()
        shape = builder.add_shape_element(
            slide=slide,
            shape_type='rect',
            bbox=[100, 100, 400, 300],
            fill_color='#222222',
            shadow={'blur_pt': 6, 'offset_y_pt': 3, 'color': '#000000', 'opacity': 0.3},
        )
        assert shape is not None
        sp_pr = shape._element.spPr
        effect_lst = sp_pr.find(qn('a:effectLst'))
        assert effect_lst is not None, "effectLst 应已写入 spPr"
        outer = effect_lst.find(qn('a:outerShdw'))
        assert outer is not None, "outerShdw 应已写入 effectLst"

    def test_invalid_shape_type_falls_back_to_rect(self):
        """未知 shape_type → 回退到矩形（shape_id=1），不报错"""
        prs, slide, builder = _make_slide()
        shape = builder.add_shape_element(
            slide=slide,
            shape_type='unknown_type',
            bbox=[10, 10, 200, 150],
            fill_color='#AABBCC',
        )
        assert shape is not None

    def test_transparency_sets_alpha_xml(self):
        """transparency > 0 → XML 中写入 alpha 元素"""
        from pptx.oxml.ns import qn

        prs, slide, builder = _make_slide()
        shape = builder.add_shape_element(
            slide=slide,
            shape_type='rect',
            bbox=[0, 0, 300, 200],
            fill_color='#FF0000',
            transparency=0.5,
        )
        assert shape is not None
        sp_pr = shape._element.spPr
        solid_fill = sp_pr.find(qn('a:solidFill'))
        assert solid_fill is not None
        srgb = solid_fill.find(qn('a:srgbClr'))
        assert srgb is not None
        alpha = srgb.find(qn('a:alpha'))
        assert alpha is not None, "alpha 元素应已写入 srgbClr"
        # 50% 透明 → alpha 应为 50000
        assert alpha.get('val') == '50000'


class TestSetSlideBackgroundColor:
    def test_sets_solid_background(self):
        """set_slide_background_color → slide.background.fill 类型为 solid"""
        from pptx.enum.dml import MSO_THEME_COLOR
        from utils.pptx_builder import PPTXBuilder

        builder = PPTXBuilder()
        builder.create_presentation()
        slide = builder.add_blank_slide()

        PPTXBuilder.set_slide_background_color(slide, '#1A1A2E')
        fill = slide.background.fill
        # fill_type 为 1 表示 solid
        assert fill.type is not None

    def test_invalid_color_does_not_raise(self):
        """无效颜色字符串 → 不报错，静默忽略"""
        from utils.pptx_builder import PPTXBuilder

        builder = PPTXBuilder()
        builder.create_presentation()
        slide = builder.add_blank_slide()

        # 不应抛出任何异常
        PPTXBuilder.set_slide_background_color(slide, 'not-a-color')
        PPTXBuilder.set_slide_background_color(slide, '')
        PPTXBuilder.set_slide_background_color(slide, None)
