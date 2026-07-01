# 用户管理页面设计稿约束

## 页面目标

管理员用于治理用户、角色、状态和项目归属，必须清晰、安全、可审计。

## 布局结构

```text
AppShell
  Main
    PageHeader: 用户管理 / 账号、角色和项目归属
    StatsRow
      总用户
      活跃用户
      总项目
      未归属历史项目
    Toolbar
      SearchInput
      RoleFilter
      StatusFilter
      CreateUserButton
    UserTable
    Pagination
```

## 表格字段

- 用户名
- 角色
- 状态
- 项目数
- 最近登录
- 创建时间
- 操作：启用/禁用、设为管理员、重置密码

## 安全约束

- 禁止管理员禁用、删除或降级自己。
- 危险操作必须确认。
- 后端权限是最终边界，前端隐藏只做体验优化。

## 验收

- 统计卡口径清楚。
- 表格文字在浅色背景可见。
- 自己账号的危险操作不可用且有解释。
