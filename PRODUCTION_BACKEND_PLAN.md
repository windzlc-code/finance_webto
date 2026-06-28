# TFSE 後端接入計劃

目前站點已完成靜態 MVP：前台頁面、資料庫、文章、分類、落地頁、表單、CRM、合規審核與本機事件追蹤。正式營運前，後端需補齊以下能力。

## 優先順序

1. `POST /api/leads`：先替換免費健檢 localStorage，確保潛客不只存在瀏覽器。
2. Admin Auth：以伺服器 session 替換前端明碼密碼。
3. `GET/PATCH /api/admin/leads`：後台 CRM 讀寫資料庫，並將 `contact_log` 落到 `lead_contact_logs` 保存每次聯繫歷史。
4. `POST /api/events`：將本機事件寫入伺服器，並同步 GA4。
5. `POST /api/admin/compliance/review`：合規審核與審計落庫。
6. `GET /api/products`、`GET /api/articles`：前台資料由 API 提供，靜態 JSON 作為 seed。

資料庫 schema 初稿見 `backend-schema.sql`，需先建立 enum、資料表、索引與審計/備份表，再匯入 `assets/data/*.json` seed。
正式導入前，先由 Admin 匯出 `tfse_formal_backend_migration_package`，核對 seed JSON、本機內容覆蓋、潛客、合規審核、來源復核、個資請求、Line 分群與匯入順序；測試資料不得匯入正式營運庫。
同時匯出 `tfse_import_validation_package`，逐項核對 sample_lead 排除、來源復核、個資請求、Line 分群、加密欄位與導入後抽查，避免只把資料搬入庫而未完成驗收。
來源資料正式導入前，另需匯出 `tfse_source_verification_evidence`，將官方來源 URL、復核結果、角色與證據摘要保存到 `source_verification_evidence`，避免只保留待辦隊列而缺少實際查核留痕。
機構資料正式導入前，另需匯出 `tfse_institution_import_verification_package`，核對 `institutions.json`、`institutions`、`institution_source_versions`、來源留痕、抽查樣本與 `audit_logs`，避免只建立最新機構列而缺少來源版本紀錄。
聯絡頁資料回報正式接入後，需將 Email/API 收件轉成 `tfse_public_feedback_intake_package` 或 `public_feedback_tickets`，再分流到來源復核、內容版本、個資請求或法務合規送審。正式公開收件 API 上線前，需匯出 `tfse_public_feedback_api_verification_package`，核對 `POST /api/public-feedback`、`public_feedback_tickets`、禁止欄位拒收、限流、分流任務與 audit_logs 證據。
CRM 接入前另需匯出 `tfse_crm_contact_log`，核對渠道、結果、下次動作、負責角色與備註摘要是否能匯入 `lead_contact_logs`，避免正式 CRM 只保留最後一筆自由文字備註。
CRM 正式 API 上線前，需匯出 `tfse_crm_api_persistence_package`，核對 `GET/PATCH /api/admin/leads`、`lead_forms`、`lead_contact_logs`、`lead_dedupe_queues`、`audit_logs`、RBAC、CSRF、Viewer 遮罩與跨瀏覽器資料一致性。
CRM 接入前也需匯出 `tfse_lead_dedupe_queue`，用完整手機雜湊、需求與 24 小時窗口核對疑似重複，合併或關聯後寫入 `lead_dedupe_queues` 與 `audit_logs`。
前台內容 API 切換前，另需匯出 `tfse_content_api_cutover_package`，核對 `/api/products`、`/api/articles`、`/api/institutions`、`/api/search`、seed 數量、published-only、來源連結與 fallback 邊界，避免正式 API 暴露草稿或未核驗內容。

## 表單安全

- 使用 Cloudflare Turnstile。
- 前端會送出 `cf_turnstile_response`，後端需呼叫 Cloudflare siteverify 驗證成功後才入庫。
- IP + 裝置指紋限流。
- 保留 `website` 蜜罐欄位，非空即拒收。
- 同手機與同需求 24 小時內重複提交需回傳既有紀錄提示，不新增第二筆。
- 後台需提供重複線索審核/合併隊列，避免顧問重複聯繫同一需求。
- 後端驗證欄位，不接受身分證字號、帳戶、卡號、密碼、證件影像。
- `consent_privacy` 必須為 true。
- `consent_line` 必須獨立欄位，不可由隱私同意推定。
- 儲存 `consent_version`、`source_url`、完整 UTM。
- 手機、Line ID、補充說明加密或至少欄位級保護。
- 前端已提供 `tfse-api.js` 適配層；正式版需設定 `site-config.json > backend.api_base_url`，讓表單提交、CRM 列表與狀態更新優先走 API。
- 正式後端未就緒前，可先使用 `python3 tools/mock_formal_api.py --port 8788` 搭配 `node tools/browser_acceptance_verify.mjs --backend-base-url http://127.0.0.1:8788` 做本機 rehearsal，驗證 `POST /api/leads`、`POST /api/events`、`POST /api/public-feedback`、`GET /api/products`、`GET /api/articles`、`GET /api/institutions`、`GET /api/search`、`GET /api/admin/leads`、`PATCH /api/admin/leads/:id/status`、Admin login/session/logout、CORS 與前端切換邏輯。
- 填入正式 `backend.api_base_url`、GA4、Meta Pixel、Sentry、Server Event、Line OA、Turnstile 與 Search Console 後，需先執行 `python3 tools/validate_site_config.py`，再重跑靜態與合規驗收。
- 後台可匯出 `tfse_site_config_approval_package`，在正式配置合併前保存審批角色、待配置服務、合併後命令與外部留痕要求；此包只保存摘要與預檢結果，不保存 secret 真值。
- 後台可匯出 `tfse_production_env_template`，用來核對 `site-config.json`、`.env.production`、GitHub Actions secrets、API server environment 與備份任務所需變數；Turnstile secret、資料庫 URL 與 Admin session secret 僅能放在正式密鑰管理或伺服器環境，不得提交到 Git。
- 後台可匯出 `tfse_backend_acceptance_matrix`，正式 API 接入時需逐項核對必要端點、驗收證據、阻擋項、資料庫落庫、審計與備份，不可只用單次 smoke test 宣告完成。

## 後台安全

- Server-side session。
- CSRF 防護。
- RBAC 角色權限。
- 正式 API 合約需提供 `/api/admin/auth/login`、`/api/admin/auth/session`、`/api/admin/auth/logout`，並以 `admin_users`、`admin_sessions` 保存密碼雜湊、session hash、CSRF hash、過期與撤銷紀錄。
- 正式 API 需提供 `/api/admin/security-matrix` 或同等內部報表，保存 `tfse_admin_security_matrix` 的角色權限、session、CSRF、MFA、審計與 Viewer 遮罩檢查結果。
- 匯出資料需 Super Admin 或 Data Manager。
- 匯出、狀態更新、刪除請求、文章發布、資料庫更新、合規審核都寫入 `audit_logs`。
- 合規審核正式落庫前，匯出 `tfse_compliance_api_persistence_package`，逐項核對 `POST /api/admin/compliance/review`、`compliance_reviews`、`audit_logs`、RBAC、CSRF、未授權拒絕與 `scan_payload` 脫敏證據。
- 個資請求正式履約前，匯出 `tfse_privacy_fulfillment_verification_package`，逐項核對 `PATCH /api/admin/privacy-requests/:lead_id`、`privacy_request_tasks`、`lead_forms` 遮罩/刪除、`audit_logs`、legal hold、未授權拒絕與下游匯出脫敏證據。
- Viewer 不可看到完整手機或 Line ID，可做遮罩。
- 法務/合規外部複核完成後，保存 `tfse_legal_external_review_evidence` 或 `legal_external_review_evidence`，只記錄簽核狀態、去識別證據摘要、開放項目與送審包版本，不保存法律意見全文或敏感個資。

## 事件與分析

目前前台事件：

- `page_view`
- `cta_free_check_click`
- `database_click`
- `database_search`
- `database_filter`
- `article_click`
- `product_detail_view`
- `landing_page_view`
- `lead_submit`

正式版需：

- 寫入 `lead_events`。
- 同步 GA4 event。
- 避免上報手機、Line ID、備註等個資。
- 投流復盤需保存 `tfse_conversion_optimization_backlog` 或對應資料表，將 UTM 歸因、表單提交與 Line 承接轉成下一輪落地頁測試待辦；每輪僅測一個主要變因，且先通過合規預檢。
- 前端已透過 `site-config.json` 提供 GA4、事件 API、Meta Pixel 與 Sentry 配置位；正式版需填入正式 ID/DSN 並驗證收件。
- 正式後端需提供 `GET /api/admin/config-readiness`，回傳 SEO、追蹤、後端、安全與 Line OA 配置交接狀態。
- 正式 Search Console 驗證後，可保存 `tfse_seo_indexing_followup_queue` 到 `seo_indexing_followup_queues`，追蹤首頁、資料庫、分類、產品、文章與落地頁的 coverage、indexed URL、last crawl 與證據備註。
- 正式 Line OA 需保存 `tfse_line_optout_complaint_queue` 或對應 `line_optout_complaint_tasks`，處理退訂、停止接收、投訴、封鎖、個資請求升級與合規升級，且不得保留完整 Line 對話或明文 Line user id。
- 正式後端需提供 `GET /api/admin/line-optout-api-verification`，回傳 `tfse_line_optout_api_verification_package` 所需欄位，核對 `line_optout_complaint_tasks`、`privacy_request_tasks`、`legal_compliance_review_packages`、`audit_logs`、RBAC、CSRF 與去識別隊列查詢。
- 後台報表以伺服器事件為準，本機 `localStorage` 僅作 fallback。

## 錯誤與監控

- Sentry Browser SDK：前台錯誤。
- Sentry Server SDK：API 錯誤。
- 过滤表單個資欄位。
- 監控 `/api/leads` 成功率、限流命中、表單錯誤、管理員登入失敗。
- 正式 DSN 與 server-side Sentry 上線後，後台可匯出 `tfse_sentry_error_verification_package`，逐項核對測試錯誤、beforeSend 脫敏、environment/release、source map 與 Sentry issue 截圖證據。

## 備份與復原

- 每日 PostgreSQL 備份。
- 每週還原演練。
- 匯出檔案保留審計紀錄與下載者。
- seed JSON 保留在 repo，但不作正式資料來源。
- 後台可匯出 `tfse_backup_restore_drill_plan`，作為正式備份排程、RPO/RTO、checksum、storage URL、隔離還原抽查與演練證據欄位的交接清單；此包不包含資料庫 URL 或任何密鑰。
- 後台可匯出 `tfse_backup_receipt_verification_package`，正式備份任務啟用後核對 backup_jobs、backup_restore_drill_results、checksum、加密儲存、RPO/RTO、通知與 audit_logs；此包只保存收據欄位，不保存備份檔內容或資料庫密鑰。
- 後台可匯出 `tfse_data_retention_purge_plan`，作為正式資料保留、匿名化、到期刪除、legal hold 與審計證據的月檢排程；正式環境需由資料庫 job 或後台工作流執行，localStorage MVP 只產生候選清單。

## 完成標準

- 免費健檢提交後，資料庫有 `lead_forms` 紀錄。
- 後台登入由伺服器驗證。
- CRM 可跨瀏覽器看到同一批資料。
- 合規審核與審計日誌可查。
- GA4/Search Console/Sentry 可用。
- 備份任務成功且可還原。
