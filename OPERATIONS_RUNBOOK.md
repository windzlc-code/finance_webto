# TFSE Operations Runbook

本 Runbook 對應靜態 MVP、正式網域切換、後端 API 接入、監控、備份、回滾與事故處理。原則是保留 Exomac 前端模板，不重新設計網站；每次上線只替換 TFSE 文案、資料、設定與功能接入。

## 1. 上線前凍結

1. 確認本次改動沒有改掉模板整體版型、主導覽、頁首/頁尾結構或主要 CSS 視覺規則。
2. 確認 `site-config.json` 內的正式配置已由負責人填寫：`base_url`、`analytics.ga4_measurement_id`、`analytics.meta_pixel_id`、`analytics.server_event_endpoint`、`analytics.sentry_dsn`、`search_console.google_site_verification`、`line.oa_url`、`security.turnstile.site_key`、`backend.api_base_url`。
3. 若正式配置尚未完成，維持靜態 MVP 狀態，並在交付說明標記 external pending。

## 2. 本機驗收命令

每次部署前在專案根目錄執行：

```sh
python3 tools/compliance_scan.py
python3 tools/data_quality_audit.py
python3 tools/checklist_artifact_coverage_audit.py --markdown
python3 tools/api_contract_audit.py
python3 tools/backend_schema_audit.py
python3 tools/crm_capability_audit.py --markdown
python3 tools/performance_budget_audit.py
python3 tools/navigation_consistency_audit.py
python3 tools/accessibility_audit.py
python3 tools/production_env_template.py --markdown
python3 tools/production_config_readiness.py --markdown
python3 tools/site_config_update_package.py --markdown
python3 tools/site_config_approval_package.py --markdown
python3 tools/launch_health_check.py --markdown
python3 tools/domain_cutover_package.py --markdown
python3 tools/host_fallback_deployment_check.py --markdown
python3 tools/seo_submission_package.py --markdown
python3 tools/search_console_verification_package.py --markdown
python3 tools/tracking_consent_audit.py --markdown
python3 tools/monitoring_receipt_checklist.py --markdown
python3 tools/sentry_error_verification_package.py --markdown
python3 tools/admin_export_cli_coverage_audit.py --markdown
python3 tools/security_headers_deployment_check.py --markdown --live
python3 tools/admin_security_matrix.py --markdown
python3 tools/admin_auth_cutover_check.py --markdown
python3 tools/backend_acceptance_matrix.py --markdown
python3 tools/line_oa_setup_package.py --markdown
python3 tools/line_oa_handoff_check.py --markdown
python3 tools/formal_backend_migration_package.py --markdown
python3 tools/backup_restore_drill_plan.py --markdown
python3 tools/backup_receipt_verification_package.py --markdown
python3 tools/persistent_api_backup.py --db data/tfse.sqlite3 --backup-dir data/backups --markdown
python3 tools/persistent_api_backup.py --backup-dir data/backups --restore-drill --markdown
python3 tools/content_api_cutover_package.py --markdown
python3 tools/turnstile_backend_verification_package.py --markdown
python3 tools/analytics_debug_verification_package.py --markdown
python3 tools/acceptance_checklist.py --markdown
python3 tools/project_plan_coverage_report.py --markdown
python3 tools/plan_requirement_trace.py --markdown
python3 tools/source_review_queue.py --markdown
python3 tools/source_verification_evidence.py --markdown
python3 tools/content_version_snapshot.py --markdown
python3 tools/privacy_request_queue.py --markdown
python3 tools/line_segment_queue.py --markdown
python3 tools/line_optout_complaint_queue.py --markdown
python3 tools/institution_import_verification_package.py --markdown
python3 tools/public_feedback_intake_package.py --markdown
python3 tools/public_feedback_api_verification_package.py --markdown
python3 tools/lead_dedupe_queue.py --markdown
python3 tools/crm_follow_up_queue.py --markdown
python3 tools/crm_contact_log.py --markdown
python3 tools/crm_api_persistence_package.py --markdown
python3 tools/form_risk_control_report.py --markdown
python3 tools/import_validation_package.py --markdown
python3 tools/data_retention_purge_plan.py --markdown
python3 tools/privacy_fulfillment_verification_package.py --markdown
python3 tools/local_backup.py --markdown
python3 tools/ad_campaign_checklist.py --markdown
python3 tools/conversion_optimization_backlog.py --markdown
python3 tools/utm_attribution_report.py --markdown
python3 tools/retrospective_report.py --markdown
python3 tools/server_event_replay_queue.py --markdown
python3 tools/legal_compliance_review_package.py --markdown
python3 tools/legal_external_review_evidence.py --markdown
python3 tools/compliance_api_persistence_package.py --markdown
python3 tools/line_optout_api_verification_package.py --markdown
python3 tools/local_audit_matrix.py --markdown
python3 tools/seo_indexing_followup_queue.py --markdown
python3 tools/validate_site_config.py
python3 tools/acceptance_audit.py
python3 tools/browser_acceptance_report.py --markdown
NODE_PATH=/Users/windzlc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/windzlc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tools/browser_acceptance_verify.mjs
python3 tools/operations_runbook_audit.py
python3 tools/verify_static_site.py
python3 tools/launch_cutover_audit.py
python3 tools/backend_cutover_roadmap.py --markdown
python3 tools/launch_execution_plan.py --markdown
python3 tools/launch_countdown_plan.py --markdown
python3 tools/formal_config_input_packet.py --markdown
python3 tools/plan_closure_report.py --markdown
python3 tools/live_deployment_check.py --markdown
python3 tools/project_plan_coverage_audit.py --markdown
python3 tools/external_execution_packet.py --markdown
python3 tools/owner_cutover_bundle.py --markdown --summary-only
python3 tools/owner_cutover_bundle.py --markdown --owner backend_engineer --checklist-only
python3 tools/owner_cutover_bundle.py --markdown --owner ops_marketing --timeline-only
python3 tools/external_verification_evidence.py --markdown
python3 tools/release_readiness_package.py --markdown
python3 tools/release_day_runsheet.py --markdown
python3 tools/release_day_runsheet.py --markdown --slot go_live
python3 tools/operations_task_queue.py --markdown
python3 tools/incident_response_package.py --markdown
python3 tools/launch_handoff_manifest.py --markdown
```

`tools/validate_site_config.py` 若只提示 Line OA 仍指向本機 MVP 說明錨點，代表正式 Line OA 尚未接入；這是上線前外部待辦，不是靜態 MVP 失敗。

`tools/launch_cutover_audit.py` 會把 `LAUNCH_CHECKLIST.md`「正式上線前仍需人工/外部完成」段落整理成 `pending_external_input`、`ready_for_external_execution`、`pending_human_review` 與 `pending_local_prep`，方便交接時確認哪些只是等待正式平台操作，哪些仍缺正式配置或人工簽核。

`tools/backend_cutover_roadmap.py --markdown` 會把 `PRODUCTION_BACKEND_PLAN.md`、正式配置待填、必要端點與切換阻擋項整理成單一後端接入順序，方便 backend / data / ops 對齊 `POST /api/leads`、Admin Auth、CRM、事件、內容 API 與備份還原的先後關係。

`tools/launch_execution_plan.py --markdown` 會把上述切換審計再整理成按波次與 owner 排序的作戰計畫，適合直接貼到交接文件、Notion 或發布會議議程。

`tools/launch_countdown_plan.py --markdown` 會把切換待辦再整理成 D-3 / D-2 / D-1 / Go-live / D+1 倒排日程，方便發布前每日站會與跨角色同步。

`tools/formal_config_input_packet.py --markdown` 會把 `pending_external_input` 再收斂成單一正式配置輸入包，列出 `site-config.json` 欄位、後端 secret、責任 owner、格式提示、解鎖項與填值後命令，適合直接交給 data / backend / SEO / ops 分工填寫。

`tools/plan_closure_report.py --markdown` 會把計畫第 17 / 21 章驗收、Phase 0-8 與 1-23 章覆蓋度合併成單一閉環狀態報告，直接說明目前是「本地已閉環、正式環境待阻擋」還是真的還有本地缺口。

`tools/project_plan_coverage_audit.py --markdown` 會按原始計畫文檔 1-23 章逐章對賬，說明哪些章節已完成本地交付，哪些只剩正式配置、正式後端或法務簽核，適合在週會、交接或對外回報時快速說清楚專案還差什麼。

`tools/crm_capability_audit.py --markdown` 會直接對照計畫文檔第 11 節與 Phase 5，檢查登入保護、潛客列表、搜尋、篩選、詳情、狀態更新、備註/聯繫紀錄、UTM、匯出權限、產品/文章管理、合規審核與審計日誌是否都已本地閉環。

`tools/checklist_artifact_coverage_audit.py --markdown` 會核對 `LAUNCH_CHECKLIST.md` 提到的 `tfse_*` 交接包，是否都已真正接入 Admin 導出與瀏覽器煙測，避免文檔先寫了但工具鏈沒跟上。

`tools/plan_requirement_trace.py --markdown` 會直接對照原始計畫文檔第 17 / 21 章，把每條需求拆成 ready、external_pending、manual_browser、not_applicable 與 missing，方便在不改模板的前提下確認目前到底還差哪一條。

`tools/production_env_template.py --markdown` 會把正式 `site-config.json`、API server、CI 與備份任務需要的環境變數整理成 CLI 版本，方便 backend / ops / data 直接照表建立，不必只依賴 Admin 導出。

`tools/production_config_readiness.py --markdown` 會把正式配置就緒度輸出成 CLI 版本，和後台 `tfse_production_config_readiness` 對齊，方便在命令列直接確認目前還缺哪些正式配置。

`tools/site_config_update_package.py --markdown` 會輸出 `site-config.json` 更新草稿預檢包；未提供 draft 時會先給 template 與 current summary，提供 `--draft-file` 或 stdin 後即可檢查 `base_url`、GA4、Meta Pixel、Sentry、Server Event、Search Console、Line OA、backend.api_base_url 與 Turnstile 片段格式。

`tools/site_config_approval_package.py --markdown` 會把正式配置簽核包輸出成 CLI 版本；搭配 `--draft-file` 或 `--draft-json` 可直接生成待審批摘要、pending services、domain cutover 狀態與合併後命令。

`tools/launch_health_check.py --markdown` 會把 Admin 的 `tfse_launch_health_check` 變成 CLI 版本，快速對照正式網址、追蹤、Search Console、Line OA、備份、合規掃描與配置格式校驗是否齊備。

`tools/domain_cutover_package.py --markdown` 會把正式網域切換、SEO 資產、Search Console 與切換阻擋項收斂成單一 CLI 交接包，方便 data / SEO / ops 用同一份基準執行正式切站。

`tools/host_fallback_deployment_check.py --markdown` 會把 404 / 500、未知路徑與 server error fallback 的部署後驗證步驟輸出成 CLI 包，避免主機切換時只驗主頁卻漏掉錯誤頁與回流入口。

`tools/seo_submission_package.py --markdown` 會把 canonical、產品/文章/分類/落地頁數量、SEO 資產路徑與 Search Console 提交流程輸出成 CLI 版本，方便 SEO / content 直接照表執行。

`tools/search_console_verification_package.py --markdown` 會把 Search Console property、驗證碼、sitemap 提交、URL Inspection 樣本與證據欄位輸出成 CLI 版本，方便正式收錄驗證與留痕。

`tools/tracking_consent_audit.py --markdown` 會把 tracking consent 與外部追蹤目的地的同意邊界輸出成 CLI 版本，避免追蹤配置先行卻沒有同步核對同意狀態。

`tools/monitoring_receipt_checklist.py --markdown` 會把 GA4、Meta、Server Event、Sentry 的收件核對清單輸出成 CLI 版本，方便正式追蹤切換時直接對照缺口。

`tools/sentry_error_verification_package.py --markdown` 會把 Sentry DSN、前台/API 受控錯誤驗證、遮罩規則與證據欄位輸出成 CLI 包，方便正式錯誤收件驗收。

`tools/admin_export_cli_coverage_audit.py --markdown` 會對照 Admin 現有 `tfse_*` 導出與 `tools/*.py` 的 standalone CLI 覆蓋度，幫我們持續追蹤哪些能力仍只存在於前端面板。

`tools/security_headers_deployment_check.py --markdown --live` 會把 `_headers`、security.txt、正式主機 header 驗證命令、CSP allowlist 與当前公网 header/cache 證據輸出成 CLI 包，方便正式主機切換時直接核對。`43.130.233.113` 目前已在 Nginx 套用 `tfse-security-headers.conf` 與 assets / site-config / SEO 資產快取策略。

`tools/admin_security_matrix.py --markdown` 會把角色權限矩陣、session / CSRF / MFA / audit / viewer masking 檢查輸出成 CLI 版本，對齊 Admin 的 `tfse_admin_security_matrix`。

`tools/admin_auth_cutover_check.py --markdown` 會把 Admin Auth 正式切換的端點、cookie/CSRF/RBAC/MFA 控制、切換步驟與 blockers 輸出成 CLI 包。

`tools/backend_acceptance_matrix.py --markdown` 會把正式 API 驗收矩陣輸出成 CLI 版本，覆蓋 leads、Admin Auth、CRM、事件、內容 API、合規與個資流程。

`tools/line_oa_setup_package.py --markdown` 會把歡迎語、rich menu、quick replies、標籤與 setup 步驟輸出成 CLI 版本，方便營運照表建立正式 Line OA。

`tools/line_oa_handoff_check.py --markdown` 會把站內 CTA、quick reply、正式 Line OA URL 與手機驗收步驟輸出成 CLI 包，方便切換日逐項留痕。

`tools/formal_backend_migration_package.py --markdown` 會把正式匯入順序、seed 統計、來源/隱私/Line 隊列摘要與敏感資料邊界輸出成 CLI 包，方便後端接入前交接。

`tools/backup_restore_drill_plan.py --markdown` 會把每日備份、每週還原演練、RPO/RTO、證據欄位與阻擋項輸出成 CLI 版本。

`tools/backup_receipt_verification_package.py --markdown` 會把 backup_jobs、restore drill 收據欄位、驗收步驟與外部證據欄位輸出成 CLI 包。

`tools/content_api_cutover_package.py --markdown` 會把產品、文章、機構與搜尋 API 的切換檢查、靜態 fallback 邊界與阻擋項輸出成 CLI 包。

`tools/turnstile_backend_verification_package.py --markdown` 會把 Turnstile server-side siteverify、rate limit、honeypot、去重與負向測試案例輸出成 CLI 包。

`tools/analytics_debug_verification_package.py --markdown` 會把 GA4 / Meta / server event 映射、debug 流程、證據欄位與阻擋項輸出成 CLI 包。

若不開 shell，也可從 Admin 匯出 `tfse_local_audit_matrix`。它會把本節命令整理成單一矩陣，區分可直接執行、執行後仍會指向外部配置，或仍需人工瀏覽器留痕的項目。

`tools/external_execution_packet.py --markdown` 會把 `ready_for_external_execution` 與 `pending_human_review` 任務按 owner 分組，整理執行步驟、依賴項、證據欄位與完成後命令，適合正式切換日直接照表執行與留痕。

`tools/owner_cutover_bundle.py --markdown --summary-only` 會先輸出所有 owner 的剩餘待辦數與狀態；接著可用 `--owner ... --checklist-only` 或 `--timeline-only` 直接生成單一角色的執行清單，適合分派給 backend、SEO、營運、infra 或法務逐一處理。owner 詳細包也會附上對應的 `site-config` patch template 與 `.env` 片段，讓待填配置不必再從多份報表手動拼接。

`tools/external_verification_evidence.py --markdown` 會把 GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA、backend API 與法務複核的 configured / verified 狀態輸出成 CLI 版本，方便直接對照哪些外部服務只是填值了、哪些已真正完成留痕。

`tools/release_readiness_package.py --markdown` 會把上線健康檢查、正式配置、驗收、網域切換、外部執行與後端接入狀態聚合成 CLI 版發布阻擋包，直接判斷目前是否仍需 hold。

`tools/release_day_runsheet.py --markdown` 會把 owner timeline 再壓成 D-3 / D-2 / D-1 / Go-live / D+1 的執行 run sheet，方便正式切站當天直接照時段核對；若只需要單一時段，可再加 `--slot go_live`、`--slot d_minus_1` 這類過濾條件。Run Sheet 裡的 owner group 也會同步帶出對應的 patch template 與 `.env` 片段，方便當天直接照表填值與驗證。

`tools/operations_task_queue.py --markdown` 會把上線配置、外部驗證、後端切換、來源復核、驗收與發布任務整理成 CLI 版運維任務隊列，適合站會、排程與 owner 追蹤。

`tools/incident_response_package.py --markdown` 會把 P0 / P1 觸發條件、回應步驟、驗證命令與高優先任務濃縮成 CLI 事故響應包，供正式切站與 rollback 值班時直接使用。

`tools/launch_handoff_manifest.py --markdown` 會把 config input、external execution、project plan coverage、phase audit、launch cutover、execution plan 與 countdown plan 聚合成單一總交接包，適合發布前總會議或跨角色交接時作為唯一版本來源。

若要把正式後端接入順序單獨交給 backend / data / ops，也可從 Admin 匯出 `tfse_backend_cutover_roadmap`。它會把 `PRODUCTION_BACKEND_PLAN.md`、正式遷移順序、必要端點、安全控制、rehearsal 命令與完成門檻收斂成單一後端交接包。

## 3. 人工瀏覽器驗收

自動煙測通過後，仍需人工打開本機站點檢查桌面與手機：

```sh
python3 -m http.server 4173
```

檢查重點：

- 首頁 CTA、需求查詢面板、資料庫入口與免費健檢入口可正常使用。
- `database.html`、`products/bank-credit-products.html`、`articles.html`、`articles/credit-score-debt-ratio-check.html` 可正常載入。
- `free-check.html` 表單提交成功後有 Line CTA、UTM、隱私同意、蜜罐與 Turnstile 欄位。
- `admin.html` 登入後可看到 CRM、來源復核、內容管理、合規摘要、上線健康檢查與本機備份。
- 手機視窗無橫向溢出、文字重疊或按鈕文字被截斷。

## 4. 靜態部署

1. 將 `site-config.json > base_url` 改為正式網域。
2. 執行 `python3 tools/generate_seo_assets.py`。
3. 重新執行第 2 節所有驗收命令。
4. 推送到 GitHub Pages、Netlify、Vercel Static Hosting 或等效靜態主機。
5. 確認主機套用 `_headers` 或等效安全標頭；GitHub Pages 需透過 Cloudflare、反向代理或平台規則補齊。
6. 匯出 `tfse_security_headers_deployment_check` 或執行 `python3 tools/security_headers_deployment_check.py --markdown --live`，用 `curl -I` 或平台 header 檢查保存 CSP、X-Frame-Options、nosniff、Referrer-Policy、Permissions-Policy、Cache-Control 與 security.txt 留痕。
7. 部署後訪問 `/index.html`、`/database.html`、`/free-check.html`、`/admin.html`、`/404.html`、`/500.html`、`/robots.txt`、`/sitemap.xml`、`/feed.xml`、`/.well-known/security.txt`。
8. 執行 `python3 tools/live_deployment_check.py --markdown`，保存公网主站、SEO 資產、security.txt、`/api/health` 與 HTTPS 阻擋項證據。

## 5. 正式後端切換

後端切換依 `api-contract.json`、`DATA_MODEL.md`、`backend-schema.sql` 與 `PRODUCTION_BACKEND_PLAN.md` 執行：

1. 建立 PostgreSQL schema、enum、索引與審計/備份表。
2. 匯入 `assets/data/*.json` 作為 seed，不把靜態 JSON 當正式營運資料庫。
3. 匯出 `tfse_institution_import_verification_package`，確認 `institutions.json`、`institution_source_versions`、官方 URL 抽查與 audit_logs。
4. 啟用伺服器登入、RBAC、審計日誌與加密欄位。
5. 匯出 `tfse_admin_auth_cutover_check`，驗證 login/session/logout、cookie flags、CSRF、MFA、RBAC、Viewer 遮罩、logout revoke 與 audit_logs。
6. 填入 `backend.api_base_url`，將前台線索提交切到 `POST /api/leads`。
7. 後端必須驗證 Turnstile token、蜜罐、IP + `device_id` 限流與 24 小時重複提交。
8. 匯出 `tfse_turnstile_backend_verification_package`，驗證 siteverify、secret 管理、蜜罐、限流、去重、負向測試與 audit_logs。
9. 合併 `site-config.json` 正式配置前，匯出 `tfse_site_config_approval_package`，確認審批角色、外部留痕、合併後命令與 secret 管理邊界。
10. 匯出 `tfse_compliance_api_persistence_package`，驗證 `POST /api/admin/compliance/review`、`compliance_reviews`、`audit_logs`、RBAC、CSRF、未授權拒絕與 `scan_payload` 脫敏。
11. 匯出 `tfse_privacy_fulfillment_verification_package`，驗證 `PATCH /api/admin/privacy-requests/:lead_id`、`privacy_request_tasks`、`lead_forms` 遮罩/刪除、`audit_logs`、legal hold、未授權拒絕與下游匯出脫敏。
12. 匯出 `tfse_public_feedback_api_verification_package`，驗證 `POST /api/public-feedback`、`public_feedback_tickets`、來源/內容/個資/合規分流、禁止欄位拒收、限流與 audit_logs。
13. 匯出 `tfse_crm_api_persistence_package`，驗證 `GET/PATCH /api/admin/leads`、`lead_forms`、`lead_contact_logs`、`lead_dedupe_queues`、`audit_logs`、RBAC、CSRF、Viewer 遮罩與跨瀏覽器資料一致性。
14. 匯出 `tfse_line_optout_api_verification_package`，驗證 `GET /api/admin/line-optout-complaints`、`GET /api/admin/line-oa-handoff-check`、`line_optout_complaint_tasks`、`privacy_request_tasks`、`legal_compliance_review_packages`、`audit_logs`、RBAC、CSRF、Viewer/未授權遮罩與 Line tag 移除留痕。
15. 將 Admin CRM、合規審核、隱私請求、Line 分群、Line 退訂/投訴、報表與來源復核切到正式 API。
16. 匯出 `tfse_backend_cutover_roadmap`，確認 leads API、Admin Auth、CRM、事件、內容 API 與備份還原的優先順序、阻擋項與完成門檻一致。
17. 重新跑第 2 節與第 3 節驗收。

## 6. 監控與追蹤

正式上線後逐項驗證：

- GA4：確認 `page_view`、`lead_submit`、`site_search`、`database_filter`、`line_cta_click` 可收到。
- Meta Pixel：確認瀏覽、表單、搜尋與 Line CTA 事件可在 Events Manager 收到。
- GA4/Meta Debug：後台匯出 `tfse_analytics_debug_verification_package`，保存 DebugView / Events Manager 的 event_name、observed_at、result、debug_url、screenshot_url 與 reviewer_role。
- Server Event endpoint：確認去識別事件落庫，不含手機、Line ID、姓名、Email、備註、證件、帳戶、卡號或密碼。
- Sentry：確認前台錯誤摘要與伺服器 API 錯誤可收到，且不含敏感欄位。
- Sentry 驗收留痕：後台匯出 `tfse_sentry_error_verification_package`，保存受控測試錯誤、遮罩欄位、environment/release、source map 與 issue 截圖證據。
- Search Console：驗證網域後提交 `sitemap.xml`。
- Search Console 驗證：後台匯出 `tfse_search_console_verification_package`，保存 property URL、驗證方式、sitemap 狀態、URL Inspection 抽查、coverage status、last crawl 與 reviewer 留痕。
- SEO 收錄：後台匯出 `tfse_seo_indexing_followup_queue`，按高優先頁、分類、產品、文章與落地頁逐項保存 coverage、indexed URL、last crawl 與證據備註。
- Line OA：確認 `line.oa_url` 為正式加友網址，並依 `assets/data/line-flows.json` 建立圖文選單、分群標籤與自動回覆。
- Line OA 導向驗收：後台匯出 `tfse_line_oa_handoff_check`，保存免費健檢成功承接、首頁/落地頁 CTA、quick reply、退訂關鍵字、手機瀏覽器結果與截圖證據。
- Line 退訂/投訴：後台匯出 `tfse_line_optout_complaint_queue`，確認停止接收、投訴、封鎖、個資請求升級與 Line tag 移除都有處理人、時間、結果與去識別證據。
- 公眾資料回報：後台匯出 `tfse_public_feedback_intake_package`，確認 `contact.html` 收件可分流到來源復核、內容修正、合規送審或個資請求，且不得保存高敏資料。

## 7. 備份與還原

靜態 MVP 的 Admin 本機備份包只用於遷移前核對，不能替代正式資料庫備份。正式版需建立：

- 每日資料庫 backup。
- 備份完成與失敗通知。
- 備份檔 storage URL 或雲端快照紀錄。
- 後台匯出 `tfse_backup_restore_drill_plan`，核對 RPO/RTO、每日備份、每週還原、checksum、隔離還原抽查與外部阻擋項。
- 後台匯出 `tfse_backup_receipt_verification_package`，保存每日備份收據、checksum、加密儲存、每週還原結果、RPO/RTO 與 audit_log_id。
- 每週 restore drill，至少抽查 `lead_forms`、`audit_logs`、`privacy_request_tasks`、`line_segment_tasks`、`articles`、`financial_products`。
- 每次 restore drill 後在 `backup_jobs` 或正式運維系統記錄結果。
- 每月匯出 `tfse_data_retention_purge_plan`，檢查 `lead_forms`、`privacy_request_tasks`、`lead_events`、`audit_logs`、來源證據與備份的保留/匿名化/刪除候選；未完成個資請求、投訴、事故或法務審核中的資料需先標記 legal hold。

持久化 SQLite API 過渡層已提供 `tools/persistent_api_backup.py`，可用 SQLite backup API 做一致性備份、gzip 壓縮、SHA256 manifest 與隔離 restore drill。`43.130.233.113` 目前已部署：

- `tfse-api-backup.timer`：每日 03:15 執行，`Persistent=true`。
- `tfse-api-backup.service`：先備份 `/var/lib/tfse-api/tfse.sqlite3` 到 `/var/lib/tfse-api/backups`，再自動執行 restore drill。
- 驗證重點：`integrity_check=ok`、critical tables present、source/backup row counts match。

這個 SQLite 備份只覆蓋過渡 API，不取代未來正式 PostgreSQL / 雲端快照備份；正式環境仍需保存 backup job、storage URL、KMS/encryption、RPO/RTO、通知與審計證據。

還原演練基本步驟：

1. 選擇最近一份非生產環境可用備份。
2. 還原到隔離資料庫，不覆蓋正式資料。
3. 對照資料筆數、最近一筆線索、審計日誌與隱私請求狀態。
4. 驗證 Admin 查詢與報表可讀。
5. 記錄耗時、問題與修復措施。

## 8. 回滾流程

靜態站 rollback：

1. 保留上一個可用部署版本或主機部署快照。
2. 若新版本出現阻斷性問題，先切回上一個版本。
3. 清除 CDN 快取。
4. 驗證首頁、資料庫、免費健檢、Admin 登入、sitemap、robots、404/500。
5. 在事故紀錄中標記 rollback 時間、影響頁面與修復版本。

正式主機部署或 rollback 後，從 Admin 匯出 `tfse_host_fallback_deployment_check`，逐項保存 404、500、未知路徑與 server error fallback 的 checked_url、status_code、screenshot_url、result 與 reviewer_role；若平台不支援 500 fallback，需在事故/待辦中標記由後端或反向代理補齊。

後端 rollback：

1. 暫停新版本 API 流量或切回上一版服務。
2. 若 schema migration 影響資料，先停止寫入並由資料庫負責人判斷是否 restore。
3. 不可直接用本機 MVP localStorage 覆蓋正式資料。
4. rollback 後重新驗證 `POST /api/leads`、Admin CRM、審計日誌與隱私請求。

## 9. 事故處理

incident 等級：

- P0：免費健檢無法提交、正式資料外洩、Admin 未授權可見、全站不可用。
- P1：主要分類/資料庫不可用、Line OA 導流失效、GA4/Sentry 全部中斷。
- P2：單篇文章、單個落地頁、非阻斷性樣式或內容錯誤。

處理順序：

1. 記錄發現時間、影響 URL、瀏覽器、裝置、錯誤訊息與截圖。
2. 若涉及個資、登入或錯誤導流，先停用相關入口或 rollback。
3. 檢查 Sentry、Server Event、主機部署紀錄、API logs、`tfse_errors` 本機摘要。
4. 修復後跑第 2 節必要命令和對應人工驗收。
5. 補事故紀錄：root cause、修復內容、是否需要法務/合規通知、後續預防項。

## 10. 合規與法律審核

正式投流、SEO 大量收錄或 Line OA 對外承接前，需由台灣當地 legal / compliance 複核：

- 廣告文案與 CTA。
- 金融商品資訊展示方式。
- 免費健檢表單欄位。
- 隱私權政策、服務條款與免責聲明。
- Line OA 歡迎語、自動回覆與分群標籤。
- 後台匯出 `tfse_legal_external_review_evidence`，保存外部複核狀態、開放項目、去識別證據摘要與送審包版本；未完成外部簽核前不得視為正式法務通過。

TFSE 只彙整公開合法金融商品與法令資訊，非銀行、放款機構或貸款代辦單位。任何會讓使用者誤認保證核貸、保證降息、代辦貸款或收取代辦費的文案，都必須先移除再送審。
