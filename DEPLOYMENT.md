# TFSE 靜態 MVP 部署與運維說明

本專案目前是沿用前端模板改造的靜態 MVP。可直接部署到 GitHub Pages、Netlify、Vercel Static Hosting 或任何支援靜態檔案的主機。

## 部署前

1. 執行本機驗收：

```sh
python3 tools/compliance_scan.py
python3 tools/data_quality_audit.py
python3 tools/source_freshness_audit.py
python3 tools/api_contract_audit.py
python3 tools/backend_schema_audit.py
python3 tools/performance_budget_audit.py
python3 tools/seo_assets_audit.py
python3 tools/accessibility_audit.py
python3 tools/validate_site_config.py
python3 tools/acceptance_audit.py
python3 tools/plan_closure_report.py --markdown
python3 tools/formal_config_input_packet.py --markdown
python3 tools/project_plan_coverage_audit.py --markdown
python3 tools/external_execution_packet.py --markdown
python3 tools/owner_cutover_bundle.py --markdown --summary-only
python3 tools/release_day_runsheet.py --markdown
python3 tools/launch_handoff_manifest.py --markdown
python3 tools/browser_acceptance_report.py --markdown
NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs
python3 tools/operations_runbook_audit.py
python3 tools/verify_static_site.py
```

2. 若本機沒有全域 Node/Playwright，可使用 Codex bundled runtime：`NODE_PATH=/Users/windzlc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/windzlc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tools/browser_acceptance_verify.mjs`。
3. 推送前確認 `.github/workflows/tfse-acceptance.yml` 會在 GitHub Actions 執行同一組 Python 驗收、人工驗收報告生成與 Playwright 瀏覽器煙測。
4. 啟動 `python3 -m http.server 4173`，依 `tools/browser_acceptance_report.py --markdown` 產出的項目完成桌面與手機人工視覺驗收；自動煙測已檢查桌面/手機文字裁切與移動選單開合，但仍不能取代正式人工截圖簽核。
5. 確認 `sitemap.xml`、`feed.xml`、`robots.txt`、`404.html`、`500.html` 可訪問。
6. 在 `site-config.json` 將 `base_url` 改成正式網域，例如 `https://www.tfse.tw`。
7. 執行 `python3 tools/generate_seo_assets.py`，重新產生全站 canonical、Open Graph URL、RSS alternate link、JSON-LD、manifest head 標記、`robots.txt`、`sitemap.xml` 與 `feed.xml`。
8. 確認正式主機已套用 `_headers` 或等效安全標頭，並可訪問 `/.well-known/security.txt`。
9. 再次執行驗收命令，確認產品、分類、落地頁與文章 slug 均存在。

## GitHub Pages

1. 將本專案推送到 GitHub。
2. 等待 GitHub Actions 的 `TFSE acceptance` workflow 通過；此 workflow 會跑 Python 驗收、Playwright 瀏覽器煙測與總靜態驗收。
3. 在 Repository Settings → Pages 啟用部署來源。
4. 選擇 `main` 分支和根目錄。
5. GitHub Pages 不會自動套用 `_headers`；若正式上線使用 GitHub Pages，需透過 Cloudflare、反向代理或平台設定補上同等安全標頭。
6. 部署後檢查：
   - `/index.html`
   - `/database.html`
   - `/products/bank-credit-products.html`
   - `/articles/credit-score-debt-ratio-check.html`
   - `/articles.html`
   - `/free-check.html`
   - `/admin.html`
   - `/404.html`
   - `/500.html`
   - `/sitemap.xml`
   - `/feed.xml`
   - `/robots.txt`
   - `/site.webmanifest`
   - `/.well-known/security.txt`

## Netlify / Vercel

此專案不需要建置命令。部署設定：

- Build command: 留空
- Publish directory: 專案根目錄
- 404 page: 指向 `404.html`
- 500/server error page: 可指向 `500.html`；靜態主機若不支援 500 fallback，正式後端接入後需在伺服器層設定。
- HTTPS: 啟用平台自動 SSL
- Security headers: 套用專案根目錄 `_headers`，包含 CSP、X-Frame-Options、Referrer-Policy、Permissions-Policy 與快取策略。

正式主機切換前，可從 Admin 匯出 `tfse_host_fallback_deployment_check`，記錄 `/404.html`、`/500.html`、不存在路徑與正式後端 server error fallback 的狀態碼、截圖、平台限制與 reviewer 留痕。GitHub Pages 僅支援自訂 404，不支援真正 500 fallback；需要由正式後端、Cloudflare 或反向代理層補齊。

## 靜態安全標頭

專案根目錄 `_headers` 提供 Netlify、Cloudflare Pages 等靜態主機可讀取的安全與快取配置：

- `Content-Security-Policy`：限制資源來源，保留 GA4、Meta Pixel、Sentry、Cloudflare Turnstile 的正式接入白名單。
- `X-Frame-Options: DENY` 與 `frame-ancestors 'none'`：降低被嵌入或點擊劫持風險。
- `X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy`：降低瀏覽器端資訊外洩與權限濫用。
- `/assets/*` 長快取，`site-config.json` 不快取，`sitemap.xml`、`feed.xml`、`robots.txt` 使用短快取。
- `/.well-known/security.txt` 提供標準安全聯絡資訊；正式網域變更後需同步更新 Canonical 與 Policy URL。

## SEO 資產重生

`site-config.json` 是正式網域、sitemap 與 RSS feed 來源的單一配置。任何正式網域、GitHub Pages 子路徑或 Open Graph 圖片變更後，都要重新執行：

```sh
python3 tools/generate_seo_assets.py
python3 tools/data_quality_audit.py
python3 tools/source_freshness_audit.py
python3 tools/api_contract_audit.py
python3 tools/backend_schema_audit.py
python3 tools/performance_budget_audit.py
python3 tools/seo_assets_audit.py
python3 tools/production_config_audit.py
python3 tools/accessibility_audit.py
python3 tools/operations_runbook_audit.py
python3 tools/verify_static_site.py
```

若使用 Google Search Console 的 HTML meta 驗證，先把驗證碼填入 `site-config.json > search_console.google_site_verification`，再執行上述生成與驗收；未填驗證碼時不會輸出空白驗證 meta。

正式 GA4、Meta Pixel、Sentry、Server Event、Line OA、後端 API 或 Turnstile 資訊到位後，可先在 Admin「正式配置交接包」區塊貼上 `site-config.json` 更新片段，匯出 `tfse_site_config_update_package` 做 JSON/HTTPS/ID 格式預檢。此包只作人工合併交接，合併到 `site-config.json` 後仍需重生 SEO 資產並重新跑上述驗收命令。

若要先把所有 `pending_external_input` 正式待填配置收斂給不同 owner，可執行 `python3 tools/formal_config_input_packet.py --markdown`。它會整理 `base_url`、GA4、Meta Pixel、Server Event、Search Console、Line OA、`backend.api_base_url`、Sentry，以及 Turnstile / Database / Session / Backup 等伺服器端 secret 提示，但不會輸出 secret 真值。

若要先判斷目前到底還有沒有本地缺口，可先執行 `python3 tools/plan_closure_report.py --markdown`。它會直接把狀態分成「本地已閉環」和「正式環境待配置 / 後端 / 簽核」，避免把外部待辦誤判成還沒完成開發。

若要從整份計畫文檔角度核對目前到底完成到哪裡，可再執行 `python3 tools/project_plan_coverage_audit.py --markdown`。它會把 1-23 章分成本地已完成和仍待正式配置 / 法務簽核兩類，方便在部署前對外同步實際進度。

若正式配置已收齊，下一步可執行 `python3 tools/external_execution_packet.py --markdown`。它會把真正可以開始做的外部切換任務按 owner 收斂，例如 Line OA 建立、Admin Auth server cutover、備份演練、機構匯入、正式遷移、主機 fallback 與法務送審。

若要把同一批外部待辦直接拆給單一 owner，可執行 `python3 tools/owner_cutover_bundle.py --markdown --summary-only` 先看所有角色，再用像是 `python3 tools/owner_cutover_bundle.py --markdown --owner backend_engineer --checklist-only` 或 `python3 tools/owner_cutover_bundle.py --markdown --owner ops_marketing --timeline-only` 這類命令，直接輸出該角色的待填、執行順序與留痕欄位。owner 詳細包現在還會附上該角色可直接使用的 `site-config` patch template 與 `.env` 片段，方便交給 backend / SEO / ops 直接填值。

若要把正式切換日排成可照表執行的 run sheet，可執行 `python3 tools/release_day_runsheet.py --markdown`。需要只看某個時間槽或某個角色時，可再加 `--slot d_minus_1` 或 `--owner backend_engineer`。Run Sheet 內的 owner group 現在也會附上該角色對應的 patch template 與 `.env` 片段，避免發布日還要回頭翻其他配置包。

若要在部署前把所有交接資訊收成唯一總表，可再執行 `python3 tools/launch_handoff_manifest.py --markdown`。它會把配置待填、外部執行、章節覆蓋、驗收阻擋與倒排計畫合併成同一份發布交接清單。

正式 Line OA 與後端投訴/退訂流程串接前，可先從 Admin 匯出 `tfse_line_optout_api_verification_package`，逐項核對 `GET /api/admin/line-optout-complaints`、`GET /api/admin/line-oa-handoff-check`、`audit_logs`、`line_optout_complaint_tasks`、個資/法務升級、Line tag 移除與去識別欄位是否已在 staging 打通。

正式網域切換前，可從 Admin 匯出 `tfse_domain_cutover_package`，逐項核對 `base_url`、canonical 頁數、SEO 資產、Search Console 驗證、重生命令、部署後抽查與回滾待辦。

Search Console 驗證前，可從 Admin 匯出 `tfse_search_console_verification_package`，按包內步驟建立 URL prefix property、填入 HTML meta 驗證碼、重生 `sitemap.xml` / `robots.txt` / `feed.xml` / canonical / OG / JSON-LD，部署後提交 sitemap 並抽查首頁、資料庫、文章、產品詳情與落地頁的 URL Inspection 結果。

正式主機切換前，也可從 Admin 匯出 `tfse_security_headers_deployment_check`，逐項核對 `_headers` 或平台等效安全標頭、CSP 白名單、`site-config.json` no-store、資產快取、`/.well-known/security.txt`、404/500 fallback 與 `curl -I` 留痕。GitHub Pages 不會自動套用 `_headers`，需保留 Cloudflare、反向代理或平台規則證據。

生成器會同步：

- 所有 HTML 的 canonical、`og:url`、`og:image`。
- 所有 HTML 的 JSON-LD 結構化資料，包含 Organization、WebSite、WebPage 與必要的 Blog、ItemList、Service 補充。
- Google Search Console 驗證 meta。
- `assets/js/tfse-categories.js`、`tfse-products.js`、`tfse-landing-pages.js`、`tfse-articles.js` 的動態詳情頁 canonical base URL。
- HTML head 的 RSS alternate link。
- HTML head 的 `site.webmanifest`、`theme-color` 與 `apple-touch-icon`。
- `robots.txt` 的 sitemap URL。
- `sitemap.xml` 的靜態頁、分類、落地頁、產品詳情與文章詳情 URL。
- `feed.xml` 的已發布文章 RSS item。

## 事件與分析

目前本機 MVP 使用 `localStorage["tfse_events"]` 追蹤：

- `page_view`
- `cta_free_check_click`
- `database_click`
- `database_search`
- `database_filter`
- `article_click`
- `product_detail_view`
- `landing_page_view`
- `site_search`
- `site_search_results`
- `lead_submit`

`assets/js/tfse-events.js` 會先寫入本機事件，再依 `site-config.json` 的 `analytics` 設定選擇性同步：

- `ga4_measurement_id`：填入正式 GA4 Measurement ID 後，前台事件會透過 `gtag` 轉送。
- `meta_pixel_id`：填入正式 Meta Pixel ID 後，前台會載入 `fbq`，並把 `page_view`、`lead_submit`、搜尋、免費健檢與 Line CTA 事件轉送到 Meta Events Manager。
- `server_event_endpoint`：填入正式事件 API 後，事件會以去識別 payload POST 到伺服器。
- `sentry_dsn`：填入正式 Sentry DSN 後，前台錯誤摘要會送往 Sentry。
- `sample_rate`：控制前台事件抽樣比例，預設 1。
- `line.oa_url`：填入正式 Line OA 加友網址後，免費健檢成功訊息會顯示可追蹤的 Line 承接 CTA；未填正式網址前，靜態 MVP 會導向站內 Line 承接說明。
- `security.turnstile.site_key`：填入 Cloudflare Turnstile site key 並把 `enabled` 設為 `true` 後，免費健檢與投流落地頁表單會載入 Turnstile widget，並把 `cf_turnstile_response` 送到 `POST /api/leads`。

GA4、Meta Pixel 與 Server Event 只有在使用者於追蹤偏好橫幅同意 analytics 後才會接收去識別事件；本機 `tfse_events` 仍可用於 MVP 復盤。正式追蹤收件前，先從 Admin 匯出 `tfse_tracking_consent_audit`，確認同意狀態、`tracking_consent_update` 事件與外部追蹤阻擋項。

正式 Line OA 後台建立前，可先從 Admin 匯出 `tfse_line_oa_setup_package`。此包會整理歡迎語、圖文選單入口、quick reply、自動回覆原則、分群標籤、已同意 Line 的同步隊列與合規邊界；完成 Line OA 設定後，再把正式加友網址填入 `site-config.json > line.oa_url` 並重新驗收。

正式 Line OA URL 填入並部署後，可從 Admin 匯出 `tfse_line_oa_handoff_check`，逐項核對免費健檢成功訊息、首頁/落地頁 CTA、Line quick reply、退訂/停止接收關鍵字、手機瀏覽器開啟結果與截圖留痕。此包只保存公開 URL、去識別結果與 reviewer 備註，不保存完整 Line 對話或明文 Line user id。

事件與錯誤上報都會過濾手機、Line ID、姓名、Email、備註、身分證字號、帳戶、卡號、密碼等敏感欄位。未填正式 GA4/API/Sentry 前，後台的數據復盤僅代表本機瀏覽器資料。

正式追蹤配置填入後，可從 Admin 匯出 `tfse_monitoring_receipt_checklist`，逐項核對 GA4 Realtime / DebugView、Meta Events Manager、Server Event endpoint 與 Sentry 是否收到必要事件與測試錯誤。

GA4 與 Meta Pixel 填入後，也可從 Admin 匯出 `tfse_analytics_debug_verification_package`，按包內事件映射逐項觸發 `page_view`、`lead_submit`、`site_search`、`database_filter`、`line_cta_click`，並在 GA4 DebugView / Realtime 與 Meta Events Manager 保存 event name、observed_at、debug URL、截圖與 reviewer 留痕。未取得 analytics 追蹤同意前，不應把 GA4/Meta 收件視為通過。

`tools/production_config_audit.py` 會檢查 `site-config.json`、後台正式配置交接包、`tfse_site_config_update_package`、API 合約、資料模型、部署文件與 GitHub Actions 是否同時覆蓋 GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA、`backend.api_base_url` 與 Cloudflare Turnstile。正式配置每次變更後，都應與 `tools/validate_site_config.py` 一起重新執行。

## 後端 API 接入

本專案已提供正式後端接入依據：

- `api-contract.json`：前台、後台、表單、事件與合規審核 API 合約。
- `DATA_MODEL.md`：PostgreSQL 資料表與欄位建議。
- `PRODUCTION_BACKEND_PLAN.md`：從靜態 MVP 遷移到正式 API/資料庫/權限/備份的順序。
- `OPERATIONS_RUNBOOK.md`：正式部署、監控、備份、restore drill、rollback 與 incident 處理步驟。

正式版第一優先是將免費健檢從 `localStorage` 切到 `POST /api/leads`，再將 Admin CRM 切到 `/api/admin/leads`。靜態 JSON 可作為 seed，不應作為正式營運資料庫。

正式前台內容 API 切換前，可從 Admin 匯出 `tfse_content_api_cutover_package`，逐項核對 `/api/products`、`/api/articles`、`/api/institutions`、`/api/search` 的 status code、row count、sample slug、published-only、source_url 與 fallback 邊界。API 不可回傳草稿、退回文章、後台審計或任何潛客資料。

正式 Admin Auth 切換前，可從 Admin 匯出 `tfse_admin_auth_cutover_check`，逐項核對 `/api/admin/auth/login`、`/api/admin/auth/session`、`/api/admin/auth/logout`、`/api/admin/security-matrix`、httpOnly Secure SameSite cookie、CSRF 驗證、MFA、RBAC 拒絕、Viewer 遮罩、logout revoke 與 audit_logs。正式 API 可用後，前端 MVP 驗證碼只可保留為本機 fallback，不得作為正式管理入口。

正式後端尚未就緒前，可先用本機 mock formal API 做 HTTP rehearsal：

```sh
python3 tools/mock_formal_api.py --port 8788
NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs --backend-base-url http://127.0.0.1:8788
```

這條 rehearsal 會讓 `free-check.html` 與 `admin.html` 經由 `assets/js/tfse-api.js` 真實呼叫本機 HTTP API，而不是只在瀏覽器內攔截 request。它不能替代正式資料庫、Auth、CSRF、RBAC、備份與審計，但能先驗證前端 API 適配層與跨埠 JSON/CORS 邊界。

需要重啟後保留資料或做小流量 staging 時，可使用專案內建的 SQLite 持久化 API：

```sh
python3 backend/tfse_persistent_api.py --host 127.0.0.1 --port 8788 --db data/tfse.sqlite3
python3 tools/persistent_api_smoke.py
```

目前 `43.130.233.113` 已以獨立 systemd 服務部署過渡 API：

- service：`tfse-api.service`
- app path：`/opt/tfse-api/current`
- DB path：`/var/lib/tfse-api/tfse.sqlite3`
- env file：`/etc/tfse-api.env`，權限為 root-only，不提交 secret
- Nginx：僅在 `tfse-site` 中新增 `location ^~ /api/`，反代到 `127.0.0.1:8788`
- public health：`http://www.tfse-fcc.com/api/health`

該服務已提供 `POST /api/leads`、`POST /api/public-feedback`、內容查詢、Admin Auth、CRM 狀態更新、合規審核、個資請求與 `audit_logs`。但目前 `site-config.json > backend.mode` 仍保持 `localStorage`，前台不會自動切到 API；要正式切換時需先解決 HTTPS 443 公網入站、填入正式 Line OA / Turnstile / 後端配置，再把 `backend.mode` 改為 `api` 並將 `backend.api_base_url` 設為正式 HTTPS 網址。

前端已提供 `assets/js/tfse-api.js` API 適配層。正式後端上線時，在 `site-config.json` 填入：

```json
{
  "backend": {
    "api_base_url": "https://api.example.com",
    "mode": "api",
    "timeout_ms": 8000
  }
}
```

填入後：

- 免費健檢會優先 POST `backend.api_base_url + /api/leads`，payload 會包含本機匿名 `device_id`，供正式後端搭配 IP 做限流與重複提交識別。
- Admin CRM 會優先 GET `backend.api_base_url + /api/admin/leads`。
- Admin 狀態更新會優先 PATCH `backend.api_base_url + /api/admin/leads/:id/status`。
- API 不可用時會記錄 `api_fallback` 錯誤摘要，並暫時 fallback 到本機 MVP，避免前台表單完全失效。
- 正式後端必須驗證 `cf_turnstile_response`、蜜罐欄位、IP + `device_id` 限流與 24 小時重複提交，不能只信任前端。

正式 Turnstile 啟用後，可從 Admin 匯出 `tfse_turnstile_backend_verification_package`，逐項測試空 token、無效 token、蜜罐、IP + device_id 限流、phone_hash + needs 去重與高敏 payload 拒收。`TFSE_TURNSTILE_SECRET` 只能放在 API server secrets，不得寫入 `site-config.json`、前端、審計明文或匯出包。

正式 Sentry 啟用後，可從 Admin 匯出 `tfse_sentry_error_verification_package`，逐項保存前台受控測試錯誤、API 受控 server error、敏感欄位遮罩、environment/release 標籤、source map 管理與 Sentry issue 截圖。Sentry event 不得包含 cookie、session、authorization、Turnstile token、完整手機、Line ID、備註或表單原文。

正式資料庫導入 `institutions.json` 前，可從 Admin 匯出 `tfse_institution_import_verification_package`，核對 `institutions` 筆數、`institution_source_versions` 版本紀錄、官方 URL 抽查、來源留痕與 `audit_logs`。導入包只包含公開來源資訊，不得加入使用者個資或後台憑證。

## 錯誤上報

靜態 MVP 已提供 Sentry 接入點與本機錯誤摘要。正式版建議：

1. 在 `site-config.json` 填入正式 `analytics.sentry_dsn`。
2. 驗證前台錯誤是否出現在 Sentry 專案與 Admin 本機錯誤摘要。
3. 保留個資過濾規則，不上報表單內容、手機、Line ID 或備註。
4. 將伺服器 API 錯誤另接 Sentry Server SDK 與維運通知。

## 備份策略

靜態 MVP 的正式資料仍在瀏覽器本機，不適合作為正式營運資料庫。正式版需：

- 表單資料寫入伺服器資料庫。
- 每日資料庫備份。
- 匯出紀錄保留審計日誌。
- 產品、文章、FAQ、合規規則保留版本紀錄。
- 每週還原演練，確認備份可用。

目前 Admin 已提供「本機備份包」作為 MVP 遷移前核對工具，可匯出潛客、事件、錯誤、審計、合規審核、產品覆蓋與文章覆蓋資料，也可在同一瀏覽器環境做還原演練。這只適合靜態 MVP 和正式後端導入前的資料搬遷檢查，不能取代伺服器資料庫備份。

正式備份排程啟用後，Admin 可匯出 `tfse_backup_receipt_verification_package`，逐項保存 backup_job_id、status、storage_url、checksum、加密/KMS、retention_until、restore_drill_id、row_count_checks、RPO/RTO 與 audit_log_id。此包只保存收據欄位與去識別抽查結果，不保存資料庫 URL、密鑰或備份檔內容。

正式後端導入前，Admin 也可匯出 `tfse_formal_backend_migration_package`。此交接包會依 `api-contract.json` 與 `backend-schema.sql` 打包 seed JSON、本機內容覆蓋、潛客、合規審核、審計、來源復核、個資請求、Line 分群與建議匯入順序；匯入前需排除測試資料，並確認手機、Line ID、備註等個資欄位在正式資料庫採用加密或欄位級保護。

## 合規提醒

正式上線前需由台灣當地法務或合規人員複核：

- 廣告文案
- 表單欄位
- 個資告知
- 金融資訊展示方式
- Line 承接話術

Admin 可匯出 `tfse_legal_compliance_review_package`，集中整理站點邊界、免費健檢表單欄位、Line OA 話術、廣告落地頁、來源復核、禁用詞規則、隱私請求、正式配置與驗收留痕。正式投流、SEO 大量收錄或 Line OA 對外承接前，應將此包連同 `tfse_ad_campaign_checklist`、`tfse_source_review_queue`、`tfse_privacy_request_queue` 與 `tfse_acceptance_checklist` 一併交給法務/合規人員複核。

合規審核切到正式後端前，可從 Admin 匯出 `tfse_compliance_api_persistence_package`，核對 `POST /api/admin/compliance/review`、`compliance_reviews`、`audit_logs`、RBAC、CSRF、未授權拒絕與 `scan_payload` 脫敏。此包只保存審核與掃描摘要、狀態碼、角色與 audit log ID，不保存法律意見全文、token、完整手機、Line ID、證件、帳戶、卡號或密碼。

個資請求切到正式後端履約前，可從 Admin 匯出 `tfse_privacy_fulfillment_verification_package`，核對 `PATCH /api/admin/privacy-requests/:lead_id`、`privacy_request_tasks`、`lead_forms` 遮罩/刪除、`audit_logs`、legal hold、未授權拒絕與下游匯出脫敏。此包只保存 request id、手機末三碼、角色、狀態碼、audit log ID 與證據摘要，不保存完整手機、Line ID、姓名、補充說明、證件、帳戶、卡號、密碼或 token。

資料回報正式收件 API 上線前，可從 Admin 匯出 `tfse_public_feedback_api_verification_package`，核對 `POST /api/public-feedback`、`public_feedback_tickets`、來源更新、內容錯誤、個資請求與合規疑慮分流、禁止欄位拒收、限流與 audit_logs。此包只保存工單 ID、類型、狀態碼、分流結果與證據摘要，不保存 Email 原文、完整手機、Line ID、證件、帳戶、卡號、密碼或附件原文。

CRM 切到正式 API 前，可從 Admin 匯出 `tfse_crm_api_persistence_package`，核對 `GET/PATCH /api/admin/leads`、`lead_forms`、`lead_contact_logs`、`lead_dedupe_queues`、`audit_logs`、RBAC、CSRF、Viewer 遮罩與跨瀏覽器資料一致性。此包只保存 CRM 統計、手機末三碼、狀態碼、聯繫摘要與 audit log ID，不保存完整手機、Line ID、Email 或補充說明全文。

TFSE 僅彙整公開合法金融商品與法令資訊，非銀行、放款機構或貸款代辦單位。
