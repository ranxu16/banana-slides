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
