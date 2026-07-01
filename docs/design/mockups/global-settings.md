# 全局配置中心设计稿约束

## 页面目标

全局配置中心是系统默认行为的唯一管理入口。它替代旧系统设置和大部分项目设置，展示当前生效配置、来源和可覆盖策略。

## 布局结构

```text
AppShell
  Main
    PageHeader: 全局配置 / 保存状态 / 测试连接
    SplitPanel
      ConfigNav
        基础信息
        AI 模型
        生成策略
        PPT 导出
        模板与素材
        文件解析
        服务连接
        安全与审计
        项目覆盖
      ConfigPanel
        SectionHeader
        SearchConfig
        FormRows
        EffectiveSourceBadge
        InlineValidation
        StickySaveBar
```

## 关键约束

- OpenAI/ChatGPT 是默认推荐主线。
- Gemini、nano banana、LazyLLM、百度等放入兼容/高级配置。
- 每个关键配置展示当前值和来源：系统默认、全局配置、项目覆盖、个人覆盖。
- 密钥不明文回显，只显示已配置状态或长度。
- 服务测试必须用户主动触发。
- 有脏状态提示，离开页面前拦截未保存修改。

## 验收

- `AI 模型` 分组能区分文本、视觉理解、图片生成、图片描述、可编辑 PPT 结构分析。
- 保存、测试连接、清空密钥、重新填写入口清楚。
- 错误提示是字段级，不只是 toast。
- 旧项目兼容策略有入口说明。
