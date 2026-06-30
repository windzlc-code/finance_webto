# TFSE 生產資料模型

本文件把目前靜態 JSON 與 `localStorage` MVP 對應到正式後端資料表。正式版建議使用 PostgreSQL，所有含個資資料需加密傳輸、限制權限、保留審計紀錄，並支援刪除請求。

對應 SQL 初稿：`backend-schema.sql`。正式導入時可依雲端資料庫、加密/KMS、備份策略與 ORM migration 工具調整，但欄位邊界、敏感資料保護、審計與刪除請求不可移除。

## admin_users

正式 Admin 使用者表，取代目前 `admin.html` 的本機 MVP 驗證碼。密碼只能保存 `password_hash`，不得把明文密碼、MFA code 或 session token 寫入審計或匯出包。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| email | text unique | 管理員登入帳號 |
| display_name | text | 後台顯示名稱 |
| role | enum | super_admin / consultant / viewer / content_editor / data_manager / compliance_reviewer |
| password_hash | text | 密碼雜湊 |
| mfa_enabled | boolean | 是否啟用 MFA |
| status | text | active / disabled |
| last_login_at | timestamp | 最近登入時間 |

## admin_sessions

正式 Admin session 表，對應 `/api/admin/auth/login`、`/api/admin/auth/session`、`/api/admin/auth/logout`。Session cookie 必須 httpOnly、Secure、SameSite，CSRF token 只保存 hash。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| admin_user_id | uuid | 對應 admin_users |
| session_hash | text unique | session token hash |
| csrf_token_hash | text | CSRF token hash |
| user_agent_hash | text | 去識別裝置資訊 |
| ip_hash | text | 去識別 IP |
| expires_at | timestamp | 過期時間 |
| revoked_at | timestamp nullable | 登出或撤銷時間 |

## admin_auth_cutover_checks

正式 Admin Auth 切換核對包，對應後台 `data-admin-auth-cutover-export` 與 `tfse_admin_auth_cutover_check` 匯出包。正式後端接入時，用來保存 login/session/logout、httpOnly cookie、CSRF、MFA、RBAC、Viewer 遮罩、audit_logs 與 MVP 明碼驗證退場步驟；不得保存密碼、session token、CSRF token、MFA code 或完整個資。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_formal_api_configuration / ready_for_formal_auth_validation |
| backend_mode | text | localStorage / api |
| api_base_url_configured | boolean | 是否已配置正式 HTTPS API |
| endpoints | jsonb | login/session/logout/security-matrix 驗收端點 |
| schema_tables | text[] | admin_users、admin_sessions、audit_logs、admin_security_matrices |
| required_controls | text[] | password_hash、session_hash、CSRF、MFA、RBAC、Viewer 遮罩與審計控制 |
| cutover_steps | text[] | 從 MVP 驗證碼切到正式 Auth 的步驟 |
| evidence_fields | text[] | checked_endpoint、cookie_flags、csrf_result、rbac_result、audit_log_id 等留痕欄位 |
| blockers | text[] | 正式 API、session/CSRF/RBAC/MFA/audit 待辦 |
| related_exports | text[] | 安全矩陣、API 驗收、環境變數與外部驗證包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## admin_security_matrices

Admin 權限與安全矩陣，對應後台 `data-admin-security-matrix` 與 `tfse_admin_security_matrix` 匯出包。正式版可在上線前保存角色權限、session/CSRF/MFA/審計檢查和阻擋項，用於安全複核；不得保存密碼、session token、CSRF token 或完整個資。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| roles | jsonb | 角色、顯示名稱與可用 permission 清單 |
| checks | jsonb | server session、CSRF、password_hash、MFA、RBAC、audit、Viewer masking 檢查 |
| blockers | text[] | 正式上線前仍需完成的安全阻擋項 |
| related_exports | text[] | 後端驗收、遷移、個資請求與審計相關交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## security_headers_deployment_checks

正式主機安全標頭部署核對包，對應後台 `data-admin-security-headers-export` 與 `tfse_security_headers_deployment_check` 匯出。用於保存 `_headers`、CSP、快取策略、`security.txt`、404/500 fallback 與平台套用證據欄位；此包不代表正式主機已套用，仍需部署後以 `curl -I`、平台設定或瀏覽器 DevTools 留痕。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | requires_formal_host_verification |
| source_files | text[] | `_headers`、`.well-known/security.txt`、部署與 Runbook 文件 |
| expected_headers | text[] | CSP、X-Frame-Options、nosniff、Referrer-Policy、Permissions-Policy、Cache-Control 等 |
| csp_allowlist | text[] | GA4、Meta Pixel、Sentry、Turnstile 等必要來源 |
| critical_urls | text[] | 首頁、免費財務健檢查詢、Admin、錯誤頁、site-config 與 security.txt |
| host_notes | text[] | GitHub Pages / Netlify / Cloudflare Pages 等平台注意事項 |
| verification_commands | text[] | curl 與本機驗收命令 |
| evidence_fields | text[] | checked_url、actual_value、result、evidence_note 等正式留痕欄位 |
| related_exports | text[] | 安全矩陣、配置簽核、網域切換與外部驗證留痕包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## institutions

公開金融機構或法令/防詐來源。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| name | text | 機構或來源名稱 |
| type | enum | bank / finance_company / credit_union / government / legal_resource |
| region | text | 地區 |
| official_url | text | 官方來源 |
| status | enum | source_pending / verified / needs_update |
| updated_at | timestamp | 資料更新時間 |

## institution_source_versions

機構來源核驗版本紀錄，對應正式導入 `assets/data/institutions.json` 後的版本留痕。每次新增、更新或重新核驗機構來源時，需保留官方 URL、registry_ref、核驗狀態、角色與證據摘要，避免只覆蓋 institutions 最新狀態。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| institution_id | uuid | 對應 institutions |
| source_url | text | 官方 https 來源 URL |
| registry_ref | text | 官方登錄或公開來源摘要 |
| verification_status | enum | source_pending / verified / needs_update |
| evidence_summary | text | 去識別核驗摘要，不保存帳號或內部意見全文 |
| reviewer_role | enum nullable | data_manager / compliance_reviewer 等正式角色 |
| verified_at | timestamp nullable | 核驗時間 |
| created_at | timestamp | 建立時間 |

## financial_products

對應 `assets/data/products.json` 與前台資料庫。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| institution_id | uuid | 可為空，連到 institutions |
| slug | text unique | 前台詳情 URL |
| title | text | 資訊標題 |
| type | enum | bank / finance_company / credit_union / legal_resource |
| category | enum | mortgage / credit_loan / vehicle / installment / credit_union / debt_law / insurance_finance / anti_fraud |
| audience | text | 適合對象 |
| region | text | 地區 |
| source_title | text | 來源標題 |
| source_url | text | 來源連結 |
| status | enum | source_pending / verified / legal_info / public_notice / needs_update |
| summary | text | 摘要 |
| checks | jsonb | 查詢前確認事項 |
| reviewed_at | timestamp | 最近合規/來源復核時間 |
| updated_at | timestamp | 更新時間 |

## articles

SEO 文章與金融知識內容。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| slug | text unique | 文章 URL |
| title | text | 標題 |
| category | text | 分類 |
| status | enum | draft / in_review / published / archived |
| body | text | 文章正文 |
| summary | text | 摘要 |
| seo_title | text | SEO 標題 |
| seo_description | text | SEO 描述 |
| keywords | text[] | 關鍵字 |
| compliance_note | text | 合規備註 |
| updated_at | timestamp | 更新日期 |
| published_at | timestamp | 發布時間 |

## lead_forms

免費財務健檢查詢潛客資料。不得收身分證字號、證件照片、銀行帳戶、信用卡卡號、密碼或完整財務文件。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| display_name | text | 稱呼 |
| phone | text encrypted | 手機 |
| line_id | text encrypted | Line ID |
| region | text | 地區 |
| needs | text | 需求 |
| occupation_type | text | 身份類型 |
| income_type | text | 收入型態 |
| message | text encrypted | 補充說明 |
| consent_privacy | boolean | 隱私權同意 |
| consent_line | boolean | Line 同意 |
| consent_version | text | 同意版本，例如 privacy-2026-06-27 |
| source_url | text | 來源頁面 |
| utm_source | text | UTM |
| utm_medium | text | UTM |
| utm_campaign | text | UTM |
| utm_content | text | UTM |
| utm_term | text | UTM |
| device_id | text | 前端產生的匿名裝置 ID，用於後端限流與重複提交識別，不應視為身份證明 |
| cf_turnstile_response | transient | Cloudflare Turnstile 驗證 token，僅供後端驗證，不落正式個資表 |
| tags | text[] | 分群標籤 |
| status | enum | new / contacted / info_sent / consulted / unresponsive / spam / closed |
| assigned_to | text nullable | CRM 負責角色或正式後端使用者 ID |
| follow_up_priority | text | high / normal / low |
| next_follow_up_at | date nullable | 下次跟進日 |
| delete_requested | boolean | 使用者刪除請求 |
| privacy_request_type | enum nullable | delete / correction |
| privacy_request_status | enum nullable | pending / completed |
| privacy_requested_at | timestamp nullable | 使用者請求時間 |
| privacy_completed_at | timestamp nullable | 後台處理完成時間 |
| submitted_at | timestamp | 提交時間 |
| updated_at | timestamp | 更新時間 |

## lead_contact_logs

CRM 結構化聯繫紀錄，對應後台潛客詳情中的聯繫渠道、結果、下次動作與 `tfse_crm_contact_log` 匯出包。正式版應保存每次聯繫歷史，不以單一備註覆蓋。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| lead_id | uuid | 對應 lead_forms |
| channel | text | phone / line / email / manual_note |
| outcome | text | reached / info_sent / no_response / invalid_contact 等 |
| next_action | text | follow_up / send_public_info / line_reminder / close_no_need / privacy_request |
| note_summary | text nullable | 備註摘要，不保存高敏個資 |
| next_follow_up_at | date nullable | 下次跟進日 |
| handled_by | uuid nullable | 正式後端管理員 ID |
| handled_by_role | text | MVP 角色或正式角色 |
| contacted_at | timestamp | 聯繫時間 |
| created_at | timestamp | 建立時間 |

## lead_dedupe_queues

CRM 重複線索處理隊列，對應後台 `data-admin-lead-dedupe` 與 `tfse_lead_dedupe_queue` 匯出包。MVP 僅以手機末三碼 + 需求找疑似重複；正式版需以完整手機雜湊 + needs + 24 小時窗口做去重，並將處理結果寫入審計。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| dedupe_key | text | 正式版可用 phone_hash + needs + time window |
| phone_last3 | text | 手機末三碼，僅供人工比對 |
| needs | text | 需求類型 |
| suggested_primary_lead_id | uuid nullable | 建議保留的主線索 |
| candidate_lead_ids | uuid[] | 疑似重複線索 ID |
| dedupe_policy | jsonb | local MVP 與正式去重規則 |
| recommended_action | text | 合併、關聯或關閉重複線索建議 |
| status | text | pending_review / merged / linked / rejected |
| related_exports | text[] | 防刷、跟進、聯繫紀錄、遷移包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## crm_api_persistence_packages

CRM 正式 API 落庫驗收包，對應後台 `data-admin-crm-api-export` 與 `tfse_crm_api_persistence_package` 匯出包。正式接入 `GET /api/admin/leads`、`PATCH /api/admin/leads/:id/status`、跟進隊列、聯繫紀錄與重複線索隊列時，用於核對 `lead_forms`、`lead_contact_logs`、`lead_dedupe_queues`、`audit_logs`、RBAC、CSRF 與 Viewer 遮罩；不得保存完整手機、Line ID、Email、補充說明全文、session token、CSRF token、證件、帳戶、卡號或密碼。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_crm_api_persistence / ready_for_crm_api_persistence |
| backend_target | jsonb | CRM list/detail/status/follow-up/contact-log/dedupe/audit endpoint 與目標表 |
| local_context | jsonb | 本機線索、跟進、聯繫紀錄、重複線索與審計摘要 |
| required_controls | text[] | server session、CSRF、RBAC、Viewer 遮罩、狀態更新、聯繫紀錄追加與重複線索處理要求 |
| test_cases | jsonb | Viewer 遮罩、顧問更新、聯繫紀錄追加、跟進篩選與 phone_hash 去重案例 |
| evidence_fields | text[] | endpoint、status_code、lead_id、contact_log_id、dedupe_queue_id、audit_log_id 等留痕欄位 |
| blockers | text[] | 正式 API、落庫、角色測試、跨瀏覽器與遮罩證據待辦 |
| related_exports | text[] | 跟進隊列、聯繫紀錄、重複線索、遷移、導入、後端與 Auth 驗收包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## privacy_request_tasks

由聯絡頁、隱私權政策或 CRM 標記產生的個資查詢、更正、刪除處理隊列。MVP 對應後台 `data-admin-privacy-requests`，正式版需在伺服器端執行刪除、遮罩或更正並保留必要審計。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| lead_id | uuid | 對應 lead_forms |
| request_type | enum | delete / correction |
| request_status | enum | pending / completed / rejected |
| phone_last3 | text | 僅供人工比對，不匯出完整手機 |
| requested_at | timestamp | 請求時間 |
| completed_at | timestamp nullable | 完成時間 |
| handled_by | uuid nullable | 處理人 |
| audit_log_id | uuid nullable | 對應審計紀錄 |

## data_retention_purge_plans

正式後端每月資料保留、匿名化、到期刪除與 legal hold 月檢排程。MVP 對應後台 `data-admin-data-retention` 與 `tfse_data_retention_purge_plan`，只輸出手機末三碼、規則、候選摘要與證據欄位。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | draft / reviewed / executed / blocked |
| review_frequency | text | monthly |
| summary | jsonb | 候選數、90 天以上事件、未完成個資請求等摘要 |
| retention_rules | jsonb | lead_forms、privacy_request_tasks、lead_events、audit_logs、backup_jobs 等保留規則 |
| purge_candidates | jsonb | 僅含 record id、手機末三碼、狀態與建議動作 |
| blockers | jsonb | 後端、legal hold、備份清除證據等阻擋項 |
| generated_by | uuid nullable | 產生人 |
| generated_at | timestamp | 產生時間 |
| executed_by | uuid nullable | 執行刪除/匿名化人 |
| executed_at | timestamp nullable | 執行時間 |
| audit_log_id | uuid nullable | 對應審計紀錄 |

## privacy_fulfillment_verification_packages

個資查詢、更正與刪除正式履約驗收包，對應後台 `data-admin-privacy-fulfillment-export` 與 `tfse_privacy_fulfillment_verification_package` 匯出包。正式後端處理 `PATCH /api/admin/privacy-requests/:lead_id` 後，用於核對 `privacy_request_tasks`、`lead_forms` 遮罩/刪除、`audit_logs`、RBAC、CSRF、legal hold 與下游匯出脫敏；不得保存完整手機、Line ID、姓名、補充說明、證件、帳戶、卡號、密碼、session token 或 CSRF token。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_privacy_fulfillment / ready_for_privacy_fulfillment_verification / no_privacy_requests |
| backend_target | jsonb | privacy requests queue、fulfillment、audit endpoint、目標表與授權角色 |
| local_context | jsonb | 個資請求、完成數、保留排程候選與本機審計摘要 |
| required_controls | text[] | server session、CSRF、RBAC、lead_forms 遮罩/刪除、audit_logs 與 legal hold 控制 |
| test_cases | jsonb | 隊列查詢、刪除完成、更正完成、未授權拒絕與下游匯出抽查案例 |
| evidence_fields | text[] | endpoint、status_code、privacy_request_id、lead_fields_scrubbed、audit_log_id 等留痕欄位 |
| blockers | text[] | 正式 API、落庫/遮罩證據、角色測試與下游抽查待辦 |
| related_exports | text[] | 個資請求、資料保留、Line 退訂、遷移、導入與後端驗收包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## lead_events

前台與 CRM 事件。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| lead_id | uuid nullable | 關聯潛客 |
| name | text | 事件名稱 |
| path | text | 頁面 |
| url | text | URL |
| referrer | text | 來源 |
| payload | jsonb | 事件內容，需移除個資 |
| created_at | timestamp | 建立時間 |

## line_segment_tasks

Line OA 分群同步隊列。MVP 對應後台 `data-admin-line-segments` 和 `tfse_line_segment_queue` 匯出包；正式版需由後端或 Line OA 匯入流程處理，不得把未同意 Line 的潛客送入分群。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| lead_id | uuid | 對應 lead_forms |
| line_id | text encrypted nullable | 使用者 Line ID |
| tags | text[] | need_* / segment_* / source_* / line_opt_in |
| sync_status | enum | pending / exported / synced / failed |
| exported_at | timestamp nullable | 匯出時間 |
| synced_at | timestamp nullable | 正式 Line OA 同步時間 |
| consent_version | text | Line 同意版本 |

## line_oa_setup_packages

Line OA 設定交接包，對應後台 `data-admin-line-oa-setup-export` 與 `tfse_line_oa_setup_package` 匯出包。正式 Line OA 建立圖文選單、quick reply、自動回覆與分群標籤前，應以此包作為設定依據。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| line_oa_url | text | 正式 Line OA 加友網址 |
| welcome_messages | jsonb | 歡迎語 |
| rich_menu | jsonb | 圖文選單入口與 URL |
| quick_replies | jsonb | 自動回覆、文章、資料庫與免費財務健檢查詢入口 |
| tags | jsonb | 需求、來源、分群與同意標籤 |
| reply_principles | jsonb | 自動回覆原則 |
| segment_sync_queue | jsonb | 可匯入 Line OA 的已同意分群資料 |
| compliance_boundaries | jsonb | Line 話術與個資限制 |
| records | jsonb | 正式 Line OA 設定留痕 |
| record_summary | jsonb | 已留痕、已完成與受阻統計 |
| setup_steps | jsonb | 設定步驟 |
| generated_by | uuid | 產生者 |
| generated_at | timestamp | 生成時間 |

## line_oa_handoff_checks

正式 Line OA 導向驗收包，對應後台 `data-admin-line-oa-handoff-export` 與 `tfse_line_oa_handoff_check` 匯出包。正式 Line OA 建立後，用於保存正式加友 URL、站內 CTA、免費財務健檢查詢成功承接、quick reply、自動回覆、退訂/投訴入口與外部留痕欄位；不得保存完整 Line 對話、明文 Line user id 或高敏個資。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_line_oa_handoff / ready_for_line_oa_handoff_verification |
| line_oa_url | text | 正式 Line OA 加友網址 |
| official_url_ready | boolean | 是否已配置正式 HTTPS Line OA URL |
| source_files | text[] | site-config、line-flows、表單與 Line 腳本來源 |
| cta_routes | jsonb | 需抽查的站內 Line CTA 與成功承接入口 |
| quick_reply_checks | jsonb | quick reply、標籤、文章、資料庫與免費財務健檢查詢入口 |
| handoff_steps | text[] | 正式 Line OA 驗收步驟 |
| evidence_fields | text[] | checked_url、line_oa_url、device、result、screenshot_url 等留痕欄位 |
| compliance_boundaries | text[] | Line 話術與個資限制 |
| records | jsonb | 正式 Line OA 導向驗收留痕 |
| record_summary | jsonb | 已留痕、已完成與受阻統計 |
| blockers | text[] | 正式 URL、quick reply、歡迎語與合規邊界待辦 |
| related_exports | text[] | Line 設定、分群、退訂、外部驗證與法務送審包 |
| generated_by | uuid | 產生者 |
| generated_at | timestamp | 生成時間 |

## line_optout_complaint_tasks

Line 退訂、停止接收與投訴處理隊列，對應後台 `data-admin-line-optout` 與 `tfse_line_optout_complaint_queue` 匯出包。正式 Line OA 上線後，若使用者要求停止訊息、封鎖、檢舉、投訴騷擾或要求刪除/更正資料，需保存去識別處理欄位、SLA、處理步驟與證據欄位，並同步個資請求或法務合規送審。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| lead_id | uuid nullable | 對應 lead_forms |
| request_type | text | line_optout / complaint / review_required |
| status | text | pending_review / completed / escalated |
| phone_last3 | text | 手機末三碼 |
| line_user_id_hash | text | Line user id 雜湊，不保存明文 |
| intake_keyword | text | 觸發關鍵字，例如 STOP、退訂、投訴 |
| evidence_fields | jsonb | 處理人、處理時間、Line tag 移除、證據備註 |
| handling_steps | jsonb | 停止訊息、移除標籤、個資請求、合規升級步驟 |
| related_exports | jsonb | Line 分群、Line OA 設定、個資請求與法務送審包 |
| assigned_to | uuid | 負責管理員 |
| requested_at | timestamp | 收到請求時間 |
| handled_at | timestamp nullable | 完成處理時間 |

## line_optout_api_verification_packages

Line 退訂/投訴正式 API 驗收包，對應後台 `data-admin-line-optout-api-export` 與 `tfse_line_optout_api_verification_package` 匯出包。正式後端接入後，用於保存 `line_optout_complaint_tasks`、`privacy_request_tasks`、`legal_compliance_review_packages`、`audit_logs` 的核對結果，以及 RBAC、CSRF、去識別欄位與 Line tag 移除留痕；不得保存完整 Line 對話、明文 Line user id、完整手機或其他高敏個資。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_line_optout_api_verification / verified |
| backend_target | jsonb | 目標 API、資料表、授權角色與驗證需求 |
| local_context | jsonb | 本機隊列摘要與審計事件統計 |
| required_controls | text[] | 正式 API 必須達成的處理與遮罩控制 |
| test_cases | jsonb | STOP、投訴、刪除資料、去識別查詢、未授權拒絕等驗收案例 |
| evidence_fields | text[] | status_code、task_id、privacy_request_id、audit_log_id 等留痕欄位 |
| blockers | text[] | 正式後端尚未完成的阻擋項 |
| related_exports | text[] | 相關 Line、個資與法務交接包 |
| generated_by | uuid | 產生者 |
| generated_at | timestamp | 生成時間 |

## retrospective_reports

每週或每次投流後的復盤摘要，對應後台「匯出復盤報告」。報告只保存聚合數字、來源、熱門路徑與下一步建議，不保存完整手機、Line ID 或表單補充說明。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| period_start | date | 復盤起始日 |
| period_end | date | 復盤結束日 |
| source_mode | text | localStorage / api / warehouse |
| funnel | jsonb | page_view、CTA、表單、Line 點擊與轉換率 |
| engagement | jsonb | 搜尋、篩選、文章點擊、落地頁瀏覽 |
| lead_summary | jsonb | 潛客數、來源、需求、狀態彙總 |
| top_paths | jsonb | 熱門頁面路徑 |
| quality | jsonb | 錯誤數與最近錯誤摘要 |
| next_actions | text[] | 下週優化建議 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## tracking_consent_audits

外部追蹤同意檢查包，對應後台 `data-admin-tracking-consent-export` 與 `tfse_tracking_consent_audit` 匯出包。用於確認 GA4、Meta Pixel 與 Server Event 只在使用者同意 analytics 追蹤後轉發；本機去識別事件仍可用於 MVP 復盤。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| consent_status | text | `unset`、`granted` 或 `declined` |
| consent_record | jsonb nullable | `tfse_tracking_consent` 本機同意紀錄 |
| external_destinations | jsonb | GA4、Meta Pixel、Server Event、Sentry 配置狀態 |
| event_counts | jsonb | 本機事件、同意更新事件與 page_view 統計 |
| policy | jsonb | 本機事件、外部追蹤與錯誤上報的處理原則 |
| blockers | text[] | 正式外部追蹤前需處理的阻擋項 |
| related_exports | text[] | 復盤、監控收件、外部留痕與法務送審包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## utm_attribution_reports

UTM 與投流歸因快照，對應後台「UTM 與投流歸因」與 `tfse_utm_attribution_report` 匯出包。此表只保存 source / medium / campaign / content / term 聚合數字、需求分布、頁面路徑與優化建議，不保存完整手機、Line ID 或補充說明。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| period_start | date nullable | 歸因期間起始日 |
| period_end | date nullable | 歸因期間結束日 |
| source_mode | text | localStorage / api / warehouse |
| summary | jsonb | campaign 數、事件數、線索數、付費社群與 direct/unknown 彙總 |
| campaigns | jsonb | 每組 UTM 的 CTA、表單、Line 點擊、線索與需求分布 |
| next_actions | text[] | 每週投流與落地頁優化建議 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## ad_campaign_checklists

廣告落地頁投流前檢查清單，對應後台 `data-admin-ad-campaigns` 與 `tfse_ad_campaign_checklist` 匯出包。正式版可由 `landing-pages.json` 匯入後產生投流 URL、UTM 標準與合規檢查紀錄。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| landing_slug | text | 對應落地頁 slug |
| landing_url | text | `lp/{slug}.html` |
| utm_example | text | 標準 UTM 範例 |
| checks | text[] | 標題、資訊邊界、FAQ、表單、Line CTA、免責聲明 |
| review_status | enum | pending / approved / needs_revision |
| reviewed_by | uuid nullable | 審核人 |
| reviewed_at | timestamp nullable | 審核時間 |

## conversion_optimization_backlogs

投流與落地頁轉換優化待辦，對應後台 `data-admin-conversion-backlog` 與 `tfse_conversion_optimization_backlog` 匯出包。此表將廣告落地頁清單、UTM 歸因、表單提交與 Line 承接聚合成下一輪測試項目，並保存合規護欄，避免優化時偏向貸款廣告式話術。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source_reports | text[] | 來源報表，例如投流檢查、UTM 歸因、瀏覽器驗收 |
| summary | jsonb | 落地頁數、中優先項、尚無歸因項等摘要 |
| experiment_rules | text[] | 每輪單一變因、投流前預檢、保留 UTM 等規則 |
| items | jsonb | slug、基準數字、假設、KPI、合規護欄與下一步動作 |
| related_exports | text[] | 投流檢查、歸因、法務送審與外部驗證留痕包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## launch_health_checks

上線健康檢查清單，對應後台 `data-admin-launch-health` 與 `tfse_launch_health_check` 匯出包。此表不保存個資，只保存站點設定、監控配置與上線前檢查狀態。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| ready_count | integer | 已準備項目數 |
| pending_count | integer | 待配置項目數 |
| items | jsonb | base_url、sitemap、robots、GA4、Meta Pixel、Sentry、Search Console、Line OA 等檢查 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## launch_cutover_audits

正式切換阻擋項隊列，對應後台 `data-admin-launch-cutover-audit` 與 `tfse_launch_cutover_audit` 匯出包。此包將正式輸入待填、可外部執行、待人工複核與本地前置缺失整合成單一切換清單，供 data manager、backend、ops、法務在最後切站前對賬。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source | text | 固定為 LAUNCH_CHECKLIST external cutover section |
| generated_from | text[] | 來源檔案，例如 site-config.json、admin script、API contract |
| counts | jsonb | 各狀態統計 |
| summary | jsonb | pending_external_input、ready_for_external_execution、pending_human_review、pending_local_prep 摘要 |
| items | jsonb | 切換項目、owner、阻擋項、證據摘要與相關匯出包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## launch_execution_plans

上線執行計畫，對應後台 `data-admin-launch-execution-plan` 與 `tfse_launch_execution_plan` 匯出包。此包將正式切換任務按波次與 owner 重新分組，方便按照 wave_0 到 wave_3 推進。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source | text | 對應 launch cutover audit |
| summary | jsonb | pending / ready / human review 摘要 |
| waves | jsonb | 分波次目標、owner 分組、狀態統計與任務清單 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## launch_countdown_plans

上線倒數計畫，對應後台 `data-admin-launch-countdown-plan` 與 `tfse_launch_countdown_plan` 匯出包。此包將切換任務按 D-3、D-2、D-1、Go-live、D+1 節點拆解，方便執行與複查。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source | text | 對應 launch cutover audit |
| summary | jsonb | pending / ready / human review 摘要 |
| slots | jsonb | 倒數節點、目標、owner 分組、任務與 manual checks |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## release_readiness_packages

發布凍結與回滾交接包，對應後台 `data-admin-release-readiness` 與 `tfse_release_readiness_package` 匯出包。正式部署前可保存健康檢查、正式配置、驗收留痕、備份/遷移摘要、部署命令、回滾步驟與發布阻擋項。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| release_scope | jsonb | 模板保留原則、靜態 MVP 範圍與交接文件 |
| readiness | jsonb | 健康檢查、正式配置、驗收、瀏覽器留痕與法務狀態摘要 |
| required_commands | text[] | 發布前必跑驗收命令 |
| deployment_checks | text[] | 靜態部署、SEO 重生、外部服務收件檢查 |
| rollback_plan | text[] | 靜態站與正式 API 回滾步驟 |
| artifact_summary | jsonb | 本機備份、正式遷移、法務包與瀏覽器留痕摘要 |
| blockers | text[] | 發布阻擋或待外部驗證項 |
| handoff_notes | text[] | 交接注意事項 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## operations_task_snapshots

運維任務快照，對應後台 `data-admin-operations-tasks` 與 `tfse_operations_task_queue` 匯出包。正式上線前後可保存上線配置、SEO、合規、資料來源、個資、驗收、備份、Line OA 與發布待辦的責任角色、狀態與下一步動作。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status_counts | jsonb | ready、pending_external、needs_review、manual_browser 等狀態統計 |
| tasks | jsonb | 任務、責任角色、優先級、證據、下一步與相關匯出包 |
| next_review_cycle | text | 建議檢視頻率 |
| runbook | text | 對應 Runbook |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## incident_response_packages

事故響應與回滾記錄包，對應後台 `data-admin-incident-response` 與 `tfse_incident_response_package` 匯出包。正式營運時可保存本機錯誤摘要、P0/P1 觸發條件、回應步驟、修復後驗證命令與相關交接包。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| severity_hint | text | no_active_local_error / investigate |
| signals | jsonb | 錯誤數、事件數、發布阻擋與高優先任務統計 |
| top_error_sources | jsonb | 錯誤來源聚合 |
| recent_errors | jsonb | 去識別近期錯誤摘要 |
| severity_triggers | jsonb | P0 / P1 觸發條件 |
| response_steps | text[] | 事故處置與回滾步驟 |
| verification_commands | text[] | 修復後驗證命令 |
| related_exports | text[] | 相關交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## seo_submission_packages

SEO 收錄提交交接包，對應後台 `data-admin-seo-submission` 與 `tfse_seo_submission_package` 匯出包。正式網域與 Search Console 驗證完成後，可保存 sitemap、robots、RSS、canonical、動態詳情 URL 規則與提交步驟。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| base_url | text | 正式 base URL |
| search_console | jsonb | Search Console 驗證碼狀態與 sitemap 提交 URL |
| assets | jsonb | sitemap、robots、RSS、security.txt、manifest URL |
| counts | jsonb | canonical、產品、文章、分類、落地頁數量 |
| canonical_pages | jsonb | 靜態 canonical 頁面清單 |
| dynamic_url_patterns | jsonb | 產品詳情、文章詳情、分類、落地頁 URL 規則 |
| submission_steps | text[] | 正式提交與驗收步驟 |
| blockers | text[] | 正式提交前待辦 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## search_console_verification_packages

Search Console 正式屬性驗證與 sitemap 提交核對包，對應後台 `data-admin-search-console-export` 與 `tfse_search_console_verification_package` 匯出包。正式網域切換前後，可保存 URL prefix property、HTML meta 驗證碼來源、需重生 SEO 資產、sitemap 提交目標、URL Inspection 抽查樣本與外部證據欄位；此包只記錄公開 URL 與去識別證據，不保存 Google 帳號憑證。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_search_console_verification / ready_for_search_console_submission |
| property | jsonb | property 類型、base_url、驗證方式與 token 狀態 |
| assets_to_regenerate | text[] | sitemap、robots、RSS、canonical、OG、JSON-LD |
| validation_commands | text[] | 重生與驗收命令 |
| submission_targets | jsonb | sitemap、robots、首頁與 Search Console 入口 |
| verification_steps | text[] | 屬性建立、meta 驗證、部署、提交 sitemap 與 URL Inspection 步驟 |
| url_inspection_samples | jsonb | 首批需抽查 URL 與預期結果 |
| evidence_fields | text[] | property_url、verification_result、sitemap_status、coverage_status 等留痕欄位 |
| records | jsonb | Search Console 驗證 / 提交留痕 |
| record_summary | jsonb | 已留痕、已驗證、已提交與受阻統計 |
| blockers | text[] | base_url、驗證碼、canonical 清單待辦 |
| related_exports | text[] | SEO 提交包、收錄跟進、網域切換與外部驗證留痕 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## seo_indexing_followup_queues

SEO 收錄跟進隊列，對應後台 `data-admin-seo-indexing` 與 `tfse_seo_indexing_followup_queue` 匯出包。正式 Search Console 驗證後，可用此表保存需追蹤的首頁、資料庫、分類、產品詳情、文章詳情與落地頁 URL、優先級、檢查動作與索引證據欄位。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| format | text | 固定為 tfse_seo_indexing_followup_queue |
| base_url | text | 正式 base URL |
| search_console_configured | boolean | Search Console 驗證碼是否已配置 |
| summary | jsonb | 任務數、高/中/低優先與阻擋項摘要 |
| evidence_fields | jsonb | inspected_at、coverage_status、indexed_url、last_crawl_time 等證據欄位 |
| items | jsonb | URL、類型、優先級、狀態與 required_actions |
| blockers | jsonb | 正式跟進前待辦 |
| related_exports | jsonb | SEO 提交包、網域切換包與外部驗證留痕包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## production_config_readiness

正式配置交接包，對應後台 `data-admin-config-readiness` 與 `tfse_production_config_readiness` 匯出包。正式版可保存每次修改 `site-config.json` 後的配置快照，供部署、追蹤與 Line OA 驗證交接。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| ready_count | integer | 已準備項目數 |
| pending_count | integer | 待填或待外部驗證項目數 |
| items | jsonb | SEO、GA4、Meta Pixel、Server Event、Sentry、後端 API、Turnstile、Line OA 等配置狀態 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## domain_cutover_packages

正式網域切換交接包，對應後台 `data-admin-domain-cutover` 與 `tfse_domain_cutover_package` 匯出包。正式網域、Search Console、canonical、sitemap、OG、RSS 與 manifest 重生前後，可保存切換步驟、必要命令、阻擋項與回滾依據。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| base_url | text | 正式 base URL |
| status | text | pending_domain_cutover / ready_for_domain_cutover |
| summary | jsonb | canonical 頁數、Search Console 配置與阻擋項統計 |
| assets | text[] | sitemap、robots、RSS、manifest、security.txt 等資產 |
| required_commands | text[] | SEO 生成與驗收命令 |
| cutover_steps | text[] | 網域切換、提交與抽查步驟 |
| blockers | text[] | 切換前待辦 |
| related_exports | text[] | 相關交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## host_fallback_deployment_checks

正式主機錯誤頁部署核對包，對應後台 `data-admin-host-fallback-export` 與 `tfse_host_fallback_deployment_check` 匯出包。用於保存 `404.html`、`500.html`、未知路徑與正式後端 server error fallback 的檢查步驟、平台限制、結果欄位與阻擋項；此包不代表正式主機已完成設定，仍需部署後以狀態碼、瀏覽器截圖或平台規則留痕。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | requires_formal_host_verification |
| source_files | text[] | 404、500、部署與 runbook 來源 |
| critical_routes | jsonb | 需抽查的錯誤頁與未知路徑 |
| platform_notes | text[] | Netlify、Cloudflare Pages、GitHub Pages、後端限制 |
| verification_steps | text[] | 部署後核對步驟 |
| evidence_fields | text[] | checked_url、status_code、screenshot_url、result 等留痕欄位 |
| blockers | text[] | 正式主機、500 fallback、未知路徑狀態碼待驗證項 |
| related_exports | text[] | 相關交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## backend_acceptance_matrices

正式 API 驗收矩陣，對應後台 `data-admin-backend-acceptance` 與 `tfse_backend_acceptance_matrix` 匯出包。正式後端接入時，用來保存 API 模式、必要端點、驗收證據、阻擋項與來源文件，避免只看單一 smoke test 就宣告後端完成。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| backend_mode | text | localStorage / api |
| api_base_url | text | 正式 API base URL |
| summary | jsonb | 端點數、API 配置、遷移資料、表單風險與阻擋項統計 |
| endpoints | jsonb | 必要 API 端點、分組與驗收證據 |
| records | jsonb | 正式 API 驗收留痕 |
| record_summary | jsonb | 已留痕、已通過與受阻統計 |
| required_validation | text[] | 正式後端完成標準 |
| source_documents | text[] | PRODUCTION_BACKEND_PLAN、API 合約、schema 與資料模型來源 |
| related_exports | text[] | 相關交接包 |
| blockers | text[] | 正式 API 接入前阻擋項 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## backend_cutover_roadmaps

正式後端接入路線圖，對應後台 `data-admin-backend-roadmap` 與 `tfse_backend_cutover_roadmap` 匯出包。此表把 `PRODUCTION_BACKEND_PLAN.md`、正式遷移包、正式 API 驗收矩陣與 Turnstile / CRM / 合規 / 個資 / 備份驗收包串成單一優先順序，方便在不改模板前提下交接後端接入路徑。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source | text | 路線圖來源，預設為 PRODUCTION_BACKEND_PLAN 與 Admin 驗收匯出 |
| summary | jsonb | API 是否已配置、遷移資料量、阻擋項與 ready step 統計 |
| priority_sequence | jsonb | 依序列出的 leads API、Admin Auth、CRM、事件、內容 API、備份還原步驟 |
| migration_order | text[] | 正式資料導入順序 |
| critical_endpoints | jsonb | 後端必要端點與驗收證據摘要 |
| security_controls | text[] | session、CSRF、RBAC、Turnstile、加密欄位等安全控制 |
| rehearsal_commands | text[] | 本機 / staging rehearsal 命令 |
| completion_gates | text[] | 正式後端切換完成標準 |
| related_exports | text[] | 相關遷移、驗收、配置與備份匯出包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## server_event_replay_batches

Server Event 重放批次，對應後台 `data-admin-event-replay` 與 `tfse_server_event_replay_queue` 匯出包。正式 GA4、Meta Pixel 或 Server Event endpoint 接入前後，可用此批次核對事件名稱、路徑、去識別 payload、回應碼與 dead-letter 處理。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source_mode | text | localStorage / api |
| destinations | jsonb | GA4、Meta Pixel、Server Event endpoint 與 sample_rate 配置狀態 |
| counts | jsonb | 事件總量、隊列數、事件類型、缺少必要事件統計 |
| event_name_counts | jsonb | 各事件名稱聚合數 |
| missing_required_event_names | text[] | 尚未觀測到的必要事件 |
| queue | jsonb | 去識別事件重放隊列，僅保留事件名、路徑、safe payload 與時間 |
| replay_steps | text[] | staging 回放、三端核對與失敗處理步驟 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## monitoring_receipt_checklists

GA4、Meta Pixel、Server Event 與 Sentry 正式收件驗收清單，對應後台 `data-admin-monitoring-receipt-export` 與 `tfse_monitoring_receipt_checklist` 匯出包。正式追蹤配置填入後，用來核對必要事件、錯誤收件、去識別 payload 與外部留痕。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| destinations | jsonb | GA4、Meta Pixel、Server Event、Sentry 與 sample_rate 配置狀態 |
| summary | jsonb | 本機事件、錯誤、必要事件與阻擋項統計 |
| required_events | text[] | 需要在外部平台看到的事件 |
| missing_required_events | text[] | 本機尚未觀測到的必要事件 |
| receipt_checks | text[] | 外部收件核對步驟 |
| blockers | text[] | 正式監控驗收前阻擋項 |
| related_exports | text[] | 事件重放、外部配置留痕與健康檢查包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## sentry_error_verification_packages

Sentry 前台與後端錯誤收件驗收包，對應後台 `data-admin-sentry-verification-export` 與 `tfse_sentry_error_verification_package` 匯出包。正式 DSN 與 API 上線後，用於核對受控測試錯誤、beforeSend 脫敏、environment/release 標籤、source map 管理、P0/P1 事故留痕與外部證據；不得保存 stack trace 全文、cookie、session、完整手機、Line ID、備註或表單原文。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_sentry_error_verification / ready_for_sentry_error_verification |
| destinations | jsonb | Browser DSN、server-side Sentry、API URL 與本機錯誤數配置狀態 |
| required_controls | text[] | SDK 載入、beforeSend 脫敏、server-side Sentry、source map 與事故串接要求 |
| test_cases | jsonb | 前台測試錯誤、API 測試錯誤、敏感 payload 遮罩、環境標籤與事故串接案例 |
| recent_local_errors | jsonb | 去識別近期本機錯誤摘要 |
| evidence_fields | text[] | Sentry issue、environment、release、遮罩確認、截圖與 reviewer 留痕欄位 |
| blockers | text[] | 正式 Sentry 驗收前阻擋項 |
| related_exports | text[] | 監控收件、事故響應、外部配置留痕與主機錯誤頁核對包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## analytics_debug_verification_packages

GA4 DebugView 與 Meta Events Manager 驗證包，對應後台 `data-admin-analytics-debug-export` 與 `tfse_analytics_debug_verification_package` 匯出包。正式 GA4 / Meta Pixel 填入後，用於保存本機事件到外部平台事件的映射、追蹤同意狀態、Debug 操作步驟、缺失事件與外部留痕欄位；此包不得保存手機、Line ID、姓名、Email、備註或任何高敏個資。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_analytics_debug_verification / ready_for_analytics_debug_verification |
| destinations | jsonb | GA4、Meta Pixel、Server Event、analytics consent 與 sample_rate 配置狀態 |
| event_mappings | jsonb | 本機事件、GA4 事件、Meta 事件、觀測數與預期 payload |
| debug_steps | text[] | GA4 DebugView、Meta Events Manager 與 Server Event 對照步驟 |
| evidence_fields | text[] | platform、event_name、observed_at、debug_url、screenshot_url 等留痕欄位 |
| blockers | text[] | GA4、Meta、consent、必要事件待辦 |
| related_exports | text[] | 追蹤同意、事件重放、監控收件與外部驗證包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## site_config_update_packages

`site-config.json` 正式配置更新草稿預檢包，對應後台 `data-admin-config-draft-export` 與 `tfse_site_config_update_package` 匯出。此表保存待人工合併的配置片段、格式檢查結果與合併後驗收命令，不直接代表正式環境已套用配置。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| target_file | text | 目標配置檔，預設 `site-config.json` |
| status | text | `needs_revision` 或 `ready_for_manual_merge` |
| draft_keys | text[] | 草稿包含的頂層配置欄位 |
| validation | jsonb | JSON/HTTPS/GA4/Meta/Line/後端/Turnstile 預檢錯誤與警告 |
| patch | jsonb | 待人工合併的配置片段 |
| current_config_summary | jsonb | 匯出當下正式配置狀態摘要 |
| related_exports | text[] | 配置交接、網域切換、監控收件與外部留痕包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## site_config_approval_packages

`site-config.json` 正式配置變更簽核包，對應後台 `data-admin-config-approval-export` 與 `tfse_site_config_approval_package` 匯出。此表保存草稿預檢、待配置服務、審批角色、合併後命令與外部留痕要求；不得保存 GA4/Meta/Sentry 以外的 secret、資料庫 URL、Admin session secret 或 Turnstile secret key 真值。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| target_file | text | 目標配置檔，預設 `site-config.json` |
| status | text | needs_revision_before_approval / awaiting_approval |
| approval_policy | jsonb | 必要審批角色、合併負責人、最終簽核人與合規 gate |
| summary | jsonb | 配置 ready/pending、草稿錯誤/警告、外部驗證與網域切換摘要 |
| pending_services | jsonb | 尚未配置或待外部驗證的服務 |
| draft_package | jsonb | 草稿狀態、頂層 key、預檢結果與當前配置摘要 |
| approval_checklist | text[] | 合併前審核項目 |
| post_merge_commands | text[] | 合併後必跑命令 |
| required_external_evidence | text[] | GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA、正式後端與法務留痕 |
| related_exports | text[] | 相關後台匯出包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## production_env_templates

正式部署環境變數模板，對應後台 `data-admin-env-template-export` 與 `tfse_production_env_template` 匯出包。此表只保存變數名稱、來源路徑、部署端與是否屬於密鑰，不保存 Turnstile secret、資料庫 URL 或 Admin session secret 的真實值。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| configured_count | integer | 目前已由 `site-config.json` 配置的項目數 |
| pending_count | integer | 待正式填入或待密鑰管理的項目數 |
| secret_count | integer | 需放入 Secret Manager / CI secrets / API server env 的項目數 |
| target_files | text[] | `site-config.json`、`.env.production`、GitHub Actions secrets、API server environment |
| validation_commands | text[] | 合併配置後必跑的驗收命令 |
| items | jsonb | 變數名稱、來源路徑、部署端、示例提示、是否密鑰 |
| related_exports | text[] | 配置交接、site-config 更新、後端驗收與監控收件包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## formal_config_input_packets

正式配置待填總覽，對應後台 `data-admin-config-input-packet` 與 `tfse_formal_config_input_packet` 匯出包。此表用於把 `base_url`、GA4、Meta Pixel、Server Event、Search Console、正式後端、Line OA、Sentry 與條件性 Turnstile 配置按 owner 收斂成單一待填包；只提供 secret 類別提示，不保存 secret 真值。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| ready_count | integer | 已具備的正式配置輸入數 |
| pending_count | integer | 尚待填入的正式配置輸入數 |
| conditional_pending_count | integer | 條件性輸入待補數 |
| required_inputs | jsonb | 必填配置項、owner、site-config path、建議值與現況 |
| conditional_inputs | jsonb | Turnstile 等依配置啟用狀態才需補的輸入 |
| secret_only_inputs | jsonb | secret manager / CI / API server 才會處理的項目提示 |
| records | jsonb | 收件/驗證/受阻留痕 |
| record_summary | jsonb | 已留痕、已驗證與受阻統計 |
| owner_handoff | jsonb | 待交接角色與未完成項目 |
| site_config_patch_template | jsonb | 建議合併的 `site-config.json` 片段 |
| follow_up_commands | text[] | 填值後需執行的命令 |
| related_exports | text[] | 相關交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## project_plan_coverage_reports

計畫文檔覆蓋度對賬報告，對應後台 `data-admin-plan-coverage` 與 `tfse_project_plan_coverage_report` 匯出包。此表依原始計畫文檔 1-23 章，區分本地已閉環與仍待正式配置 / 法務簽核的章節，方便對外同步目前到底完成到哪裡。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source | text | 對賬來源，預設為計畫文檔 1-23 章 |
| ready_count | integer | 已達本地 / 外部閉環的章節數 |
| local_ready_external_pending_count | integer | 本地已完成但仍待外部配置或簽核的章節數 |
| chapters | jsonb | 每章狀態、摘要與 blockers |
| related_exports | text[] | 驗收、外部留痕、配置待填與總交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## plan_requirement_traces

計畫逐條需求追蹤，對應後台 `data-admin-plan-requirements` 與 `tfse_plan_requirement_trace` 匯出包。此表直接對照原始計畫文檔第 17 / 21 章，逐條標示 ready、external_pending、manual_browser、not_applicable 與 missing，方便確認我們是在原模板上補內容與功能，而不是偏離需求重做設計。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| plan_path | text | 原始計畫文檔檔名 |
| source | text | 對賬來源，預設為計畫文檔第 17 / 21 章 |
| counts | jsonb | ready / external_pending / manual_browser / not_applicable / missing 統計 |
| items | jsonb | 每條需求的章節、需求描述、狀態、證據與 source_key |
| related_exports | text[] | 驗收、階段、章節覆蓋與閉環總表 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## project_phase_audits

模板套用階段對賬，對應後台 `data-admin-phase-audit` 與 `tfse_project_phase_audit` 匯出包。此表按 Phase 0-8 對照模板套用、品牌替換、資料庫、表單、Admin、SEO、落地頁與上線運維的本地完成度，方便在不重設模板的前提下說清楚目前走到哪個階段。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source | text | 對賬來源，預設為計畫文檔 Phase 0-8 |
| counts | jsonb | ready / local_ready_external_pending 統計 |
| external_pending | text[] | 仍待正式環境切換的驗收標籤 |
| phases | jsonb | 每個 phase 的狀態、摘要、證據與 blockers |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## local_audit_matrices

本機驗收命令對照，對應後台 `data-admin-local-audit-matrix` 與 `tfse_local_audit_matrix` 匯出包。此表把 `LAUNCH_CHECKLIST.md` / `OPERATIONS_RUNBOOK.md` 的本機驗收命令收斂成單一矩陣，標示哪些命令可直接作為本地閉環審計執行，哪些跑完後仍會指向正式配置、正式後端或人工瀏覽器留痕。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source | text | 對照來源，預設為 LAUNCH_CHECKLIST / OPERATIONS_RUNBOOK local verification commands |
| summary | jsonb | 命令總數與 ready / external follow-up / manual follow-up 統計 |
| status_definitions | jsonb | 各狀態的定義說明 |
| items | jsonb | 命令、分組、標題、目前訊號與關聯交接包 |
| related_exports | text[] | 與發布、階段、章節、總交接相關的匯出包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## external_execution_packets

外部執行交接隊列，對應後台 `data-admin-external-execution` 與 `tfse_external_execution_packet` 匯出包。此表按 owner 整理 `ready_for_external_execution` 與 `pending_human_review` 任務，列出依賴項、下一步與證據欄位，方便正式切換日直接照表執行。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| actionable_items | integer | 可交付外部執行的任務總數 |
| ready_for_external_execution_count | integer | 可開始執行的任務數 |
| pending_human_review_count | integer | 仍需人工複核的任務數 |
| items | jsonb | owner、依賴項、證據欄位、狀態與 next_action |
| records | jsonb | 執行中 / 已完成 / 受阻留痕 |
| record_summary | jsonb | 已留痕、已完成與受阻統計 |
| follow_up_commands | text[] | 執行後需重跑的對賬命令 |
| related_exports | text[] | 相關交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## launch_handoff_manifests

最終上線總交接清單，對應後台 `data-admin-launch-handoff` 與 `tfse_launch_handoff_manifest` 匯出包。此表會把正式配置待填、外部執行、章節覆蓋、驗收與發布狀態彙總成唯一版本來源，供後端、營運、資料與法務在發布前對同一份狀態協作。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| template_policy | text | 明確聲明保留 Exomac 模板結構，不重做前端設計 |
| summary | jsonb | 配置待填、切換待執行、人工簽核、章節覆蓋、驗收與發布摘要 |
| recommended_sequence | text[] | 建議切換順序 |
| pending_config_inputs | jsonb | 尚未填妥的正式配置項 |
| external_execution_items | jsonb | 需交外部執行或簽核的任務 |
| owner_handoff | jsonb | 依角色彙整的交接清單 |
| checkpoint_records | jsonb | 發布會議 / gate 決議留痕 |
| required_commands | text[] | 發布前需重跑的主要命令 |
| related_exports | text[] | 相關交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## acceptance_checklists

上線驗收清單，對應後台 `data-admin-acceptance-checklist` 與 `tfse_acceptance_checklist` 匯出包。正式版可保存每次上線前對專案計畫第 17 章的驗收快照。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| ready_count | integer | 已準備項目數 |
| pending_count | integer | 待外部配置或正式驗證項目數 |
| status_counts | jsonb | ready、manual_browser、external_pending、not_applicable 等狀態統計 |
| items | jsonb | 業務、UI、合規、技術與 SEO 驗收項目 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## external_verification_evidence

外部配置驗證留痕，對應後台 `data-admin-external-verification` 與 `tfse_external_verification_evidence` 匯出包。正式 GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA、後端 API 或法務複核完成後，可保存責任人、結果與去識別證據備註。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| summary | jsonb | 必要項、已配置、已留痕統計 |
| items | jsonb | 每個外部服務的配置與驗證狀態 |
| records | jsonb | 外部驗證留痕紀錄 |
| source_exports | text[] | 來源交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## browser_acceptance_reports

瀏覽器人工驗收紀錄，對應 `tools/browser_acceptance_report.py` 產出的 `tfse_browser_acceptance_report`。正式版可保存每次桌面與手機驗收的結果、截圖連結或備註。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| base_url | text | 驗收站點網址 |
| passed_count | integer | 已人工留痕通過項目數 |
| pending_count | integer | 待瀏覽器驗收項目數 |
| status_counts | jsonb | passed、manual_browser、needs_fix 等狀態統計 |
| items | jsonb | manual_browser 項目、頁面、viewport、步驟、結果與證據備註 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## legal_compliance_review_packages

法務/合規送審包，對應後台 `data-admin-legal-review` 與 `tfse_legal_compliance_review_package` 匯出包。正式投流、SEO 大量收錄或 Line OA 對外承接前，應保存此包與外部複核結果。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status_counts | jsonb | ready、needs_review、external_pending、manual_external 統計 |
| items | jsonb | 站點邊界、表單個資、Line、廣告、來源、文案規則、隱私請求、正式配置與驗收留痕 |
| required_external_review | jsonb | 需由法務/合規複核的項目 |
| evidence_files | jsonb | 送審依據檔案 |
| related_exports | jsonb | 相關後台匯出包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## legal_external_review_evidence

法務/合規外部複核留痕，對應後台 `data-admin-legal-external-review-export` 與 `tfse_legal_external_review_evidence`。正式投流、SEO 大量收錄或 Line OA 對外承接前，用於保存外部複核的簽核狀態、去識別證據摘要、開放項目與送審包版本；不得保存完整個資或法律意見全文。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_external_review / external_review_in_progress / external_review_passed |
| summary | jsonb | 送審項數、未結項、外部留痕筆數、最近通過時間與負責人 |
| required_external_review | jsonb | 需由法務/合規複核的項目 |
| evidence_package | jsonb | 送審來源格式、依據檔案與相關匯出包 |
| signoff_requirements | jsonb | 正式簽核前需確認的條件 |
| open_items | jsonb | 尚非 ready 的送審項目 |
| records | jsonb | 外部驗證中的 legal_review 留痕 |
| related_exports | jsonb | 相關後台匯出包 |
| generated_by | uuid nullable | 產生人 |
| generated_at | timestamp | 產生時間 |

## compliance_api_persistence_packages

正式合規審核 API 落庫驗收包，對應後台 `data-admin-compliance-api-export` 與 `tfse_compliance_api_persistence_package` 匯出包。正式後端接入 `POST /api/admin/compliance/review` 時，用於核對 `compliance_reviews`、`audit_logs`、RBAC、CSRF、scan_payload 脫敏與未授權拒絕證據；不得保存法律意見全文、session token、CSRF token、完整手機、Line ID、證件、帳戶、卡號或密碼。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_compliance_api_persistence / ready_for_compliance_api_persistence |
| backend_target | jsonb | POST /api/admin/compliance/review、GET /api/admin/audit-logs、目標表與角色要求 |
| local_context | jsonb | 本機合規審核、scan_payload 與審計事件摘要 |
| required_controls | text[] | server session、CSRF、RBAC、audit_logs、scan_payload 摘要保存與未授權拒絕要求 |
| test_cases | jsonb | page/article/product/ad 審核、scan payload、未授權拒絕與 audit log 查詢案例 |
| evidence_fields | text[] | endpoint、status_code、review_id、audit_log_id、reviewer_role、rbac_checked 等留痕欄位 |
| blockers | text[] | 正式 API、落庫截圖、角色測試與 scan_payload 脫敏待辦 |
| related_exports | text[] | 法務送審、外部複核、表單風險、內容 API 與後端驗收包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## form_risk_control_reports

表單風險與防刷檢查包，對應後台 `data-admin-form-risk` 與 `tfse_form_risk_control_report` 匯出包。正式版應只保存聚合風險、device_id 與手機末三碼樣本，不保存完整手機、Line ID、補充說明或 Turnstile token。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| controls | jsonb | Turnstile、蜜罐、冷卻、限流與去重控制要求 |
| counts | jsonb | 線索、表單事件、重複組合、同裝置多筆、缺同意與缺 device_id 統計 |
| duplicate_groups | jsonb | 以手機末三碼與需求聚合的疑似重複組合 |
| repeated_devices | jsonb | 同一 device_id 多筆線索的聚合摘要 |
| risk_notes | jsonb | 上線前風險提示與正式後端處理建議 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## turnstile_backend_verification_packages

正式 `POST /api/leads` 的 Turnstile 後端驗收包，對應後台 `data-admin-turnstile-export` 與 `tfse_turnstile_backend_verification_package` 匯出包。正式後端上線時，用於核對 Cloudflare siteverify、secret 管理、蜜罐、IP + device_id 限流、phone_hash + needs 去重、負向測試與去識別證據欄位；不得保存 Turnstile token、secret key、完整 IP、完整手機、Line ID 或備註。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_turnstile_backend_verification / ready_for_turnstile_backend_verification |
| frontend_config | jsonb | site key、token 欄位、蜜罐欄位與 device_id 狀態 |
| backend_target | jsonb | /api/leads、siteverify endpoint 與 secret env 名稱 |
| required_controls | text[] | server-side siteverify、secret、蜜罐、限流、去重與審計控制 |
| negative_test_cases | jsonb | 空 token、無效 token、蜜罐、限流、重複與高敏 payload 測試 |
| validation_steps | text[] | 正式後端驗收步驟 |
| evidence_fields | text[] | checked_case、status_code、error_code、audit_log_id 等留痕欄位 |
| blockers | text[] | 正式 API、site key、secret/siteverify 待辦 |
| related_exports | text[] | 表單風險、API 驗收、Auth 切換與外部驗證包 |
| form_risk_summary | jsonb | 表單風險總覽摘要 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## source_review_tasks

資料來源復核隊列，對應後台「來源復核隊列」。正式版應由排程依 `financial_products.updated_at`、`source_url`、復核狀態與 90 天復核週期自動產生。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| product_id | uuid | 對應 financial_products |
| title | text | 資料條目標題 |
| status | enum | pending / in_review / resolved / rejected |
| reasons | text[] | 來源待核驗、需補官方來源、超過 90 天未更新等原因 |
| source_url | text | 待復核來源 |
| last_product_updated_at | date | 產品資訊更新日 |
| assigned_role | text | data_manager / compliance_reviewer |
| reviewed_by | uuid nullable | 復核人 |
| reviewed_at | timestamp nullable | 復核時間 |
| created_at | timestamp | 建立時間 |

## source_verification_evidence

資料來源復核證據留痕，對應後台 `data-admin-source-evidence` 與 `tfse_source_verification_evidence` 匯出包。正式版用於保存每次來源核對的官方 URL、結果、角色與證據摘要，補足 `source_review_tasks` 的待辦狀態。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| product_id | uuid nullable | 對應 financial_products |
| product_seed_id | text nullable | 靜態 MVP 的產品 ID |
| result | enum | approved / needs_revision / rejected |
| source_url | text | 官方 https 來源 URL |
| evidence_note | text nullable | 復核證據摘要，不保存個資 |
| reviewer_role | text | MVP 或正式角色 |
| reviewed_by | uuid nullable | 正式後端管理員 ID |
| reviewed_at | timestamp | 復核時間 |
| created_at | timestamp | 建立時間 |

## institution_import_verification_packages

機構資料正式導入驗收包，對應後台 `data-admin-institution-import-export` 與 `tfse_institution_import_verification_package` 匯出包。正式導入 `assets/data/institutions.json` 時，用於核對 `institutions`、`institution_source_versions`、來源留痕、抽查樣本與 `audit_logs`；此包只保存公開機構資料和去識別驗收證據，不保存使用者個資或登入憑證。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_institution_import_verification / ready_for_institution_import_verification |
| source_file | text | 種子檔案，預設 assets/data/institutions.json |
| target_tables | text[] | institutions、institution_source_versions、source_verification_evidence、audit_logs |
| counts | jsonb | 種子筆數、已核驗數、待復核數與來源留痕數 |
| status_counts | jsonb | verification_status 聚合 |
| import_rows | jsonb | 準備導入的公開機構欄位 |
| stale_or_unverified_items | jsonb | 待復核或超過 180 天未核驗的項目 |
| validation_steps | text[] | 唯一性、https 來源、版本紀錄、API 抽查與 audit_logs 步驟 |
| evidence_fields | text[] | batch_id、row_count、version_record_count、sample_ids、audit_log_id 等留痕欄位 |
| blockers | text[] | 正式導入前阻擋項 |
| related_exports | text[] | 來源留痕、正式遷移、導入驗收與來源復核隊列 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## public_feedback_tickets

公眾資料回報與內容錯誤工單，對應聯絡頁 `contact.html` 與後台 `tfse_public_feedback_intake_package` 匯出包。正式版可將 Email 或 API 收件轉成工單，用於來源更新、內容錯誤、合規疑慮與個資請求分流；不得保存證件、帳戶、卡號、密碼、完整手機或完整 Email 原文。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| feedback_type | text | source_update / content_error / compliance_issue / privacy_request |
| status | text | pending_triage / in_review / resolved / rejected |
| page_url | text nullable | 回報頁面 URL |
| summary | text | 去識別回報摘要 |
| official_source_url | text nullable | 官方來源 URL |
| source_updated_at | date nullable | 官方來源更新日 |
| reporter_contact_hash | text nullable | 回報者聯絡方式雜湊 |
| phone_last3 | text nullable | 手機末三碼 |
| consent_contact | boolean | 是否同意後續聯絡 |
| assigned_role | text | data_manager / content_editor / compliance_reviewer |
| related_task_type | text nullable | source_review / content_version / privacy_request / legal_review |
| related_task_id | uuid nullable | 關聯正式任務 |
| evidence_note | text nullable | 處理證據摘要，不保存敏感內容 |
| received_at | timestamp | 收件時間 |
| resolved_at | timestamp nullable | 結案時間 |

## public_feedback_api_verification_packages

公眾資料回報正式 API 驗收包，對應後台 `data-admin-public-feedback-api-export` 與 `tfse_public_feedback_api_verification_package` 匯出包。正式接入 `POST /api/public-feedback` 後，用於核對 `public_feedback_tickets` 入庫、來源/內容/個資/合規分流、禁止欄位拒收、限流與 `audit_logs`；不得保存 Email 原文、完整手機、Line ID、證件、帳戶、卡號、密碼、附件原文或法律意見全文。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_public_feedback_api_verification / ready_for_public_feedback_api_verification |
| backend_target | jsonb | POST /api/public-feedback、Admin queue、audit endpoint、目標表與允許/禁止欄位 |
| local_context | jsonb | 目前來源復核、來源留痕、個資請求、法務送審與工單匯出摘要 |
| required_controls | text[] | 限流、防刷、禁止欄位拒收、去識別摘要保存、分流與 RBAC 要求 |
| test_cases | jsonb | source_update、content_error、privacy_request、compliance_issue 與高敏 payload 拒收案例 |
| evidence_fields | text[] | endpoint、status_code、ticket_id、related_task_id、forbidden_fields_rejected、audit_log_id 等留痕欄位 |
| blockers | text[] | 正式收件 API、入庫、分流、拒收與抽查證據待辦 |
| related_exports | text[] | 資料回報工單、來源、內容版本、個資、法務與後端驗收包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## content_version_snapshots

內容版本快照，對應後台「內容版本紀錄」與 `tfse_content_version_snapshot` 匯出包。正式版可在每次發布、資料庫來源更新或 FAQ 調整前保存一份快照，供正式後端還原、比對與審計。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| counts | jsonb | 產品、文章、FAQ 覆蓋與狀態覆蓋數量 |
| product_overrides | jsonb | 本機產品內容覆蓋 |
| product_status | jsonb | 本機產品狀態覆蓋 |
| article_overrides | jsonb | 本機文章內容覆蓋 |
| article_status | jsonb | 本機文章發布狀態覆蓋 |
| faq_overrides | jsonb | 本機 FAQ 內容覆蓋 |
| audit_trail | jsonb | 內容相關審計紀錄 |
| restore_order | jsonb | 正式還原順序 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## content_api_cutover_packages

前台內容 API 切換驗收包，對應後台 `data-admin-content-api-export` 與 `tfse_content_api_cutover_package` 匯出包。正式 `GET /api/products`、`GET /api/articles`、`GET /api/institutions` 與 `GET /api/search` 接入時，用於核對 seed 數量、公開端點、發布狀態、來源連結、未發布內容隔離與 fallback 邊界；不得保存後台 session、API token、潛客手機、Line ID 或表單備註。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_content_api_cutover / ready_for_content_api_cutover |
| backend_target | jsonb | 正式 API 模式、公開端點與靜態 fallback 檔案 |
| seed_counts | jsonb | products、articles、published articles、FAQ、institutions 與 landing pages 數量 |
| content_state | jsonb | 內容覆蓋、狀態覆蓋與來源復核待辦摘要 |
| required_api_checks | jsonb | products、articles、institutions、search 的逐項核對要求 |
| validation_steps | text[] | staging API 比對、published-only、來源連結與 fallback 檢查 |
| evidence_fields | text[] | endpoint、status_code、row_count、sample_slug、source_url_checked 等留痕欄位 |
| blockers | text[] | 正式內容 API 切換前阻擋項 |
| related_exports | text[] | 內容版本、機構導入、來源留痕、後端驗收與外部驗證包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## compliance_reviews

合規審核紀錄，對應後台 `tfse_compliance_reviews`。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| type | enum | page / article / product / ad |
| target | text | 審核對象 |
| result | enum | approved / needs_revision / rejected |
| note | text | 審核備註 |
| scan_payload | jsonb nullable | 文案即時預檢結果，包含禁用詞、免責聲明、高風險 CTA 與敏感個資提示 |
| reviewer_id | uuid | 審核人 |
| reviewed_at | timestamp | 審核時間 |

## audit_logs

所有後台敏感操作都需落審計。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| actor_id | uuid | 操作者 |
| role | text | 操作時角色 |
| action | text | 操作 |
| target | text | 對象 |
| ip_hash | text | IP 雜湊 |
| user_agent_hash | text | UA 雜湊 |
| created_at | timestamp | 建立時間 |

## backup_jobs

正式版備份紀錄。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| scope | text | database / media / exports |
| status | enum | success / failed / running |
| storage_url | text | 備份位置 |
| checksum | text | 校驗碼 |
| started_at | timestamp | 開始時間 |
| finished_at | timestamp | 完成時間 |

## backup_restore_drill_results

正式資料庫還原演練結果。每週 restore drill 後保存隔離資料庫目標、抽查表、RPO/RTO、發現問題與完成時間；不得保存資料庫 URL、密鑰、備份檔內容或完整個資。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| backup_job_id | uuid nullable | 對應 backup_jobs |
| restored_to | text | 隔離還原環境代號，不保存連線字串 |
| row_count_checks | jsonb | 表筆數抽查結果 |
| rpo_result | text | RPO 驗證結果 |
| rto_result | text | RTO 驗證結果 |
| sample_tables | text[] | 抽查表，例如 lead_forms、articles、audit_logs |
| findings | text | 發現問題摘要 |
| reviewer_role | enum nullable | data_manager / super_admin |
| completed_at | timestamp | 演練完成時間 |

## backup_restore_drill_plans

正式資料庫備份與還原演練交接包，對應後台 `data-admin-restore-drill-export` 與 `tfse_backup_restore_drill_plan` 匯出包。本表保存 RPO/RTO、每日備份、每週還原、證據欄位、抽查步驟與外部阻擋項；不保存資料庫 URL、密鑰、完整手機、Line ID 或表單備註。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| format | text | 固定為 tfse_backup_restore_drill_plan |
| status | text | pending_external_backup_setup / ready_for_restore_drill |
| backend_mode | text | localStorage / api / fallback |
| api_base_url_configured | boolean | 正式 API 是否已配置 |
| rpo_rto | jsonb | RPO、RTO、保留週期與加密要求 |
| schedule | jsonb | 每日備份、每週還原與月度保留檢查排程 |
| restore_steps | jsonb | 隔離資料庫還原與抽查步驟 |
| evidence_fields | jsonb | backup_job_id、storage_url、checksum、RPO/RTO 等證據欄位 |
| local_mvp_reference | jsonb | 本機備份與正式遷移包數量摘要 |
| blockers | jsonb | 尚需正式環境完成的阻擋項 |
| related_exports | jsonb | 相關後台交接包 |
| generated_by | uuid | 匯出者 |
| generated_at | timestamp | 產生時間 |

## backup_receipt_verification_packages

正式資料庫備份收據與還原結果驗收包，對應後台 `data-admin-backup-receipt-export` 與 `tfse_backup_receipt_verification_package` 匯出包。正式環境完成每日 backup job、checksum、加密儲存、每週隔離還原後，用於保存需要核對的收據欄位、還原欄位、RPO/RTO、audit_logs 與外部證據；不得保存資料庫 URL、密鑰、備份檔內容、完整手機、Line ID 或表單備註。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| status | text | pending_backup_receipt_verification / ready_for_backup_receipt_verification |
| backend_target | jsonb | 正式 API 與 expected tables 狀態 |
| required_receipts | jsonb | 每日備份、checksum、加密、每週還原與 audit linkage 要求 |
| receipt_fields | text[] | backup_job_id、status、storage_url、checksum、retention_until 等收據欄位 |
| restore_drill_fields | text[] | drill_id、row_count_checks、RPO/RTO、sample_tables、findings 等還原欄位 |
| validation_steps | text[] | 備份成功、checksum、隔離還原、抽查與 audit_logs 步驟 |
| latest_plan_status | text | 對應 tfse_backup_restore_drill_plan 狀態 |
| evidence_fields | text[] | checked_case、backup_job_id、restore_drill_id、audit_log_id 等留痕欄位 |
| blockers | text[] | 正式備份收據驗收前阻擋項 |
| related_exports | text[] | 備份演練、API 驗收、外部驗證與資料保留包 |
| generated_by | uuid | 匯出者 |
| generated_at | timestamp | 產生時間 |

## migration_packages

正式後端遷移交接包，對應後台 `data-admin-migration-export` 與 `tfse_formal_backend_migration_package` 匯出包。此表不取代正式 migration 工具，而是保留從靜態 MVP/localStorage 切到正式 API 前的 seed、內容覆蓋、來源復核、個資請求與 Line 分群交接快照。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| format | text | 固定為 tfse_formal_backend_migration_package |
| source_mode | text | localStorage / api / fallback |
| target_contract | text | 對應 API 合約檔案 |
| target_schema | text | 對應資料庫 schema 檔案 |
| import_order | jsonb | institutions、categories、financial_products、articles、lead_forms 等匯入順序 |
| summary | jsonb | seed、覆蓋、潛客、審計、來源復核數量摘要 |
| seed_data | jsonb | products、articles、faq、institutions、landing_pages 初始資料 |
| local_state | jsonb | 本機潛客、內容覆蓋、合規審核、事件與錯誤摘要 |
| review_queues | jsonb | 來源復核、個資請求、Line 分群隊列 |
| sensitive_data_policy | jsonb | 正式匯入前的個資與測試資料處理規則 |
| exported_by | uuid | 匯出者 |
| exported_at | timestamp | 匯出時間 |

## import_validation_packages

正式資料導入驗收包，對應後台 `data-admin-import-validation-export` 與 `tfse_import_validation_package` 匯出包。正式後端匯入 seed 與本機 MVP 狀態前後，用來核對測試資料排除、來源復核、個資請求、Line 分群、加密欄位與導入後抽查。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| source_package | text | 對應的正式遷移包格式 |
| summary | jsonb | seed、潛客、sample_lead、來源復核、個資請求與 Line 分群統計 |
| import_checks | text[] | 匯入前後驗收檢查 |
| blockers | text[] | 匯入前阻擋項 |
| related_exports | text[] | 來源復核、個資請求、Line 分群等相關交接包 |
| generated_by | uuid | 匯出/生成者 |
| generated_at | timestamp | 生成時間 |

## 權限摘要

| 角色 | 權限 |
|---|---|
| Super Admin | 全部 |
| Content Editor | 文章、FAQ |
| Data Manager | 金融資料庫、來源狀態、資料匯出 |
| Compliance Reviewer | 合規審核、審計檢視 |
| Consultant | 潛客查看、狀態、備註、刪除請求標記 |
| Viewer | 只讀報表 |

## 上線遷移順序

1. 建立資料表與 enum。
2. 匯入 `assets/data/products.json`、`articles.json`、`categories.json`、`landing-pages.json`。
3. 將前台 fetch 從靜態 JSON 切到 `/api/products`、`/api/articles`。
4. 將免費財務健檢查詢從 `localStorage` 切到 `POST /api/leads`。
5. 將後台 localStorage 狀態切到 Admin API。
6. 啟用每日備份、審計查詢、Sentry、GA4 與 Search Console。
