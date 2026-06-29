# TFSE 與 SCLAW_fz 對照分析

本文件用來落實計畫中「分析 `/Library/Github/SCLAW_fz`，仔細對照，可提取當前項目所需部分」的要求。結論是：SCLAW_fz 的核心價值在資料來源治理、內容管線、搜尋 API、SEO 結構化、後台工作台與匯出流程；TFSE 已以金融獨立站場景重新套入對應能力，保留 Exomac 前端模板，不把 SCLAW 的房地產視覺或資料模型直接搬進來。

## 對照結論

| SCLAW_fz 能力 | SCLAW_fz 證據 | TFSE 對應落地 | 狀態 |
| --- | --- | --- | --- |
| 公開來源登錄與來源治理 | `config/source_registry.json`、`src/source_registry.py` | `assets/data/institutions.json`、`source-policy.html`、`tools/source_verification_evidence.py` | 已吸收 |
| 站內搜尋與查詢 API | `app.py`、`src/site_search.py` | `search.html`、`assets/js/tfse-search.js`、`api-contract.json` 的 `GET /api/search` | 已吸收 |
| SEO 與結構化資料 | `src/text_utils.py`、sitemap 路由 | `tools/generate_seo_assets.py`、`sitemap.xml`、`feed.xml`、JSON-LD | 已吸收 |
| 資料管線與品質檢查 | `scripts/run_pipeline.py`、`src/crawler.py`、`src/pipeline.py` | `tools/data_quality_audit.py`、`tools/source_freshness_audit.py`、`tools/import_validation_package.py` | 已轉為金融資料維護流程 |
| 後端持久化 | `src/db.py`、FastAPI 站點 | `backend/tfse_persistent_api.py`、`backend-schema.sql`、`tools/persistent_api_smoke.py` | 本地與服務器 MVP 已落地，正式 API 切換待外部配置 |
| 後台工作台 | `templates/social_case_workbench.html` | `admin.html`、`tools/crm_capability_audit.py`、CRM 匯出與審核工具 | 已吸收 |
| 匯入匯出與交接 | `scripts/export_wordpress_csv.py`、`exports/` | `tools/local_backup.py`、`tools/import_validation_package.py`、Admin 匯出包 | 已吸收 |
| 客服 / 對話承接 | `src/dialog_ai.py`、`tests/test_support_chat_conversation.py` | `assets/data/line-flows.json`、`tools/public_feedback_intake_package.py`、CRM follow-up queues | 本地閉環，正式 Line OA 待外部配置 |

## 不直接移植的部分

- SCLAW_fz 的日本房地產案例模型、SUUMO/Homes/Yahoo 等來源、地區頁與房產圖庫不符合 TFSE 金融便民中心定位，不直接搬入。
- SCLAW_fz 的爬蟲流水線可作為資料治理參考，但 TFSE 現階段以人工驗證的公開金融資料、來源審核與匯入驗證為主，避免金融資訊自動抓取造成合規風險。
- SCLAW_fz 的 WordPress 匯出只保留「可交接、可匯出」思想；TFSE 目前以靜態站、輕量 API、CRM 匯出與備份包作為交付形態。

## 仍需外部閉環

- 正式 `backend.api_base_url`、資料庫憑證、備份 receipt 與 restore drill。
- 正式 Line OA 加友 URL、退訂與客服承接流程。
- GA4 / Search Console / Sentry / Turnstile 的正式帳號與收件驗證。
- 法務或合規負責人對金融內容、免責聲明與資料保留政策的正式簽核。

## 驗收方式

本對照由 `tools/sclaw_comparison_audit.py` 檢查。若本機存在 `/Library/Github/SCLAW_fz`，會掃描 SCLAW_fz 的實際檔案證據；若 CI 或其他環境沒有該相鄰專案，則改以本文件作為對照證據，避免遠端驗收被本機路徑綁死。

```bash
python3 tools/sclaw_comparison_audit.py --markdown
```
