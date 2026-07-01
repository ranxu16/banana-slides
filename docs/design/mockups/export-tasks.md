# 导出任务中心设计稿约束

## 页面目标

导出任务中心承接全局导出状态，替代仅在预览页弹出的临时任务面板。

## 布局结构

```text
AppShell
  Main
    PageHeader: 导出任务 / 查看、下载和排查导出结果
    Toolbar
      SearchInput
      StatusFilter
      FormatFilter
      ClearCompleted
    TaskList
      TaskRow
        StatusIcon
        ProjectTitle
        Format
        Progress
        CreatedAt
        ErrorReason
        Actions
```

## 任务状态

- 排队中
- 处理中
- 成功，可下载
- 失败，显示真实错误 message
- 已取消

## 关键要求

- 失败任务必须优先展示后端 `error.message` 或 `message`。
- 可编辑 PPTX 的视觉结构分析、gpt-image-2 图层生成错误不能被包装成模糊提示。
- 支持下载、重试、查看项目、清理历史。
- 轮询必须受控，离开页面后停止。

## 验收

- 用户能从任意页面进入导出任务中心。
- 失败原因不用打开开发者工具即可读。
- 没有任务时展示创建/导出引导。
