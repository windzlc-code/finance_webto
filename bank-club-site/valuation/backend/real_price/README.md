# 定位找周遭實價

本模組新增「定位找周遭實價」功能，正式主線改為 PostgreSQL/PostGIS，SQLite 保留作本機開發與未啟用 PostGIS 時的 fallback。

- 不修改既有估價公式。
- 不修改既有 `/api/lvr/*` 路徑。
- 不修改既有前端 input id/name。
- API 路徑維持不變，背後由 `backend.real_price.storage` 依設定切換 PostGIS / SQLite。

## PostGIS 主線

啟動本機 PostGIS：

```bash
docker-compose -p found-realprice -f docker-compose.postgis.yml up -d
```

環境變數：

```bash
export REAL_PRICE_DB_BACKEND=postgis
export DATABASE_URL='postgresql://found:found-realprice-local@127.0.0.1:5433/found_realprice'
```

套用 migration：

```bash
psql "$DATABASE_URL" -f migrations/20260620_real_price_postgis.sql
```

Python driver：

```bash
python3 -m pip install 'psycopg[binary]==3.2.13'
```

PostGIS schema：

- `real_price_transactions`
- `address_coordinate_cache`
- `geocode_jobs`
- `geocode_attempts`
- `geom geography(point,4326)`
- `idx_real_price_geom` GIST 空間索引

查詢主線：

- 半徑查詢：PostGIS `ST_DWithin`
- 地圖 bbox：PostGIS `ST_Intersects`
- 地圖群聚：DB 端 grid grouping
- 地址查詢：`address_coordinate_cache`

SQLite fallback：

- 沒有 `DATABASE_URL` 或 `REAL_PRICE_DB_BACKEND=sqlite` 時使用。
- 測試傳入暫存 `db_path` 時固定使用 SQLite。
- 以 `lat/lng` bounding box + Python Haversine 計算距離。

## API

- `GET /api/real-price/status`
- `POST /api/real-price/nearby`
- `POST /api/real-price/nearby-by-address`
- `GET /api/real-price/map-search`
- `GET /api/real-price/map-clusters`
- `GET /api/real-price/cases/{id}`
- `POST /api/geocode/address`

`/api/real-price/nearby` 範例：

```json
{
  "lat": 25.033968,
  "lng": 121.564468,
  "radius_km": 0.5,
  "limit": 100,
  "sort": "distance_asc"
}
```

支援半徑：`0.1`、`0.3`、`0.5`、`1`、`3` 公里。

支援排序：

- `distance_asc`
- `date_desc`
- `unit_price_desc`
- `unit_price_asc`
- `total_price_desc`
- `total_price_asc`
- `area_desc`
- `area_asc`

## 匯入 CSV

```bash
python scripts/import_real_price.py --input data/lvr/raw.csv --city 台北市
```

匯入器會處理：

- 地址標準化
- 台/臺統一
- 全形數字轉半形
- 中文數字轉阿拉伯數字
- ROC 日期轉西元日期
- 平方公尺轉坪
- 元/平方公尺轉元/坪

## 補座標 / PostGIS

```bash
python scripts/geocode_real_price.py --limit 1000 --provider auto
```

目前主站流程只讀本機座標資料與 `geocode_cache`，避免未設定正式資料源時對外部 geocoding 服務發送大量請求。TGOS 不再作為主流程 fallback。

手動補一筆快取：

```bash
python scripts/geocode_real_price.py --cache-address "台北市信義區松仁路100號" --lat 25.033 --lng 121.5654
```

批次匯入座標 CSV：

```bash
python scripts/import_real_price_coordinates.py --input data/lvr_opendata/coordinates.csv
```

CSV 至少需要地址與 WGS84 經緯度欄位；欄位名稱可用：

- 地址：`address`、`address_raw`、`address_normalized`、`地址`、`門牌`
- 緯度：`lat`、`latitude`、`緯度`
- 經度：`lng`、`lon`、`longitude`、`經度`

匯出目前待補座標清單：

```bash
python scripts/import_real_price_coordinates.py --export-pending data/lvr_opendata/coordinate_import_pending.csv --limit 10000
```

匯入器會先寫入 `geocode_cache`，再依 `address_normalized` 自動套用到 `real_price_transactions.lat/lng`。

使用外部 geocoder 批次補點：

```bash
python3 scripts/geocode_real_price_external.py --limit 100
```

目前策略：

- 優先嘗試 NLSC `TextQueryAddress` 門牌定位；此服務依官方介接頁面屬需申請服務，未授權時會回 `PERMISSION DENIED`。
- 若本輪 NLSC 回 `PERMISSION DENIED`，批次腳本會自動停用本輪 NLSC 呼叫，避免每筆資料重複打失敗端點。
- Photon / OpenStreetMap 作第一層 fallback，Nominatim / OpenStreetMap 作第二層 fallback。
- `地號`、非門牌或無法解析 `號` 的資料會標記為 `skipped`，不送外部 geocoder。
- 每次執行會在 `data/lvr_opendata/reports/` 產生 `external_geocode_report_*.json`。

可指定 provider 順序：

```bash
python3 scripts/geocode_real_price_external.py --limit 100 --providers nlsc,photon,nominatim
python3 scripts/geocode_real_price_external.py --limit 100 --providers photon,nominatim
python3 scripts/geocode_real_price_external.py --limit 100 --providers nominatim --nominatim-url http://127.0.0.1:8088
```

自架 Nominatim POC job queue：

```bash
# 啟動本機 Nominatim Taiwan extract；第一次啟動會先匯入與建立索引
docker-compose -p found-nominatim -f docker-compose.nominatim.yml up -d

# 匯入完成後可檢查 health
python3 scripts/check_nominatim_service.py --url http://127.0.0.1:8088

# 從既有 lvr_transactions 建立去重後的門牌定位工作；不呼叫 Nominatim
python3 scripts/build_nominatim_geocode_jobs.py --limit 10000 --source-limit 50000 --city 臺北市 --output data/lvr_opendata/reports/nominatim_poc_jobs_taipei_20260620.csv

# 等自架 Nominatim 啟動後，再從 pending job 批次補座標
python3 scripts/run_nominatim_geocode_jobs.py --limit 100 --nominatim-url http://127.0.0.1:8088
```

`run_nominatim_geocode_jobs.py` 預設拒絕打公開 `nominatim.openstreetmap.org`，避免不小心把大量 job 送到公開服務。

PostGIS 版本套用 migration：

```bash
psql "$DATABASE_URL" -f migrations/20260620_real_price_postgis.sql
```

PostGIS 表設計以 `geom geography(point, 4326)` 做空間索引；查詢時以半徑或 bbox 篩選，前端地圖搜尋與附近實價共用同一批已上座標交易資料。SQLite fallback 仍保留 `lat/lng` + bounding box + Haversine，用於本機開發與未啟用 PostGIS 的環境。

## Deprecated：TGOS 瀏覽器批次定位

主站已放棄 TGOS fallback。舊工具頁僅為歷史相容與既有資料補點用途，不再由首頁流程呼叫。

若仍需手動使用舊工具，可先從既有 Open Data 搬一批資料到定位表：

```bash
python scripts/import_real_price_from_lvr.py --limit 1000 --city 台北市
```

再開啟：

```text
http://127.0.0.1:5606/frontend/tgos_geocode_importer.html
```

此頁會載入 TGOS Web API 並寫回本機 `geocode_cache` 與 `real_price_transactions`，但不是新版主流程的一部分。

## SQLite Schema

`real_price_transactions` 保留升級 PostGIS 需要的欄位語意；本機 fallback 以 `lat/lng` + bounding box + Haversine 計算半徑距離。

`geocode_cache` 以 `address_normalized` 做唯一鍵，避免重複 geocode。

## 限制

- 既有 `lvr_transactions` 約 537 萬筆資料沒有座標，需先轉入新表並批次 geocode 後，才會出現在半徑查詢結果。
- 地址查詢只會使用本機座標快取或 PostGIS/座標匯入資料；沒有座標時需先補座標或手動輸入緯度、經度。
- 前端地圖搜尋共用手動查詢條件，不再維護第二套縣市、行政區、路名、期間、交易標的、單價、面積與屋齡欄位。
