"""
导出可编辑PPTX后台任务的单元测试

测试重点：
1. 任务状态从 PENDING 正确流转到 PROCESSING，最终到 COMPLETED 或 FAILED
2. 项目/任务/图片缺失时能正确设置 FAILED 状态而不挂起
3. ExportService 抛出 ExportError 时任务能正确标记为 FAILED
4. 通用异常也能正确标记为 FAILED
"""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image

from models import Page, Project, Task, db
from services.task_manager import export_editable_pptx_with_recursive_analysis_task


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_project(*, export_allow_partial=False) -> Project:
    """创建并持久化一个测试项目，返回 Project 实例（调用方须在 app_context 内）。"""
    project = Project(
        id=str(uuid.uuid4()),
        creation_type="idea",
        idea_prompt="单元测试项目",
        status="completed",
        export_allow_partial=export_allow_partial,
    )
    db.session.add(project)
    db.session.commit()
    return project


def _make_task(project_id: str) -> Task:
    """创建并持久化一个 PENDING 任务，返回 Task 实例。"""
    task = Task(project_id=project_id, task_type="EXPORT_EDITABLE_PPTX", status="PENDING")
    db.session.add(task)
    db.session.commit()
    return task


def _make_page_with_image(project_id: str, image_path: str) -> Page:
    """创建一个带 generated_image_path 的页面并持久化。"""
    page = Page(project_id=project_id, order_index=0, status="COMPLETED")
    page.generated_image_path = image_path
    db.session.add(page)
    db.session.commit()
    return page


def _run_task(app, task_id: str, project_id: str, file_service, **kwargs):
    """封装调用 export_editable_pptx_with_recursive_analysis_task 的细节。"""
    export_editable_pptx_with_recursive_analysis_task(
        task_id=task_id,
        project_id=project_id,
        filename="test-export.pptx",
        file_service=file_service,
        app=app,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# 测试用例
# ---------------------------------------------------------------------------

class TestExportEditablePptxTaskStatusTransition:
    """验证任务状态从 PENDING → PROCESSING → COMPLETED/FAILED 的流转。"""

    def test_task_transitions_to_processing_then_completed(self, app, tmp_path):
        """正常流程：有图片，ExportService 成功 → 任务应到 COMPLETED。"""
        # 准备一张真实的小图片
        img_path = str(tmp_path / "slide.png")
        Image.new("RGB", (100, 56), color=(200, 200, 200)).save(img_path)

        with app.app_context():
            project = _make_project()
            pid = project.id
            task = _make_task(pid)
            task_id = task.id
            _make_page_with_image(pid, "slide.png")

        # file_service 返回临时图片的绝对路径
        file_service = MagicMock()
        file_service.get_absolute_path.return_value = img_path

        # Mock ExportService，避免真实的 AI 调用
        mock_warnings = MagicMock()
        mock_warnings.has_warnings.return_value = False
        mock_warnings.to_dict.return_value = {}

        visual_ai_service = MagicMock(name='isolated-visual-service')
        with patch(
            "services.export_service.ExportService.create_editable_pptx_with_recursive_analysis",
            return_value=(None, mock_warnings),
        ) as export_mock, patch(
            "services.image_editability.TextAttributeExtractorFactory.create_caption_model_extractor",
            return_value=MagicMock(),
        ) as extractor_factory:
            _run_task(
                app,
                task_id,
                pid,
                file_service,
                visual_ai_service=visual_ai_service,
            )

        assert export_mock.call_args.kwargs['visual_ai_service'] is visual_ai_service
        extractor_factory.assert_called_once_with(ai_service=visual_ai_service)

        with app.app_context():
            task = Task.query.get(task_id)
            assert task.status == "COMPLETED", f"期望 COMPLETED，实际 {task.status}"
            progress = task.get_progress()
            assert progress.get("percent") == 100
            assert "download_url" in progress

    def test_task_transitions_to_processing_before_export_work(self, app, tmp_path):
        """确保在 ExportService 被调用 之前 任务状态就已经变成 PROCESSING。"""
        img_path = str(tmp_path / "slide2.png")
        Image.new("RGB", (100, 56), color=(100, 100, 100)).save(img_path)

        captured_status = {}

        def fake_export(**kwargs):
            # 在 ExportService 运行期间检查任务状态
            with app.app_context():
                t = Task.query.get(task_id)
                captured_status["status_during_export"] = t.status if t else None
            mock_warnings = MagicMock()
            mock_warnings.has_warnings.return_value = False
            return None, mock_warnings

        with app.app_context():
            project = _make_project()
            pid = project.id
            task = _make_task(pid)
            task_id = task.id
            _make_page_with_image(pid, "slide2.png")

        file_service = MagicMock()
        file_service.get_absolute_path.return_value = img_path

        with patch(
            "services.export_service.ExportService.create_editable_pptx_with_recursive_analysis",
            side_effect=fake_export,
        ), patch(
            "services.image_editability.TextAttributeExtractorFactory.create_caption_model_extractor",
            return_value=MagicMock(),
        ):
            _run_task(app, task_id, pid, file_service)

        assert captured_status.get("status_during_export") == "PROCESSING", (
            f"ExportService 被调用时任务状态应为 PROCESSING，"
            f"实际为 {captured_status.get('status_during_export')}"
        )

    def test_task_fails_when_project_not_found(self, app, tmp_path):
        """项目不存在时，任务应被标记为 FAILED。"""
        nonexistent_pid = str(uuid.uuid4())
        with app.app_context():
            # 只创建 task，不创建对应 project
            task = Task(project_id=nonexistent_pid, task_type="EXPORT_EDITABLE_PPTX", status="PENDING")
            db.session.add(task)
            db.session.commit()
            task_id = task.id

        file_service = MagicMock()

        _run_task(app, task_id, nonexistent_pid, file_service)

        with app.app_context():
            task = Task.query.get(task_id)
            assert task.status == "FAILED", f"期望 FAILED，实际 {task.status}"

    def test_task_fails_when_no_images_found(self, app, tmp_path):
        """项目存在但没有生成图片时，任务应被标记为 FAILED。"""
        with app.app_context():
            project = _make_project()
            pid = project.id
            task = _make_task(pid)
            task_id = task.id
            # 不创建任何页面 / 不创建任何图片

        file_service = MagicMock()
        file_service.get_absolute_path.return_value = "/nonexistent/path/slide.png"

        _run_task(app, task_id, pid, file_service)

        with app.app_context():
            task = Task.query.get(task_id)
            assert task.status == "FAILED", f"期望 FAILED，实际 {task.status}"

    def test_task_fails_on_export_error(self, app, tmp_path):
        """ExportService 抛出 ExportError 时，任务应被标记为 FAILED，错误信息应被记录。"""
        from services.export_service import ExportError

        img_path = str(tmp_path / "slide3.png")
        Image.new("RGB", (100, 56), color=(50, 50, 50)).save(img_path)

        with app.app_context():
            project = _make_project()
            pid = project.id
            task = _make_task(pid)
            task_id = task.id
            _make_page_with_image(pid, "slide3.png")

        file_service = MagicMock()
        file_service.get_absolute_path.return_value = img_path

        export_error = ExportError(
            message="模拟导出错误",
            error_type="style_extraction",
            details={"reason": "test"},
            help_text="请检查图片格式",
        )

        with patch(
            "services.export_service.ExportService.create_editable_pptx_with_recursive_analysis",
            side_effect=export_error,
        ), patch(
            "services.image_editability.TextAttributeExtractorFactory.create_caption_model_extractor",
            return_value=MagicMock(),
        ):
            _run_task(app, task_id, pid, file_service)

        with app.app_context():
            task = Task.query.get(task_id)
            assert task.status == "FAILED", f"期望 FAILED，实际 {task.status}"
            assert "模拟导出错误" in (task.error_message or ""), (
                f"error_message 应包含导出错误信息，实际: {task.error_message}"
            )

    def test_task_fails_on_generic_exception(self, app, tmp_path):
        """通用异常（非 ExportError）也应使任务最终变为 FAILED。"""
        img_path = str(tmp_path / "slide4.png")
        Image.new("RGB", (100, 56), color=(30, 30, 30)).save(img_path)

        with app.app_context():
            project = _make_project()
            pid = project.id
            task = _make_task(pid)
            task_id = task.id
            _make_page_with_image(pid, "slide4.png")

        file_service = MagicMock()
        file_service.get_absolute_path.return_value = img_path

        with patch(
            "services.export_service.ExportService.create_editable_pptx_with_recursive_analysis",
            side_effect=RuntimeError("意外的运行时错误"),
        ), patch(
            "services.image_editability.TextAttributeExtractorFactory.create_caption_model_extractor",
            return_value=MagicMock(),
        ):
            _run_task(app, task_id, pid, file_service)

        with app.app_context():
            task = Task.query.get(task_id)
            assert task.status == "FAILED", f"期望 FAILED，实际 {task.status}"
            assert "意外的运行时错误" in (task.error_message or ""), (
                f"error_message 应包含异常信息，实际: {task.error_message}"
            )

    def test_task_partial_export_uses_fail_fast_false(self, app, tmp_path):
        """export_allow_partial=True 时，fail_fast 应为 False 传给 ExportService。"""
        img_path = str(tmp_path / "slide5.png")
        Image.new("RGB", (100, 56), color=(80, 80, 80)).save(img_path)

        captured_kwargs = {}

        def fake_export(**kwargs):
            captured_kwargs.update(kwargs)
            mock_warnings = MagicMock()
            mock_warnings.has_warnings.return_value = False
            return None, mock_warnings

        with app.app_context():
            project = _make_project(export_allow_partial=True)
            pid = project.id
            task = _make_task(pid)
            task_id = task.id
            _make_page_with_image(pid, "slide5.png")

        file_service = MagicMock()
        file_service.get_absolute_path.return_value = img_path

        with patch(
            "services.export_service.ExportService.create_editable_pptx_with_recursive_analysis",
            side_effect=fake_export,
        ), patch(
            "services.image_editability.TextAttributeExtractorFactory.create_caption_model_extractor",
            return_value=MagicMock(),
        ):
            _run_task(app, task_id, pid, file_service)

        assert captured_kwargs.get("fail_fast") is False, (
            f"export_allow_partial=True 时 fail_fast 应为 False，实际: {captured_kwargs.get('fail_fast')}"
        )

    def test_export_route_creates_pending_task_and_returns_task_id(self, client):
        """验证 HTTP 路由：POST /api/projects/{id}/export/editable-pptx
        应该返回 202 以及 task_id，并在 DB 中创建一个 PENDING 任务。"""
        # 先创建一个项目
        resp = client.post(
            "/api/projects",
            json={"creation_type": "idea", "idea_prompt": "单元测试"},
        )
        assert resp.status_code == 201, resp.get_data(as_text=True)
        pid = resp.get_json()["data"]["project_id"]

        # 路由要求项目有页面，补一个页面
        with client.application.app_context():
            page = Page(project_id=pid, order_index=0, status="COMPLETED")
            page.generated_image_path = "fake/slide.png"
            db.session.add(page)
            db.session.commit()

        # Mock task_manager.submit_task 防止真实后台线程启动
        runtime = MagicMock()
        runtime.public_summary.return_value = {'provider': 'openai', 'model': 'gpt-test'}
        visual_service = MagicMock(name='isolated-visual-service')
        with patch(
            "controllers.export_controller.resolve_user_editable_pptx_ai_runtime",
            return_value=({'visual': runtime, 'element': runtime}, visual_service),
        ), patch("services.task_manager.task_manager.submit_task") as submit_task:
            resp2 = client.post(
                f"/api/projects/{pid}/export/editable-pptx",
                json={"filename": "unit-test-export.pptx"},
            )

        assert resp2.status_code == 200, resp2.get_data(as_text=True)
        body = resp2.get_json()
        assert body.get("success") is True
        task_id = body["data"]["task_id"]
        assert task_id

        with client.application.app_context():
            task = Task.query.get(task_id)
            assert task is not None
            assert task.status == "PENDING"
            assert task.task_type == "EXPORT_EDITABLE_PPTX"
            assert task.get_progress()['config_source']['visual']['provider'] == 'openai'
            assert task.get_progress()['project_overrides']['fields']['image_aspect_ratio']['source'] == 'inherited_or_default'

        assert submit_task.call_args.kwargs['visual_ai_service'] is visual_service

    def test_export_route_returns_runtime_reason_without_creating_task(self, client):
        resp = client.post(
            "/api/projects",
            json={"creation_type": "idea", "idea_prompt": "runtime error test"},
        )
        pid = resp.get_json()["data"]["project_id"]

        with client.application.app_context():
            page = Page(project_id=pid, order_index=0, status="COMPLETED")
            page.generated_image_path = "fake/slide.png"
            db.session.add(page)
            db.session.commit()

        with patch(
            "controllers.export_controller.resolve_user_editable_pptx_ai_runtime",
            side_effect=ValueError(
                "Editable PPTX export requires API credentials; Codex subscription login is not supported."
            ),
        ), patch("services.task_manager.task_manager.submit_task") as submit_task:
            response = client.post(f"/api/projects/{pid}/export/editable-pptx", json={})

        assert response.status_code == 503
        body = response.get_json()
        assert body["error"]["code"] == "EDITABLE_PPTX_CONFIG_UNAVAILABLE"
        assert "requires API credentials" in body["error"]["message"]
        submit_task.assert_not_called()

        with client.application.app_context():
            assert Task.query.filter_by(
                project_id=pid,
                task_type="EXPORT_EDITABLE_PPTX",
            ).count() == 0
