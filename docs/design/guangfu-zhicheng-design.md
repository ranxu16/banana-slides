---
version: alpha
name: guangfu-zhicheng-system-design
product: 光伏智呈
description: "地面光伏事业部 AI 汇报生成平台。面向光伏逆变器业务的企业级 AI PPT/汇报材料生产工作台。设计目标不是营销展示，而是高频、稳定、易用、可操作、可审计的生产工具。系统采用浅色企业后台风格、左侧导航、顶部工具栏、高密度数据区域、低装饰界面，并把前端视觉、后端接口、权限、数据模型、任务状态、性能和测试统一纳入设计约束。"
---

# 光伏智呈 DESIGN.md

## 1. 产品定位

光伏智呈是地面光伏事业部的 AI 汇报生成平台，服务光伏逆变器相关的项目汇报、经营分析、方案材料、技术总结、客户交流材料等场景。

系统定位：

- 企业级 AI 汇报工作台
- 光伏逆变器业务知识和 PPT 生成能力的统一入口
- 面向多人、多项目、多模板、多任务的生产系统
- 管理员可治理，普通用户可高效产出

非目标：

- 不做营销落地页
- 不保留“蕉幻 / Banana Slides”的轻松玩梗风格
- 不使用大 hero、大渐变标题、GitHub 统计、无业务价值装饰
- 不为了视觉牺牲可操作性和性能

## 2. 核心设计原则

### 2.1 易用性优先

- 页面第一屏必须让用户知道下一步能做什么。
- 高频动作必须明显：新建汇报、继续项目、导出、查看任务、选择模板。
- 文案使用业务语言，不使用技术暗语。
- 空状态要告诉用户为什么为空，以及下一步做什么。

### 2.2 可操作性优先

- 操作路径短，避免用户在多个弹窗和页面之间来回找入口。
- 重要状态可见：项目状态、导出状态、模板解析状态、文件上传状态、AI 生成状态。
- 危险操作可确认，失败操作可重试。
- 管理页支持搜索、筛选、分页、批量操作的扩展能力。

### 2.3 性能优先

- 首页首屏不得加载重型装饰资源。
- 模板缩略图懒加载。
- 大列表必须分页，禁止前端一次性渲染大量项目、用户或素材。
- 导出任务轮询必须受控，不在后台无限高频请求。
- 页面切换尽量避免重复拉取同一份全局数据。

### 2.4 企业后台优先

- 浅色主界面。
- 弱装饰、低圆角、细边框、轻阴影。
- 信息密度高，但层级清晰。
- 左侧导航 + 顶部工具栏 + 主内容区。

### 2.5 全链路一致

设计不仅包括前端 UI，也包括：

- 后端接口语义
- 权限边界
- 数据模型
- 任务状态
- 错误码和错误提示
- 性能策略
- 测试和回归验收

### 2.6 ChatGPT/OpenAI 能力优先

系统后续默认模型主线必须从原来的 Gemini / nano banana 导向，调整为 ChatGPT/OpenAI 能力优先。

规则：

- 默认文本生成、视觉理解、图片结构分析、可编辑 PPT 结构拆解等主路径优先使用 ChatGPT/OpenAI 系列能力。
- 默认图片生成/编辑能力优先使用 OpenAI 图像模型能力。
- Gemini、nano banana、LazyLLM、百度等能力作为可配置的兼容项、后备项或特定场景适配项，不再作为默认产品叙事和默认配置主线。
- 前端文案不再出现“基于 nano banana pro”的产品定位。
- 设置页的模型配置要以“ChatGPT/OpenAI 默认推荐配置”为主，其他供应商放到高级配置或兼容配置。
- 后端模型选择必须有清晰的优先级、回退策略和错误提示。
- 不硬编码不可用模型名；具体模型名在实现阶段根据当前官方能力、用户 API Key 支持情况和配置项确定。

### 2.7 可编辑 PPTX 视觉还原流水线

可编辑 PPTX 导出必须以“高保真还原 + 尽可能可编辑”为目标，而不是用低质量兜底结果冒充完成。

核心流水线：

```text
原始页面图片
  -> GPT 视觉结构拆层
  -> gpt-image-2 生成独立非文字元素
  -> PPTX 矢量形状 / 图片图层 / 文本框合成
  -> 渲染结果与原图对比
  -> 必要时生成修正提示并重试
```

实现规则：

- GPT 视觉结构分析是主路径，负责识别背景、卡片、形状、图标、信息图、装饰线和复杂非文字图层。
- 可用 PPT 矢量表达的元素进入 `shapes`，复杂非文字元素进入 `image_layers`。
- `image_layers` 必须由 OpenAI 图片模型生成独立元素文件，不能简单裁原图后冒充 GPT 图层生成。
- 导出服务只负责任务调度、进度、错误透传和文件保存；视觉拆层、图层生成、背景处理、结果比对必须封装为独立流水线服务。
- 服务错误必须真实透传，例如额度、限流、鉴权、模型不支持图片输入，不得被包装成“未返回有效图层”。
- 启发式结构只能在用户关闭 GPT 视觉结构分析时作为兼容路径使用，不能污染 GPT 主路径。
- 原图对比校正需要以可量化指标记录差异；当渲染器可用时，使用导出 PPTX 的渲染图与原图比较，并把差异区域反馈给下一轮 GPT 拆层/生成。

## 3. 品牌与命名

产品名：光伏智呈

定位语：地面光伏事业部 AI 汇报生成平台

英文辅助名：PV SmartDeck

Logo 方向：

- 光伏板网格
- 报告屏幕或文档页轮廓
- 太阳弧线或逆变器波形
- 橙金色能量线作为强调
- 不能出现香蕉、卡通或玩梗元素

浏览器标题：

- 光伏智呈 | AI 汇报生成平台

## 4. 视觉系统

### 4.1 颜色

```yaml
colors:
  canvas: "#F7F8FA"
  surface: "#FFFFFF"
  surface-muted: "#F2F4F7"
  surface-subtle: "#FAFBFC"
  border: "#E5E7EB"
  border-strong: "#D1D5DB"
  text-primary: "#111827"
  text-secondary: "#4B5563"
  text-muted: "#9CA3AF"
  brand: "#F59E0B"
  brand-hover: "#D97706"
  brand-soft: "#FFF7E6"
  graphite: "#1F2937"
  danger: "#DC2626"
  success: "#16A34A"
  warning: "#F59E0B"
  info: "#2563EB"
```

使用规则：

- 品牌橙只用于主按钮、选中态、关键数字和图标强调。
- 页面背景用浅灰，内容容器用白色。
- 禁止大面积橙色背景。
- 禁止多色渐变作为主视觉。
- 表格白底必须显式设置深色文字，避免深色模式继承导致看不见。

### 4.2 字体

```yaml
typography:
  page-title: 22px / 600 / 1.3
  section-title: 16px / 600 / 1.4
  card-title: 15px / 600 / 1.4
  body: 14px / 400 / 1.5
  body-strong: 14px / 600 / 1.5
  caption: 12px / 400 / 1.4
  button: 14px / 500 / 1.2
```

规则：

- 页面内不使用超大 display 标题。
- 业务后台的标题以清晰为主，不做品牌展示。
- 表格、按钮、表单使用 14px 为主。

### 4.3 圆角与阴影

```yaml
radius:
  input: 6px
  button: 6px
  card: 8px
  modal: 8px
  table: 8px

shadow:
  card: "0 1px 2px rgba(16,24,40,0.06)"
  dropdown: "0 8px 24px rgba(16,24,40,0.12)"
```

规则：

- 卡片不要超过 8px 圆角。
- 不使用大面积厚重阴影。
- 不使用装饰性发光、渐变光斑、漂浮元素。

## 5. 全局布局

目标结构：

```text
┌──────────────────────────────────────────────┐
│ TopBar: 搜索 / 快捷创建 / 任务状态 / 用户       │
├──────────────┬───────────────────────────────┤
│ Sidebar      │ Main Content                   │
│ 工作台        │ PageHeader                     │
│ 我的项目      │ Toolbar / Filters              │
│ 模板中心      │ Content                         │
│ 素材中心      │                               │
│ 导出任务      │                               │
│ 用户管理      │ admin only                    │
│ 系统设置      │ admin only                    │
└──────────────┴───────────────────────────────┘
```

布局尺寸：

- Sidebar 宽度：220px
- TopBar 高度：56px
- 主内容 padding：24px
- 内容最大宽度：按页面类型决定，列表页可全宽，编辑页保留工作区宽度

移动端：

- Sidebar 折叠为抽屉。
- TopBar 保留菜单按钮、页面标题、用户入口。
- 表格降级为卡片列表或横向滚动。

## 6. 导航与权限

普通用户菜单：

- 工作台
- 我的项目
- 模板中心
- 素材中心
- 导出任务
- 个人设置

管理员额外菜单：

- 用户管理
- 全局配置
- 全部项目
- 未归属历史项目

规则：

- 前端菜单隐藏不是权限控制，只是体验优化。
- 后端接口必须继续校验权限。
- 用户状态必须在 AppShell 渲染前恢复，避免管理员菜单闪烁或丢失。
- 原“系统设置”和原“项目设置”的通用能力必须合并到“全局配置”，减少分散入口。
- 项目内只保留少量明确的覆盖项入口，不再复制一整套项目设置页。

## 7. 页面设计

### 7.1 登录页

内容：

- 光伏智呈 Logo
- 地面光伏事业部 AI 汇报生成平台
- 用户名、密码
- 登录按钮
- 错误提示

要求：

- 白底深色字，输入内容必须可见。
- 错误提示展示后端真实 message。
- 不展示注册入口，除非明确启用开放注册。

### 7.2 工作台首页

模块：

- 快捷创建汇报
- 最近项目
- 常用模板
- 导出任务状态
- 系统状态
- 管理员可见的用户/项目统计

要求：

- 首屏直接进入操作区。
- 不使用大 hero。
- 不展示 GitHub 统计。
- 创建 PPT 的核心流程必须保留。

### 7.3 项目管理页

模块：

- 搜索
- 筛选：类型、状态、时间、归属
- 项目表格
- 批量操作
- 分页

要求：

- 普通用户仅看自己项目。
- 管理员可看全部项目和未归属历史项目。
- 项目状态要可读，失败状态要有原因入口。

### 7.4 用户管理页

模块：

- 总用户、活跃用户、总项目、已归属项目、未归属历史项目
- 用户表格
- 创建用户
- 禁用/启用
- 设置管理员
- 重置密码

要求：

- 统计口径必须说明清楚。
- 表格文字在浅色背景必须可见。
- 禁止管理员禁用、删除、降级自己。

### 7.5 全局配置中心

定位：

- 全局配置中心是系统默认行为的唯一管理入口。
- 原设置页中的系统能力、原项目设置中的通用生成/导出能力，统一收敛到这里。
- 新建项目默认继承全局配置。
- 已有项目只允许保留必要覆盖项，并明确显示“使用全局默认”或“项目覆盖”。

信息架构：

- 基础信息：产品名称、组织名称、默认语言、默认输出格式。
- AI 模型：文本生成、视觉理解、图片生成/编辑、图片描述、可编辑 PPT 结构分析。
- 生成策略：大纲生成、描述生成、翻新模式、参考文件解析、任务并发上限。
- 可编辑 PPT 导出：视觉结构分析、文字保留策略、元素拆层策略、背景处理策略、图标/插画生成策略、局部修复策略。
- 模板与素材：默认模板、模板分组、素材库路径、素材可见范围。
- 文件解析：PPT/PDF/图片/文档解析方式、MinerU 或其他解析服务、失败降级策略。
- 服务连接：OpenAI/ChatGPT API、兼容供应商、OAuth/Codex 连接、图像服务、导出服务。
- 安全与审计：密钥管理、操作日志、敏感配置展示规则。
- 项目覆盖：列出允许项目单独覆盖的字段，并提供批量恢复为全局默认。

页面结构：

```text
┌──────────────────────────────────────────────┐
│ PageHeader: 全局配置 / 保存状态 / 测试连接      │
├──────────────┬───────────────────────────────┤
│ ConfigNav    │ ConfigPanel                    │
│ 基础信息      │ section title                  │
│ AI 模型       │ form rows                      │
│ 生成策略      │ inline validation              │
│ PPT 导出      │ effective value/source         │
│ 模板与素材    │ sticky save bar                │
│ 文件解析      │                               │
│ 服务连接      │                               │
│ 安全与审计    │                               │
│ 项目覆盖      │                               │
└──────────────┴───────────────────────────────┘
```

要求：

- 配置分组清晰。
- 服务测试结果可读。
- 密钥类字段不明文回显，只显示长度或已配置状态。
- 每个关键配置必须显示当前生效值和来源：系统默认、全局配置、项目覆盖、个人覆盖。
- 保存前要有脏状态提示；离开页面前要拦截未保存修改。
- 服务测试必须由用户主动触发，不得页面加载时自动调用外部模型接口。
- 低频高级项默认折叠，但必须可搜索。
- 设置搜索要支持按配置名、供应商、能力类型查找。
- 敏感字段必须支持“测试连接”“清空”“重新填写”，不能明文展示。
- 配置错误要给出字段级提示，不只弹出通用失败。
- 管理员保存全局配置后，新建项目立即使用新默认值。
- 普通用户如允许个人配置，只能影响自己的任务，不能修改全局默认。
- 项目页内的设置入口只展示项目覆盖项，例如“本项目使用不同导出策略”；默认状态必须是继承全局配置。
- 任何从项目设置迁出的字段都必须提供迁移兼容，旧项目不能因为字段位置变化而失效。

### 7.6 编辑与预览页

第一阶段只统一外壳：

- 顶部操作栏
- 返回路径
- 用户菜单
- 导出任务入口

不重构：

- 大纲生成逻辑
- 描述生成逻辑
- 图片生成逻辑
- 导出逻辑

## 8. 后端设计规则

### 8.1 接口语义

统一响应：

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

错误响应：

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "用户名或密码错误",
    "details": {}
  }
}
```

要求：

- 前端必须优先读取 `error.message`。
- 后端错误码要稳定，不使用裸字符串。
- 业务失败和系统失败要区分。

### 8.2 权限

- `require_auth` 保护用户接口。
- `require_admin` 保护管理接口。
- 普通用户只能访问自己的项目、模板、素材。
- 管理员可以访问全部项目和未归属历史项目。

### 8.3 数据模型

核心实体：

- User
- UserSettings
- GlobalSettings
- Project
- Template
- Material
- ReferenceFile
- ExportTask

要求：

- 新建项目必须绑定当前用户。
- 历史项目 `user_id = null` 必须有明确展示和迁移方案。
- 删除用户时要明确项目处理策略：删除、转移或置空。
- `GlobalSettings` 是系统默认配置的唯一事实来源。
- `Project` 不再承载完整项目设置，只保留必要覆盖字段。
- `UserSettings` 只保存个人偏好或个人 API 配置，不覆盖管理员治理边界。
- 旧项目设置字段必须通过迁移或兼容读取映射到新的配置体系。
- 配置读取必须通过统一的解析服务，不允许各业务模块直接拼配置。

配置生效优先级：

```text
system defaults
  < global settings
  < project overrides
  < user personal overrides
```

约束：

- 管理员可决定哪些字段允许项目覆盖、哪些字段允许个人覆盖。
- 任务创建时必须记录本次任务使用的配置快照，便于审计和复现。
- 导出任务、生成任务、解析任务都必须从同一个 effective config 获取配置。
- 敏感配置只在后端解密使用，接口响应不得返回明文。
- 配置变更必须记录操作者、时间、字段、旧状态摘要和新状态摘要。

### 8.4 性能

- 列表接口必须支持分页。
- 搜索和筛选在后端执行。
- 任务轮询必须可停止。
- 图片缩略图要按需加载。
- 大型文件解析和导出必须走后台任务。

### 8.5 AI 模型策略

默认模型策略：

- `text_model_source`: `openai`
- `image_model_source`: `openai`
- `image_caption_model_source`: 默认跟随 OpenAI/ChatGPT 主线
- `ai_provider_format`: 默认 OpenAI 兼容格式

配置原则：

- 管理员可在系统设置中修改默认模型。
- 普通用户如启用个人 API 配置，只影响自己的生成任务。
- 模型配置必须区分文本、图像、视觉理解/图片描述、可编辑 PPT 结构分析。
- 当用户配置了与供应商不兼容的模型名时，后端必须给出明确提示或自动降级到兼容模型，并记录日志。
- 设置页必须显示当前生效供应商和模型，不让用户猜系统到底在用哪个能力。

兼容与迁移：

- 旧配置中的 Gemini / nano banana 相关模型不直接删除。
- 升级后若未显式配置模型，默认走 OpenAI/ChatGPT。
- 若历史项目保存了旧模型配置，项目可继续读取，但新建项目使用新默认策略。
- UI 中所有“nano banana”品牌化文案替换为“ChatGPT/OpenAI 默认能力”或中性的“AI 模型能力”。

测试要求：

- 测试默认配置是否解析为 OpenAI/ChatGPT 主线。
- 测试 Gemini 旧配置仍能作为兼容项工作。
- 测试不兼容模型名的提示和降级逻辑。
- 测试设置页展示的模型来源与后端实际调用一致。

### 8.6 全局配置接口

建议接口：

```text
GET    /api/settings/global
PUT    /api/settings/global
GET    /api/settings/effective?project_id=:id
POST   /api/settings/test-connection
GET    /api/settings/override-schema
PUT    /api/projects/:id/settings-overrides
DELETE /api/projects/:id/settings-overrides/:key
```

要求：

- `global` 接口只允许管理员写入。
- `effective` 接口返回当前生效配置、来源和是否可覆盖。
- `test-connection` 必须支持指定配置片段测试，不能强制保存后才能测试。
- `override-schema` 返回项目允许覆盖的字段，前端据此渲染项目覆盖表单。
- 更新配置必须做 schema 校验、供应商能力校验和权限校验。
- 配置接口返回体要稳定，避免前端散落兼容判断。

## 9. 组件规范

优先建设：

- AppShell
- Sidebar
- TopBar
- PageHeader
- StatsCard
- DataTable
- FilterBar
- StatusPill
- ActionMenu
- EmptyState
- LoadingState
- ErrorState

禁止：

- 新页面大量 inline style。
- 同类按钮重复定义样式。
- 表格每页各写一套。
- 无 loading、无 error、无 empty 状态。

## 10. 设计评审

每个阶段开发前必须检查：

- 是否符合“光伏智呈”业务定位。
- 是否符合企业后台风格。
- 高频操作是否直达。
- 是否减少点击和认知负担。
- 是否有清晰的状态、错误和空数据。
- 是否对性能有约束。
- 是否与后端权限/数据模型一致。

评审输出：

- 页面结构
- 关键交互
- 接口依赖
- 风险点
- 回滚方案
- 测试清单

## 11. 代码 Review

重点检查：

- 是否复用统一组件。
- 是否存在不必要 inline style。
- 权限判断是否前后端一致。
- 是否有重复请求。
- 是否有加载/错误/空状态。
- 是否影响生成、导出、模板、素材核心流程。
- 是否引入性能隐患。
- 配置读取是否统一走 effective config。
- 项目覆盖是否只包含白名单字段。
- 敏感配置是否没有明文进入前端、日志和任务记录。

## 12. 测试方案

### 12.1 单元测试

- 权限菜单过滤。
- 用户状态恢复。
- API 错误解析。
- 数据格式转换。
- 状态枚举映射。
- 全局配置解析。
- 项目覆盖优先级。
- 个人配置优先级。
- 旧项目设置兼容映射。
- 敏感字段脱敏响应。

### 12.2 冒烟测试

- admin 登录。
- 普通用户登录。
- 打开工作台。
- 创建项目。
- 打开历史项目。
- 打开用户管理。
- 打开全局配置。
- 修改一个非敏感配置并保存。
- 测试 OpenAI/ChatGPT 连接。
- 项目内切换一个允许覆盖项并恢复全局默认。
- 退出登录。

### 12.3 系统测试

- 从创建项目到导出完整链路。
- 模板选择。
- 素材选择。
- 文件上传和解析。
- 用户创建、禁用、重置密码。
- 历史项目搜索、筛选、分页。
- 全局配置变更后新建项目继承新默认。
- 老项目仍按兼容规则读取历史配置。
- 任务详情能追溯本次使用的模型和导出策略。

### 12.4 回归测试

- PPT 生成能力不退化。
- 可编辑 PPT 导出入口不丢。
- 视觉结构分析配置不丢。
- 多用户项目隔离不破。
- 管理员访问历史未归属项目不破。
- Docker 重建后服务正常。
- 原设置页能力不丢。
- 原项目设置能力迁移后仍可生效。
- OpenAI/ChatGPT 默认主线不被旧 Gemini/nano banana 配置误覆盖。

### 12.5 性能测试

- 首页首屏渲染。
- 历史项目大列表。
- 模板缩略图加载。
- 导出任务轮询频率。
- 页面重复进入是否重复请求。
- 全局配置缓存命中率。
- 设置页按需加载高级配置。
- 服务测试不阻塞页面交互。
- 配置保存不触发无关大列表刷新。

## 13. 回滚与应急

当前 baseline 提交：

```text
879121e Add multi-user auth and admin baseline
```

重构分支：

```text
ui-guangfu-dashboard-redesign
```

策略：

- 每个阶段单独提交。
- 先实现新布局，不删除旧业务逻辑。
- 复杂编辑页可暂时绕过新 AppShell。
- 出现阻断问题时，回滚最近阶段提交。
- 先恢复可用，再继续精修。

## 14. 阶段计划

### Phase 1: 设计底座

- 完成 DESIGN.md。
- 确定 Logo 和图标。
- 生成关键页面效果图。

关键界面设计稿与验收说明已登记在：

- `docs/design/mockups/README.md`
- `docs/design/mockups/workbench-dashboard.md`
- `docs/design/mockups/projects-page.md`
- `docs/design/mockups/global-settings.md`
- `docs/design/mockups/export-tasks.md`
- `docs/design/mockups/user-management.md`
- `docs/design/mockups/materials-templates.md`
- `docs/design/mockups/editor-preview-shell.md`

正式实现页面前必须先阅读对应设计稿说明。页面完成后必须用本地截图对照验收。

### Phase 2: AppShell

- 新建 AppShell。
- 新建 Sidebar。
- 新建 TopBar。
- 菜单按权限过滤。

### Phase 3: 工作台首页

- 重构首页为 Dashboard。
- 保留原创建 PPT 能力。
- 加入最近项目、模板、任务状态。

### Phase 4: 管理与项目页

- 重构用户管理。
- 重构历史项目。
- 统一表格、筛选、分页。

### Phase 5: 设置与编辑页统一

- 全局配置中心重构。
- 原项目设置能力整合到全局配置。
- 项目内设置入口降级为“项目覆盖项”。
- 编辑页/预览页统一顶部栏和基础视觉。
- 不大改核心生成逻辑。

### Phase 6: 配置后端生效链路

目标：让“全局默认配置 / 个人配置 / 项目覆盖”不只停留在前端展示，而是真正参与生成、导出和服务测试。

必做项：

- 新增用户级个人配置 schema/API，支持当前用户读取、保存、重置个人配置。
- 支持 `force_global_default`，用户可强制忽略个人配置并回退全局默认。
- 支持能力级 `use_global_default` 或等价字段，允许单项能力继承全局默认。
- 个人 API Key 加密存储、脱敏展示、按用户隔离，不返回明文。
- 后端配置 resolver 统一计算：`系统默认 → 全局配置 → 用户个人配置 → 项目覆盖 → 当前生效值`。
- resolver 返回每项能力的来源、执行方式、是否可用和不可用原因。
- Codex / ChatGPT 账号连接不再只是前端提示，后端需返回账号连接状态、授权范围和当前能力是否可执行。
- 大纲生成、页面描述、自然语言修改允许走个人订阅/账号连接或 API。
- 图片生成、生成 PPTX、可编辑 PPTX 视觉拆层、`gpt-image-2` 独立元素生成、导出任务队列必须走 API / 企业代理。
- 设置页服务测试必须使用 resolver 后的当前生效配置，而不是直接读取单个全局字段。

验收：

- 同一用户启用个人配置后，新建项目默认使用个人配置。
- 用户切换“强制使用全局默认”后，生成任务立即回退全局默认。
- 选择 Codex 但未连接账号时，后端返回明确不可用原因，前端不静默失败。
- 个人密钥不进入接口响应、日志和任务记录明文。
- 项目覆盖优先级高于个人配置，且界面能展示来源。

### Phase 7: 配置链路接入生成工作流

目标：把 Phase 6 的 resolver 接到实际业务调用点，避免页面配置和后端调用不一致。

接入范围：

- 一问生成 PPT 大纲。
- 从描述生成大纲和页面描述。
- 自然语言修改。
- 图片描述 / 视觉理解。
- 图片生成。
- 可编辑 PPTX：GPT 视觉拆层。
- 可编辑 PPTX：`gpt-image-2` 独立元素生成。
- 可编辑 PPTX：拼回 PPTX 和原图对比校正。
- 导出任务中心失败原因展示。

验收：

- 设置页显示的当前生效模型与后端实际调用一致。
- 每个任务记录配置来源摘要。
- 失败任务展示 resolver 返回的真实原因。
- 订阅/账号连接不可用于某项后台任务时，前端提示可读，不出现泛化“网络失败”。

## 14.1 当前状态快照

截至 2026-07-01 18:05，当前改造状态如下。

已完成：

- AppShell 和工作台首页首轮重构。
- 我的项目页面首轮重构。
- 导出任务中心一级页面。
- 资源中心合并，模板/素材入口收敛为资源中心。
- 编辑/预览页外壳统一。
- 全局配置中心前端 V2：`全局默认配置 / 个人配置` 二级入口。
- 个人配置页已与全局配置页同构展示：基础配置、AI 模型、生成策略、文件解析、服务连接、兼容高级、服务测试、覆盖链路。
- Codex 在前端可选择；未连接账号时显示“需连接账号”，不再禁用选项。
- 用户级个人配置 schema/API 第一片：读取、保存、重置、敏感值脱敏。
- `force_global_default` 与能力级 `use_global_default` 已持久化并参与解析。
- effective config resolver 第一片，可返回逐能力来源、执行方式、可用状态和不可用原因。
- 个人配置页已接入后端读写，并展示 resolver 返回的能力矩阵。
- 可编辑 PPTX 已形成“GPT 视觉结构分析 -> `gpt-image-2` 独立元素生成 -> PPTX 拼装”的流水线骨架。
- 文本模型、图片识别、图片生成三类服务测试已接入 effective config，未保存表单值作为最高优先级临时覆盖，并记录非敏感配置来源。
- 大纲生成、页面描述和文本自然语言修改的主要同步、流式与后台任务入口已接入请求级 `AIRuntimeConfig`。
- 批量图片生成、单页图片生成和图片编辑已接入“文本 prompt runtime + 图片 runtime”组合配置，并记录双来源摘要。
- 可编辑 PPTX 已接入“Caption 视觉理解 runtime + Image 独立元素 runtime”，覆盖图层识别、文字样式视觉提取和独立元素生成。

部分完成：

- resolver 已覆盖全局与个人层，项目覆盖层尚未接入。
- Codex / ChatGPT 连接状态已返回，但仍复用全局 OAuth，尚未做到用户级账号隔离。
- 可编辑 PPTX 流水线已有结构分析与元素生成实现，仍缺真实样例端到端视觉比对和自动校正闭环。

未完成且必须进入后续计划：

- 个人 API Key 加密存储；当前已脱敏展示，但数据库字段仍需加密。
- 用户级 Codex / ChatGPT OAuth 隔离与授权范围管理。
- 大纲、描述、自然语言修改、图片生成、可编辑 PPTX、导出任务等业务调用点接入 resolver。
- 项目覆盖与个人配置的来源展示和优先级验证。
- 可编辑 PPTX 真实样例端到端视觉对比、差异量化与自动校正。

下一阶段建议顺序：

1. 先实现请求/任务级 `AIRuntimeConfig` 与按 Provider、模型、API Base、凭据指纹隔离的 Provider 缓存。
2. 进入 Phase 7，逐个接入生成工作流：大纲/描述/自然语言修改 -> 图片生成 -> 可编辑 PPTX -> 导出任务。
3. 补项目覆盖层、任务配置来源摘要和真实失败原因展示。
4. 最后完成个人密钥加密、用户级 OAuth 隔离，以及可编辑 PPTX 端到端视觉校正验收。

## 15. 执行记录与进展同步规则

从 2026-07-01 起，所有前端改造、后端配置改造、可编辑 PPTX 流水线改造，以及与本设计文档相关的任务，都必须在执行过程中持续更新本文件。

硬性要求：

- 每完成一个明确步骤，必须在本文件记录进展、结果、验证方式和遗留问题。
- 如果某一步失败或被阻塞，也必须记录原因、日志摘要、当前判断和下一步动作。
- 不能只在对话中说明进度；关键信息必须沉淀到本设计文档，避免上下文丢失。
- 代码改动、设计稿约束、接口变更、测试结果、运行端口、已知风险都应进入执行记录。
- 每次代码改动必须有专门记录改动点，至少列出涉及文件、用户可见变化、保留/未改的业务逻辑、验证命令和遗留风险。
- 后续继续任务时，先阅读本节最近记录，再决定下一步，不从记忆或猜测开始。
- 如果新增关键界面设计稿，必须在本文件登记文件路径、适用页面和验收约束。

记录格式：

```text
### YYYY-MM-DD HH:mm - 标题

- 范围：
- 动作：
- 结果：
- 验证：
- 遗留：
- 下一步：
```

### 2026-07-01 00:00 - 新增设计文档进展同步要求

- 范围：光伏智呈前端改造、全局配置改造、可编辑 PPTX 视觉流水线，以及所有受本 DESIGN.md 约束的后续任务。
- 动作：新增“执行记录与进展同步规则”，要求每执行一个明确步骤都写回本设计文档。
- 结果：后续任务必须把进展、结果、验证和遗留问题沉淀到本文件，避免关键信息只存在于对话上下文。
- 验证：已在本文件新增第 15 节和首条执行记录。
- 遗留：需要在后续执行中补齐关键界面设计稿路径，并把每个阶段的实际完成情况持续追加。
- 下一步：开始任何新改造前，先读取最近执行记录；完成每一步后追加或更新记录。

### 2026-07-01 00:10 - 前端改造开工前准备检查

- 范围：光伏智呈前端改造继续执行前的准备事项检查。
- 动作：检查最近执行记录、当前工作区状态、`docs/design` 设计资产目录、`frontend/src/components/layout` 组件现状和前端守卫脚本。
- 结果：当前已具备主设计文档、初版 AppShell/BrandLogo、品牌守卫脚本和 PV SmartDeck 图标资源；但关键界面设计稿尚未落盘，`docs/design` 目前只有本 DESIGN.md，缺少 `mockups/` 或等价目录；模板中心、素材中心、导出任务中心仍是菜单占位或弹窗逻辑，尚未具备独立页面验收基准。
- 验证：通过 `git status --short`、`find docs/design`、`find frontend/src/components/layout`、`find frontend/scripts` 检查当前文件与资源。
- 遗留：需要补齐关键界面设计稿文件路径和验收说明；需要确认是否先提交/保存当前大量未提交改动，避免后续阶段混在一起；需要确认 3012/5012 本地服务状态是否作为每阶段截图验收基准。
- 下一步：优先建立 `docs/design/mockups/` 并登记关键界面设计稿；随后按 Phase 2/3 从 AppShell 和工作台首页开始逐页实现与截图验收。

### 2026-07-01 00:20 - 开工准备资产落盘

- 范围：前端正式改造前的设计资产、验收说明和准备清单。
- 动作：新增 `docs/design/mockups/` 目录，补齐工作台首页、我的项目、全局配置中心、导出任务中心、用户管理、模板与素材中心、编辑/预览页外壳的设计稿约束文件；新增 `docs/design/implementation-readiness.md` 准备清单；在 Phase 1 中登记关键设计稿路径。
- 结果：后续页面实现已有可引用的设计稿约束和验收标准；工作台、项目、配置、任务、用户、资源、编辑外壳七类关键界面均有独立说明。
- 验证：通过 `find docs/design -maxdepth 3 -type f -print` 确认新增文件已落盘。
- 遗留：当前设计稿为结构化文字约束，尚未生成可视化 PNG/HTML 高保真稿；当前大量未提交改动仍需阶段性保存或提交；本地 3012/5012 服务状态还需在进入页面实现前确认。
- 下一步：跑前端品牌守卫和构建确认基线；随后从 AppShell 收尾和工作台首页开始实现，并在每一步后更新本执行记录。

### 2026-07-01 00:30 - 开工基线验证

- 范围：前端品牌守卫、AppShell 回归测试和设计资产落盘验证。
- 动作：执行 `npm run guard:brand`、`npm run test:run -- src/tests/branding-workbench-regression.test.ts`，并再次列出 `docs/design` 文件。
- 结果：品牌/工作台守卫通过；AppShell 与旧品牌回归测试通过；关键设计稿约束文件和准备清单均已落盘。
- 验证：`guard:brand` 输出 `Brand/workbench regression guard passed.`；Vitest 输出 `1 passed (1), 2 tests passed`；`find docs/design` 能列出 `mockups/` 下 8 个文件和 `implementation-readiness.md`。
- 遗留：尚未运行完整 `npm run build`；尚未启动或截图验证 3012 页面；当前工作区仍有大量未提交改动。
- 下一步：正式实现前先确认是否需要阶段性提交当前准备工作；若继续编码，第一步应处理 AppShell 收尾和工作台首页，并使用 `mockups/workbench-dashboard.md` 作为验收约束。

### 2026-07-01 08:10 - 确认分支并启动 AppShell/工作台改造

- 范围：前端改造分支确认、改动记录规则强化、AppShell 收尾和工作台首页重构启动。
- 动作：确认当前 Git 分支为 `ui-guangfu-dashboard-redesign`；读取 `mockups/workbench-dashboard.md`、`frontend/src/components/layout/AppShell.tsx` 和 `frontend/src/pages/Home.tsx`；明确本次只做 AppShell 收尾与首页 Dashboard 渲染层重构，不重写创建项目业务逻辑。
- 结果：确认当前分支是为光伏智呈工作台改造准备的专用分支；发现 Home 仍保留旧独立导航、装饰背景、Footer 和非工作台式创建卡片，需要替换为 AppShell 内的企业后台 Dashboard。
- 验证：`git branch --show-current` 输出 `ui-guangfu-dashboard-redesign`；`git status --short` 显示当前仍有大量未提交改动。
- 遗留：需要在本次代码改动完成后追加具体改动点、测试结果和遗留问题；当前未提交改动较多，后续建议阶段性提交。
- 下一步：修改 AppShell 菜单/顶部栏与 Home JSX 渲染层，保留现有 state、上传、素材、模板、创建项目、跳转逻辑。

### 2026-07-01 08:35 - AppShell 收尾与工作台首页首轮重构

- 范围：`frontend/src/components/layout/AppShell.tsx`、`frontend/src/App.tsx`、`frontend/src/pages/Home.tsx`。
- 动作：将 AppShell 中“模板中心 / 素材中心 / 导出任务”从 disabled 菜单改成可进入导航；在 `App.tsx` 增加三个 AppShell 占位路由，明确后续阶段接入能力；将 Home 的旧独立导航、装饰背景、Footer 和大卡片创建区替换为 AppShell 内 Dashboard：页面标题、状态统计、快捷创建、最近项目、导出任务摘要、系统状态；保留原上传、粘贴、素材、模板、参考文件、PPT 翻新、创建项目和跳转逻辑。
- 结果：工作台首页已经从旧 landing/独立导航结构转为企业后台 Dashboard 结构；一级菜单不再不可点击；工作台第一屏包含创建入口、参考文件状态、素材入口、OpenAI 主线、最近项目和导出任务摘要。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/App.tsx frontend/src/components/layout/AppShell.tsx frontend/src/pages/Home.tsx docs/design/guangfu-zhicheng-design.md` 通过；`curl http://127.0.0.1:3012/` 和 `curl http://127.0.0.1:5012/health` 可访问。
- 遗留：`npm run build:check` 仍被仓库既有 TypeScript 严格错误阻塞，包括 `AccessCodeGuard`、`MaterialCenterModal`、`MaterialGeneratorModal`、`Settings`、`useProjectStore`、部分测试类型等；本次新增的 `Button variant="outline"` 类型错误已修复为 `secondary`；Playwright 截图因本机缺少浏览器运行时失败，错误提示需要 `npx playwright install`，因此 1440x900 视觉截图验收待补。
- 下一步：在可截图环境或安装 Playwright 浏览器运行时后补工作台截图验收；随后继续按 `mockups/projects-page.md` 重构“我的项目”，或先阶段性提交当前 AppShell/工作台首轮改造。

### 2026-07-01 08:45 - 前端改造 checkpoint 准备

- 范围：准备阶段性保存当前前端工作台改造，不混入后端可编辑 PPTX 流水线改动。
- 动作：检查工作区状态，确认待提交范围限定为 `frontend/` 与 `docs/design/`；后端相关改动保持未提交，留给后续独立 checkpoint。
- 结果：前端工作台首轮、AppShell、品牌守卫、设计文档、关键界面设计稿可作为一个阶段性 checkpoint；后端文件如 `backend/services/export_service.py`、`backend/services/editable_pptx_pipeline.py` 不进入本次提交。
- 验证：`git status --short` 显示前端、设计文档和后端均有改动；本步骤只计划暂存 `frontend/` 和 `docs/design/`。
- 遗留：提交后需要记录 commit hash；随后继续“我的项目”页面重构。
- 下一步：执行 `git add frontend docs/design`，检查暂存文件列表后提交。

### 2026-07-01 08:50 - 前端工作台 checkpoint 已提交

- 范围：`frontend/` 和 `docs/design/`。
- 动作：提交前端品牌守卫、AppShell、工作台首页首轮 Dashboard、关键界面设计稿说明和准备清单。
- 结果：生成阶段性提交 `8d097fa Refactor PV SmartDeck frontend shell and dashboard`，共 42 个文件，包含设计文档、mockups、PV SmartDeck 图标、AppShell、BrandLogo、首页重构、品牌回归测试和前端守卫脚本。
- 验证：提交前已通过 `npm run guard:brand`、`npm run test:run -- src/tests/branding-workbench-regression.test.ts`、`npm run build` 和相关 `git diff --check`。
- 遗留：后端可编辑 PPTX 流水线相关改动仍未提交；本次提交使用本机自动 Git 身份 `许冉 <xuran@xurandeMacBook-Air.local>`；工作台视觉截图验收仍待补。
- 下一步：继续按 `docs/design/mockups/projects-page.md` 重构“我的项目”页面。

### 2026-07-01 09:00 - 我的项目页面首轮重构

- 范围：`frontend/src/pages/History.tsx`。
- 动作：按 `docs/design/mockups/projects-page.md` 将旧“历史项目”页面改为 AppShell 内的“我的项目”管理页；移除页面自带顶部导航、香蕉图标、主题切换和渐变背景；新增 PageHeader、搜索框、状态筛选、管理员范围切换控件、统计卡、桌面表格、移动端项目卡片、批量选择、继续编辑、删除和分页区域。
- 结果：页面主心智从“历史记录”转为“我的项目”；普通项目管理入口更接近设计稿要求；表格白底深色文字可读；保留原加载项目、分页、删除、批量删除、重命名、打开项目、同步项目和跳转逻辑。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/pages/History.tsx docs/design/guangfu-zhicheng-design.md` 通过；`rg` 扫描 `History.tsx` 未发现旧品牌词、香蕉图标、渐变页面背景、`useTheme` 或 `ProjectCard` 旧渲染依赖。
- 遗留：搜索和状态筛选当前先作用于当前页数据，后续需要后端搜索/筛选接口支持全量项目；管理员“全部项目 / 未归属历史项目”目前是可见控件和信息架构占位，尚未接入管理员全局项目接口；项目最近导出字段暂显示“暂无导出”，后续需接导出任务数据。
- 提交：`Refactor projects page dashboard`（最终 hash 以 `git log` 为准，避免提交自引用 hash 在 amend 时反复变化）。
- 下一步：进入导出任务中心或模板/素材中心的一级页面建设。

### 2026-07-01 09:25 - 导出任务中心页面启动

- 范围：`docs/design/mockups/export-tasks.md`、`frontend/src/store/useExportTasksStore.ts`、`frontend/src/components/shared/ExportTasksPanel.tsx`、`frontend/src/App.tsx`。
- 动作：进入导出任务中心一级页面建设前，读取设计稿约束、导出任务 store、预览页已有任务面板和路由占位；确认本步骤只处理 `/exports` 前端页面，不混入后端可编辑 PPTX 流水线改动。
- 结果：确认现有 `useExportTasksStore` 已持久化导出任务、保存真实 `errorMessage`、支持恢复活跃任务与清理完成/失败任务；现有 `ExportTasksPanel` 更适合项目预览页侧栏，不适合作为全局任务中心整页直接复用。
- 验证：通过 `sed` 阅读设计稿、store、面板与路由；`git status --short` 确认当前分支为 `ui-guangfu-dashboard-redesign`，后端未提交改动仍保持未暂存。
- 遗留：store 的轮询目前由 `setTimeout` 链式触发，缺少页面卸载时取消句柄；本步骤先避免新增额外轮询循环，后续需要把轮询生命周期下沉为可停止的任务管理器。
- 下一步：新增 `frontend/src/pages/ExportTasks.tsx`，将 `/exports` 从占位页改为真实任务中心，展示搜索、状态/格式筛选、进度、真实失败原因、下载、重试占位、查看项目和清理历史。

### 2026-07-01 09:45 - 导出任务中心一级页面完成

- 范围：`frontend/src/pages/ExportTasks.tsx`、`frontend/src/store/useExportTasksStore.ts`、`frontend/src/App.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增导出任务中心整页组件；将 `/exports` 路由从占位页切换为真实页面；复用全局导出任务 store 展示任务统计、搜索、状态筛选、格式筛选、进度、警告、下载、查看项目、移除、清理历史；失败任务直接展示 `task.errorMessage`、最新进度消息和 `progress.help_text`，不再只给泛化提示；为 store 增加 `download_url/filename` 进度类型字段，并引入可停止的轮询 timeout 管理。
- 结果：用户可以从一级导航进入导出任务中心；可编辑 PPTX、GPT 视觉结构分析、gpt-image-2 图层生成等失败原因会在任务行内直接可读；页面挂载时恢复活跃任务轮询，离开页面时停止当前 store 中登记的轮询 timeout；预览页原 `ExportTasksPanel` 仍保留。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/pages/ExportTasks.tsx frontend/src/store/useExportTasksStore.ts frontend/src/App.tsx docs/design/guangfu-zhicheng-design.md` 通过。
- 遗留：失败任务的“重新检查”当前只重新拉取原 task 状态，不会重新发起一次导出；真正“重试导出”需要后端提供按历史任务参数重新导出的接口，或前端保存原导出参数并回到项目预览页重新导出；页面暂未展示服务端历史导出文件列表，当前只展示本地持久化的任务记录。
- 下一步：阶段性提交本次导出任务中心前端改造；随后继续模板中心/素材中心或进入全局配置中心整页重构。

### 2026-07-01 10:05 - 全局配置中心首轮重构启动

- 范围：`docs/design/mockups/global-settings.md`、`frontend/src/pages/Settings.tsx`。
- 动作：读取全局配置中心设计稿和现有设置页实现；确认本步骤只做前端信息架构与视觉框架重构，不改 `getSettings/updateSettings/test*` 后端接口，不改实际保存 payload。
- 结果：现有设置页保留了旧“系统设置/返回首页”心智，缺少左侧配置导航、配置来源提示、OpenAI 主线推荐和项目覆盖说明；但现有保存、重置、OAuth、服务测试和敏感字段不回显逻辑可继续复用。
- 验证：通过 `sed` 和 `rg` 定位 Settings 的表单分组、保存逻辑、服务测试逻辑与当前 return 主体。
- 遗留：本步骤暂不实现浏览器离开拦截和字段级校验体系；先完成全局配置中心首屏框架、AI 模型分组说明、密钥状态与来源可见化。
- 下一步：修改 `Settings.tsx` 页面外壳、分组导航与关键辅助信息，并在完成后跑品牌守卫、设置相关测试和构建。

### 2026-07-01 10:25 - 全局配置中心首轮重构完成

- 范围：`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：移除 `SettingsPage` 旧独立渐变背景、卡片容器和返回首页按钮，让 AppShell 统一承接页面标题与布局；在设置页内新增四个状态摘要卡、左侧配置目录、全局配置来源标签、OpenAI/ChatGPT 推荐主线提示、AI 模型分组说明、项目覆盖说明和底部 sticky 保存条；保留原 `getSettings/updateSettings/resetSettings/test*`、OpenAI OAuth、服务测试、敏感字段不回显和保存 payload 逻辑。
- 结果：全局配置中心已经从旧“系统设置”单页卡片转为企业后台配置页；用户能看到当前默认 Provider、敏感密钥配置状态、配置来源和项目覆盖策略；AI 模型区明确文本生成、图片生成、图片识别，以及可编辑 PPTX 视觉结构分析/gpt-image-2 图层生成应优先走 OpenAI 主线。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/pages/Settings.tsx docs/design/guangfu-zhicheng-design.md` 通过；`rg` 检查页面渲染不再包含旧渐变容器、`Card` 包装、`useNavigate/useLocation` 或返回首页按钮。
- 遗留：脏状态检测、离开页面拦截、字段级校验和项目覆盖真实来源链路仍未实现；“服务连接”目前仍在高级配置折叠区内，后续可拆为独立一级配置面板；翻译字典里仍保留少量旧 `系统设置/返回首页` 文案但不再渲染。
- 下一步：阶段性提交本次全局配置中心前端改造；随后继续模板中心/素材中心一级页面，或回到后端配置/可编辑 PPTX 流水线 checkpoint。

### 2026-07-01 10:40 - 模板与素材中心一级页面启动

- 范围：`docs/design/mockups/materials-templates.md`、`frontend/src/App.tsx`、`frontend/src/api/endpoints.ts`、素材/模板相关共享组件。
- 动作：读取模板与素材中心设计稿约束，扫描现有素材和用户模板 API、弹窗选择器、编辑页复用入口；确认本步骤只做 `/templates` 与 `/materials` 前端一级页面，不改素材/模板后端接口。
- 结果：现有接口已支持全局素材列表、上传、删除、下载 zip，以及用户模板列表、上传、删除；一级路由目前仍是 AppShell 内占位页，需要替换为真实资源管理页面。
- 验证：通过 `sed` 阅读设计稿和 `api/endpoints.ts` 相关接口，通过 `rg` 定位 `MaterialSelector`、`MaterialCenterModal`、`TemplateSelector` 等现有复用点。
- 遗留：当前后端模板接口未提供“设为默认模板/最近使用/场景标签”字段；素材可见范围主要可由是否绑定 `project_id` 推断，团队/全局权限还需后端字段完善。
- 下一步：新增 `Templates.tsx` 与 `Materials.tsx` 页面，替换 `/templates` 和 `/materials` 的占位路由，保留接口能力并明确未接字段的占位说明。

### 2026-07-01 11:00 - 模板与素材中心一级页面完成

- 范围：`frontend/src/pages/Templates.tsx`、`frontend/src/pages/Materials.tsx`、`frontend/src/App.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增模板中心页面，接入 `listUserTemplates/uploadUserTemplate/deleteUserTemplate`，支持搜索、场景筛选、上传、删除、缩略图懒加载、空状态和统计卡；新增素材中心页面，接入 `listMaterials/uploadMaterial/deleteMaterial/downloadMaterialsZip`，支持搜索、类型筛选、可见范围筛选、上传、删除、批量下载、缩略图懒加载、空状态和统计卡；将 `/templates`、`/materials` 从占位路由切换为真实页面，并删除 `App.tsx` 中已无使用的 `PlaceholderPage`。
- 结果：模板中心与素材中心不再只是一级菜单占位；素材卡片展示图片/图标/图表推断类型和全局/项目素材范围；模板卡片展示缩略图、名称、更新时间和光伏场景标签；未接入的“使用/设为默认”以禁用按钮明确保留位置。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/App.tsx frontend/src/pages/Templates.tsx frontend/src/pages/Materials.tsx docs/design/guangfu-zhicheng-design.md` 通过；`rg` 检查 `App.tsx` 与新增页面中不再包含模板/素材占位文案。
- 遗留：模板“使用/设为默认”、最近使用、场景标签仍需后端字段与跨页面动作支持；素材“使用”需要结合编辑页上下文选择器接入；团队可见范围还没有后端字段，目前仅能区分全局和项目素材。
- 下一步：阶段性提交模板与素材中心前端改造；随后可继续编辑/预览页外壳统一，或回到后端可编辑 PPTX 流水线与 OpenAI 默认配置 checkpoint。

### 2026-07-01 11:15 - 编辑/预览页外壳统一启动

- 范围：`docs/design/mockups/editor-preview-shell.md`、`frontend/src/pages/OutlineEditor.tsx`、`frontend/src/pages/DetailEditor.tsx`、`frontend/src/pages/SlidePreview.tsx`。
- 动作：读取编辑/预览页外壳设计稿，检查三页当前顶部栏、返回路径、导出任务入口和 AppShell 内重复外壳。
- 结果：三个项目页已经由 `AppShell` 路由包裹，但页面内部仍保留 `min-h-screen/h-screen` 全屏容器、独立 header、旧品牌图标/名称和旧返回路径；预览页已有导出任务面板，可继续复用。
- 验证：通过 `sed` 和 `rg` 定位三个页面顶部栏与主内容容器；确认本步骤只改外壳和导航入口，不改生成、保存、导出、轮询核心函数。
- 遗留：第一轮先统一企业后台外壳和项目阶段工具条，暂不重排编辑区核心布局；后续再做编辑区密度和移动端操作抽屉。
- 下一步：移除三页旧品牌/全屏外壳，补充“工作台/我的项目/全局配置/导出任务”入口，并保持可编辑 PPTX 导出入口不丢。

### 2026-07-01 11:35 - 编辑/预览页外壳首轮统一完成

- 范围：`frontend/src/pages/OutlineEditor.tsx`、`frontend/src/pages/DetailEditor.tsx`、`frontend/src/pages/SlidePreview.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：将大纲页、描述页、预览页的旧全屏外壳改为 AppShell 内的有边界工作区；移除三页顶部栏中的旧品牌图标/名称；改为项目阶段标签、项目标题、页数/完成度说明；新增工作台、我的项目、全局配置等统一入口；预览页保留原导出菜单和可编辑 PPTX 导出入口，并新增跳转全局导出任务中心入口；将预览画布背景从 banana 渐变改为中性灰白工作区，并替换未生成图片空状态的旧品牌符号。
- 结果：三个项目编辑/预览页不再在 AppShell 内重复展示旧品牌页头；返回路径、项目阶段、全局配置和导出任务入口更统一；核心大纲生成、描述生成、图片生成、模板/素材、导出菜单和导出任务面板逻辑未改。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/pages/OutlineEditor.tsx frontend/src/pages/DetailEditor.tsx frontend/src/pages/SlidePreview.tsx docs/design/guangfu-zhicheng-design.md` 通过；`rg` 检查三个页面不再包含旧品牌符号、旧 `home.title` 顶栏引用或旧全屏 banana 渐变背景。
- 遗留：编辑区内部的卡片、工具条密度和移动端按钮折叠仍沿用旧实现；预览页局部弹窗/按钮仍有旧样式细节，后续可继续做编辑区工作流优化；本次未做浏览器截图验收。
- 下一步：阶段性提交本次编辑/预览页外壳统一；随后可切回后端可编辑 PPTX 稳定流水线，或继续细化编辑页移动端/密度。

### 2026-07-01 11:50 - 资源中心合并与全局配置重设计启动

- 范围：`frontend/src/components/layout/AppShell.tsx`、`frontend/src/App.tsx`、`frontend/src/pages/Templates.tsx`、`frontend/src/pages/Materials.tsx`、`frontend/src/pages/Settings.tsx`。
- 动作：根据反馈重新评估模板中心和素材中心的信息架构，确认二者本质都是资源管理；检查全局配置中心左侧导航和右侧 section 对应关系，发现“服务连接/兼容与高级”指向同一折叠区，生成、导出、文件解析字段也分散在多个卡片里。
- 结果：本步骤决定把模板与素材合并为“资源中心”，使用标签页区分模板和素材；原 `/templates`、`/materials` 保留兼容跳转；全局配置中心改成左侧目录与右侧 section 一一对应的结构，重新分组为基础信息、AI 模型、生成策略、文件解析、服务连接、兼容高级、服务测试、项目覆盖。
- 验证：已读取当前实现和最近执行记录，确认本次仍只做前端信息架构和布局改造，不改模板/素材/设置后端接口。
- 遗留：合并资源中心后，编辑页上下文“使用资源”仍需后续接入；全局配置中心的字段级校验和脏状态拦截仍不在本步骤内。
- 下一步：新增 `Resources.tsx`，改 AppShell 导航与路由；重排 `Settings.tsx` 右侧 section 和目录映射。

### 2026-07-01 12:15 - 资源中心合并与全局配置重设计完成

- 范围：`frontend/src/pages/Resources.tsx`、`frontend/src/pages/Templates.tsx`、`frontend/src/pages/Materials.tsx`、`frontend/src/App.tsx`、`frontend/src/components/layout/AppShell.tsx`、`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增统一资源中心页面，以标签页合并素材库和模板库；AppShell 左侧导航从“模板中心/素材中心”合并为“资源中心”；`/templates`、`/materials` 改为兼容重定向到 `/resources?tab=templates|materials`；全局配置中心重新分组为基础配置、AI 模型、生成策略、文件解析、服务连接、兼容高级、服务测试、项目覆盖，左侧目录每项对应右侧唯一 section；OpenAI OAuth 与 ElevenLabs 归入服务连接，清晰度/语言/并发归入生成策略，MinerU/OCR 归入文件解析。
- 结果：资源管理心智从两个相似一级入口收敛为一个资源中心；全局配置中心左侧导航和右侧内容不再错位，页面结构更接近“配置中心”而不是零散表单堆叠；顶部搜索提示同步改为“项目、资源、配置”。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/App.tsx frontend/src/components/layout/AppShell.tsx frontend/src/pages/Resources.tsx frontend/src/pages/Settings.tsx docs/design/guangfu-zhicheng-design.md` 通过；`rg` 检查旧 `/templates`、`/materials` 页面入口只剩兼容重定向、API 路径和静态模板资源路径。
- 遗留：资源中心内部仍复用原素材/模板两个页面组件，各自 Toast/Confirm 容器后续可进一步抽到统一资源页；“使用资源/设为默认模板”仍需后端字段和编辑页上下文支持；全局配置中心字段级校验、脏状态拦截仍待做。
- 下一步：阶段性提交本次资源中心合并与全局配置重设计；随后可继续做资源中心内聚交互，或切回后端可编辑 PPTX 稳定流水线。

### 2026-07-01 12:35 - 全局配置中心 V2 设计稿重写

- 范围：`docs/design/mockups/global-settings.md`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：根据“当前界面整体还是乱，需要换样式”的反馈，重写全局配置中心设计稿；从原来的分组约束升级为页面级设计，明确第一屏结构、健康状态卡、左侧导航、右侧配置画布、FormRow、SectionHeader、StickySaveBar、移动端和不做事项。
- 结果：新设计稿定义全局配置中心为“配置工作台”，不再是一页堆叠所有表单；导航和右侧 section 一一对应；AI 模型区按能力拆分为文本生成、视觉理解、图片生成、图片描述、可编辑 PPTX 结构分析、可编辑 PPTX 独立元素生成；明确 `gpt-image-2` 是独立元素生成主线。
- 验证：已重写 `docs/design/mockups/global-settings.md`，并在本执行记录登记；本步骤只产出设计稿，不改前端代码。
- 遗留：需要按 V2 设计稿重新实现 `frontend/src/pages/Settings.tsx`；后续实现时需补字段级错误、dirty 状态、保存条、分组激活同步和移动端分组选择。
- 下一步：基于 V2 设计稿重构全局配置中心界面，先做静态结构和视觉层级，再接现有保存/测试逻辑。

### 2026-07-01 12:50 - 全局配置中心高保真 UI 设计稿启动

- 范围：`docs/design/mockups/global-settings-v2.html`、`docs/design/mockups/global-settings.md`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：根据“设计一个全局配置界面的高保真的 UI 我看一下”的反馈，准备把 V2 信息架构转成可浏览的静态高保真页面稿；本步骤只产出设计稿，不修改正式前端代码。
- 结果：已新增 `docs/design/mockups/global-settings-v2.html` 高保真静态稿；页面包含 AppShell 侧栏、页面标题区、全局策略条、三张健康状态卡、左侧配置导航、右侧配置画布、AI 模型能力卡、基础配置字段行、生成导出策略、服务测试、项目覆盖来源链路和底部 sticky 保存条。
- 验证：待执行 `git diff --check`。
- 遗留：高保真稿目前是静态 HTML，不连接接口；确认视觉方向后再进入 `Settings.tsx` 实现，并补真实保存/测试/脏状态同步。
- 下一步：检查设计文件差异；等待视觉确认或根据反馈继续调整稿子。

### 2026-07-01 13:05 - 个人模型配置与订阅集成设计补充

- 范围：`docs/design/mockups/global-settings-v2.html`、`docs/design/mockups/global-settings.md`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：根据“每个用户可以配置自己的模型，也可以用默认配置；模型配置是否也可以集成订阅”的反馈，补充配置来源层级和账号/订阅连接边界。
- 结果：已把配置来源链路升级为“系统默认 → 全局配置 → 用户个人配置 → 项目覆盖 → 当前生效值”；明确用户个人配置不是前端本地状态，而是需要后端 API、权限隔离和统一 resolver 支持；补充 API Key、API 组织计费、企业代理、用户个人 API Key、账号/订阅连接的凭据来源模型。
- 验证：待完成能力接入方式补充后统一执行 `git diff --check`。
- 遗留：后续实现需新增用户级模型配置 schema、个人凭据加密存储、配置 resolver 和生成流水线接入。
- 下一步：根据“哪些功能可用订阅、哪些建议 API”的反馈，补充能力接入方式矩阵。

### 2026-07-01 13:15 - 订阅与 API 能力矩阵补充

- 范围：`docs/design/mockups/global-settings-v2.html`、`docs/design/mockups/global-settings.md`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：在全局配置设计中增加“能力接入方式矩阵”，区分订阅/账号连接、API Key、API 组织计费和企业代理；每项能力标记推荐接入方式、当前状态、订阅作用和不可用原因。
- 结果：高保真稿新增“个人模型”和“能力接入方式”section；左侧导航新增个人模型、接入方式、覆盖链路；覆盖链路从两层升级为五层；文档要求后端返回每项能力的 `execution_mode`、`subscription_supported`、`api_required`、`ready` 和 `reason`，避免把订阅状态误判为后台 API 可执行。
- 验证：待执行 `git diff --check`。
- 遗留：正式实现时需把矩阵接入真实后端能力探测，不能写死；订阅连接可用于人工辅助、账号态、Codex/ChatGPT 登录态或企业授权能力，后台自动化生成仍需明确可执行凭据。
- 下一步：执行设计文件检查；如视觉方向确认，再进入前后端实现拆分。

### 2026-07-01 13:30 - 全局/个人二级入口与订阅能力说明重排

- 范围：`docs/design/mockups/global-settings-v2.html`、`docs/design/mockups/global-settings.md`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：根据“个人和全局应该在全局配置一级入口下分成两个二级入口；能力接入方式应该是说明；生成描述、大纲可以用订阅；用户个人配置不生效时要能切回默认配置”的反馈，重排全局配置设计。
- 结果：高保真稿新增“全局默认配置 / 个人配置”二级入口；个人配置页左侧只保留个人侧分组；删除主界面里的“能力接入方式”大 section，改为个人配置中的说明块；生效策略改为大纲生成、页面描述、自然语言修改可用订阅/账号连接，图片生成、生成 PPTX、可编辑 PPTX 视觉拆层、gpt-image-2 独立元素生成和导出任务队列必须走 API / 企业代理；个人配置新增“强制使用全局默认”和能力级回退语义。
- 验证：`git diff --check -- docs/design/mockups/global-settings-v2.html docs/design/mockups/global-settings.md docs/design/guangfu-zhicheng-design.md` 通过；`rg` 确认高保真稿已有二级入口、个人配置回退、订阅可用和必须 API 标记，且主导航不再包含“接入方式”。
- 遗留：正式实现需后端支持 `force_global_default`、能力级 `use_global_default`、个人订阅连接状态、个人 API Key 和统一 resolver 生效值计算。
- 下一步：检查设计文件差异；确认视觉方向后再进入实现。

### 2026-07-01 13:45 - 全局配置高保真稿操作优先级调整

- 范围：`docs/design/mockups/global-settings-v2.html`、`docs/design/mockups/global-settings.md`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：根据“可操作区域占比和优先级增大，解释说明占比和优先级降低”的反馈，准备调整全局配置高保真稿的视觉权重。
- 结果：高保真稿压缩顶部说明、健康卡说明和 section 说明；生效策略能力卡改为操作卡，突出当前方式下拉、测试、继承全局、个人 API、查看任务等动作；个人模型区使用更醒目的选择控件和“强制使用全局默认”按钮；能力接入说明从说明卡压缩为低权重帮助条；设计稿新增“操作优先级”规范。
- 验证：`git diff --check -- docs/design/mockups/global-settings-v2.html docs/design/mockups/global-settings.md docs/design/guangfu-zhicheng-design.md` 通过；`rg` 确认高保真稿中 `action-control`、`mini-actions`、`强制使用全局默认`、`测试`、`继承全局`、`查看详情` 等操作入口已出现，说明模块降为低权重帮助条。
- 遗留：正式实现时要按这个权重做组件，不要把能力接入说明矩阵直接放回主界面。
- 下一步：执行设计文件检查；如视觉方向确认，再进入实现。

### 2026-07-01 14:00 - 全局配置 V2 前端实现启动

- 范围：`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：按最新高保真稿开始改造全局配置中心前端；本轮先落二级入口、个人配置操作卡、全局默认配置页、低权重说明和可操作优先级，不混入后端未提交的可编辑 PPTX 流水线改动。
- 结果：`Settings.tsx` 已新增“全局默认配置 / 个人配置”二级入口；个人配置页按操作优先级落地生效策略卡、个人模型配置、账号连接、强制使用全局默认、能力级继承全局、测试按钮和全局默认回退预览；全局默认配置继续复用现有保存、重置、服务测试、OAuth、敏感字段和原配置表单逻辑；能力接入方式作为低权重帮助条展示，不再占主配置 section。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/pages/Settings.tsx docs/design/guangfu-zhicheng-design.md docs/design/mockups/global-settings.md docs/design/mockups/global-settings-v2.html` 通过；本机 `localhost:3012` 已有 node 服务监听，未另起新服务。
- 遗留：个人配置目前是前端预览状态，后端 schema、用户级持久化、个人 API Key 加密存储、订阅连接能力状态和统一 resolver 尚未接入；正式实现下一步需要新增 `force_global_default`、能力级 `use_global_default` 和执行凭据来源计算。
- 下一步：实现用户级个人配置 API 与 resolver，让大纲/描述/自然语言修改可走订阅/账号连接，PPTX 工作流强制走 API / 企业代理，并把前端个人配置保存接到后端。

### 2026-07-01 14:20 - 个人配置界面同构修正启动

- 范围：`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：根据“个人配置界面应该和全局配置界面展示一样，现在看不到可操作说明”的反馈，调整个人配置页信息架构。
- 结果：个人配置页已改为与全局配置同构的左侧目录和分组表单；目录包含基础配置、AI 模型、生成策略、文件解析、服务连接、兼容高级、服务测试、覆盖链路；主界面保留个人配置总策略、强制使用全局默认、能力级继承全局、账号连接和个人 API Key 操作入口，并补回生成策略、文件解析、兼容高级等与全局配置一致的字段区域。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/pages/Settings.tsx docs/design/guangfu-zhicheng-design.md` 通过；`rg` 确认个人配置页已有与全局配置一致的 section。
- 遗留：个人配置页的生成策略、文件解析和兼容高级字段目前复用现有表单控件用于前端同构展示；真正用户级持久化、敏感字段隔离和 resolver 生效计算仍需后端 API 接入。
- 下一步：实现个人配置后端 API，把当前同构界面中的个人字段与全局字段分离，并接入最终生效值 resolver。

### 2026-07-01 14:35 - Codex 可选与个人 AI 模型同构修正启动

- 范围：`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：根据“Codex 为什么显示未连接不能选择；个人配置的 AI 模型显示和全局配置不一样”的反馈，修正 Provider 选择和个人 AI 模型区展示。
- 结果：已移除全局默认 Provider 和模型级 Provider 下拉中 Codex 的禁用逻辑，未连接时改为“需连接账号”提示；选择 Codex 后在字段下方显示需要连接 OpenAI/ChatGPT 账号的说明；个人配置的 AI 模型 section 改为复用全局配置同款 `modelConfigItems.map(renderModelConfigGroup)` 表单展示，并保留来源标签、测试文本模型、测试图片模型、测试图片识别按钮。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`git diff --check -- frontend/src/pages/Settings.tsx docs/design/guangfu-zhicheng-design.md` 通过；`rg` 确认不存在 Codex disabled 逻辑，个人配置 AI 模型已复用全局模型表单。
- 遗留：Codex 选择后的真实执行仍依赖 OpenAI OAuth/账号连接状态，后端 resolver 需在下一步返回明确不可用原因；个人配置 AI 模型字段仍待后端用户级持久化。
- 下一步：实现个人配置后端 API 与 resolver，让 Codex/订阅/API/企业代理在最终生效配置中按能力计算。

### 2026-07-01 14:45 - 前端改造计划与当前状态重整

- 范围：`docs/design/guangfu-zhicheng-design.md`。
- 动作：根据“后端相关很多还没打通，把这个加入原来的前端改造计划，重新整理计划和当前状态”的反馈，更新阶段计划和状态快照。
- 结果：新增 Phase 6“配置后端生效链路”和 Phase 7“配置链路接入生成工作流”；新增“14.1 当前状态快照”，明确已完成、部分完成、未完成和下一阶段建议顺序；把用户级个人配置 API、个人配置保存、个人 API Key 加密、`force_global_default`、能力级继承、配置 resolver、Codex/订阅能力状态、生成/导出工作流接入全部纳入后续计划。
- 验证：`git diff --check -- docs/design/guangfu-zhicheng-design.md` 通过；`rg` 确认 Phase 6、Phase 7、当前状态快照、`force_global_default`、配置 resolver、用户级个人配置等关键项已写入文档。
- 遗留：计划已整理，尚未开始 Phase 6 后端实现。
- 下一步：从 Phase 6 开始实现后端 schema/API/resolver，并把前端个人配置保存接入后端。

### 2026-07-01 15:00 - Phase 6 配置后端生效链路启动

- 范围：`backend/`、`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：按计划推进 Phase 6；先盘点现有全局设置、用户鉴权、数据库模型、设置 API 和生成链路调用方式，再实现用户级个人配置 API 与 resolver。
- 计划状态：
  - 进行中：后端设置/用户/鉴权/生成调用盘点。
  - 待开始：用户级个人配置 schema/API。
  - 待开始：配置 resolver。
  - 待开始：前端个人配置保存/读取接入。
  - 待开始：服务测试改为当前生效配置。
- 结果：进行中。
- 验证：待完成本步骤后执行后端/前端相关测试和 `git diff --check`。
- 遗留：必须避免混入已有可编辑 PPTX 流水线未提交改动；如需修改同一后端文件，先确认现有 diff。
- 下一步：盘点 `backend/controllers/settings_controller.py`、用户模型/鉴权、设置模型与生成服务调用入口。

### 2026-07-01 15:10 - Phase 6 后端设置链路盘点完成

- 范围：`backend/controllers/settings_controller.py`、`backend/controllers/auth_controller.py`、`backend/models/settings.py`、`backend/models/user_settings.py`、`backend/utils/auth.py`。
- 动作：盘点全局设置、个人设置、鉴权和当前 API 分布；确认现有全局设置走 `/api/settings` 且要求管理员，个人设置雏形走 `/api/auth/personal-settings` 且要求登录，用户上下文由 `require_auth` / `require_admin` 写入 `g.current_user`。
- 结果：现有 `UserSettings` 已支持 `api_key`、`api_base_url`、`text_model`、`image_model`、`image_caption_model`、`text_model_source`、`image_model_source`，但缺少与全局配置同构的字段、`force_global_default`、能力级 `use_global_default`、`image_caption_model_source`、分模型 API Key/Base、OpenAI 图片协议、LazyLLM Key 信息、个人配置 reset、统一 effective config resolver、账号/订阅连接能力状态。`Settings.to_dict()` 已有全局敏感值长度输出和 OpenAI OAuth 连接状态，可作为 resolver 的全局层输入。
- 计划状态：
  - 已完成：后端设置/用户/鉴权/生成调用入口初步盘点。
  - 进行中：用户级个人配置 schema/API。
  - 待开始：配置 resolver。
  - 待开始：前端个人配置保存/读取接入。
  - 待开始：服务测试改为当前生效配置。
- 验证：本步骤为代码盘点，已通过 `sed`/`rg` 确认相关文件结构；尚未改业务代码。
- 遗留：生成链路接入点较多，Phase 6 先做设置存储和 effective resolver；Phase 7 再逐步替换生成/导出任务里的全局 `Settings.get_settings()` 读取方式。
- 下一步：扩展 `UserSettings` 与个人设置 API，先让用户能保存/清空/读取同构配置，并保留敏感字段只返回长度。

### 2026-07-01 15:25 - 用户个人配置 schema/API 第一片完成

- 范围：`backend/models/user_settings.py`、`backend/controllers/auth_controller.py`、`backend/migrations/versions/021_expand_user_settings_config.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：扩展 `UserSettings` 字段，补齐 `force_global_default`、`ai_provider_format`、三类模型来源、三类分模型 API Key/Base、`openai_image_api_protocol`、`lazyllm_api_keys`、`capability_overrides`；新增迁移；扩展 `/api/auth/personal-settings` 的 `GET/PUT` 数据结构；新增 `/api/auth/personal-settings/reset` 用于清空个人覆盖并回退全局。
- 结果：个人配置后端已能保存与全局配置同构的核心模型/凭据字段；空字符串按“清除个人覆盖，继承全局”处理；敏感字段只返回长度和 vendor key 信息，不返回明文；Codex/provider 选择允许保存，真实可执行状态留给 resolver 计算。
- 计划状态：
  - 已完成：后端设置/用户/鉴权/生成调用入口初步盘点。
  - 已完成：用户级个人配置 schema/API 第一片。
  - 进行中：配置 resolver。
  - 待开始：前端个人配置保存/读取接入。
  - 待开始：服务测试改为当前生效配置。
- 验证：待完成 resolver 后统一运行后端测试和 `git diff --check`。
- 遗留：尚未把个人配置接入 `app.config` 或生成流水线；个人 API Key 加密存储本片仍沿用现有 Settings 的明文数据库模式，后续需要单独加密改造；迁移链需在测试阶段确认 Alembic head 是否需要 merge。
- 下一步：实现 effective config resolver，返回每个能力的生效来源、执行方式、是否可用和不可用原因。

### 2026-07-01 15:40 - effective config resolver 第一片完成

- 范围：`backend/services/settings_resolver.py`、`backend/controllers/settings_controller.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增统一配置解析 service，按 `系统默认 -> 全局配置 -> 用户个人配置 -> 能力级继承 -> 当前生效值` 计算模型、Provider、API Base、凭据来源和能力状态；新增 `GET /api/settings/effective`，使用登录态返回当前用户的全局、个人、账号连接和能力矩阵。
- 结果：后端可返回 `outline`、`description`、`natural_edit`、`image_caption`、`image_generation`、`pptx_generation`、`editable_pptx_visual`、`editable_pptx_element`、`export_queue` 的 `execution_mode`、`subscription_supported`、`api_required`、`ready`、`reason`、`use_global_default`；文本类能力允许账号/订阅路径，图片生成、PPTX、可编辑 PPTX 和导出任务队列标记为 API 必需；Codex 未连接或 API 必需能力选择 Codex 时会给出不可用原因。
- 计划状态：
  - 已完成：后端设置/用户/鉴权/生成调用入口初步盘点。
  - 已完成：用户级个人配置 schema/API 第一片。
  - 已完成：配置 resolver 第一片。
  - 进行中：前端个人配置保存/读取接入。
  - 待开始：服务测试改为当前生效配置。
- 验证：待接入前端后统一运行后端单测、前端构建和 `git diff --check`。
- 遗留：resolver 暂未接项目覆盖层和生成流水线实际调用；个人 OpenAI/Codex OAuth 尚未做到用户级隔离，目前账号连接状态复用全局 `Settings` 中的 OpenAI OAuth 状态；个人凭据仍需加密存储。
- 下一步：接入 `Settings.tsx`，让个人配置页读取 `/api/auth/personal-settings` 和 `/api/settings/effective`，保存个人配置时写回个人接口。

### 2026-07-01 16:05 - 前端个人配置读写与生效链路展示接入

- 范围：`frontend/src/api/endpoints.ts`、`frontend/src/types/index.ts`、`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增前端 `PersonalSettings`、`EffectiveSettings` 类型；新增 `getPersonalSettings`、`updatePersonalSettings`、`resetPersonalSettings`、`getEffectiveSettings` API；`Settings.tsx` 加载全局、个人、effective 三类配置；全局/个人二级入口切换时分别展示对应表单数据；个人页保存走 `/api/auth/personal-settings`，重置走 `/api/auth/personal-settings/reset`；覆盖链路展示 resolver 返回的能力矩阵。
- 结果：个人配置不再只是前端预览，模型字段、Provider、API Key/Base、强制全局、能力级继承可以写入当前用户配置；个人页的密钥长度、账号连接状态、已配置数量和能力可用性按 `displaySettings/effectiveSettings` 显示；大纲/描述/自然语言修改展示为可走账号/订阅，图片生成、PPTX、可编辑 PPTX 和导出队列展示 API 必需。
- 计划状态：
  - 已完成：后端设置/用户/鉴权/生成调用入口初步盘点。
  - 已完成：用户级个人配置 schema/API 第一片。
  - 已完成：配置 resolver 第一片。
  - 已完成：前端个人配置保存/读取与生效来源展示第一片。
  - 进行中：测试验证与问题修复。
- 验证：待运行前端 build/test、后端相关单测和 `git diff --check`。
- 遗留：服务测试仍使用当前表单临时覆盖调用，尚未改为先走 effective resolver；生成工作流仍未接 resolver；个人配置页中生成策略、文件解析、语音等未纳入个人 schema 的字段仍会继承全局。
- 下一步：运行验证，修复编译/测试问题；随后做服务测试接入 effective config 或进入 Phase 7 工作流接入。

### 2026-07-01 16:25 - Phase 6 第一轮验证完成

- 范围：`backend/models/user_settings.py`、`backend/controllers/auth_controller.py`、`backend/controllers/settings_controller.py`、`backend/services/settings_resolver.py`、`backend/migrations/versions/021_expand_user_settings_config.py`、`backend/tests/unit/test_personal_settings_effective_config.py`、`frontend/src/api/endpoints.ts`、`frontend/src/types/index.ts`、`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：补充后端单测，覆盖个人配置保存不回显明文、个人配置 reset、Codex + API 必需能力在 effective config 中返回不可用原因；运行前端品牌守卫、回归测试、生产构建、后端 py_compile、设置相关单测、Alembic head 检查和 diff 空白检查。
- 结果：Phase 6 第一轮“个人配置存储 + effective resolver + 前端读写展示”完成；迁移链当前为单 head `021_expand_user_settings_config`；前端个人配置页已不再停留在纯预览状态，保存/重置会写后端并刷新能力矩阵。
- 计划状态：
  - 已完成：后端设置/用户/鉴权/生成调用入口初步盘点。
  - 已完成：用户级个人配置 schema/API 第一片。
  - 已完成：配置 resolver 第一片。
  - 已完成：前端个人配置保存/读取与生效来源展示第一片。
  - 已完成：测试验证与问题修复。
  - 待开始：服务测试改为基于 effective config 的当前生效配置。
  - 待开始：Phase 7 生成/导出工作流接入 resolver。
- 验证：`npm run guard:brand` 通过；`npm run test:run -- src/tests/branding-workbench-regression.test.ts` 通过，2 tests passed；`npm run build` 通过；`python3 -m py_compile backend/models/user_settings.py backend/controllers/auth_controller.py backend/controllers/settings_controller.py backend/services/settings_resolver.py` 通过；`uv run --python 3.13 pytest backend/tests/unit/test_personal_settings_effective_config.py -q` 通过，3 tests passed；`uv run --python 3.13 pytest backend/tests/unit/test_api_settings_provider.py backend/tests/unit/test_personal_settings_effective_config.py -q` 通过，13 tests passed；`uv run --python 3.13 alembic heads` 返回 `021_expand_user_settings_config (head)`；`git diff --check` 通过。
- 遗留：个人 API Key 加密存储仍未做；个人 OAuth/Codex 登录态仍复用全局 OAuth，不是用户级隔离；服务测试仍是表单临时覆盖，没有统一走 resolver；生成大纲/描述/自然语言修改、图片生成、可编辑 PPTX、导出任务队列还没接入 resolver；工作区仍存在之前可编辑 PPTX 流水线相关未提交改动，本轮未回滚。
- 下一步：建议先做“服务测试接入 effective config”，让设置页验证结果和实际生效链路一致；之后进入 Phase 7，把大纲/描述/自然语言修改和 PPTX/图片/导出工作流逐步切到 resolver。

### 2026-07-01 17:05 - 当前状态快照校准完成

- 范围：`docs/design/guangfu-zhicheng-design.md`。
- 动作：对照当前分支提交与 Phase 6 执行记录，修正 14.1 中停留在 14:45 的旧状态，避免后续继续按“个人配置 API/resolver 尚未实现”的过期计划执行。
- 结果：状态快照已登记个人配置 schema/API、保存/重置、`force_global_default`、能力级继承、effective resolver、前端能力矩阵和可编辑 PPTX 流水线骨架的完成状态；未完成项收敛为服务测试接 resolver、Phase 7 工作流接入、项目覆盖、密钥加密、用户级 OAuth 和视觉校正验收。
- 计划状态：已完成状态快照校准；进行中“服务测试接入 effective config”；待开始 Phase 7 生成/导出工作流接入。
- 验证：`git diff --check -- docs/design/guangfu-zhicheng-design.md` 通过；人工对照提交 `e4b9ed8`、`7f2f25b` 与 15:25 至 16:25 的执行记录。
- 遗留：本步骤只校准文档，没有修改业务代码。
- 下一步：扩展 resolver 提供运行时能力配置，让设置页服务测试以当前用户的 effective config 为基础，并保留未保存表单值作为最高优先级临时覆盖。

### 2026-07-01 17:30 - 服务测试接入 effective config 完成

- 范围：`backend/services/settings_resolver.py`、`backend/controllers/settings_controller.py`、`backend/tests/unit/test_personal_settings_effective_config.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增内部专用 `resolve_capability_runtime_config`，在不进入接口响应和任务记录明文的前提下解析能力运行所需的模型、Provider、API Base、密钥和 LazyLLM vendor key；把文本模型、图片识别、图片生成服务测试分别映射到 `outline`、`image_caption`、`image_generation`；保留前端未保存表单值作为 resolver 结果之上的临时覆盖；测试任务结果记录非敏感 `config_source` 摘要，并把被表单临时覆盖的来源标记为 `request_override`；临时覆盖上下文补充 LazyLLM 环境变量的设置与恢复。
- 结果：个人配置、`force_global_default` 和能力级继承现在会真实影响三类模型服务测试；测试结果可追溯 Provider、模型、凭据和 Base URL 的来源层，但不会写入密钥；OCR、MinerU、百度修复等非模型服务继续使用对应全局服务配置。
- 用户可见变化：个人配置页触发模型测试时，后台实际测试当前用户生效配置；用户尚未保存的表单修改仍可立即测试，不需要先保存。
- 保留逻辑：Codex 401/OAuth 失效自动断开、异步任务轮询、现有测试函数、全局非模型服务配置均保留；Codex 失败记录现在同时保留 `config_source`。
- 计划状态：已完成“服务测试改为基于 effective config 的当前生效配置”；待开始 Phase 7 生成/导出工作流接入 resolver。
- 验证：`python3 -m py_compile backend/services/settings_resolver.py backend/controllers/settings_controller.py backend/tests/unit/test_personal_settings_effective_config.py` 通过；`uv run --python 3.13 pytest backend/tests/unit/test_personal_settings_effective_config.py backend/tests/unit/test_api_settings_provider.py -q` 通过，15 tests passed；`git diff --check` 通过。
- 问题处理：新增运行时 resolver 单测首次失败，因为测试只请求 `app` fixture、未创建管理员用户；改为同时使用 `client` fixture 并读取 `test-admin` 后通过。该问题只影响测试准备，不影响业务代码。
- 遗留：`verify_api_key` 旧同步验证接口仍只面向全局管理员配置；Phase 7 生成/导出任务尚未使用 runtime resolver；项目覆盖、个人密钥加密和用户级 OAuth 尚未完成。
- 下一步：进入 Phase 7 第一片，优先将大纲生成、页面描述和自然语言修改三个文本能力接入 `resolve_capability_runtime_config`，并给任务记录增加非敏感配置来源摘要。

### 2026-07-01 17:50 - Phase 7 文本生成调用链盘点完成

- 范围：`backend/controllers/project_controller.py`、`backend/controllers/page_controller.py`、`backend/services/task_manager.py`、`backend/services/ai_service.py`、`backend/services/ai_service_manager.py`、`backend/services/ai_providers/`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：定位大纲生成、流式大纲、从描述生成、单页描述、批量描述、流式描述、优化大纲和优化描述的控制器/后台任务入口；检查 AIService 构造、Provider 工厂和缓存键的配置读取方式。
- 结果：文本能力入口已完整定位，但不能直接复用服务测试的 `temporary_settings_override`。当前 AIService 从全局 `app.config` 取模型和 Provider 配置，`ai_service_manager` 的 Provider 缓存仅按模型名建键；若在多用户生成任务中临时改全局配置，可能并发串用 Provider/API Key，同模型不同用户也可能复用错误凭据。
- 接入约束：Phase 7 必须先新增请求/任务级 AI 运行上下文，让 Provider 工厂显式接收 runtime config；Provider 缓存键至少包含能力、Provider、模型、API Base、凭据指纹和账号连接身份，且任务记录只保存非敏感来源摘要，不保存密钥。
- 计划状态：已完成 Phase 7 文本调用链盘点；待开始“请求/任务级 AI runtime context 与隔离缓存”；其后再接大纲、描述和自然语言修改入口。
- 验证：通过 `rg`/`sed` 对照 `generate_outline`、`generate_outline_stream`、`generate_from_description`、`generate_descriptions_task`、`generate_page_description`、`refine_outline`、`refine_descriptions`、`AIService.__init__`、`get_ai_service` 和三类 Provider cache。
- 遗留：本步骤只完成架构盘点，没有修改生成业务调用；服务测试仍使用短生命周期临时覆盖，适用于当前主动触发的测试任务，但不能作为多用户生成流水线的最终实现。
- 下一步：实现独立于全局 `app.config` 的 `AIRuntimeConfig`/Provider 构造入口和带凭据指纹的隔离缓存，再接入大纲、描述、自然语言修改三个文本能力。

### 2026-07-01 18:05 - 完整改造计划复核与状态快照修正

- 范围：`docs/design/guangfu-zhicheng-design.md`、当前分支提交与工作区改动。
- 动作：按 Phase 1 至 Phase 7、配置后端链路、可编辑 PPTX 流水线和最近执行记录重新核对完整计划；修正 14.1 中仍将服务测试 effective config 接入列为未完成的过期状态。
- 结果：状态快照已确认服务测试接入完成；下一步前置项明确为请求/任务级 `AIRuntimeConfig` 和隔离 Provider 缓存，之后再按文本能力、图片能力、可编辑 PPTX、导出任务顺序接入 resolver。
- 计划状态：Phase 1 至 Phase 5 为首轮完成或部分完成；Phase 6 第一片完成但项目覆盖、密钥加密和用户级 OAuth 未完成；Phase 7 仅完成调用链盘点，生成业务尚未接入。
- 验证：对照 `git log --oneline`、`git status --short`、Phase 6/7 代码入口和 17:30/17:50 执行记录；`git diff --check -- docs/design/guangfu-zhicheng-design.md` 通过。
- 遗留：用户管理页是否达到最终高保真验收、所有首轮前端页面的 3012 桌面/移动截图验收仍需单独复核；当前服务测试/runtime resolver 改动尚未提交。
- 下一步：实现请求级 AI runtime config 与安全隔离缓存，并补单元测试覆盖同模型、不同用户密钥不会复用 Provider。

### 2026-07-01 18:35 - AIRuntimeConfig 与文本 Provider 隔离缓存底座完成

- 范围：`backend/services/ai_runtime.py`、`backend/services/ai_providers/__init__.py`、`backend/services/ai_service.py`、`backend/services/ai_service_manager.py`、`backend/services/settings_resolver.py`、`backend/tests/unit/test_ai_runtime_isolation.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增不可变 `AIRuntimeConfig`，将能力、Provider、模型、API Base、凭据、账号身份和非敏感来源摘要封装为请求/任务级运行配置；新增显式 `create_text_provider(config, model)` 工厂；AIService 支持只初始化传入的 Provider；新增 runtime 文本 Provider 缓存和 `get_runtime_ai_service`；Codex runtime 解析真实 OAuth token 与账号身份，但不进入公开摘要。
- 缓存隔离：runtime 缓存键包含能力、Provider、模型、API Base、凭据 SHA-256 短指纹和账号身份；密钥不进入 `repr`、公开摘要或缓存键明文；相同模型但不同用户密钥不会复用 Provider，完全相同运行配置才复用。
- 兼容性：原 `get_ai_service()` 和全局 Provider 工厂保持不变，旧生成链路尚未切换；新的 runtime 路径不修改全局 `app.config`。
- 限制：LazyLLM 当前通过全局 namespace/环境变量读取密钥，尚不具备可靠的用户级并发隔离；runtime 路径会明确拒绝个人 LazyLLM 配置，不会静默借用全局密钥。后续需为 LazyLLM 增加显式凭据适配器后再开放。
- 计划状态：已完成请求/任务级 `AIRuntimeConfig` 与 OpenAI/Gemini/Codex 等文本 Provider 隔离缓存底座；进行中大纲、页面描述、自然语言修改接入。
- 验证：`python3 -m py_compile backend/services/ai_runtime.py backend/services/ai_providers/__init__.py backend/services/ai_service.py backend/services/ai_service_manager.py backend/services/settings_resolver.py backend/tests/unit/test_ai_runtime_isolation.py` 通过；`uv run --python 3.13 pytest backend/tests/unit/test_ai_runtime_isolation.py backend/tests/unit/test_personal_settings_effective_config.py backend/tests/unit/test_api_settings_provider.py -q` 通过，19 tests passed。
- 遗留：runtime 目前只支持文本 AIService；图片和视觉 Provider 仍待后续扩展；生成控制器和后台任务尚未接入；任务来源摘要尚未写入业务任务。
- 下一步：新增“按用户解析文本 runtime 并构造 AIService”的统一 helper，接入大纲、描述和自然语言修改入口，同时避免 SSE/后台线程丢失用户上下文。

### 2026-07-01 19:05 - Phase 7 文本能力第一片接入完成

- 范围：`backend/services/ai_runtime.py`、`backend/controllers/project_controller.py`、`backend/controllers/page_controller.py`、`backend/tests/unit/test_api_project.py`、`backend/tests/unit/test_ai_runtime_isolation.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增 `resolve_user_ai_runtime` 统一入口；将同步大纲、流式大纲、从描述生成、单页描述、批量描述、流式描述、优化大纲和优化描述切换为当前用户 effective config + 隔离 Provider；SSE 在请求上下文结束前解析并捕获 runtime/service；批量描述任务在落库前完成 runtime 校验，并记录 `runtime.public_summary()`。
- 结果：个人文本模型、Provider、API Base、API Key、`force_global_default` 和能力级继承开始真实影响大纲、描述和文本自然语言修改；后台描述任务记录能力、Provider、模型、Base、凭据指纹和来源层，不记录密钥；runtime 配置失败不会留下孤立 PENDING 任务。
- 兼容性：图片生成、页面图片编辑、翻修、语音等非本片入口继续使用原全局 AIService；全局 LazyLLM 继续走原全局 service，不受本片影响；个人 LazyLLM 因 namespace/环境变量无法并发隔离而返回明确错误，不静默使用全局凭据。
- 测试修正：流式大纲单测原先 mock `get_ai_service`，接线后实际调用了 runtime Provider；测试已改为 mock `resolve_user_ai_runtime`，并断言使用 `outline` 能力和当前 `test-admin` 用户。
- 计划状态：已完成 Phase 7 文本能力第一片；进行中更大范围后端回归；待开始图片/视觉 runtime、可编辑 PPTX 和导出任务接入。
- 验证：`python3 -m py_compile` 覆盖 runtime、Provider、AIService、resolver、项目/页面控制器并通过；`uv run --python 3.13 pytest backend/tests/unit/test_api_project.py backend/tests/unit/test_ai_runtime_isolation.py backend/tests/unit/test_personal_settings_effective_config.py backend/tests/unit/test_api_settings_provider.py -q` 通过，37 tests passed；`git diff --check` 通过。
- 遗留：同步与 SSE 操作没有独立 Task 记录，因此仅后台批量描述任务持久化来源摘要；图片生成、视觉理解、可编辑 PPTX 和导出队列仍未接 runtime；个人 LazyLLM 显式凭据适配器未完成。
- 下一步：运行完整后端 unit 回归；如通过，阶段性提交服务测试 + AIRuntimeConfig + 文本能力接入，再开始图片/视觉 runtime。

### 2026-07-01 19:20 - 完整 unit 回归发现并修复可编辑 PPTX 进度变量回归

- 范围：`backend/services/export_service.py`、`backend/tests/unit/test_editable_pptx_equations.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：运行全部后端 unit 测试；定位两个公式导出测试失败到 `create_editable_pptx_with_recursive_analysis`：使用预分析 `editable_images` 时，进度文案在 `total_pages` 赋值前读取变量。将 `total_pages = len(editable_images)` 提前到并行分析启动前，并移除构建阶段的重复赋值。
- 结果：修复与本次 runtime 接入无关、但存在于当前分支的可编辑 PPTX 回归；传入预分析结果时不再因 `UnboundLocalError` 中断，后续并行分析和 PPTX 构建复用同一页数。
- 初次完整回归：共 416 tests，`409 passed / 5 skipped / 2 failed`；失败均为上述 `total_pages` 初始化顺序问题，其余 runtime、设置、项目、视觉拆层和导出任务测试通过。
- 计划状态：修复与完整回归闭环已完成；待阶段性提交本批改动。
- 验证：`uv run --python 3.13 pytest backend/tests/unit/test_editable_pptx_equations.py -q` 通过，10 tests passed；`uv run --python 3.13 pytest backend/tests/unit -q` 通过，`411 passed / 5 skipped`；`git diff --check` 通过。
- 遗留：当前工作区包含服务测试、runtime、文本能力和本次导出回归修复，尚未提交；图片/视觉 runtime、项目覆盖层、密钥加密和用户级 OAuth 仍未完成。
- 下一步：阶段性提交本批改动；随后开始图片生成与视觉理解的请求级 runtime 和隔离 Provider 缓存。

### 2026-07-01 19:35 - Phase 7 文本 runtime 阶段性提交完成

- 范围：服务测试 effective config、`AIRuntimeConfig`、文本 Provider 隔离缓存、大纲/描述/文本自然语言修改接入、可编辑 PPTX `total_pages` 回归修复及对应测试/文档。
- 动作：仅暂存本阶段明确文件，排除根目录与设计目录 `.DS_Store`；检查暂存差异后创建阶段提交。
- 结果：提交 `12751cb feat(phase7): isolate user AI runtime for text workflows` 已生成，共 13 个文件，新增 `backend/services/ai_runtime.py` 和 `backend/tests/unit/test_ai_runtime_isolation.py`。
- 验证：提交前 `git diff --cached --check` 通过；完整 unit 回归结果为 `411 passed / 5 skipped`。
- 遗留：图片/视觉 runtime、可编辑 PPTX 与导出队列接入、项目覆盖、个人密钥加密、用户级 OAuth、个人 LazyLLM 隔离仍未完成。
- 下一步：开始图片生成与视觉理解 runtime；先为显式图片/Caption Provider 工厂和隔离缓存补测试，再接业务入口。

### 2026-07-01 20:00 - Caption/Image runtime 工厂与隔离缓存底座完成

- 范围：`backend/services/ai_runtime.py`、`backend/services/ai_providers/__init__.py`、`backend/services/ai_service_manager.py`、`backend/services/settings_resolver.py`、`backend/tests/unit/test_ai_runtime_isolation.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：从全局工厂中抽出显式 `create_caption_provider` 和 `create_image_provider`；新增 runtime Caption/Image Provider 缓存；将 OpenAI 图片协议和分辨率加入 `AIRuntimeConfig` 与缓存键；resolver 为图片能力返回协议与全局分辨率。
- 结果：视觉理解和图片生成 Provider 可以使用请求级显式配置构造，不修改全局 `app.config`；相同模型、不同用户密钥不会复用；同一图片模型但不同 `images/chat` 协议或分辨率也不会复用错误 Provider。
- 兼容性：原 `get_caption_provider`、`get_image_provider` 继续从全局配置解析并委托给显式工厂；OpenAI 图片代理兼容、视觉结构分析现有行为保持通过。
- 计划状态：Caption/Image runtime 底座完成；进行中组合文本 prompt runtime 与图片 runtime，并接入图片生成/编辑任务。
- 验证：`python3 -m py_compile` 覆盖 runtime、Provider 工厂、manager、resolver 和测试并通过；`uv run --python 3.13 pytest backend/tests/unit/test_ai_runtime_isolation.py backend/tests/unit/test_openai_image_proxy_compat.py backend/tests/unit/test_visual_structure_analysis.py backend/tests/unit/test_api_settings_provider.py -q` 通过，44 tests passed。
- 遗留：图片业务控制器尚未切换；任务进度尚未保存文本 prompt 与图片 Provider 的双来源摘要；可编辑 PPTX 仍使用全局 AIService。
- 下一步：新增组合 runtime helper，接入批量图片生成、单页图片生成和图片编辑，并确保后台任务更新进度时不覆盖 `config_source`。

### 2026-07-01 20:25 - 图片生成与编辑组合 runtime 第一片完成

- 范围：`backend/services/ai_runtime.py`、`backend/controllers/project_controller.py`、`backend/controllers/page_controller.py`、`backend/services/task_manager.py`、`backend/tests/unit/test_ai_runtime_isolation.py`、`backend/tests/unit/test_api_project.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增 `resolve_user_image_ai_runtime`，分别解析页面 prompt 的 `description` 文本能力和 `image_generation` 图片能力，再组合成一个仅含对应 Provider 的 AIService；接入批量图片生成、单页图片生成和图片编辑；任务创建时保存 `prompt/image` 双 runtime 公开摘要；后台任务更新进度和完成状态时合并原 progress，保留 `config_source`。
- 结果：个人文本配置负责图片 prompt，个人图片 API 配置负责 `gpt-image-2` 等图片生成/编辑，两者可以使用不同 Provider、模型、Base 和密钥；图片能力选择 Codex 订阅时明确拒绝并提示必须 API/企业代理；runtime 解析在任务落库前完成，不产生孤立 PENDING 任务。
- LazyLLM 处理：全局 LazyLLM 继续复用旧全局 AIService 对应 Provider；个人 LazyLLM 仍因无法安全隔离而明确拒绝，不会借用其他用户或全局密钥。
- 测试修正：单页图片并发测试原 mock 旧 `get_ai_service`，已改为 mock组合 runtime，保留“至少五个任务可并发处理、不退回四任务上限”的原验收。
- 计划状态：图片生成/编辑业务第一片及完整 unit 回归完成；待阶段提交；视觉理解与可编辑 PPTX 仍未接 runtime。
- 验证：`python3 -m py_compile` 覆盖 runtime、项目/页面控制器和 task manager 并通过；`uv run --python 3.13 pytest backend/tests/unit/test_ai_runtime_isolation.py backend/tests/unit/test_api_project.py backend/tests/unit/test_task_manager_image_prompt_fields.py backend/tests/unit/test_openai_image_proxy_compat.py backend/tests/unit/test_visual_structure_analysis.py -q` 通过，60 tests passed；`git diff --check` 通过。
- 完整回归：`uv run --python 3.13 pytest backend/tests/unit -q` 通过，`415 passed / 5 skipped`，覆盖旧图片代理、LazyLLM、OAuth、可编辑 PPTX、任务队列和 runtime 新增测试。
- 遗留：可编辑 PPTX 视觉拆层仍从全局 AIService 获取 Caption/Image Provider；普通图片识别入口尚未统一接入 caption runtime；个人 LazyLLM 显式凭据适配未完成。
- 下一步：阶段提交图片 runtime 第一片，再接可编辑 PPTX 的视觉理解和独立元素生成 runtime。

### 2026-07-01 20:40 - 图片 runtime 阶段性提交完成

- 范围：Caption/Image 显式 Provider 工厂、隔离缓存、组合 runtime、图片生成/编辑控制器、任务来源保留、测试与设计记录。
- 动作：排除 `.DS_Store`，仅暂存本阶段 10 个明确文件并创建独立提交。
- 结果：提交 `d90f0b4 feat(phase7): isolate image generation runtimes` 已生成，共 10 个文件，312 insertions、37 deletions。
- 验证：提交前 `git diff --cached --check` 通过；完整后端 unit 回归为 `415 passed / 5 skipped`。
- 遗留：可编辑 PPTX 的 `editable_pptx_visual`/`editable_pptx_element`、普通图片识别、导出队列 runtime 尚未接入；项目覆盖、密钥加密、用户级 OAuth 和个人 LazyLLM 隔离仍未完成。
- 下一步：为可编辑 PPTX 构造“Caption 视觉理解 + Image 独立元素生成”组合 runtime，并从导出控制器传入后台任务和 ExportService，移除该流水线对全局 AIService 的依赖。

### 2026-07-01 21:10 - 可编辑 PPTX 双 runtime 接入完成

- 范围：`backend/controllers/export_controller.py`、`backend/services/ai_runtime.py`、`backend/services/task_manager.py`、`backend/services/export_service.py`、`backend/tests/unit/test_ai_runtime_isolation.py`、`backend/tests/unit/test_export_editable_pptx_task.py`、`backend/tests/unit/test_editable_pptx_equations.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：新增 `resolve_user_editable_pptx_ai_runtime`，分别解析 `editable_pptx_visual` 的 Caption Provider 和 `editable_pptx_element` 的 Image Provider；导出路由在任务落库前构造隔离 AIService，将双 runtime 来源写入任务并传入后台任务；后台任务继续传入 ExportService；视觉结构分析、文字样式 Caption 提取和独立元素生成统一使用注入的当前用户 AIService。
- 结果：可编辑 PPTX 主路由不再依赖全局 AIService；GPT 图层识别使用当前用户视觉模型/API，`gpt-image-2` 独立元素使用当前用户图片模型/API；任务进度更新采用 merge，保留 `visual/element` 双来源摘要且不保存密钥。
- 错误处理：Codex 订阅登录态和无法隔离的个人 LazyLLM 不允许运行必须 API 的可编辑 PPTX；路由在创建任务前返回 `503 EDITABLE_PPTX_CONFIG_UNAVAILABLE` 和真实原因，不留下 PENDING 任务，不再泛化为 500/网络失败。
- 错误分类修正：`ValueError` 捕获仅包围 runtime 构造，后续文件服务、数据库或任务提交异常仍进入通用服务错误，不会被误标为模型配置不可用；修正后路由/runtime 定向测试 19 项通过。
- 兼容性：直接调用 ExportService 且不传 `visual_ai_service` 时仍保留全局 AIService fallback，兼容历史单测和内部调用；正式 HTTP 导出路径始终注入隔离 runtime。
- 计划状态：可编辑 PPTX 双 runtime 接入、定向回归和完整 unit 回归完成；待阶段提交。
- 验证：`PYTHONPYCACHEPREFIX=/tmp/banana-pycache python3 -m py_compile ...` 通过；`uv run --python 3.13 pytest backend/tests/unit/test_ai_runtime_isolation.py backend/tests/unit/test_export_editable_pptx_task.py backend/tests/unit/test_editable_pptx_equations.py backend/tests/unit/test_editable_pptx_visual_pipeline.py backend/tests/unit/test_visual_structure_analysis.py -q` 通过，46 tests passed；`git diff --check` 通过。
- 环境说明：默认 `python3 -m py_compile` 尝试写 `~/Library/Caches` 被沙箱阻止，改用 `/tmp/banana-pycache`；`uv` 访问现有 `~/.cache/uv` 需要沙箱外执行，用户已批准对应 pytest 前缀。
- 完整回归：`uv run --python 3.13 pytest backend/tests/unit -q` 通过，`418 passed / 5 skipped`，覆盖 runtime、设置、项目、图片、OAuth、LazyLLM、可编辑 PPTX、公式、视觉结构和导出任务。
- 遗留：普通图片识别独立入口、导出队列 effective runtime、项目覆盖、个人密钥加密、用户级 OAuth、个人 LazyLLM 隔离及可编辑 PPTX 原图视觉对比自动校正仍未完成。
- 下一步：提交本阶段，再接导出队列来源/失败原因和项目覆盖层。

### 2026-07-01 21:30 - 可编辑 PPTX runtime 阶段提交完成

- 范围：可编辑 PPTX 双 runtime、导出路由、后台任务、ExportService 注入、任务来源保留、错误分类、回归测试和设计记录。
- 动作：仅暂存本阶段 8 个明确文件，排除 `.DS_Store`，检查暂存差异后创建独立提交。
- 结果：提交 `eceea16 feat(phase7): isolate editable pptx visual runtime` 已生成，227 insertions、14 deletions。
- 验证：定向测试 `46 passed`；错误分类修正后路由/runtime 测试 `19 passed`；完整后端 unit 回归 `418 passed / 5 skipped`；`git diff --cached --check` 通过。
- 遗留：普通图片识别、导出队列 effective runtime、项目覆盖、个人密钥加密、用户级 OAuth、个人 LazyLLM 隔离、可编辑 PPTX 原图视觉对比自动校正仍未完成。
- 下一步：接入导出任务的 effective 来源和 resolver 失败原因展示，再实现项目覆盖层并验证 `项目 > 个人 > 全局 > 系统默认` 优先级。

### 2026-07-01 22:05 - 导出任务配置来源展示接入

- 范围：`frontend/src/store/useExportTasksStore.ts`、`frontend/src/pages/ExportTasks.tsx`、`frontend/src/components/shared/ExportTasksPanel.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：将后端任务进度中的 `progress.config_source` 建模为导出任务的一等字段；新增来源摘要格式化能力；在一级导出任务中心和预览页导出任务浮层展示本次任务实际使用的能力、Provider、模型和来源层；搜索范围同步覆盖配置来源摘要。
- 结果：可编辑 PPTX 的 `visual/element`、图片生成的 `prompt/image`、描述生成的单 runtime 来源都会在任务行内可读，用户排查失败时可以直接看到是否走了个人配置、全局配置或后续项目覆盖，不再只看到泛化失败文案。
- 计划状态：导出任务失败原因已有后端 `error_message` 和前端可读展示，本步骤补齐来源展示；项目覆盖 resolver 层仍未接入。
- 验证：`npm run guard:brand` 通过；`npx eslint src/store/useExportTasksStore.ts src/pages/ExportTasks.tsx src/components/shared/ExportTasksPanel.tsx --ext ts,tsx --max-warnings 20` 通过。
- 构建说明：`npm run build:check` 中品牌守卫通过，但全量 `tsc` 被既有类型债务阻塞，包含 `AccessCodeGuard.tsx`、`MaterialCenterModal.tsx`、`Landing.tsx`、`Settings.tsx`、`useProjectStore.ts` 和若干测试文件的历史错误；本次触达文件 lint 已通过。
- 遗留：普通图片识别独立入口、项目覆盖 resolver、个人密钥加密、用户级 OAuth、个人 LazyLLM 隔离、可编辑 PPTX 原图视觉比对自动校正仍未完成；全量前端 TS 债务需要单独清理。
- 下一步：开始项目覆盖 resolver 层，先盘点 Project 模型已有可覆盖字段，再实现 `项目 > 个人 > 全局 > 系统默认` 的后端合并与来源标记。

### 2026-07-01 22:20 - 项目覆盖前置 resolver 隐患修复

- 范围：`backend/services/settings_resolver.py`、`backend/tests/unit/test_personal_settings_effective_config.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：盘点 Project 模型现有覆盖字段，确认当前只有画面比例、导出策略、背景修复、返回半成品、图标抠图和视觉结构分析等项目字段；AI Provider/模型/API Key 尚无项目级字段。修复 `resolve_capability_runtime_config` 在图片能力中读取 `image_resolution` 时引用未定义 `global_dict` 的问题，并补图片 runtime 解析测试。
- 结果：图片生成与可编辑 PPTX 独立元素能力解析 runtime 时能稳定带出全局 `image_resolution`，不会在进入项目覆盖改造前因未定义变量中断。
- 计划状态：项目覆盖层已完成字段盘点和前置 bug 修复；真正的 `项目 > 个人 > 全局 > 系统默认` 合并还未实现。
- 验证：`uv run --python 3.13 pytest backend/tests/unit/test_personal_settings_effective_config.py backend/tests/unit/test_ai_runtime_isolation.py -q` 通过，16 tests passed。
- 遗留：项目字段当前带默认值，无法区分“继承全局”与“项目显式覆盖”；下一步需要先定义可覆盖字段 schema 和来源标记策略，再决定是否需要迁移/新增显式 override 元数据。
- 下一步：为项目覆盖建立后端 schema/来源摘要：先覆盖已有项目导出字段和画面比例的来源展示，再评估 AI 模型是否需要新增项目级 override 存储。

### 2026-07-01 22:40 - 项目覆盖摘要契约接入

- 范围：`backend/models/project.py`、`backend/tests/unit/test_api_project.py`、`frontend/src/types/index.ts`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：为项目详情新增 `project_overrides` 摘要，列出当前项目已有的可覆盖字段：画面比例、组件提取方法、背景获取方法、返回半成品、图标主体抠图、视觉结构分析；每个字段包含 label、group、source 和当前 value。前端 `Project` 类型同步补充 `ProjectOverridesSummary`。
- 结果：配置中心、项目设置弹窗和导出任务排障后续可以读取统一的项目覆盖字段清单，不需要各页面自己猜哪些字段属于项目级覆盖；同时明确 `inheritance_tracking=false`，避免把数据库默认值伪装成“继承全局/显式覆盖”。
- 计划状态：项目覆盖字段 schema 和 API 契约第一片完成；尚未接入 UI 展示，也尚未加入项目级 AI Provider/模型/API Key 覆盖存储。
- 验证：`uv run --python 3.13 pytest backend/tests/unit/test_api_project.py::TestProjectGet backend/tests/unit/test_personal_settings_effective_config.py -q` 通过，10 tests passed；`npx eslint src/types/index.ts --ext ts --max-warnings 20` 通过。
- 遗留：需要决定是否新增项目 override 元数据表/JSON 字段，以支持真正的“继承全局默认/启用项目覆盖”切换；AI 模型项目级覆盖仍需产品层确认后再建字段。
- 下一步：把 `project_overrides` 接到全局配置中心的“项目覆盖”区和项目设置弹窗，先做只读来源展示，再补恢复全局默认/启用覆盖的真实存储设计。

### 2026-07-01 23:00 - 项目设置弹窗覆盖摘要展示

- 范围：`frontend/src/components/shared/ProjectSettingsModal.tsx`、`frontend/src/pages/SlidePreview.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：项目设置弹窗新增只读“当前项目覆盖项”摘要，在项目设置 tab 展示画面比例，在导出设置 tab 展示组件提取、背景获取、返回半成品、图标抠图和视觉结构分析；预览页传入当前项目的 `project_overrides`。
- 结果：用户在项目内调整设置时，能直接看到这些字段属于当前项目值，并能看到“暂未区分继承全局与显式覆盖”的限制提示，避免误以为已经具备完整继承开关。
- 计划状态：项目覆盖 schema 已从后端打到项目设置 UI；全局配置中心“项目覆盖”区仍是静态说明，尚未接入摘要。
- 验证：`npm run guard:brand` 通过；`npx eslint src/components/shared/ProjectSettingsModal.tsx src/pages/SlidePreview.tsx --ext ts,tsx --max-warnings 20` 通过但保留既有 `SlidePreview.tsx` 未用 `Home` import 警告。
- 遗留：还需要把项目覆盖摘要接到全局配置中心；真正的继承/恢复全局默认操作仍需新增项目 override 元数据存储。
- 下一步：全局配置中心“项目覆盖”区接入最近项目/当前项目摘要，或先设计项目 override 元数据字段与迁移方案。

### 2026-07-01 23:20 - 全局配置中心项目覆盖摘要展示

- 范围：`frontend/src/pages/Settings.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：全局配置中心加载最近 5 个项目，并在“项目覆盖”区展示每个项目的 `project_overrides` 字段摘要、当前值、字段分组和继承追踪状态；原静态说明改为真实数据卡片，同时保留“历史字段暂未区分继承全局与显式覆盖”的限制提示。
- 结果：全局配置中心不再只说明项目覆盖概念，用户可以直接看到最近项目有哪些项目级覆盖字段，以及当前画面比例、导出策略、视觉结构分析等值。
- 计划状态：`project_overrides` 已接入后端契约、项目设置弹窗和全局配置中心；仍未实现真正的项目覆盖继承/恢复默认存储。
- 验证：`npm run guard:brand` 通过；`npx eslint src/pages/Settings.tsx --ext ts,tsx --max-warnings 20` 通过但保留既有 `CapabilityActionCard` 未使用警告。
- 遗留：最近项目摘要不能代表所有项目；全局配置中心后续可增加项目选择器或搜索；真正的“继承全局默认/项目显式覆盖/恢复默认”仍需新增 override 元数据字段与迁移。
- 下一步：设计并实现项目 override 元数据存储，让项目字段能明确区分继承和显式覆盖，再接入 resolver 优先级。

### 2026-07-01 23:45 - 项目覆盖元数据存储接入

- 范围：`backend/models/project.py`、`backend/controllers/project_controller.py`、`backend/migrations/versions/022_add_project_override_fields.py`、`backend/tests/unit/test_api_project.py`、`frontend/src/types/index.ts`、`frontend/src/pages/Settings.tsx`、`frontend/src/components/shared/ProjectSettingsModal.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：为 `projects` 新增 `project_override_fields` JSON 文本字段，记录哪些项目字段是显式覆盖；项目创建时仅在请求提供画面比例时标记覆盖，项目更新导出策略/画面比例等字段时自动标记显式覆盖；新增 `clear_project_overrides` 支持清除覆盖元数据；项目详情 `project_overrides.fields` 增加 `explicit` 与 `source`，前端同步展示“项目覆盖 / 继承或默认”。
- 结果：项目覆盖不再只能展示当前值，已经可以区分“用户明确改过的项目覆盖”和“历史/默认字段”。后续恢复全局默认可以基于同一个元数据字段实现。
- 计划状态：项目 override 元数据第一片完成；项目字段值本身仍保留在 `projects` 表原字段中，尚未在清除覆盖时回填全局默认值，也尚未接入生成 resolver 的项目优先级。
- 验证：`uv run --python 3.13 pytest backend/tests/unit/test_api_project.py::TestProjectGet -q` 通过，5 tests passed；`npm run guard:brand` 通过；`npx eslint src/pages/Settings.tsx src/components/shared/ProjectSettingsModal.tsx src/types/index.ts --ext ts,tsx --max-warnings 20` 通过但保留既有 `CapabilityActionCard` 未使用警告。
- 遗留：需要把 `clear_project_overrides` 接入 UI 操作；需要定义清除覆盖后的字段值回填策略；需要让 resolver/导出任务读取项目覆盖来源，并验证 `项目覆盖 > 个人配置 > 全局配置 > 系统默认`。
- 下一步：先在项目设置弹窗增加“恢复为继承/默认”操作，调用 `clear_project_overrides`；再把导出任务进度和 effective config 来源接入项目覆盖优先级。

### 2026-07-02 00:05 - 项目覆盖恢复继承操作接入

- 范围：`frontend/src/components/shared/ProjectSettingsModal.tsx`、`frontend/src/pages/SlidePreview.tsx`、`frontend/src/api/endpoints.ts`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：项目设置弹窗中显式项目覆盖字段新增“恢复继承”按钮；预览页接入 `updateProject(..., { clear_project_overrides: [...] })` 并刷新项目；`updateProject` 请求类型允许 `clear_project_overrides`。
- 结果：用户现在可以在项目设置中清除某个字段的显式覆盖元数据，字段会从“项目覆盖”回到“继承或默认”显示。
- 计划状态：项目覆盖元数据、显式状态展示和恢复继承 UI 已完成第一片；尚未做清除覆盖后的字段值自动回填，也未进入 runtime resolver 优先级。
- 验证：`uv run --python 3.13 pytest backend/tests/unit/test_api_project.py::TestProjectGet -q` 通过，5 tests passed；`npm run guard:brand` 通过；`npx eslint src/components/shared/ProjectSettingsModal.tsx src/pages/SlidePreview.tsx src/api/endpoints.ts --ext ts,tsx --max-warnings 20` 通过但保留既有 `SlidePreview.tsx` 未用 `Home` import 警告。
- 遗留：清除覆盖目前只清元数据，不改变项目字段存储值；如果后续要求“恢复全局默认值”，需要定义字段回填来源和与全局配置字段的映射。
- 下一步：让导出任务读取项目覆盖元数据并把来源写入任务进度；随后在 resolver 层实现 `项目覆盖 > 个人配置 > 全局配置 > 系统默认` 的可验证优先级。

### 2026-07-02 00:25 - 可编辑 PPTX 导出任务携带项目覆盖来源

- 范围：`backend/controllers/export_controller.py`、`backend/tests/unit/test_export_editable_pptx_task.py`、`frontend/src/store/useExportTasksStore.ts`、`frontend/src/pages/ExportTasks.tsx`、`frontend/src/components/shared/ExportTasksPanel.tsx`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：可编辑 PPTX 导出任务创建时把 `project_overrides` 写入 task progress；导出任务中心和预览页导出任务浮层新增“本次项目覆盖”展示，仅展示显式项目覆盖字段；搜索范围同步包含项目覆盖摘要。
- 结果：用户排查可编辑 PPTX 导出时，能同时看到 runtime 模型来源和本项目显式覆盖了哪些导出/画面字段。
- 计划状态：导出任务来源展示已包含模型 runtime 与项目覆盖元数据；尚未把项目覆盖接入 AI runtime resolver 的模型/Provider 优先级。
- 验证：`uv run --python 3.13 pytest backend/tests/unit/test_export_editable_pptx_task.py -k export_route_creates_pending_task_and_returns_task_id -q` 通过，1 test passed；`npm run guard:brand` 通过；`npx eslint src/store/useExportTasksStore.ts src/pages/ExportTasks.tsx src/components/shared/ExportTasksPanel.tsx --ext ts,tsx --max-warnings 20` 通过。
- 遗留：普通 PPTX/PDF/视频等其他导出任务尚未统一写入项目覆盖摘要；项目覆盖目前主要覆盖导出策略/画面比例，不包含 AI 模型 Provider/Key。
- 下一步：定义项目覆盖进入 resolver 的字段范围，优先让导出相关任务使用 `project_overrides` 标记来源；AI 模型项目级覆盖需要新增字段后再进入 resolver。

### 2026-07-02 00:45 - 可编辑 PPTX 导出请求覆盖优先级记录

- 范围：`backend/controllers/export_controller.py`、`backend/tests/unit/test_export_editable_pptx_task.py`、`frontend/src/store/useExportTasksStore.ts`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：可编辑 PPTX 导出在创建任务前统一解析有效导出参数；当请求体临时传入 `enable_visual_structure_analysis` 时，将该字段来源标记为 `request_override`，并把 `effective_export_options` 写入任务进度；前端项目覆盖摘要展示来源标签，能区分“项目覆盖”和“本次请求”。
- 结果：导出任务记录现在能表达导出参数优先级：本次请求覆盖优先于项目覆盖；没有请求覆盖时，继续按项目显式覆盖或继承/default 展示来源。
- 计划状态：导出相关项目覆盖来源已经接入可编辑 PPTX 任务，并覆盖请求级最高优先级；AI 模型 runtime 的项目级覆盖仍未实现。
- 验证：`uv run --python 3.13 pytest backend/tests/unit/test_export_editable_pptx_task.py -k "export_route_creates_pending_task_and_returns_task_id or export_route_records_request_override_for_visual_structure" -q` 通过，2 tests passed；`npm run guard:brand` 通过；`npx eslint src/store/useExportTasksStore.ts src/pages/ExportTasks.tsx src/components/shared/ExportTasksPanel.tsx --ext ts,tsx --max-warnings 20` 通过。
- 遗留：`effective_export_options` 目前只在可编辑 PPTX 导出任务中记录；普通 PPTX/PDF/视频导出仍需统一；清除项目覆盖仍只清元数据，不回填字段值。
- 下一步：抽出通用项目导出配置摘要 helper，复用到视频/其他异步导出；随后再评估 AI 模型项目级覆盖字段设计。

### 2026-07-02 01:00 - 项目导出配置来源 helper 抽取

- 范围：`backend/models/project.py`、`backend/controllers/export_controller.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：在 Project 模型中新增 `get_project_overrides_summary()` 和 `get_effective_export_options()`，统一计算项目覆盖字段、显式覆盖状态、请求覆盖来源和有效导出参数；可编辑 PPTX 导出路由改为使用 helper，不再手写每个字段的来源判断。
- 结果：导出相关项目覆盖来源计算有了单一入口，后续视频/其他异步导出可以复用同一套 `inherited_or_default / project_override / request_override` 规则。
- 计划状态：可编辑 PPTX 已使用通用 helper；普通 PPTX/PDF/视频导出尚未统一写入 `effective_export_options`。
- 验证：`uv run --python 3.13 pytest backend/tests/unit/test_export_editable_pptx_task.py -k "export_route_creates_pending_task_and_returns_task_id or export_route_records_request_override_for_visual_structure" -q` 通过，2 tests passed；`uv run --python 3.13 pytest backend/tests/unit/test_api_project.py::TestProjectGet -q` 通过，5 tests passed。
- 遗留：helper 目前覆盖项目已有导出字段和画面比例；AI 模型项目级覆盖仍无字段定义，不应强行进入 runtime resolver。
- 下一步：复用 helper 到视频导出任务并记录项目覆盖来源；随后统一普通导出任务或进入 AI 模型项目级覆盖字段设计。

### 2026-07-02 01:20 - 视频导出任务复用项目覆盖来源

- 范围：`backend/controllers/export_controller.py`、`backend/services/task_manager.py`、`backend/tests/unit/test_tts_video_service.py`、`docs/design/guangfu-zhicheng-design.md`。
- 动作：视频导出任务创建时写入 `project_overrides` 和 `effective_export_options`；后台视频导出进度更新改为读取已有 progress 后增量更新，避免处理中/完成态把配置来源覆盖掉；新增路由测试验证显式 `export_allow_partial` 项目覆盖会进入视频导出任务，并补测 FFmpeg 早期失败时仍保留配置来源。
- 结果：视频导出任务和可编辑 PPTX 导出任务开始共享同一套项目导出配置来源记录，导出任务排障可以看到“项目覆盖 / 继承或默认”的有效值来源；同时修复视频任务在 FFmpeg 检查前失败时 `placeholder_dir` 未初始化导致的二次异常。
- 计划状态：可编辑 PPTX 与视频导出已接入项目覆盖来源；普通 PPTX/PDF 等导出任务仍未统一；AI 模型项目级覆盖字段仍待设计。
- 验证：`FULL_TEST_ENV=1 uv run --python 3.13 pytest backend/tests/unit/test_tts_video_service.py -k "records_project_override_sources or normalized_narration_config or preserves_project_override_sources" -q` 通过，3 tests passed；`git diff --check` 通过。
- 遗留：视频任务失败态目前只记录 error message，不额外改写 progress；当前增量保留策略已通过早期失败测试覆盖创建时配置来源不丢失。
- 下一步：提交 `feat(phase7): record video export override sources`；然后启动本地应用，并继续进入普通 PPTX/PDF 导出任务来源统一或 AI 模型项目级覆盖字段设计。
