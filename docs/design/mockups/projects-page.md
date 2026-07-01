# 我的项目页面设计稿约束

## 页面目标

把旧“历史记录”心智升级为项目管理页面，服务查找、继续编辑、导出、归档和失败排查。

## 布局结构

```text
AppShell
  Main
    PageHeader: 我的项目 / 管理汇报项目和导出结果
    Toolbar
      SearchInput
      StatusFilter
      TimeFilter
      OwnerFilter(admin)
      NewProjectButton
    StatsRow
    DataTable / ResponsiveProjectCards
    Pagination
```

## 表格字段

- 项目名称
- 状态
- 页数
- 创建方式
- 最近更新时间
- 归属用户（管理员）
- 最近导出
- 操作：继续编辑、预览、导出、更多

## 状态要求

- 失败状态必须有失败原因入口。
- 空状态必须提供“创建新项目”和“导入文件”。
- 加载状态不能造成布局跳动。
- 管理员可切换“我的项目 / 全部项目 / 未归属历史项目”。

## 验收

- 搜索、筛选、分页入口可见。
- 普通用户看不到管理员专属筛选。
- 表格白底文字必须可读。
- 页面名称使用“我的项目”，不再主打“历史记录”。
