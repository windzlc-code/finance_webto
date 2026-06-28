# TFSE Template Mapping

本文件对应 `TFSE金融独立站现成前端模板套用0-1完整项目计划.md` 的 Phase 0 交付物。当前项目沿用 Exomac 静态前端模板，不重新设计网站，只把 TFSE 金融便民内容、资料库、表单、后台、SEO、投流和合规闭环套入原模板页面、区块、样式和交互。

## 套用原则

- 保留模板既有 header、mobile menu、page title、section、card、button、form、blog、footer、动画与响应式结构。
- 只替换品牌、导航、文案、图片语义、资料 JSON、表单字段、业务脚本、SEO 与合规提示。
- 不新增贷款广告风格视觉，不使用倒计时、包过、保证核贷、快速放款等诱导文案。
- 新功能优先挂在 `assets/js/tfse-*.js`、`assets/data/*.json` 和既有 HTML 容器上，避免复制出另一套视觉系统。
- 静态 MVP 允许使用 `localStorage` 与 JSON seed；正式版需按 `PRODUCTION_BACKEND_PLAN.md` 切到 API、数据库、服务器端登录、备份与审计。

## 页面角色映射

| 原模板页面/类型 | 当前文件 | TFSE 页面角色 | 业务脚本/数据 |
|---|---|---|---|
| Home / Landing | `index.html` | 金融便民首页、品牌首屏、查询面板、资料库入口、免费健检 CTA | `tfse-home-query.js`, `tfse-lead-form.js`, `categories.json`, `articles.json` |
| Home variation | `index-2.html` | 资料库入口备用首页，保留模板骨架用于资料库导流 | `tfse-lead-form.js` |
| Home variation | `index-3.html` | 免费健检入口备用首页，保留模板骨架用于表单导流 | `tfse-lead-form.js` |
| About | `about.html` | 关于 TFSE、平台定位、资料来源和非代办边界 | shared scripts |
| Services / Products | `service.html`, `database.html` | 全类金融商品资料库，含搜索、筛选、来源与更新时间 | `tfse-products.js`, `tfse-database.js`, `products.json` |
| Work / Portfolio | `work.html` | 金融分类入口 | `tfse-categories.js`, `categories.json` |
| Work detail | `work-details.html` | 金融商品详情页，展示公开资讯、来源、复核状态和合规 CTA | `tfse-products.js`, `products.json` |
| Category aliases | `mortgage.html`, `credit-loan.html`, `vehicle-finance.html`, `installment.html`, `credit-union.html`, `debt-law.html`, `insurance-finance.html`, `anti-fraud.html`, `category.html` | 八大金融分类页和动态分类页 | `tfse-categories.js`, `categories.json`, `products.json`, `articles.json` |
| Blog list/grid/classic | `articles.html`, `blog-grid.html`, `blog-classic.html` | 金融知识内容中心和专栏列表 | `tfse-articles.js`, `articles.json` |
| Blog detail | `blog-details.html`, `articles/*.html` | 金融知识文章详情，底部导向资料库和免费健检 | `tfse-articles.js`, `articles.json` |
| Product detail | `work-details.html`, `products/*.html` | 金融商品详情，显示来源、更新时间、相关资讯和健检 CTA | `tfse-products.js`, `products.json`, `articles.json`, `categories.json` |
| Contact / Form | `free-check.html` | 免费财务健检表单、低敏资料收集、Line CTA、FAQ | `tfse-lead-form.js`, `tfse-line.js`, `tfse-faq.js`, `faq.json`, `line-flows.json` |
| Contact page | `contact.html` | 联络我们、个资删除/更正请求入口说明 | shared scripts |
| Landing page | `lp.html`, `lp/*.html` | 8 个广告落地页，复用同一套模板区块、FAQ、UTM 与表单 | `tfse-landing-pages.js`, `landing-pages.json`, `tfse-lead-form.js` |
| Search | `search.html` | 全站搜索结果页 | `tfse-search.js`, `products.json`, `articles.json`, `categories.json` |
| Admin / Dashboard | `admin.html` | 静态 MVP Admin CRM、资料管理、文章审核、合规、报表、备份、上线检查 | `tfse-admin.js`, `tfse-api.js`, all JSON seeds |
| Policy pages | `privacy.html`, `terms.html`, `disclaimer.html`, `source-policy.html` | 隐私权、使用条款、免责声明、资料来源政策 | `tfse-institutions.js` on source policy |
| Error pages | `404.html`, `500.html` | 错误页，导回资料库、文章和免费健检 | shared scripts |

## 模板区块映射

| 模板区块 | TFSE 套用方式 | 当前证据 |
|---|---|---|
| Header / Navbar | 改成首页、资料库、金融分类、金融知识、免费健检、CRM；保留桌面和手机菜单结构 | 全站 HTML header |
| Header CTA | 原 Buy Now 改成 `免費健檢` | 全站 header right |
| Search overlay | 原搜索弹层改成 TFSE 全站搜索入口 | `tfse-search.js` |
| Hero / Page title | 首页放 TFSE 品牌，内页放页面角色和 breadcrumb | `index.html`, page title sections |
| Feature / Service cards | 改成金融分类、资料库条目、文章卡片或 CTA | `tfse-categories.js`, `tfse-products.js`, `tfse-articles.js` |
| Tabs / Filters | 改成机构类型、需求类型、地区、复核状态和更新时间筛选 | `database.html`, `tfse-database.js` |
| Contact form | 改成免费财务健检表单，记录低敏资料、UTM、隐私同意和 Line 同意 | `free-check.html`, `tfse-lead-form.js` |
| FAQ accordion | 改成合规 FAQ、分类 FAQ 和落地页 FAQ | `faq.json`, `landing-pages.json`, `tfse-faq.js` |
| Blog cards/details | 改成金融知识文章中心和详情页 | `articles.json`, `tfse-articles.js` |
| CTA / Newsletter | 改成免费健检、Line 承接、资料库导流 | `free-check.html`, `lp.html`, `blog-details.html` |
| Footer | 放 Logo、免责声明、资料库、合规页面、联络入口 | 全站 footer |

## 数据与脚本映射

| 文件 | 角色 |
|---|---|
| `assets/data/categories.json` | 8 个金融分类，供分类页、首页查询和导航使用 |
| `assets/data/products.json` | 30 条公开金融资讯 seed，供资料库、分类页和详情页使用 |
| `assets/data/articles.json` | 40 篇金融知识 seed，供内容中心、文章详情、RSS 和 SEO 使用 |
| `assets/data/landing-pages.json` | 8 个投流落地页配置，含痛点、FAQ、对应分类和产品 |
| `assets/data/institutions.json` | 机构和官方来源 seed，供资料来源政策与正式资料库导入 |
| `assets/data/faq.json` | 免费健检与合规 FAQ |
| `assets/data/line-flows.json` | Line OA 欢迎语、快速回复、标签和自动回复原则 |
| `assets/data/compliance-rules.json` | 禁用词、允许上下文、敏感个资字段和必要免责声明 |
| `assets/js/tfse-api.js` | 前台表单与 Admin CRM API 适配层，API 不可用时 fallback 到 localStorage |
| `assets/js/tfse-events.js` | 前台事件、GA4、Meta Pixel、Server Event、Sentry 与敏感资料过滤 |
| `assets/js/tfse-admin.js` | Admin CRM、权限、审计、资料管理、文章审核、合规、报表、备份、上线检查 |
| `assets/js/tfse-lead-form.js` | 免费健检表单、UTM、Turnstile、重复提交、Line CTA、推荐分类和文章 |
| `assets/js/tfse-products.js` | 产品/资料库详情渲染和 canonical base 支持 |
| `assets/js/tfse-database.js` | 资料库搜索、筛选和列表 |
| `assets/js/tfse-categories.js` | 分类页和分类别名页渲染 |
| `assets/js/tfse-articles.js` | 文章列表、详情、发布状态和文章 CTA |
| `assets/js/tfse-landing-pages.js` | 投流落地页动态渲染、UTM 表单和分类导流 |
| `assets/js/tfse-search.js` | 全站搜索和 header 搜索跳转 |
| `assets/js/tfse-line.js` | Line CTA 和承接说明 |
| `assets/js/tfse-faq.js` | FAQ 数据渲染 |
| `assets/js/tfse-institutions.js` | 机构来源和核验资料展示 |

## 验收与运维映射

| 计划要求 | 当前落地 |
|---|---|
| 禁用词、免责声明、来源和更新时间检查 | `tools/compliance_scan.py`, `tools/verify_static_site.py` |
| HTML 语系、图片 alt、表单可用性 | `tools/accessibility_audit.py` |
| 第 17/21 章验收清单 | `tools/acceptance_audit.py`, Admin 验收面板 |
| 浏览器人工验收留痕 | `tools/browser_acceptance_report.py` |
| 表单/Admin/移动端自动烟测 | `tools/browser_acceptance_verify.mjs` |
| SEO 资产重生 | `tools/generate_seo_assets.py`, `sitemap.xml`, `robots.txt`, `feed.xml`, JSON-LD |
| 正式配置检查 | `tools/validate_site_config.py`, Admin 配置交接包 |
| 部署与后端迁移说明 | `DEPLOYMENT.md`, `PRODUCTION_BACKEND_PLAN.md`, `DATA_MODEL.md` |

## 保留模板不重设计的边界

- 不改模板主 CSS 架构，不新增并行设计系统。
- 不重写 header、footer、card、button、form 的视觉语言。
- 任何新增功能优先写入既有 `.section`、`.container`、`.row`、`.col`、`.btn`、`.sidebar-widget`、`.contact-form-area` 等模板容器。
- 需要新增页面时，优先复用已有 page title、breadcrumb、section padding、footer 和 script 组合。
- 若未来接正式后端，前端 HTML 仍应保持同一套模板结构，替换数据来源而不是重做 UI。

## 仍需外部完成

- 正式域名、SSL、Search Console、GA4、Meta Pixel、Server Event、Sentry、正式 Line OA 和 Turnstile 需填入 `site-config.json` 并重新生成 SEO 资产。
- 正式 API、PostgreSQL、服务器端登录、权限、审计和备份需按 `PRODUCTION_BACKEND_PLAN.md` 接入。
- 上线前仍需台湾当地法务或合规人员复核广告文案、表单字段、个资告知和金融资讯展示方式。
