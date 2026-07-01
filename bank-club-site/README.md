# 銀行俱樂部獨立站

Next.js 全棧應用，覆蓋銀行俱樂部前台內容站、免費諮詢表單、後台 CRM、文章/文件管理、事件追蹤與基礎 SEO。

## 本地啟動

```bash
pnpm install
pnpm dev
```

預設網址：

- 前台：http://127.0.0.1:3000
- 後台：http://127.0.0.1:3000/admin

後台登入頁只需要輸入密碼。
本地預設密碼為 `admin123`，正式環境必須用 `ADMIN_PASSWORD` 覆蓋。
後台「上線檢查」會把未設定 `ADMIN_PASSWORD` 或沿用已知預設密碼視為失敗項。

## 必要環境變數

可先複製 `.env.example` 到部署平台，再填入正式值：

```bash
ADMIN_PASSWORD="replace-with-strong-password"
AUTH_SECRET="replace-with-long-random-secret"
NEXT_PUBLIC_SITE_URL="https://your-domain.example"
NOTIFY_WEBHOOK_URL="https://optional-webhook.example/leads"
```

`AUTH_SECRET` 用於簽署後台 session。正式環境若更換此值，既有登入狀態會失效，屬於正常安全行為。

完整正式上線閉環與人工驗收證據請見 [docs/go-live-closure.md](docs/go-live-closure.md)。

## 後台上線設定

後台「站點設定」可維護：

- 品牌、公司、通訊處、專員、電話、Email、地址
- LINE 連結、LINE QR Code 圖片、FB 社團連結、銀行官方申請連結
- GA4 Measurement ID，例如 `G-XXXXXXXXXX`
- Google Search Console 驗證碼，也就是 `google-site-verification` 的 `content`

若尚未取得可直接開啟的 LINE 官方連結，`LINE 連結` 可維持預設 `/contact#line-qr`，所有 LINE CTA 會導向聯絡頁 QR Code 區。`LINE QR Code 圖片` 可填站內路徑或 HTTPS 圖片網址；取得正式 LINE 深連結或新版 QR 圖後，再由後台替換即可。

填入 GA4 ID 後，前台會載入 `gtag.js`，並把自建事件同步推送到 GA4。填入 Search Console 驗證碼後，根頁面會輸出對應 meta。

## 資料與備份

MVP 使用本機 JSON 儲存：`.data/bank-club-db.json`。此檔案含線索、後台使用者、設定、文章、文件與事件資料，不應提交到公開倉庫。

正式部署前至少要做到：

- 將 `.data/bank-club-db.json` 納入每日備份。
- 超級管理員可在後台「站點設定」下載完整 JSON 備份；備份檔含個資，必須存放在受控位置。
- 超級管理員可在後台「站點設定」上傳 JSON 備份做預檢；真正還原必須輸入確認短語 `RESTORE BANK CLUB DATA`。
- 還原保護：備份 schema 必須符合 `bank-club-json-db-v1`，且備份內必須包含目前登入的超級管理員，避免還原後鎖定帳號。
- 限制伺服器檔案存取權限。
- 將未來正式版資料庫遷移到 PostgreSQL 或其他託管資料庫。
- 備份還原流程至少人工演練一次：下載備份、上傳預檢、在受控環境執行確認還原、確認 `/api/health` 與後台登入正常。

## 驗證指令

```bash
pnpm lint
pnpm build
BASE_URL=http://127.0.0.1:3000 pnpm backup:smoke
BASE_URL=http://127.0.0.1:3000 pnpm crm:smoke
BASE_URL=http://127.0.0.1:3000 pnpm social:smoke
BASE_URL=http://127.0.0.1:3000 pnpm tracking:smoke
BASE_URL=http://127.0.0.1:3000 pnpm notification:smoke
BASE_URL=http://127.0.0.1:3000 pnpm launch:smoke
BASE_URL=http://127.0.0.1:3000 pnpm files:smoke
BASE_URL=http://127.0.0.1:3000 pnpm articles:smoke
BASE_URL=http://127.0.0.1:3000 pnpm form:smoke
BASE_URL=http://127.0.0.1:3000 pnpm admin-deeplink:smoke
BASE_URL=http://127.0.0.1:3000 pnpm admin-ui:smoke
BASE_URL=http://127.0.0.1:3000 pnpm roles:smoke
BASE_URL=http://127.0.0.1:3000 pnpm visual:smoke
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/sitemap.xml
curl -I http://127.0.0.1:3000/robots.txt
curl http://127.0.0.1:3000/api/health
curl -I "http://127.0.0.1:3000/api/files/file-credit/download?source=/documents"
```

後台登入後可在「上線檢查」執行完整 readiness checklist；它會檢查公開頁面、全站唯一 SEO title/description、`sitemap.xml`、`robots.txt`、`/api/health`、內鏈、外部 CTA 來源參數、必要環境變數、站點設定、內容數量、2FA 與備份紀錄。

`pnpm backup:smoke` 需先啟動網站服務；它會登入後台、下載 JSON 備份、執行還原預檢、確認錯誤短語會被拒絕、用正確短語演練還原，再把測試前的 `.data/bank-club-db.json` 原樣寫回。成功後會寫入 `artifacts/backup-drill/latest.json`，供上線檢查確認最近一次備份演練已通過。若要保留演練後資料，可設定 `BACKUP_SMOKE_KEEP_DATA=1`。

`pnpm visual:smoke` 需先啟動網站服務；它會用 Playwright 檢查首頁與信貸、房貸、企業貸、申辦流程、文件、QA、部落格搜尋、聯絡頁的桌面與手機視口，驗證關鍵文案、CTA、導航高亮、Footer、Next.js 錯誤 overlay 與橫向溢出，截圖輸出在 `artifacts/visual-smoke/`。

`pnpm roles:smoke` 需先啟動網站服務；它會臨時建立專員、內容營運與只讀管理帳號，驗證專員只能查看/更新自己分配的線索、內容營運只能管理文章與公開文件、只讀管理只能查看統計，並確認後台內部文件不會被非內容角色下載。腳本結束時會恢復 `.data/bank-club-db.json`；若要保留測試資料，可設定 `ROLES_SMOKE_KEEP_DATA=1`。

`pnpm crm:smoke` 需先啟動網站服務；它會提交一筆測試諮詢、登入後台、檢查線索列表/詳情、更新狀態、添加備註、讀取統計與匯出 CSV。腳本預設會在結束時恢復 `.data/bank-club-db.json`，避免污染線索與統計；若要保留測試資料，可設定 `CRM_SMOKE_KEEP_DATA=1`。

`pnpm social:smoke` 需先啟動網站服務；它會登入後台、暫時把 LINE 入口改成可外跳的測試網址、提交一筆測試諮詢，然後用 Playwright 實際點擊聯絡頁與成功頁的 LINE / FB CTA，確認外跳 URL 帶有來源參數、事件寫入資料庫，且成功頁點擊會回寫線索的 LINE / FB 狀態。腳本結束時會恢復 `.data/bank-club-db.json`；若要保留測試資料，可設定 `SOCIAL_SMOKE_KEEP_DATA=1`。若要改用正式 LINE 測試網址，可設定 `SOCIAL_SMOKE_LINE_URL`。

`pnpm tracking:smoke` 需先啟動網站服務；它會臨時寫入 GA4 Measurement ID 與 Search Console 驗證碼，驗證首頁輸出 GA/GSC 標記、`page_view` 與首頁 CTA 事件同時進入 `dataLayer` 和 `/api/events`，並確認後台統計能依貸款類型彙總 CTA 點擊。腳本結束時會恢復 `.data/bank-club-db.json`；若要保留測試資料，可設定 `TRACKING_SMOKE_KEEP_DATA=1`。

`pnpm notification:smoke` 需先用通知 Webhook 啟動網站服務，例如 `NOTIFY_WEBHOOK_URL=http://127.0.0.1:3109/bank-club-notification-smoke pnpm start`。腳本會啟動本機 Webhook 收件器、登入後台、送出後台測試通知、提交一筆測試諮詢、確認新線索通知和後台重送都送達 Webhook，並驗證通知成功/失敗審計日誌與線索通知狀態。腳本結束時會恢復 `.data/bank-club-db.json`；若要保留測試資料，可設定 `NOTIFICATION_SMOKE_KEEP_DATA=1`。

`pnpm launch:smoke` 需先啟動網站服務；它會登入後台、確認未登入無法讀取上線檢查，再拉取 `/api/admin/launch-checklist`，驗證公開頁面、安全標頭、SEO、內鏈、性能、文案紅線、CSRF、內容、資料完整性與後台安全檢查均有執行。本地預設允許 `env:auth-secret` 與 `env:admin-password` 兩個正式環境變數失敗；若正式環境執行，可設定 `LAUNCH_SMOKE_EXPECTED_FAILS=""` 要求零失敗。

`pnpm files:smoke` 需先啟動網站服務；它會下載公開文件並確認 PDF、下載數與 `file_download` 事件，登入後台建立公開文件、拒絕敏感檔名與敏感內容匯入、拒絕敏感內容覆蓋既有公開文件、替換文件並驗證版本歷史，最後確認後台限定文件匿名不可下載、登入後可下載。腳本結束時會恢復 `.data/bank-club-db.json`；若要保留測試資料，可設定 `FILES_SMOKE_KEEP_DATA=1`。

`pnpm articles:smoke` 需先啟動網站服務；它會登入後台建立臨時文章分類，驗證重複分類與重複 slug 被拒絕、未合規文章不能發布、草稿不公開、發布後前台文章頁輸出 SEO / Article JSON-LD / 費用揭露與 CTA，並驗證文章更新、下架、刪除與分類刪除的審計日誌。腳本結束時會恢復 `.data/bank-club-db.json`；若要保留測試資料，可設定 `ARTICLES_SMOKE_KEEP_DATA=1`。

`pnpm form:smoke` 需先啟動網站服務；它會用 Playwright 打開前台免費諮詢頁，實際填寫企業貸款表單、觸發高風險用途提醒與企業欄位，送出後檢查成功頁、LINE / FB 成功頁 CTA、後台線索、來源 UTM、同意欄位、`form_submit` 事件與 `lead_created` 日誌。截圖輸出在 `/tmp/bank-club-form-smoke/`，腳本結束時會恢復 `.data/bank-club-db.json`；若要保留測試資料，可設定 `FORM_SMOKE_KEEP_DATA=1`。

`pnpm admin-deeplink:smoke` 需先啟動網站服務；它會臨時設定後台登入密碼、建立一筆線索、登入後台並打開 `/admin?lead_id=...`，驗證通知深鏈可直達該線索詳情。腳本結束時會恢復 `.data/bank-club-db.json`。

`pnpm admin-ui:smoke` 需先啟動網站服務；它會用 Playwright 驗證後台登入頁、真實登入、線索列表/詳情、狀態更新、跟進備註、文章管理、文件資源、帳號權限、操作日誌、統計儀表板、站點設定與上線檢查頁。截圖輸出在 `/tmp/bank-club-admin-ui-smoke/`，腳本結束時會恢復 `.data/bank-club-db.json`；若要保留測試資料，可設定 `ADMIN_UI_SMOKE_KEEP_DATA=1`。

表單閉環驗收：

1. 前台提交免費諮詢表單。
2. 後台登入後可看到新線索。
3. 線索含來源頁、UTM、同意時間、IP、User-Agent。
4. 可更新狀態、補件狀態、下次跟進時間、個資停止利用/刪除請求。
5. 測試完成後刪除或清理測試資料，避免污染統計。

文件下載驗收：

1. `/documents` 的文件清單按鈕會下載 PDF。
2. 後台文件資源可替換版本，公開下載次數會增加。
3. 每次下載會寫入 `file_download` 事件，統計頁可看到文件下載數。

## 上線檢查

- 正式域名完成 DNS 解析。
- HTTPS 正常。
- `NEXT_PUBLIC_SITE_URL` 已改為正式域名。
- `ADMIN_PASSWORD` 和 `AUTH_SECRET` 已使用強隨機值。
- GA4 後台能看到 page_view 與 CTA event。
- Search Console 驗證通過，並提交 `/sitemap.xml`。
- `/api/health` 返回 `ok: true`。
- 後台「上線檢查」沒有失敗項；警告項需逐一人工確認或在正式環境補齊。
- 後台可下載資料備份，且備份下載會寫入操作日誌。
- FB、LINE、LINE QR Code、銀行官方申請外鏈都已人工點擊/掃描驗證，且後台設定更新後前台同步生效。
- 風險聲明、隱私權政策、服務條款均可訪問。
- 未在 MVP 表單收集身分證、財力證明、存摺、稅務文件等敏感檔案。
