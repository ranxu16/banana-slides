# 光伏智呈改造开工准备清单

本文件用于记录正式页面改造前需要满足的准备条件。

## 必备条件

- [x] 主设计文档存在：`docs/design/guangfu-zhicheng-design.md`
- [x] 进展同步规则写入主设计文档第 15 节
- [x] 关键界面设计稿目录存在：`docs/design/mockups/`
- [x] 关键界面设计稿说明文件存在
- [x] 初版 AppShell 文件存在：`frontend/src/components/layout/AppShell.tsx`
- [x] 初版品牌组件存在：`frontend/src/components/layout/BrandLogo.tsx`
- [x] 品牌守卫脚本存在：`frontend/scripts/guard-brand-workbench.mjs`
- [ ] 当前大量未提交改动完成阶段性保存或提交
- [ ] 关键页面截图验收流程确认
- [ ] 3012/5012 本地服务状态确认

## 建议开工顺序

1. 确认当前 diff 归属，避免无关改动混入前端阶段。
2. 跑品牌守卫和前端构建，确认基线可用。
3. 对照 `mockups/workbench-dashboard.md` 重构工作台首页。
4. 截图验收桌面与移动端。
5. 更新主 DESIGN.md 第 15 节执行记录。

## 暂不处理

- 不在准备阶段重构业务 API。
- 不在准备阶段重写编辑页核心生成逻辑。
- 不在准备阶段处理真实模型额度问题。
