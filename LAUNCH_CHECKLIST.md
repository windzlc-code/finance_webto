# TFSE 上線前檢查清單

本清單對應 `TFSE金融独立站现成前端模板套用0-1完整项目计划.md` 的 Phase 8、17、21 章節。當前版本為靜態 MVP，正式上線前仍需接入伺服器登入、資料庫、GA4/Search Console、備份與錯誤上報。

## 已完成的 MVP 驗收

- [x] 首頁、資料庫、分類、文章、健檢、合規頁可訪問。
- [x] 首頁已建立需求查詢面板，可依需求、身份與地區推薦分類、文章並帶入免費健檢 UTM。
- [x] `contact.html` 已恢復為聯絡與資料回報頁；免費健檢入口統一導向 `free-check.html`。
- [x] 免費健檢表單不收證件、帳戶、卡號或密碼。
- [x] 首頁與備用首頁的模板聯絡表單已統一套入免費健檢欄位、隱私同意、Line 同意、UTM、蜜罐與 Turnstile 欄位。
- [x] 表單送出會保存 UTM、需求標籤、推薦分類與推薦文章。
- [x] 表單成功後會顯示可配置 Line 承接 CTA，並記錄展示與點擊事件。
- [x] Line 官方帳號承接說明已資料化，包含歡迎語、需求按鈕、分群標籤與自動回覆原則。
- [x] Line 每個 quick reply 已資料化邊界說明、入門文章、資料庫入口與帶 `utm_source=line` 的免費健檢入口，符合第 14 章自動回覆原則。
- [x] 後台可匯出 Line OA 設定包，包含歡迎語、圖文選單入口、quick reply、自動回覆原則、標籤、分群同步隊列與合規邊界，供正式 Line OA 後台照表配置。
- [x] 後台已建立 Line OA 導向驗收包，可匯出 `tfse_line_oa_handoff_check`，核對正式加友 URL、免費健檢成功承接、站內 CTA、quick reply、退訂/投訴入口與截圖留痕。
- [x] 表單會依需求、身份與 UTM 自動產生 Line 分群標籤；後台可查看並匯出已同意 Line 的分群同步隊列。
- [x] 後台已建立 Line 退訂與投訴處理隊列，可匯出 `tfse_line_optout_complaint_queue`，彙整停止接收、投訴、封鎖、個資請求升級、SLA、處理步驟與去識別證據欄位。
- [x] 免費健檢頁 FAQ 已資料化渲染，並可讀取後台本機覆蓋內容。
- [x] 表單具備本機 60 秒提交冷卻、24 小時重複提交識別、匿名 `device_id` 與蜜罐欄位。
- [x] 表單已預埋 Cloudflare Turnstile 配置、token 欄位與前端載入流程；未配置 site key 時不影響 MVP。
- [x] 後台已建立表單風險與防刷檢查，可匯出 `tfse_form_risk_control_report`，彙整 Turnstile、蜜罐、限流、重複提交、device_id 與隱私同意風險，供正式 `POST /api/leads` 接入前核對。
- [x] 後台已建立 Turnstile 後端驗收包，可匯出 `tfse_turnstile_backend_verification_package`，核對 Cloudflare siteverify、secret 管理、蜜罐、限流、去重、負向測試與 audit_logs 證據。
- [x] 後台需要本機 MVP 登入後才顯示 CRM/資料管理區。
- [x] 後台 CRM 已提供稱呼/手機/Line/需求搜尋，並可依潛客狀態、需求標籤與來源篩選；瀏覽器煙測覆蓋狀態、需求與來源篩選。
- [x] 後台 CRM 已提供待跟進隊列，可在潛客詳情設定負責角色、跟進優先級與下次跟進日，並匯出 `tfse_crm_follow_up_queue` 供正式 CRM 遷移。
- [x] 後台 CRM 已建立結構化聯繫紀錄，可保存渠道、結果、下次動作、負責角色與備註摘要，並匯出 `tfse_crm_contact_log` 供正式 CRM 匯入與稽核。
- [x] 後台已建立 CRM 正式 API 落庫驗收包，可匯出 `tfse_crm_api_persistence_package`，核對 `GET/PATCH /api/admin/leads`、`lead_forms`、`lead_contact_logs`、`lead_dedupe_queues`、`audit_logs`、RBAC、CSRF 與 Viewer 遮罩。
- [x] `tools/crm_capability_audit.py --markdown` 可直接對照計畫文檔第 11 節與 Phase 5，核對登入、潛客列表、搜尋、篩選、詳情、狀態更新、聯繫紀錄、UTM、匯出權限、產品/文章管理、合規審核與審計日誌是否已本地閉環。
- [x] 後台 CRM 已建立重複線索處理隊列，可依手機末三碼與需求找出疑似重複，匯出 `tfse_lead_dedupe_queue` 供正式 CRM 以完整手機雜湊與 24 小時窗口合併或關聯。
- [x] 後台不在頁面文案直接展示 MVP 驗證碼；本機測試線索需由管理員主動生成，並以 `sample_lead` 標記避免誤匯入正式資料。
- [x] 後台可更新潛客狀態。
- [x] 後台可更新產品復核狀態。
- [x] 後台可查看並匯出來源復核隊列，優先處理待核驗、需更新、來源占位與超過復核週期的資料條目。
- [x] 後台已建立來源復核證據留痕，可保存官方 https 來源、復核結果、角色與證據摘要，並匯出 `tfse_source_verification_evidence` 供正式後端稽核。
- [x] 後台已建立機構資料導入驗收包，可匯出 `tfse_institution_import_verification_package`，核對 `institutions.json`、`institutions`、`institution_source_versions`、來源留痕與 audit_logs。
- [x] 後台文章已補齊草稿、待審、已發布流程，並將審核動作寫入審計紀錄；前台只展示已發布文章。
- [x] 後台可用本機 MVP 覆蓋產品摘要、來源、文章摘要、SEO 描述、合規備註與 FAQ 問答。
- [x] 後台已建立內容版本紀錄，可匯出 `tfse_content_version_snapshot`，保存產品、文章、FAQ 覆蓋、發布狀態、內容審計與正式還原順序。
- [x] 後台已建立內容 API 切換驗收包，可匯出 `tfse_content_api_cutover_package`，核對 `/api/products`、`/api/articles`、`/api/institutions`、`/api/search`、seed 數量、published-only 與 fallback 邊界。
- [x] 後台可查看合規摘要、審計紀錄與本機事件復盤。
- [x] 後台已提供文案即時預檢，可在投流或發布前掃描禁用詞、免責聲明、高風險 CTA 與敏感個資提示；命令列合規掃描同步讀取 `compliance-rules.json`，並覆蓋 HTML 與可渲染 JSON 內容，避免前後台規則不一致。
- [x] 後台已提供法務合規送審包，可彙整站點邊界、表單個資、Line、廣告、來源、文案規則、隱私請求、正式配置與驗收留痕，供正式投流或 Line OA 對外承接前交給法務/合規複核。
- [x] 後台已建立法務/合規外部複核留痕包，可匯出 `tfse_legal_external_review_evidence`，保存簽核狀態、去識別證據摘要、開放項目與送審包版本；實際複核仍需外部法務/合規完成。
- [x] 瀏覽器煙測已驗證 Admin 文案即時預檢可抓出禁用詞、敏感個資、缺免責聲明，並可把掃描結果保存到合規審核紀錄。
- [x] 後台可匯出本機數據復盤報告，彙整事件漏斗、潛客來源、熱門頁面、錯誤摘要與下一步建議。
- [x] 後台已建立 UTM 與投流歸因報表，可按 source、medium、campaign、content、term 聚合 CTA、表單、Line 點擊與線索轉換，並匯出 `tfse_utm_attribution_report`。
- [x] 後台已建立轉換優化待辦，可由廣告落地頁、UTM 歸因、表單與 Line 承接聚合出下一輪測試假設、KPI、合規護欄與行動項，並匯出 `tfse_conversion_optimization_backlog`。
- [x] 後台已建立 Server Event 重放隊列，可匯出 `tfse_server_event_replay_queue`，以去識別事件核對 GA4、Meta Pixel 與正式伺服器事件端點。
- [x] 後台已建立監控收件驗收包，可匯出 `tfse_monitoring_receipt_checklist`，核對 GA4、Meta Pixel、Server Event 與 Sentry 的必要事件、錯誤收件與外部留痕。
- [x] 後台已建立 GA4/Meta Debug 驗證包，可匯出 `tfse_analytics_debug_verification_package`，核對本機事件到 GA4 DebugView、Meta Events Manager、consent gating、UTM 與外部截圖留痕。
- [x] 後台已建立 Sentry 錯誤收件驗收包，可匯出 `tfse_sentry_error_verification_package`，核對前台/後端測試錯誤、beforeSend 脫敏、environment/release 標籤、source map 與事故留痕。
- [x] 後台可依角色限制導出、產品、文章、合規與潛客更新動作。
- [x] 後台已建立 Admin 權限與安全矩陣，可匯出 `tfse_admin_security_matrix`，彙整角色權限、server session、CSRF、MFA、審計與 Viewer 遮罩阻擋項。
- [x] 後台已建立 Admin Auth 切換核對包，可匯出 `tfse_admin_auth_cutover_check`，核對 login/session/logout、httpOnly cookie、CSRF、MFA、RBAC、Viewer 遮罩、audit_logs 與 MVP 驗證碼退場步驟。
- [x] 後台已建立安全標頭部署核對包，可匯出 `tfse_security_headers_deployment_check`，列出 `_headers`、CSP、快取策略、security.txt、404/500 fallback、正式主機抽查 URL 與留痕欄位。
- [x] 後台可記錄合規審核，並集中管理、匯出與完成個資刪除/更正請求隊列。
- [x] 後台已建立合規 API 落庫驗收包，可匯出 `tfse_compliance_api_persistence_package`，核對 `POST /api/admin/compliance/review`、`compliance_reviews`、`audit_logs`、RBAC、CSRF 與 `scan_payload` 脫敏。
- [x] 瀏覽器煙測已驗證 Admin 可標記個資刪除請求、顯示個資/Line 分群隊列、匯出兩種隊列並完成處理演練審計。
- [x] 後台已建立個資正式履約驗收包，可匯出 `tfse_privacy_fulfillment_verification_package`，核對 `PATCH /api/admin/privacy-requests/:lead_id`、`privacy_request_tasks`、`lead_forms` 遮罩/刪除、`audit_logs`、RBAC、CSRF 與下游匯出脫敏。
- [x] 後台已建立 Line 退訂/投訴正式 API 驗收包，可匯出 `tfse_line_optout_api_verification_package`，核對 `GET /api/admin/line-optout-complaints`、`GET /api/admin/line-oa-handoff-check`、`audit_logs`、`line_optout_complaint_tasks`、個資/法務升級、RBAC、CSRF 與去識別欄位回傳。
- [x] 聯絡頁與隱私權政策提供資料查詢、更正與刪除請求入口，並提醒勿附證件、帳戶、卡號或密碼。
- [x] 後台已建立公眾資料回報工單交接包，可匯出 `tfse_public_feedback_intake_package`，定義資料來源更新、內容錯誤、合規疑慮與個資請求的正式收件欄位、禁止欄位、SLA 與分流規則。
- [x] 後台已建立公眾資料回報正式 API 驗收包，可匯出 `tfse_public_feedback_api_verification_package`，核對 `POST /api/public-feedback`、`public_feedback_tickets`、來源/內容/個資/合規分流、禁止欄位拒收、限流與 audit_logs。
- [x] 後台可匯出/匯入本機 MVP 備份包，供正式後端導入前核對與還原演練。
- [x] 瀏覽器煙測已用真實下載的本機備份包執行匯入復原演練，確認潛客與 `backup_import` 審計可恢復。
- [x] 文章中心已依計劃建立首批 40 篇 SEO 內容種子，含 slug、分類、摘要、關鍵字、合規備註與公開發布狀態。
- [x] 文章詳情頁已移除未接 CRM 的模板留言表單，改為免費健檢與資料庫 CTA，避免額外收集 Email 或留言個資。
- [x] 產品資料庫已建立 30 筆示例資訊，每筆含來源標題、來源連結、更新日期、復核狀態與查詢確認事項。
- [x] `tools/source_freshness_audit.py` 可檢查產品/機構來源時效、90 天復核週期、來源占位與核驗狀態一致性，避免已核驗資料仍使用占位來源。
- [x] 金融資訊詳情頁可顯示官方來源、查詢前確認事項、相關公開資訊、推薦文章、分類 FAQ 與免費健檢 CTA。
- [x] `institutions.json` 已建立公開來源/機構目錄，來源政策頁、全站搜尋與後台合規摘要可讀取。
- [x] 三大資料庫子頁已建立 `database/banks.html`、`database/finance-companies.html`、`database/credit-unions.html` 靜態別名，並自動套用對應機構類型篩選。
- [x] 8 個計劃內分類入口已建立為靜態別名頁，並復用同一套分類模板與資料渲染。
- [x] 第一批 8 個廣告落地頁已建立 `lp/*.html` 靜態別名，並復用同一套落地頁模板、表單、UTM 與 Line 承接。
- [x] `lp/*.html` 廣告落地頁別名已納入 title、description、canonical、Open Graph、免責聲明、圖片 alt 與本地資源驗收。
- [x] 後台已建立廣告落地頁投流檢查清單，可匯出每頁 URL、UTM 範例、FAQ、表單、Line CTA 與免責聲明檢查項。
- [x] `sitemap.xml` 包含主要靜態頁、產品 slug、文章 slug。
- [x] `feed.xml` 已建立 RSS 內容訂閱檔，包含已發布文章並在 HTML head 提供 RSS alternate link。
- [x] `robots.txt` 指向 sitemap。
- [x] `site-config.json > canonical_pages` 已全量驗證：配置頁面需存在，且需出現在 sitemap。
- [x] 全站 title、description、canonical、Open Graph 基礎標籤已補齊。
- [x] 全站已加入 JSON-LD 結構化資料，包含 Organization、WebSite、WebPage，文章列表/資料庫/免費健檢頁會補充 Blog、ItemList 或 Service。
- [x] `site.webmanifest` 已建立，HTML head 已加入 manifest、theme-color 與 apple-touch-icon。
- [x] `site-config.json` 與 `tools/generate_seo_assets.py` 可重生 canonical、OG、robots、sitemap、RSS feed、JSON-LD 與 manifest head 標記。
- [x] `tools/seo_assets_audit.py` 可在臨時副本重跑 SEO 生成器，確認 HTML canonical/OG/JSON-LD、RSS、robots、sitemap、security.txt 與動態詳情頁 base URL 沒有漂移。
- [x] 後台已建立 SEO 收錄提交包，可匯出 `tfse_seo_submission_package`，彙整 canonical、sitemap、robots、RSS、Search Console 驗證、動態詳情 URL 規則與正式提交步驟。
- [x] 後台已建立 Search Console 驗證包，可匯出 `tfse_search_console_verification_package`，彙整 URL prefix property、HTML meta 驗證、需重生 SEO 資產、sitemap 提交、URL Inspection 抽查與外部留痕欄位。
- [x] 後台已建立 SEO 收錄跟進隊列，可匯出 `tfse_seo_indexing_followup_queue`，列出首頁、資料庫、分類、產品詳情、文章詳情與落地頁 URL 的優先級、Search Console 檢查動作與索引證據欄位。
- [x] `tools/validate_site_config.py` 可檢查正式網域、GA4、Meta Pixel、Sentry、Server Event、Line OA、後端 API、Turnstile 與 canonical 設定格式。
- [x] `tools/production_config_audit.py` 可檢查 `site-config.json`、後台正式配置交接包、API 合約、資料模型、部署文件與 CI 是否共同覆蓋 GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA、`backend.api_base_url` 與 Turnstile。
- [x] `site-config.json` 已預留 GA4、Server Event、Meta Pixel、Sentry 配置位。
- [x] 前台事件與錯誤摘要會先寫入本機復盤，並過濾敏感欄位。
- [x] 前台已建立追蹤偏好橫幅，GA4、Meta Pixel 與 Server Event 需使用者同意 analytics 後才轉發；後台可匯出 `tfse_tracking_consent_audit` 核對同意留痕與外部追蹤阻擋項。
- [x] Meta Pixel 已接入前台事件轉發，填入正式 `meta_pixel_id` 後可驗證瀏覽、表單、搜尋、免費健檢與 Line CTA 事件。
- [x] 後台已建立上線健康檢查，可匯出 base URL、sitemap、robots、404/500、GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA 與備份/合規掃描狀態。
- [x] 後台已建立發布凍結與回滾交接包，可匯出 `tfse_release_readiness_package`，彙整健康檢查、正式配置、驗收留痕、備份/遷移摘要、部署命令、回滾步驟與發布阻擋項。
- [x] 後台已建立運維任務隊列，可匯出 `tfse_operations_task_queue`，按責任角色彙整上線配置、SEO、合規、資料來源、個資、驗收、備份、Line OA 與發布待辦。
- [x] 後台已建立事故響應與回滾記錄包，可匯出 `tfse_incident_response_package`，彙整錯誤摘要、P0/P1 觸發條件、回應步驟、驗證命令與相關交接包。
- [x] 後台已建立正式配置交接包，可匯出 `site-config.json` 內 SEO、追蹤、後端、安全與 Line OA 的待填/待驗證項。
- [x] 後台已建立 `site-config.json` 更新草稿預檢，可匯出 `tfse_site_config_update_package`，核對正式 GA4、Meta Pixel、Sentry、Server Event、Search Console、Line OA、後端 API 與 Turnstile 片段，供人工合併後重生 SEO 資產與重新驗收。
- [x] 後台已建立 `site-config.json` 配置變更簽核包，可匯出 `tfse_site_config_approval_package`，彙整草稿預檢、待配置服務、審批角色、合併後命令與外部留痕要求。
- [x] 後台已建立正式環境變數模板，可匯出 `tfse_production_env_template`，列出 `site-config.json`、API server、CI secrets 與備份任務所需變數，且不保存後端密鑰真實值。
- [x] 後台已建立正式網域切換交接包，可匯出 `tfse_domain_cutover_package`，彙整 base_url、canonical、SEO 資產、Search Console、重生命令、切換步驟與回滾待辦。
- [x] 後台已建立正式後端接入路線圖，可匯出 `tfse_backend_cutover_roadmap`，把 `PRODUCTION_BACKEND_PLAN.md`、正式遷移順序、必要端點、安全控制、rehearsal 命令與完成門檻收斂成單一交接包。
- [x] 後台已建立正式 API 驗收矩陣，可匯出 `tfse_backend_acceptance_matrix`，逐項核對 `POST /api/leads`、Admin CRM、事件、合規審核、審計、個資請求、備份與正式後端阻擋項。
- [x] 後台已建立第 17 章上線驗收清單，可匯出業務、UI、合規、技術與 SEO 驗收快照，並標出 `manual_browser` 瀏覽器待驗項。
- [x] 後台已建立外部配置驗證留痕，可保存並匯出 `tfse_external_verification_evidence`，記錄 GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA、後端 API 與法務複核證據。
- [x] 後台已建立瀏覽器人工驗收留痕面板，可保存桌面/手機 viewport、結果、證據備註並匯出 `tfse_browser_acceptance_report`，回填上線驗收清單中的人工待驗項。
- [x] 本機瀏覽器驗收證據已固化到 `assets/data/browser-acceptance-evidence.json`，覆蓋桌面/手機排版、免費健檢提交、聯絡頁低敏資料回報提交與 Admin 登入流程，供 `acceptance_audit.py`、Admin 驗收面板與瀏覽器驗收報告共享。
- [x] 瀏覽器煙測已驗證 Admin 可下載復盤報告、上線健康檢查、正式配置交接包、驗收清單、瀏覽器驗收留痕與廣告投流檢查 JSON。
- [x] `tools/acceptance_audit.py` 可將專案計畫第 17/21 章拆成 ready、manual_browser、external_pending 與 not_applicable 狀態，供本機交付前核對。
- [x] `tools/launch_cutover_audit.py` 可將「正式上線前仍需人工/外部完成」段落整理成 `pending_external_input`、`ready_for_external_execution`、`pending_human_review` 與 `pending_local_prep`，避免只盯著少數配置項而漏掉正式切換待辦。
- [x] `tools/backend_cutover_roadmap.py --markdown` 可把 `PRODUCTION_BACKEND_PLAN.md`、正式配置待填、必要端點與切換阻擋項整理成單一後端接入順序，方便 backend / data / ops 對齊 leads API、Admin Auth、CRM、事件、內容 API 與備份還原的先後關係。
- [x] `tools/launch_execution_plan.py --markdown` 可依 `launch_cutover_audit` 生成按波次與 owner 排序的正式上線作戰計畫，方便交接與排程。
- [x] `tools/launch_countdown_plan.py --markdown` 可依正式切換待辦生成 D-3 / D-2 / D-1 / Go-live / D+1 倒排日程，方便發布會議與實際執行。
- [x] `tools/formal_config_input_packet.py --markdown` 可把 `pending_external_input` 收斂成正式配置輸入包，列出待填 path / env、owner、格式提示、解鎖的切換項與填值後命令，避免正式配置散落在多份交接包之間。
- [x] `tools/plan_closure_report.py --markdown` 可把第 17 / 21 章驗收、Phase 0-8 與 1-23 章覆蓋度合併成單一閉環狀態報告，直接區分「本地已閉環」與「正式環境待配置 / 簽核」。
- [x] `tools/project_plan_coverage_audit.py --markdown` 可按計畫文檔 1-23 章逐章對賬，區分本地已閉環與仍待正式配置 / 法務簽核的章節，避免只看功能頁面卻忽略整體計畫覆蓋度。
- [x] `tools/external_execution_packet.py --markdown` 可把 `ready_for_external_execution` 與 `pending_human_review` 收斂成 owner 任務包，列出執行步驟、依賴項、證據欄位與完成後命令，方便正式切換與送審落地。
- [x] `tools/launch_handoff_manifest.py --markdown` 可把配置待填、外部執行、章節覆蓋、驗收與倒排計畫匯總成單一總交接包，方便和後端、營運、資料、法務同步同一份狀態。
- [x] `tools/release_day_runsheet.py --markdown` 可把 owner timeline 壓成 D-3 / D-2 / D-1 / Go-live / D+1 的單一執行 run sheet，方便正式切站當天按時段照表落地。
- [x] 後台已建立正式切換阻擋項隊列，可匯出 `tfse_launch_cutover_audit`，直接在 Admin 對照待填正式配置、可外部執行項、人工簽核項與本地前置缺失。
- [x] 後台已建立上線執行計畫與上線倒數計畫，可分別匯出 `tfse_launch_execution_plan`、`tfse_launch_countdown_plan`，按波次 / owner 與 D-3 ~ D+1 節點追蹤正式切站進度。
- [x] 後台已建立正式配置待填總覽，可匯出 `tfse_formal_config_input_packet`，直接按 owner 收斂 `base_url`、GA4、Meta Pixel、Server Event、Search Console、Line OA、正式後端與 Sentry 的待填項。
- [x] 後台已可保存正式配置收件留痕，按待填項記錄 `received / validated / blocked`、owner、時間與去識別備註，避免正式配置只停留在匯出 JSON。
- [x] 後台已建立計畫文檔覆蓋度對賬，可匯出 `tfse_project_plan_coverage_report`，按 1-23 章說明目前哪些章節已本地閉環、哪些仍待外部配置或法務簽核。
- [x] 後台已建立計畫逐條需求追蹤，可匯出 `tfse_plan_requirement_trace`，直接對照原始計畫第 17 / 21 章每條需求的 ready、external_pending、manual_browser、not_applicable 與 missing 狀態。
- [x] 後台已建立模板套用階段對賬，可匯出 `tfse_project_phase_audit`，按 Phase 0-8 說明模板映射、品牌替換、資料庫、表單、Admin、SEO、落地頁與上線運維目前走到哪一步。
- [x] 後台已建立本機驗收命令對照，可匯出 `tfse_local_audit_matrix`，把 `LAUNCH_CHECKLIST.md` / `OPERATIONS_RUNBOOK.md` 的本機驗收命令收斂成單一矩陣，區分可直接執行、執行後仍指向外部配置，以及仍需人工瀏覽器留痕的命令。
- [x] 後台已建立外部執行交接隊列，可匯出 `tfse_external_execution_packet`，將正式切換任務按 owner、依賴項、證據欄位與 next_action 收斂到同一包。
- [x] 後台已可保存外部執行留痕，按任務記錄 `in_progress / completed / blocked`、owner、時間與去識別執行摘要，方便正式切換日追蹤。
- [x] 後台已建立最終上線總交接清單，可匯出 `tfse_launch_handoff_manifest`，把配置待填、外部執行、章節覆蓋、驗收與發布狀態聚合成單一對外同步版本。
- [x] 後台已可保存總交接會議留痕，按 `config_sync / external_execution / legal_signoff / release_gate` 記錄可推進、暫停或完成決議。
- [x] 後台已建立 owner 切站任務包，可匯出 `tfse_owner_cutover_bundle`，把正式配置、外部執行與 closeout 任務按 owner 聚合成可直接分派的執行包，並附上 owner 專屬 `site-config` patch template 與 `.env` 片段。
- [x] 後台已建立上線日 run sheet，可匯出 `tfse_release_day_runsheet`，把 D-3 / D-2 / D-1 / Go-live / D+1 的 owner 任務壓成正式切站日作戰表，並附帶 owner 對應的 patch template 與 `.env` 片段。
- [x] `tools/browser_acceptance_report.py` 可由 `manual_browser` 項產生瀏覽器驗收 JSON 或 Markdown 留痕模板。
- [x] `tools/accessibility_audit.py` 可檢查 HTML 語系、圖片 alt、免費健檢表單欄位、蜜罐隱藏與表單提示 `aria-live`，避免套版內容破壞基礎可用性。
- [x] `tools/navigation_consistency_audit.py` 可檢查 Header / 下拉選單文案一致性，以及子目錄頁面依 `<base href="../">` 解析後的站內連結與靜態資源是否存在。
- [x] `tools/data_quality_audit.py` 可檢查分類、產品、文章、落地頁、來源、Line flows 與合規規則的 slug、數量、來源、日期、狀態與必要欄位。
- [x] `tools/checklist_artifact_coverage_audit.py --markdown` 可核對 `LAUNCH_CHECKLIST.md` 中提到的 `tfse_*` 交接包，是否都已真正接入 Admin 導出與瀏覽器煙測覆蓋，避免文檔與工具鏈漂移。
- [x] `tools/launch_health_check.py --markdown` 可在命令列直接輸出 `tfse_launch_health_check`，對齊正式網址、追蹤、Search Console、Line OA、備份與合規掃描總表。
- [x] `tools/domain_cutover_package.py --markdown` 可在命令列直接輸出 `tfse_domain_cutover_package`，彙整 base_url、canonical、SEO 資產、Search Console、切換步驟與阻擋項。
- [x] `tools/host_fallback_deployment_check.py --markdown` 可在命令列直接輸出 `tfse_host_fallback_deployment_check`，覆蓋 404 / 500、未知路徑與 server error fallback 的正式主機驗證清單。
- [x] `tools/live_deployment_check.py --markdown` 可在命令列直接檢查公网主站、`robots.txt`、`sitemap.xml`、`feed.xml`、`/.well-known/security.txt`、`/api/health` 與 HTTPS 443 狀態，並把 HTTPS timeout 標記為外部雲安全組 / 防火牆阻擋項。
- [x] `tools/external_verification_evidence.py --markdown` 可在命令列直接輸出 `tfse_external_verification_evidence`，對賬 GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA、backend API 與法務複核的 configured / verified 狀態。
- [x] `tools/release_readiness_package.py --markdown` 可在命令列直接輸出 `tfse_release_readiness_package`，彙整上線健康檢查、正式配置、驗收、網域切換、外部執行與 rollback 阻擋項。
- [x] `tools/operations_task_queue.py --markdown` 可在命令列直接輸出 `tfse_operations_task_queue`，按 owner / status / priority 收斂上線配置、外部驗證、後端切換、來源復核、驗收與發布任務。
- [x] `tools/incident_response_package.py --markdown` 可在命令列直接輸出 `tfse_incident_response_package`，匯總 P0 / P1 觸發條件、回應步驟、驗證命令與高優先任務。
- [x] `tools/seo_submission_package.py --markdown` 可在命令列直接輸出 `tfse_seo_submission_package`，彙整 canonical、產品/文章/分類/落地頁數量、SEO 資產與 Search Console 提交流程。
- [x] `tools/search_console_verification_package.py --markdown` 可在命令列直接輸出 `tfse_search_console_verification_package`，覆蓋 property 驗證、sitemap 提交、URL Inspection 樣本與證據欄位。
- [x] `tools/tracking_consent_audit.py --markdown` 可在命令列直接輸出 `tfse_tracking_consent_audit`，對賬 analytics 同意、外部追蹤目的地與同意邊界。
- [x] `tools/monitoring_receipt_checklist.py --markdown` 可在命令列直接輸出 `tfse_monitoring_receipt_checklist`，收斂 GA4、Meta、Server Event、Sentry 的收件驗收清單。
- [x] `tools/sentry_error_verification_package.py --markdown` 可在命令列直接輸出 `tfse_sentry_error_verification_package`，彙整前台/API Sentry 驗收、遮罩規則與證據欄位。
- [x] `tools/admin_export_cli_coverage_audit.py --markdown` 可對照 Admin 現有 `tfse_*` 導出與 `tools/*.py` 的 standalone CLI 覆蓋度，持續盤點還有哪些導出尚未 CLI 化。
- [x] `tools/security_headers_deployment_check.py --markdown --live` 可在命令列直接輸出 `tfse_security_headers_deployment_check`，覆蓋正式主機 header、CSP allowlist、security.txt、驗證命令與当前公网 header/cache 證據。
- [x] `tools/admin_security_matrix.py --markdown` 可在命令列直接輸出 `tfse_admin_security_matrix`，覆蓋角色權限矩陣、session / CSRF / MFA / audit / viewer masking 檢查。
- [x] `tools/admin_auth_cutover_check.py --markdown` 可在命令列直接輸出 `tfse_admin_auth_cutover_check`，彙整正式 Auth API、cookie/CSRF/RBAC/MFA 與切換步驟。
- [x] `tools/backend_acceptance_matrix.py --markdown` 可在命令列直接輸出 `tfse_backend_acceptance_matrix`，收斂正式 API 驗收矩陣與 blockers。
- [x] `tools/line_oa_setup_package.py --markdown` 可在命令列直接輸出 `tfse_line_oa_setup_package`，彙整歡迎語、rich menu、quick replies、標籤與 setup 步驟。
- [x] `tools/line_oa_handoff_check.py --markdown` 可在命令列直接輸出 `tfse_line_oa_handoff_check`，覆蓋站內 CTA、quick reply、正式 URL 與手機驗收流程。
- [x] `tools/formal_backend_migration_package.py --markdown` 可在命令列直接輸出 `tfse_formal_backend_migration_package`，彙整正式匯入順序、seed 統計、敏感資料邊界與來源待辦。
- [x] `tools/backup_restore_drill_plan.py --markdown` 可在命令列直接輸出 `tfse_backup_restore_drill_plan`，彙整每日備份、每週還原演練、RPO/RTO 與證據欄位。
- [x] `tools/backup_receipt_verification_package.py --markdown` 可在命令列直接輸出 `tfse_backup_receipt_verification_package`，核對 backup_jobs、restore drill 收據欄位與驗收步驟。
- [x] `tools/persistent_api_backup.py` 可對 SQLite 持久化 API 執行一致性備份、gzip、SHA256 manifest 與隔離 restore drill；`43.130.233.113` 已配置 `tfse-api-backup.timer` 每日備份並在備份後自動演練恢復。
- [x] `tools/content_api_cutover_package.py --markdown` 可在命令列直接輸出 `tfse_content_api_cutover_package`，彙整公開內容 API 切換檢查、靜態 fallback 邊界與 blockers。
- [x] `tools/turnstile_backend_verification_package.py --markdown` 可在命令列直接輸出 `tfse_turnstile_backend_verification_package`，覆蓋 server-side siteverify、限流、去重與負向測試案例。
- [x] `tools/analytics_debug_verification_package.py --markdown` 可在命令列直接輸出 `tfse_analytics_debug_verification_package`，彙整 GA4 / Meta / server event 映射、debug 流程與證據欄位。
- [x] `tools/acceptance_checklist.py --markdown`、`tools/project_plan_coverage_report.py --markdown`、`tools/plan_requirement_trace.py --markdown`、`tools/local_audit_matrix.py --markdown` 已補齊 CLI，對齊第 17 章驗收、1-23 章計畫覆蓋、第 17 / 21 章逐條需求追蹤與本機審計矩陣。
- [x] `tools/source_review_queue.py --markdown`、`tools/source_verification_evidence.py --markdown`、`tools/content_version_snapshot.py --markdown`、`tools/institution_import_verification_package.py --markdown` 已補齊 CLI，覆蓋來源復核、來源留痕、內容版本與機構正式導入驗收。
- [x] `tools/privacy_request_queue.py --markdown`、`tools/data_retention_purge_plan.py --markdown`、`tools/privacy_fulfillment_verification_package.py --markdown`、`tools/public_feedback_intake_package.py --markdown`、`tools/public_feedback_api_verification_package.py --markdown` 已補齊 CLI，覆蓋個資請求、保留/清除計畫與公開資料回報收件。
- [x] `tools/line_segment_queue.py --markdown`、`tools/line_optout_complaint_queue.py --markdown`、`tools/line_optout_api_verification_package.py --markdown` 已補齊 CLI，覆蓋 Line 分群、退訂/投訴隊列與正式 API 驗收。
- [x] `tools/crm_follow_up_queue.py --markdown`、`tools/crm_contact_log.py --markdown`、`tools/crm_api_persistence_package.py --markdown`、`tools/lead_dedupe_queue.py --markdown`、`tools/form_risk_control_report.py --markdown`、`tools/import_validation_package.py --markdown` 已補齊 CLI，覆蓋 CRM 跟進、聯繫紀錄、正式持久化、去重、防刷與導入驗收。
- [x] `tools/local_backup.py --markdown`、`tools/ad_campaign_checklist.py --markdown`、`tools/conversion_optimization_backlog.py --markdown`、`tools/utm_attribution_report.py --markdown`、`tools/retrospective_report.py --markdown`、`tools/server_event_replay_queue.py --markdown`、`tools/seo_indexing_followup_queue.py --markdown` 已補齊 CLI，覆蓋本機備份、投流、歸因、復盤、事件重放與收錄跟進。
- [x] `tools/legal_compliance_review_package.py --markdown`、`tools/legal_external_review_evidence.py --markdown`、`tools/compliance_api_persistence_package.py --markdown` 已補齊 CLI，覆蓋法務送審、外部簽核留痕與合規審核 API 持久化。
- [x] `tools/production_env_template.py --markdown` 可把正式 `site-config.json`、API server、CI 與備份任務需要的環境變數整理成 CLI 版本，方便 backend / ops / data 直接照表建立。
- [x] `tools/production_config_readiness.py --markdown` 可把正式配置就緒度輸出成 CLI 版本，和後台 `tfse_production_config_readiness` 對齊，方便在命令列直接確認目前還缺哪些正式配置。
- [x] `tools/site_config_update_package.py --markdown` 可輸出 `site-config.json` 更新草稿預檢包；未提供 draft 時先給 template 與 current summary，提供 `--draft-file` 或 stdin 後即可檢查正式配置片段格式。
- [x] `tools/site_config_approval_package.py --markdown` 可把正式配置簽核包輸出成 CLI 版本；搭配 `--draft-file` 或 `--draft-json` 可直接生成待審批摘要、pending services、domain cutover 狀態與合併後命令。
- [x] `tools/api_contract_audit.py` 可檢查正式 API 合約是否覆蓋公開端點、Admin RBAC、Turnstile、限流、表單欄位、隱私/Line 隊列與審計日誌。
- [x] `tools/backend_schema_audit.py` 可檢查 `backend-schema.sql` 是否覆蓋正式資料表、敏感欄位、隱私同意、Line/個資隊列、審計與必要索引。
- [x] `tools/performance_budget_audit.py` 可檢查關鍵頁直接引用 CSS/JS/圖片大小與全站大圖，避免在保留模板時無意加入過大資源。
- [x] `tools/browser_acceptance_verify.mjs` 可啟動本機靜態伺服器與 Playwright，煙測關鍵頁、手機橫向溢出、桌面/手機文字裁切、移動選單開合、免費健檢提交、聯絡頁低敏資料回報提交、UTM、Admin 登入、CRM 可見與狀態更新審計。
- [x] `tools/browser_acceptance_verify.mjs` 已加入正式 API 模式煙測，會臨時模擬 `backend.api_base_url`、`POST /api/leads`、`POST /api/public-feedback`、`GET /api/products`、`GET /api/articles`、`GET /api/institutions`、`GET /api/search`、`GET /api/admin/leads` 與 `PATCH /api/admin/leads/:id/status`，確認前台內容、免費健檢、聯絡頁資料回報與 Admin CRM 可從 localStorage/靜態 JSON 切到 API。
- [x] 已建立 `tools/mock_formal_api.py` 本機 mock formal API，可提供 `POST /api/leads`、`POST /api/events`、`POST /api/public-feedback`、`GET /api/products`、`GET /api/articles`、`GET /api/institutions`、`GET /api/search`、`GET /api/admin/leads`、`PATCH /api/admin/leads/:id/status`、`GET /api/admin/audit-logs` 與 Admin Auth session rehearsal，供前端在不改模板的前提下做真實 HTTP API rehearsal。
- [x] 已建立 `backend/tfse_persistent_api.py` SQLite 持久化 MVP API，沿用正式 API 合約提供 `POST /api/leads`、`POST /api/events`、`POST /api/public-feedback`、內容查詢、Admin session、CRM 列表/狀態更新、`POST /api/admin/compliance/review`、`GET/PATCH /api/admin/privacy-requests` 與 `audit_logs`，可把免費健檢、後台 CRM、合規審核與個資履約從 localStorage 推進到可重啟保留的資料庫閉環。
- [x] 持久化 MVP API 已補齊表單安全基線：`TFSE_TURNSTILE_ENABLED=true` 時呼叫 Cloudflare siteverify、保留蜜罐拒收、10 分鐘 IP/device 限流、24 小時同手機雜湊 + 同需求重複提交復用、高敏 payload 拒收、隱私同意必填與 `lead_duplicate_reuse` 審計。
- [x] 已建立 `tools/persistent_api_smoke.py`，可自動啟動持久化 API 並驗證健康檢查、隱私未同意拒收、蜜罐拒收、高敏 payload 拒收、免費健檢落庫、重複提交復用、Admin 登入、CRM 可見、狀態更新、資料回報、合規審核、個資刪除履約與審計紀錄。
- [x] 後台「本機備份與遷移包」已提供正式遷移包匯出，可打包 seed JSON、內容覆蓋、潛客、合規審核、審計、來源復核、個資請求、Line 分群與匯入順序，供正式後端導入前核對。
- [x] 後台已建立正式資料導入驗收包，可匯出 `tfse_import_validation_package`，核對 seed 數量、sample_lead 排除、來源復核、個資請求、Line 分群、加密欄位與導入後抽查。
- [x] 後台已建立正式備份與還原演練交接包，可匯出 `tfse_backup_restore_drill_plan`，列出每日備份、每週還原、RPO/RTO、證據欄位、抽查步驟與外部阻擋項；實際備份仍需正式環境完成。
- [x] 後台已建立正式備份收據驗收包，可匯出 `tfse_backup_receipt_verification_package`，核對 backup_jobs、checksum、加密儲存、每週還原結果、RPO/RTO 與 audit_logs。
- [x] 後台已建立資料保留/刪除月檢交接包，可匯出 `tfse_data_retention_purge_plan`，列出保留規則、匿名化/刪除候選、legal hold、證據欄位與正式後端阻擋項。
- [x] `404.html` 與 `500.html` 已建立，並可導回資料庫、文章與免費健檢入口。
- [x] `_headers` 已提供靜態主機安全標頭、CSP 與快取策略；`.well-known/security.txt` 已提供標準安全聯絡資訊。
- [x] `43.130.233.113` Nginx 已套用 TFSE 安全標頭與快取策略，公网 live check 已驗證首頁、SEO 資產、site-config、logo asset 與 `/api/health` 的 headers。
- [x] `TFSE_TEMPLATE_MAPPING.md` 已建立模板頁面、區塊、資料、腳本、驗收與不重設 UI 的套用邊界，對應專案計畫 Phase 0。
- [x] `DEPLOYMENT.md` 已記錄靜態部署、GA4/Sentry/備份接入邊界。
- [x] `OPERATIONS_RUNBOOK.md` 已建立正式部署、監控、備份、還原演練、回滾、事故與合規審核操作步驟。
- [x] `tools/operations_runbook_audit.py` 可檢查 Runbook 是否覆蓋上線命令、GA4/Search Console/Line OA/Sentry/Turnstile、後端 API、backup、restore drill、rollback、incident 與 legal/compliance。
- [x] `.github/workflows/tfse-acceptance.yml` 已建立 GitHub Actions 驗收流程，推送或 PR 時會執行 Python 審計、人工驗收報告生成、總靜態驗收與 Playwright 煙測。
- [x] `api-contract.json` 已定義正式前台/後台 API 合約。
- [x] `backend-schema.sql` 已提供 PostgreSQL schema 初稿，覆蓋資料庫、文章、潛客、隱私請求、Line 分群、報表、合規、審計與備份表。
- [x] 正式 Admin Auth 已納入 API 合約與 schema，包含 `/api/admin/auth/login`、`/api/admin/auth/session`、`/api/admin/auth/logout`、`admin_users` 與 `admin_sessions`，用於取代本機 MVP 明碼驗證。
- [x] 正式 Admin 權限安全矩陣已納入 API 合約與 schema，包含 `/api/admin/security-matrix` 與 `admin_security_matrices`，用於正式後端 RBAC/CSRF/審計複核。
- [x] `tfse-api.js` 已提供前台提交與 Admin CRM 的 API 適配層，API 不可用時會 fallback 到本機 MVP。
- [x] `DATA_MODEL.md` 已定義正式資料表與權限模型。
- [x] `PRODUCTION_BACKEND_PLAN.md` 已記錄後端遷移順序。

## 正式上線前仍需人工/外部完成

正式填值前，可先執行 `python3 tools/formal_config_input_packet.py --markdown`，把 `site-config.json`、後端 secret 與各 owner 待填欄位整理成單一交接包。

若要先確認目前是否已完成本地閉環、還剩哪些外部阻擋，可先執行 `python3 tools/plan_closure_report.py --markdown`。

若要直接按角色分派剩餘工作，建議優先使用 owner 過濾後的交接包：

- `python3 tools/production_config_readiness.py --markdown --owner backend_engineer --pending-only`
- `python3 tools/production_env_template.py --markdown --owner ops_marketing --pending-only`
- `python3 tools/site_config_approval_package.py --markdown --owner seo_owner --pending-only`
- `python3 tools/launch_execution_plan.py --markdown --owner backend_engineer --status pending_external_input`
- `python3 tools/launch_countdown_plan.py --markdown --owner ops_marketing --slot d_minus_1`
- `python3 tools/launch_handoff_manifest.py --markdown --owner backend_engineer --pending-only`
- `python3 tools/operations_task_queue.py --markdown --owner data_manager --status pending_external`
- `python3 tools/owner_cutover_bundle.py --markdown --summary-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner data_manager --checklist-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner backend_engineer`
- `python3 tools/owner_cutover_bundle.py --markdown --owner backend_engineer --checklist-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner backend_engineer --timeline-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner ops_engineer --checklist-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner legal_reviewer`
- `python3 tools/owner_cutover_bundle.py --markdown --owner legal_reviewer --timeline-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner ops_marketing --checklist-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner ops_marketing --timeline-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner seo_owner --checklist-only`
- `python3 tools/owner_cutover_bundle.py --markdown --owner infra_owner --checklist-only`
- `python3 tools/release_day_runsheet.py --markdown`
- `python3 tools/release_day_runsheet.py --markdown --slot d_minus_1`
- `python3 tools/release_day_runsheet.py --markdown --owner backend_engineer`

- [ ] 將 `site-config.json` 的 `base_url` 改成正式網域，執行 `python3 tools/generate_seo_assets.py` 並重新驗收。
- [ ] 填入正式 GA4 Measurement ID，確認 `tfse_events` 對應事件可在 GA4 收到。
- [ ] 填入正式 Meta Pixel ID，確認瀏覽、表單、搜尋與 Line CTA 事件可在 Meta Events Manager 收到。
- [ ] 正式 GA4/Meta 填入後，匯出 `tfse_analytics_debug_verification_package` 並保存 DebugView / Events Manager 事件截圖與 reviewer 留痕。
- [ ] 填入正式 Server Event endpoint，確認去識別事件可落庫。
- [ ] 將 `site-config.json > line.oa_url` 改成正式 Line OA 加友網址，確認表單成功後可導向。
- [ ] 正式 Line OA 需依 `tfse_line_oa_setup_package` / `line-flows.json` 建立圖文選單、分群標籤與自動回覆。
- [ ] 正式 Line OA 建立後，匯出 `tfse_line_oa_handoff_check` 並保存手機/桌面導向、quick reply、退訂關鍵字與截圖證據。
- [ ] 將 Google Search Console 驗證碼填入 `site-config.json > search_console.google_site_verification`，重生 SEO 資產並通過驗收。
- [ ] Search Console 驗證網域後提交 sitemap。
- [ ] Search Console 驗證完成後，匯出 `tfse_search_console_verification_package` 並保存 property、sitemap、URL Inspection 與 coverage 證據。
- [ ] 將 `backend/tfse_persistent_api.py` 或正式 PostgreSQL API 部署到受保護 API 主機，設定反代、HTTPS、環境密碼、備份與 `site-config.json > backend.api_base_url`。
- [ ] 接入正式伺服器端登入、角色權限與審計日誌。
- [ ] 正式 Admin Auth 上線前，匯出 `tfse_admin_auth_cutover_check` 並保存 cookie flags、CSRF、RBAC、Viewer 遮罩、logout revoke 與 audit log 證據。
- [ ] 接入正式資料庫和備份策略。
- [ ] 正式資料庫需每日備份，並完成每週還原演練；本機 MVP 備份包不可取代正式備份。當前 SQLite 過渡 API 已具備每日備份 timer 與 restore drill，但正式 PostgreSQL / 雲端備份仍需外部驗收。
- [ ] 正式備份排程上線後，匯出 `tfse_backup_receipt_verification_package` 並保存 backup_job_id、checksum、storage_url、restore_drill_id、RPO/RTO 與 audit_log_id 證據。
- [ ] 將 `institutions.json` 匯入正式 `institutions` 資料表，並建立來源核驗版本紀錄。
- [ ] 匯入機構資料前，匯出 `tfse_institution_import_verification_package` 並保存 row_count、version_record_count、sample_ids、official_url_checked 與 audit_log_id 證據。
- [ ] 從 Admin 匯出 `tfse_formal_backend_migration_package`，將本機產品/文章/FAQ 覆蓋、潛客、合規審核、來源復核、個資請求與 Line 分群遷移到正式後端版本紀錄，避免只存在瀏覽器 localStorage。
- [ ] 正式後端上線後，填入 `site-config.json > backend.api_base_url` 並重新驗收前台提交與 Admin CRM。
- [ ] 正式內容 API 上線後，匯出 `tfse_content_api_cutover_package` 並保存 endpoint、status_code、row_count、sample_slug、published_only、source_url_checked 與 evidence_note。
- [ ] 將 `POST /api/leads` 接入正式後端或持久化 API 反代，取代本機 localStorage。
- [ ] 正式 `POST /api/leads` 需在生產 API / 反代環境啟用 Turnstile secret、IP/裝置限流、蜜罐與重複提交檢查；本地持久化 MVP API 已通過同等邏輯 smoke，正式環境仍需帶真實 secret 與反代 IP 再驗證。
- [ ] 正式 Turnstile 上線後，匯出 `tfse_turnstile_backend_verification_package` 並保存 missing/invalid token、蜜罐、限流、重複與高敏 payload 負向測試證據。
- [ ] 將 Admin CRM 接入正式 `/api/admin/leads`、`/api/admin/compliance/review`、`/api/admin/privacy-requests`、`/api/admin/audit-logs`；目前持久化 MVP 已覆蓋 leads/status/compliance/privacy/audit，正式生產仍需反代、HTTPS、CSRF/RBAC 強化與外部驗收證據。
- [ ] 填入正式 Sentry DSN，確認前台錯誤摘要可在 Sentry 收到。
- [ ] 正式 Sentry DSN 與 API Sentry 上線後，匯出 `tfse_sentry_error_verification_package` 並保存測試錯誤、遮罩欄位、environment/release、source map 與 issue 截圖證據。
- [ ] 在正式主機設定 404 fallback 與 500/server error fallback；靜態主機不支援時需於正式後端接入後配置。
- [x] 後台已建立主機錯誤頁核對包，可匯出 `tfse_host_fallback_deployment_check`，部署後逐項保存 404、500、未知路徑、server error fallback、狀態碼與截圖證據。
- [ ] 台灣當地法務或合規人員複核廣告文案、表單欄位、個資告知與金融資訊展示方式。

## 本機驗收命令

```sh
python3 tools/compliance_scan.py
python3 tools/data_quality_audit.py
python3 tools/crm_capability_audit.py --markdown
python3 tools/api_contract_audit.py
python3 tools/backend_schema_audit.py
python3 tools/performance_budget_audit.py
python3 tools/navigation_consistency_audit.py
python3 tools/accessibility_audit.py
python3 tools/validate_site_config.py
python3 tools/acceptance_audit.py
python3 tools/launch_cutover_audit.py
python3 tools/backend_cutover_roadmap.py --markdown
python3 tools/launch_execution_plan.py --markdown
python3 tools/launch_countdown_plan.py --markdown
python3 tools/formal_config_input_packet.py --markdown
python3 tools/project_plan_coverage_audit.py --markdown
python3 tools/external_execution_packet.py --markdown
python3 tools/launch_handoff_manifest.py --markdown
python3 tools/project_phase_audit.py
python3 tools/browser_acceptance_report.py --markdown
NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs
python3 tools/operations_runbook_audit.py
python3 tools/verify_static_site.py
python3 -m http.server 4173
```

瀏覽器驗收重點：

- 首頁 CTA 可進入資料庫與免費健檢。
- `service.html` 可搜尋、篩選並進入 `products/{slug}.html`。
- `blog-grid.html` 與 `blog-classic.html` 可進入 `articles/{slug}.html`。
- 免費健檢提交後，`admin.html` 登入後可看到線索。
- 後台產品狀態、文章發布、合規摘要、事件復盤可操作。
