# 銀行行員俱樂部上線閉環清單

此清單用來補齊《銀行行員俱樂部獨立站完整實施計劃.docx》中無法單靠程式碼完成的正式上線項目。程式碼已提供前台、表單、後台 CRM、文章/文件管理、追蹤、備份、2FA、通知 Webhook 與上線檢查；正式閉環需要把下列外部設定逐項落地並留下驗收證據。

## 1. 外部帳號與連結

正式上線前必須人工確認並填入後台「站點設定」：

- 正式域名與 HTTPS 網址。
- LINE 官方帳號或專員 LINE 深連結。
- LINE QR Code 圖片路徑或 HTTPS 圖片網址。
- FB 社團正式連結。
- 銀行官方申請連結，需確認可公開使用且與實際合作流程一致。
- 國泰金控、國泰人壽等品牌文字的對外使用授權。
- GA4 Measurement ID。
- Google Search Console 驗證碼。
- 通知 Webhook URL，或明確決定由專員人工查看後台。

## 2. 生產環境變數

以 `.env.example` 為模板，在部署平台設定：

```bash
NEXT_PUBLIC_SITE_URL="https://正式域名"
AUTH_SECRET="至少 32 字元的強隨機字串"
ADMIN_PASSWORD="正式後台強密碼"
NOTIFY_WEBHOOK_URL="https://通知端點"
```

要求：

- `NEXT_PUBLIC_SITE_URL` 必須是 HTTPS 正式網域，不能是 localhost。
- `AUTH_SECRET` 不可使用本地預設值。
- `ADMIN_PASSWORD` 不可使用 `admin123` 或 `BankClub2026!`。
- 真實密碼、Webhook、私鑰與 `.env` 不可提交到倉庫。

## 3. 資料與備份閉環

MVP 目前使用 `.data/bank-club-db.json`。正式部署前至少完成：

- 部署平台需提供持久化儲存；不可使用會在重啟或重新部署時消失的暫存磁碟。
- `.data/bank-club-db.json` 每日至少備份一次，備份需加密或放在受控位置。
- 上線前執行一次備份演練：下載備份、上傳預檢、確認還原、檢查 `/api/health`、後台登入、線索/文章/文件仍存在。
- 演練後保留 `artifacts/backup-drill/latest.json` 或後台操作日誌中的備份匯出/還原紀錄。
- 正式版若線索量增加，需規劃 PostgreSQL 或其他託管資料庫遷移。

## 4. 上線驗收命令

先啟動正式或預發服務，設定 `BASE_URL` 指向該環境：

```bash
pnpm lint
pnpm build
BASE_URL=https://正式域名 pnpm nav:smoke
BASE_URL=https://正式域名 pnpm form:smoke
BASE_URL=https://正式域名 pnpm crm:smoke
BASE_URL=https://正式域名 pnpm files:smoke
BASE_URL=https://正式域名 pnpm articles:smoke
BASE_URL=https://正式域名 pnpm social:smoke
BASE_URL=https://正式域名 pnpm tracking:smoke
BASE_URL=https://正式域名 pnpm notification:smoke
BASE_URL=https://正式域名 pnpm backup:smoke
BASE_URL=https://正式域名 LAUNCH_SMOKE_EXPECTED_FAILS="" pnpm launch:smoke
BASE_URL=https://正式域名 pnpm admin-ui:smoke
BASE_URL=https://正式域名 pnpm roles:smoke
BASE_URL=https://正式域名 pnpm visual:smoke
```

補充：

- `notification:smoke` 需要可接收測試通知的 Webhook。
- `tracking:smoke` 會臨時寫入 GA4 / Search Console 測試值並恢復資料。
- `launch:smoke` 在正式環境應要求零失敗；警告項需人工確認並記錄。

## 5. 人工驗收證據

上線前建立一份內部紀錄，至少包含下列證據。完成後到後台「站點設定」的「正式上線人工確認」區塊逐項勾選，並在確認備註中填入證據摘要；後台「上線檢查」會讀取這些確認紀錄。

- 正式首頁、三大貸款頁、流程、文件、QA、諮詢、FB、聯絡、部落格、隱私、風險、條款均回傳 200。
- 手機與桌面截圖無文字重疊、橫向溢出或錯誤 overlay。
- 後台登入頁只顯示後台密碼欄位，正式密碼可登入。
- 後台至少一位超級管理員啟用 2FA。
- 表單提交後成功頁顯示 LINE QR Code、電話、Email 與敏感文件提醒。
- 後台可看到新線索，來源頁、UTM、同意時間、IP、User-Agent 均存在。
- LINE / FB / 官方申請連結已人工點擊或掃描確認。
- GA4 即時報表能看到 page_view 與 CTA event。
- Search Console 驗證通過並提交 `/sitemap.xml`。
- PageSpeed 或 Lighthouse mobile 分數達到計劃目標；若未達標，記錄原因與下一步優化。
- 備份演練完成，備份檔存放位置受控。
- 品牌、商標、金融廣告、個資告知與風險聲明已由負責人或法務確認。

## 6. 仍不應在 MVP 做的事

- 不在前台表單收集身分證、財力證明、銀行存摺、稅務文件等敏感檔案。
- 不把 LINE 收到的敏感文件全文貼回後台備註；只記錄摘要狀態。
- 不在 SEO、文章、FB 貼文或 CTA 中承諾核貸、最低利率、固定額度、固定年限或規避審核。

## 7. 閉環判定

以下條件同時成立，才算正式閉環完成：

1. 生產環境 `launch:smoke` 零失敗。
2. 主要 smoke 腳本通過，或每個未通過項都有可接受的人工驗收證據。
3. 後台「上線檢查」沒有失敗項。
4. 後台「站點設定」中的「正式上線人工確認」已全部勾選，並保存證據摘要。
5. 外部連結、GA4、Search Console、通知 Webhook、備份演練、品牌授權都已確認。
6. 真實使用者可完成諮詢預約，專員可在後台接收、通知、跟進、結案並回看統計。
