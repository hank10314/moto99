# 汽機車保養 / 加油 / 里程紀錄 PWA 系統規格書

## 1. 專案目標

建立一套可在 **電腦與手機** 使用的汽機車紀錄系統，用於管理多台汽車與機車的：

- 車輛基本資料
- 里程紀錄
- 保養紀錄
- 每個保養項目的剩餘里程
- 加油紀錄
- 油耗計算
- 加油價格與每公里成本計算
- 年度 / 月度費用統計

資料儲存方式使用：

- **Google Sheets 作為主要資料庫**
- **Google Drive 儲存 Google Sheets 檔案與附件**
- **PWA Web App 作為前端介面**

本專案需可部署為 Web App，並支援手機瀏覽器安裝成 PWA。

---

## 2. 技術架構

### 2.1 推薦架構

```text
Client
  ├── Desktop Browser
  └── Mobile Browser / PWA
        │
        ▼
PWA Web App
  ├── Vue 3 / React / Vanilla JS
  ├── IndexedDB / localStorage for offline queue
  └── REST API Client
        │
        ▼
Backend API
  └── Google Apps Script Web App
        │
        ├── Google Sheets API / SpreadsheetApp
        └── Google Drive API / DriveApp
        │
        ▼
Google Drive
  ├── VehicleMaintenance.gsheet
  └── Attachments Folder
```

### 2.2 建議技術選型

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite |
| UI Framework | Element Plus / Naive UI / Vuetify |
| PWA | vite-plugin-pwa |
| Chart | ECharts |
| Local Cache | IndexedDB |
| Backend | Google Apps Script Web App |
| Database | Google Sheets |
| File Storage | Google Drive |
| Auth | Google Account / Apps Script 權限 |

---

## 3. 核心需求

### 3.1 車輛管理

系統需支援多台汽車與機車管理。

功能：

- 新增車輛
- 編輯車輛
- 刪除 / 停用車輛
- 查看車輛詳情
- 查看目前里程
- 查看保養狀態
- 查看加油與油耗統計

車輛類型需至少支援：

- 汽車
- 機車
- 其他

---

### 3.2 里程紀錄

每台車都需要可紀錄里程。

用途：

- 更新車輛目前里程
- 計算保養項目剩餘里程
- 計算加油區間油耗
- 建立歷史里程紀錄

功能：

- 手動新增里程
- 加油時自動更新里程
- 保養時自動更新里程
- 顯示里程變化歷史

---

### 3.3 保養紀錄

使用者可在指定車輛下新增保養紀錄。

每筆保養紀錄需包含：

- 保養日期
- 當下里程
- 保養項目
- 保養分類
- 零件費用
- 工資
- 總費用
- 保養廠 / 自行保養
- 備註
- 下次保養里程
- 下次保養日期

保養項目範例：

- 機油
- 機油芯
- 空氣濾芯
- 冷氣濾芯
- 煞車油
- 變速箱油
- 差速器油
- 火星塞
- 輪胎
- 輪胎對調
- 煞車皮
- 煞車碟
- 電瓶
- 皮帶
- 鏈條
- 齒盤
- 水箱精

---

### 3.4 保養項目剩餘里程

系統需根據保養模板與最近一次保養紀錄，計算每個保養項目的剩餘里程。

例如：

```text
目前里程：42,000 km

機油：
上次保養里程：38,000 km
保養週期：5,000 km
下次保養里程：43,000 km
剩餘里程：1,000 km

輪胎對調：
上次保養里程：30,000 km
保養週期：10,000 km
下次保養里程：40,000 km
剩餘里程：-2,000 km
狀態：已逾期
```

狀態需分為：

| 狀態 | 條件 |
|---|---|
| 正常 | 剩餘里程 > warning_km |
| 即將到期 | 0 < 剩餘里程 <= warning_km |
| 已逾期 | 剩餘里程 <= 0 |

---

### 3.5 加油紀錄

使用者可針對指定車輛紀錄每次加油資訊。

每筆加油紀錄需包含：

- 加油日期
- 當下里程
- 加油公升數
- 每公升單價
- 總金額
- 是否加滿
- 加油站
- 油品類型
- 備註

系統需自動計算：

- 單次油耗
- 平均油耗
- 每公里油錢
- 月度加油費
- 年度加油費

---

### 3.6 油耗計算

油耗計算邏輯：

```text
本次油耗 km/L =
(本次加油里程 - 上一次加滿油里程) / 本次加油公升數
```

注意：

- 僅在本次與上一次都是「加滿」狀態時，油耗才可視為有效。
- 若非加滿，該筆紀錄仍需保存，但油耗可標記為 `null` 或 `estimated`。
- 柴油 / 汽油車皆使用 km/L。
- 電動車未來可擴充為 km/kWh。

---

### 3.7 價格計算

加油價格計算：

```text
總金額 = 加油公升數 × 每公升單價
```

如果使用者輸入：

- 公升數 + 單價：自動計算總金額
- 公升數 + 總金額：自動計算單價
- 單價 + 總金額：自動計算公升數

每公里油錢：

```text
每公里油錢 = 本次加油總金額 / 與上次有效加油紀錄的行駛里程
```

---

## 4. Google Sheets 資料庫設計

建議建立一個 Google Sheets 檔案：

```text
VehicleMaintenance.gsheet
```

裡面包含以下工作表：

```text
Vehicles
OdometerLogs
FuelLogs
MaintenanceLogs
ServiceTemplates
MaintenanceStatus
Settings
Attachments
```

---

## 5. Sheet Schema

### 5.1 Vehicles

用途：儲存車輛基本資料。

| Column | Type | Required | Description |
|---|---|---|---|
| vehicle_id | string | yes | 車輛唯一 ID |
| name | string | yes | 車輛名稱 |
| type | string | yes | car / motorcycle / other |
| brand | string | no | 廠牌 |
| model | string | no | 型號 |
| year | number | no | 年份 |
| plate_no | string | no | 車牌 |
| fuel_type | string | no | gasoline / diesel / electric / hybrid |
| current_odometer | number | yes | 目前里程 |
| active | boolean | yes | 是否啟用 |
| note | string | no | 備註 |
| created_at | datetime | yes | 建立時間 |
| updated_at | datetime | yes | 更新時間 |

---

### 5.2 OdometerLogs

用途：記錄所有里程變更。

| Column | Type | Required | Description |
|---|---|---|---|
| odometer_log_id | string | yes | 里程紀錄 ID |
| vehicle_id | string | yes | 車輛 ID |
| date | date | yes | 紀錄日期 |
| odometer_km | number | yes | 里程 |
| source_type | string | yes | manual / fuel / maintenance |
| source_id | string | no | 對應來源紀錄 ID |
| note | string | no | 備註 |
| created_at | datetime | yes | 建立時間 |

---

### 5.3 FuelLogs

用途：儲存加油紀錄。

| Column | Type | Required | Description |
|---|---|---|---|
| fuel_log_id | string | yes | 加油紀錄 ID |
| vehicle_id | string | yes | 車輛 ID |
| date | date | yes | 加油日期 |
| odometer_km | number | yes | 加油時里程 |
| liters | number | yes | 加油公升數 |
| unit_price | number | no | 每公升單價 |
| total_price | number | no | 總金額 |
| fuel_type | string | no | 油品 |
| station | string | no | 加油站 |
| full_tank | boolean | yes | 是否加滿 |
| distance_since_last_full | number | no | 距離上次加滿里程 |
| fuel_consumption_km_l | number | no | km/L |
| cost_per_km | number | no | 每公里油錢 |
| note | string | no | 備註 |
| attachment_file_id | string | no | 發票或照片檔案 ID |
| created_at | datetime | yes | 建立時間 |
| updated_at | datetime | yes | 更新時間 |

---

### 5.4 MaintenanceLogs

用途：儲存保養紀錄。

| Column | Type | Required | Description |
|---|---|---|---|
| maintenance_log_id | string | yes | 保養紀錄 ID |
| vehicle_id | string | yes | 車輛 ID |
| date | date | yes | 保養日期 |
| odometer_km | number | yes | 保養時里程 |
| category | string | no | 保養分類 |
| item | string | yes | 保養項目 |
| vendor | string | no | 保養廠 / 自行保養 |
| parts | string | no | 零件 |
| parts_cost | number | no | 零件費 |
| labor_cost | number | no | 工資 |
| total_cost | number | no | 總費用 |
| next_due_km | number | no | 下次保養里程 |
| next_due_date | date | no | 下次保養日期 |
| note | string | no | 備註 |
| attachment_file_id | string | no | 工單或照片檔案 ID |
| created_at | datetime | yes | 建立時間 |
| updated_at | datetime | yes | 更新時間 |

---

### 5.5 ServiceTemplates

用途：定義每台車的保養週期。

| Column | Type | Required | Description |
|---|---|---|---|
| template_id | string | yes | 模板 ID |
| vehicle_id | string | yes | 車輛 ID |
| item | string | yes | 保養項目 |
| category | string | no | 分類 |
| interval_km | number | no | 幾公里保養一次 |
| interval_months | number | no | 幾個月保養一次 |
| warning_km | number | no | 提前幾公里提醒 |
| warning_days | number | no | 提前幾天提醒 |
| enabled | boolean | yes | 是否啟用 |
| note | string | no | 備註 |
| created_at | datetime | yes | 建立時間 |
| updated_at | datetime | yes | 更新時間 |

---

### 5.6 MaintenanceStatus

用途：可選用。此表可作為快取表，儲存每台車目前各保養項目的狀態。

也可以不建立此表，改由後端 API 即時計算。

| Column | Type | Required | Description |
|---|---|---|---|
| status_id | string | yes | 狀態 ID |
| vehicle_id | string | yes | 車輛 ID |
| item | string | yes | 保養項目 |
| last_maintenance_log_id | string | no | 最近一次保養紀錄 |
| last_maintenance_km | number | no | 最近一次保養里程 |
| last_maintenance_date | date | no | 最近一次保養日期 |
| next_due_km | number | no | 下次保養里程 |
| next_due_date | date | no | 下次保養日期 |
| remaining_km | number | no | 剩餘里程 |
| remaining_days | number | no | 剩餘天數 |
| status | string | yes | normal / warning / overdue / unknown |
| updated_at | datetime | yes | 更新時間 |

---

### 5.7 Attachments

用途：記錄 Google Drive 附件，例如發票、保養單、車輛照片。

| Column | Type | Required | Description |
|---|---|---|---|
| attachment_id | string | yes | 附件紀錄 ID |
| vehicle_id | string | yes | 車輛 ID |
| related_type | string | yes | fuel / maintenance / vehicle |
| related_id | string | yes | 對應紀錄 ID |
| file_id | string | yes | Google Drive file ID |
| file_name | string | yes | 檔名 |
| mime_type | string | no | 檔案類型 |
| drive_url | string | yes | Google Drive URL |
| uploaded_at | datetime | yes | 上傳時間 |

---

### 5.8 Settings

用途：系統設定。

| Column | Type | Required | Description |
|---|---|---|---|
| key | string | yes | 設定名稱 |
| value | string | yes | 設定值 |
| description | string | no | 說明 |
| updated_at | datetime | yes | 更新時間 |

---

## 6. API 設計

Google Apps Script Web App 需提供 REST-like API。

### 6.1 Common Response Format

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

錯誤格式：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "vehicle_id is required"
  }
}
```

---

### 6.2 Vehicle API

#### GET vehicles

取得所有車輛。

```http
GET /api/vehicles
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "vehicle_id": "veh_xxx",
      "name": "Ranger",
      "type": "car",
      "current_odometer": 42000
    }
  ]
}
```

#### POST vehicles

新增車輛。

```http
POST /api/vehicles
```

Body:

```json
{
  "name": "Ranger",
  "type": "car",
  "brand": "Ford",
  "model": "Ranger PX3",
  "year": 2022,
  "plate_no": "",
  "fuel_type": "diesel",
  "current_odometer": 42000,
  "note": ""
}
```

---

### 6.3 Odometer API

#### POST odometerLogs

新增里程紀錄。

```http
POST /api/odometerLogs
```

Body:

```json
{
  "vehicle_id": "veh_xxx",
  "date": "2026-06-28",
  "odometer_km": 42500,
  "source_type": "manual",
  "note": ""
}
```

Backend 行為：

1. 新增 OdometerLogs
2. 如果 odometer_km 大於 Vehicles.current_odometer，更新車輛目前里程
3. 重新計算該車保養狀態

---

### 6.4 Fuel API

#### GET fuelLogs

取得指定車輛加油紀錄。

```http
GET /api/fuelLogs?vehicle_id=veh_xxx
```

#### POST fuelLogs

新增加油紀錄。

```http
POST /api/fuelLogs
```

Body:

```json
{
  "vehicle_id": "veh_xxx",
  "date": "2026-06-28",
  "odometer_km": 42500,
  "liters": 55.2,
  "unit_price": 29.8,
  "total_price": 1644.96,
  "fuel_type": "diesel",
  "station": "台灣中油",
  "full_tank": true,
  "note": ""
}
```

Backend 行為：

1. 驗證車輛存在
2. 計算 unit_price / total_price / liters 缺漏值
3. 如果 full_tank = true，尋找上一筆 full_tank = true 的加油紀錄
4. 計算 distance_since_last_full
5. 計算 fuel_consumption_km_l
6. 計算 cost_per_km
7. 新增 FuelLogs
8. 新增 OdometerLogs，source_type = fuel
9. 更新 Vehicles.current_odometer
10. 重新計算 dashboard 統計

---

### 6.5 Maintenance API

#### GET maintenanceLogs

取得指定車輛保養紀錄。

```http
GET /api/maintenanceLogs?vehicle_id=veh_xxx
```

#### POST maintenanceLogs

新增保養紀錄。

```http
POST /api/maintenanceLogs
```

Body:

```json
{
  "vehicle_id": "veh_xxx",
  "date": "2026-06-28",
  "odometer_km": 42500,
  "category": "engine",
  "item": "機油",
  "vendor": "自行保養",
  "parts": "5W-30",
  "parts_cost": 1200,
  "labor_cost": 0,
  "total_cost": 1200,
  "next_due_km": 47500,
  "next_due_date": "2026-12-28",
  "note": ""
}
```

Backend 行為：

1. 驗證車輛存在
2. 若 total_cost 未填，使用 parts_cost + labor_cost 自動計算
3. 新增 MaintenanceLogs
4. 新增 OdometerLogs，source_type = maintenance
5. 更新 Vehicles.current_odometer
6. 重新計算該車保養狀態

---

### 6.6 Service Template API

#### GET serviceTemplates

取得指定車輛保養模板。

```http
GET /api/serviceTemplates?vehicle_id=veh_xxx
```

#### POST serviceTemplates

新增保養模板。

```http
POST /api/serviceTemplates
```

Body:

```json
{
  "vehicle_id": "veh_xxx",
  "item": "機油",
  "category": "engine",
  "interval_km": 5000,
  "interval_months": 6,
  "warning_km": 500,
  "warning_days": 14,
  "enabled": true,
  "note": ""
}
```

---

### 6.7 Maintenance Status API

#### GET maintenanceStatus

取得指定車輛所有保養項目的狀態。

```http
GET /api/maintenanceStatus?vehicle_id=veh_xxx
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "vehicle_id": "veh_xxx",
      "item": "機油",
      "last_maintenance_km": 38000,
      "next_due_km": 43000,
      "remaining_km": 500,
      "status": "warning"
    },
    {
      "vehicle_id": "veh_xxx",
      "item": "輪胎對調",
      "last_maintenance_km": 30000,
      "next_due_km": 40000,
      "remaining_km": -2500,
      "status": "overdue"
    }
  ]
}
```

---

### 6.8 Dashboard API

#### GET dashboard

取得車輛儀表板資料。

```http
GET /api/dashboard?vehicle_id=veh_xxx
```

Response:

```json
{
  "success": true,
  "data": {
    "vehicle": {
      "vehicle_id": "veh_xxx",
      "name": "Ranger",
      "current_odometer": 42500
    },
    "maintenance_summary": {
      "normal": 5,
      "warning": 2,
      "overdue": 1
    },
    "fuel_summary": {
      "avg_fuel_consumption_km_l": 11.8,
      "monthly_fuel_cost": 4200,
      "yearly_fuel_cost": 32500,
      "avg_cost_per_km": 2.7
    },
    "recent_logs": []
  }
}
```

---

## 7. 計算邏輯

### 7.1 更新目前里程

任何新增紀錄只要帶有 `odometer_km`，都需檢查：

```javascript
if (newOdometer > vehicle.current_odometer) {
  vehicle.current_odometer = newOdometer;
}
```

避免新增歷史資料時把目前里程改低。

---

### 7.2 保養剩餘里程

```javascript
remaining_km = next_due_km - current_odometer;
```

若沒有直接填 `next_due_km`，則用：

```javascript
next_due_km = last_maintenance_km + interval_km;
remaining_km = next_due_km - current_odometer;
```

狀態：

```javascript
if (remaining_km <= 0) {
  status = "overdue";
} else if (remaining_km <= warning_km) {
  status = "warning";
} else {
  status = "normal";
}
```

---

### 7.3 保養剩餘天數

```javascript
remaining_days = next_due_date - today;
```

狀態：

```javascript
if (remaining_days <= 0) {
  status = "overdue";
} else if (remaining_days <= warning_days) {
  status = "warning";
} else {
  status = "normal";
}
```

如果同時有里程與日期，任一條件到期都要視為 warning / overdue。

優先級：

```text
overdue > warning > normal
```

---

### 7.4 加油價格計算

```javascript
if (!total_price && liters && unit_price) {
  total_price = liters * unit_price;
}

if (!unit_price && liters && total_price) {
  unit_price = total_price / liters;
}

if (!liters && unit_price && total_price) {
  liters = total_price / unit_price;
}
```

---

### 7.5 油耗計算

```javascript
distance_since_last_full = current_full_odometer - previous_full_odometer;
fuel_consumption_km_l = distance_since_last_full / current_liters;
cost_per_km = current_total_price / distance_since_last_full;
```

條件：

```javascript
if (current.full_tank === true && previousFullTankLog exists) {
  calculate fuel consumption;
} else {
  fuel_consumption_km_l = null;
}
```

---

## 8. PWA 頁面設計

### 8.1 頁面清單

```text
/
  Dashboard

/vehicles
  車輛列表

/vehicles/new
  新增車輛

/vehicles/:vehicle_id
  車輛詳情

/vehicles/:vehicle_id/fuel
  加油紀錄列表

/vehicles/:vehicle_id/fuel/new
  新增加油紀錄

/vehicles/:vehicle_id/maintenance
  保養紀錄列表

/vehicles/:vehicle_id/maintenance/new
  新增保養紀錄

/vehicles/:vehicle_id/templates
  保養模板設定

/vehicles/:vehicle_id/odometer
  里程紀錄

/settings
  系統設定
```

---

### 8.2 Dashboard

Dashboard 需顯示：

- 車輛切換
- 目前里程
- 即將到期保養項目
- 已逾期保養項目
- 最近一次加油
- 平均油耗
- 本月加油費
- 本年度保養費
- 最近紀錄

---

### 8.3 車輛詳情頁

顯示：

- 車輛基本資料
- 目前里程
- 保養狀態 summary
- 油耗 summary
- 快速新增按鈕：
  - 新增加油
  - 新增保養
  - 更新里程

---

### 8.4 新增加油頁

欄位：

- 日期
- 里程
- 公升數
- 單價
- 總金額
- 油品
- 加油站
- 是否加滿
- 備註

UX 要求：

- 公升數、單價、總金額三者可互相自動計算
- 日期預設今天
- 里程預設車輛目前里程
- 手機輸入需使用數字鍵盤

---

### 8.5 新增保養頁

欄位：

- 日期
- 里程
- 保養分類
- 保養項目
- 保養廠
- 零件
- 零件費
- 工資
- 總費用
- 下次保養里程
- 下次保養日期
- 備註

UX 要求：

- 可從 ServiceTemplates 選擇常用保養項目
- 選擇保養項目後，自動帶出 interval_km / interval_months
- 自動推算 next_due_km / next_due_date

---

### 8.6 保養狀態頁

顯示每個保養項目：

| Item | Last KM | Next KM | Remaining KM | Status |
|---|---:|---:|---:|---|
| 機油 | 38000 | 43000 | 500 | warning |
| 輪胎對調 | 30000 | 40000 | -2500 | overdue |

需依狀態排序：

1. overdue
2. warning
3. normal
4. unknown

---

### 8.7 統計圖表

需提供：

- 每月加油費用
- 每月保養費用
- 油耗趨勢圖
- 里程成長圖
- 每台車年度總成本
- 每公里平均成本

---

## 9. Offline / Sync 設計

PWA 需支援基本離線能力。

### 9.1 離線讀取

需快取：

- Vehicles
- 最近 FuelLogs
- 最近 MaintenanceLogs
- MaintenanceStatus

### 9.2 離線新增

若使用者離線新增紀錄：

1. 先寫入 IndexedDB
2. sync_status = pending
3. 顯示「等待同步」
4. 網路恢復後自動送出 API
5. 成功後 sync_status = synced
6. 失敗則保留錯誤訊息

### 9.3 同步欄位

每筆資料建議有：

| Field | Description |
|---|---|
| local_id | 前端暫存 ID |
| server_id | 後端正式 ID |
| sync_status | pending / synced / failed |
| created_at | 建立時間 |
| updated_at | 更新時間 |
| source_device | 裝置 ID |

---

## 10. Google Apps Script Backend 實作要求

### 10.1 基本檔案結構

```text
apps-script/
  ├── Code.gs
  ├── Router.gs
  ├── SheetsService.gs
  ├── VehicleService.gs
  ├── OdometerService.gs
  ├── FuelService.gs
  ├── MaintenanceService.gs
  ├── TemplateService.gs
  ├── DashboardService.gs
  ├── Utils.gs
  └── Config.gs
```

### 10.2 前端檔案結構

```text
frontend/
  ├── package.json
  ├── vite.config.ts
  ├── index.html
  ├── src/
  │   ├── main.ts
  │   ├── App.vue
  │   ├── router/
  │   ├── api/
  │   ├── stores/
  │   ├── pages/
  │   ├── components/
  │   ├── utils/
  │   └── types/
  └── public/
      ├── manifest.webmanifest
      └── icons/
```

---

## 11. ID 命名規則

所有主要資料需使用唯一 ID。

建議格式：

```text
vehicle_id: veh_ + timestamp/random
fuel_log_id: fuel_ + timestamp/random
maintenance_log_id: maint_ + timestamp/random
template_id: tmpl_ + timestamp/random
odometer_log_id: odo_ + timestamp/random
attachment_id: att_ + timestamp/random
```

範例：

```text
veh_20260628_8f3a91
fuel_20260628_b72d1a
maint_20260628_0ac91e
```

---

## 12. 驗證規則

### 12.1 Vehicle

- name 必填
- type 必填
- current_odometer 不可小於 0

### 12.2 FuelLog

- vehicle_id 必填
- date 必填
- odometer_km 必填
- liters 必填，且必須大於 0
- total_price 或 unit_price 至少需填一個
- odometer_km 不可小於 0

### 12.3 MaintenanceLog

- vehicle_id 必填
- date 必填
- odometer_km 必填
- item 必填
- cost 不可小於 0

### 12.4 ServiceTemplate

- vehicle_id 必填
- item 必填
- interval_km 或 interval_months 至少填一個
- warning_km 不可小於 0
- warning_days 不可小於 0

---

## 13. 權限與部署

### 13.1 Google Apps Script Deployment

Apps Script Web App 部署建議：

```text
Execute as: Me
Who has access: Only myself / Anyone with Google account
```

初期個人使用可選：

```text
Only myself
```

若要給家人共用，可改為：

```text
Anyone with Google account
```

但要注意資料權限與防止未授權寫入。

---

## 14. MVP 開發範圍

第一階段請先完成以下功能：

### Backend

- 初始化 Google Sheets
- 建立所有必要工作表與表頭
- Vehicle CRUD
- FuelLog create/list
- MaintenanceLog create/list
- ServiceTemplate create/list
- MaintenanceStatus calculation
- Dashboard summary

### Frontend

- PWA 基本設定
- 車輛列表
- 新增車輛
- 車輛詳情
- 新增加油紀錄
- 新增保養紀錄
- 保養狀態列表
- Dashboard

### 計算

- 更新目前里程
- 計算保養剩餘里程
- 計算保養狀態
- 計算加油總金額
- 計算油耗
- 計算每公里油錢

---

## 15. 後續擴充功能

第二階段可再加入：

- 附件上傳至 Google Drive
- 發票照片
- 保養單照片
- 年度報表匯出
- CSV / Excel 匯出
- Google Calendar 保養提醒
- LINE Notify / Email 提醒
- 多使用者權限
- OCR 自動讀取發票
- 車輛出售後封存
- 輪胎位置紀錄
- 保險 / 稅金 / 驗車紀錄
- 零件庫存紀錄

---

## 16. Codex 實作任務建議

請 Codex 依照以下順序實作：

### Task 1: 建立 Google Sheets Database Layer

- 建立 Apps Script 專案
- 建立初始化函式 `initDatabase()`
- 自動建立所有 Sheet
- 自動寫入表頭
- 實作基本 read / append / update helper

### Task 2: 建立 Backend Services

- VehicleService
- FuelService
- MaintenanceService
- TemplateService
- DashboardService

### Task 3: 建立 API Router

- 使用 `doGet(e)`
- 使用 `doPost(e)`
- 依照 `action` 或 `path` 分流
- 統一 response 格式

### Task 4: 建立 Frontend PWA

- Vue 3 + Vite
- Router
- API Client
- Vehicle pages
- Fuel pages
- Maintenance pages
- Dashboard page

### Task 5: 建立計算模組

- fuel calculation
- maintenance remaining calculation
- cost calculation
- dashboard statistics

### Task 6: 加入 Offline Queue

- IndexedDB
- pending sync queue
- retry mechanism
- sync status display

---

## 17. Acceptance Criteria

完成後需符合：

- 可新增多台汽車 / 機車
- 可手動更新車輛目前里程
- 可新增加油紀錄
- 可自動計算總金額 / 單價 / 公升數
- 可自動計算有效油耗 km/L
- 可新增保養紀錄
- 可設定保養週期
- 可顯示每個保養項目的剩餘里程
- 可顯示保養項目正常 / 即將到期 / 已逾期
- 可在手機瀏覽器正常使用
- 可安裝為 PWA
- 所有資料需儲存在 Google Sheets
- 不依賴本地資料庫作為唯一資料來源
- 離線新增資料需可在網路恢復後同步

---

## 18. 初始保養模板範例

可在新增車輛時提供預設模板。

### 汽車預設模板

| Item | interval_km | interval_months | warning_km | warning_days |
|---|---:|---:|---:|---:|
| 機油 | 5000 | 6 | 500 | 14 |
| 機油芯 | 10000 | 12 | 1000 | 30 |
| 空氣濾芯 | 10000 | 12 | 1000 | 30 |
| 冷氣濾芯 | 10000 | 12 | 1000 | 30 |
| 煞車油 | 40000 | 24 | 2000 | 30 |
| 變速箱油 | 40000 | 36 | 3000 | 60 |
| 輪胎對調 | 10000 | 12 | 1000 | 30 |
| 電瓶 | 0 | 36 | 0 | 60 |

### 機車預設模板

| Item | interval_km | interval_months | warning_km | warning_days |
|---|---:|---:|---:|---:|
| 機油 | 1000 | 3 | 100 | 14 |
| 齒輪油 | 2000 | 6 | 200 | 14 |
| 空氣濾芯 | 5000 | 12 | 500 | 30 |
| 火星塞 | 10000 | 24 | 1000 | 30 |
| 傳動皮帶 | 15000 | 36 | 1000 | 60 |
| 煞車油 | 20000 | 24 | 1000 | 30 |
| 輪胎 | 10000 | 24 | 1000 | 30 |

---

## 19. 注意事項

1. Google Sheets 不適合高頻大量交易，但很適合個人汽機車紀錄系統。
2. Sheet 操作要避免每次都讀整份資料，必要時可做簡單快取。
3. Google Apps Script 有執行時間限制，API 不應做太重的運算。
4. 日期格式統一使用 `YYYY-MM-DD`。
5. 金額統一使用整數或小數，幣別預設 TWD。
6. 里程單位統一使用 km。
7. 油耗單位統一使用 km/L。
8. 所有 API 回應需使用一致格式。
9. 前端需能處理同步失敗。
10. 後端新增資料時需做欄位驗證，避免 Sheet 資料污染。

---

## 20. 專案完成後的使用流程

### 新增車輛

1. 使用者進入車輛管理
2. 新增車輛
3. 輸入車名、類型、目前里程
4. 系統建立車輛
5. 系統可選擇建立預設保養模板

### 新增加油紀錄

1. 選擇車輛
2. 點選新增加油
3. 輸入里程、公升數、單價或總金額
4. 勾選是否加滿
5. 系統自動計算價格與油耗
6. 系統更新車輛目前里程

### 新增保養紀錄

1. 選擇車輛
2. 點選新增保養
3. 選擇保養項目
4. 輸入里程與費用
5. 系統自動推算下次保養里程
6. 系統更新該項保養狀態

### 查看保養提醒

1. 進入 Dashboard
2. 查看即將到期與已逾期項目
3. 依照剩餘里程安排保養

---

## 21. 對 Codex 的開發要求

請依照本規格建立完整專案骨架，並優先完成 MVP。  
若有技術選型不明確，請優先使用：

- Frontend: Vue 3 + Vite + TypeScript
- UI: Element Plus
- PWA: vite-plugin-pwa
- Backend: Google Apps Script
- Database: Google Sheets

請避免使用需要自行架設伺服器的資料庫。  
所有主要資料需以 Google Sheets 為主資料來源。  
前端 IndexedDB 僅作為離線快取與同步佇列，不可作為唯一資料來源。
