# 汽機車保養 / 加油 / 里程紀錄 PWA

本專案依照 `vehicle_maintenance_pwa_spec.md` 建立 MVP：

- `apps-script/`：Google Apps Script backend，使用 Google Sheets 作為主要資料庫。
- `frontend/`：Vue 3 + Vite + TypeScript PWA，含離線新增佇列與基本快取。

## Apps Script 部署

1. 在 Google Apps Script 建立新專案。
2. 將 `apps-script/*.gs` 與 `apps-script/appsscript.json` 複製到專案。
3. 執行一次 `initDatabase()` 並授權。
4. 部署為 Web App。前端 PWA 要從 `localhost` 或正式網域呼叫 Apps Script，建議存取權先選 `Anyone`；若選 `Only myself` 或 `Anyone with Google account`，瀏覽器 fetch 可能會被導到 Google 登入頁而不是取得 JSON。
5. 將 Web App URL 填入前端的「設定」頁。

API 採 action-based routing，例如：

```text
GET  {WEB_APP_URL}?action=listVehicles
POST {WEB_APP_URL}?action=createVehicle
```

POST body 使用 JSON，前端以 `text/plain` 發送以降低瀏覽器 preflight 問題。

## Frontend 開發

```bash
cd frontend
npm install
npm run dev
```

建置：

```bash
npm run build
```

## Cloudflare Pages + GitHub 部署

建議部署流程：

```text
GitHub repository
  -> Cloudflare Pages Git integration
  -> Vue/Vite PWA frontend
  -> Google Apps Script Web App API
  -> Google Sheets
```

Cloudflare Pages 設定：

方案 A：Cloudflare Root directory 留空，使用根目錄 build script。

```text
Framework preset: Vite
Root directory: 
Build command: npm run build
Build output directory: dist
Production branch: main
```

方案 B：直接指定前端目錄。

```text
Framework preset: Vite
Root directory: frontend
Build command: npm run build
Build output directory: dist
Production branch: main
```

若 Cloudflare log 出現 `Could not read package.json` 且路徑是 `/opt/buildhome/repo/package.json`，代表 Cloudflare 正在 repo 根目錄執行 build。此時請使用方案 A，或把 Root directory 改成 `frontend`。

本專案已在 `frontend/public/_redirects` 加入 SPA fallback：

```text
/* /index.html 200
```

因此使用 Vue Router 的路徑，例如 `/records`、`/settings`，在 Cloudflare Pages 重新整理時不會 404。

第一次推到 GitHub：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPO.git
git push -u origin main
```

推上 GitHub 後，到 Cloudflare Pages 選擇「Connect to Git」，連接該 repository，並套用上方 build 設定。

## MVP 功能

- 車輛列表、新增車輛、車輛詳情
- 里程新增與歷史列表
- 加油紀錄新增與列表，自動計算總金額、單價、公升數、有效油耗與每公里成本
- 保養紀錄新增與列表，自動推算下次保養里程與日期
- 保養模板新增與列表
- 保養狀態計算與排序
- Dashboard summary 與月度費用圖表
- IndexedDB 離線新增佇列，網路恢復後同步

## 注意

Google Sheets 是唯一主要資料來源；IndexedDB 僅用於快取與待同步資料。附件上傳、權限細分、提醒通知與報表匯出保留為第二階段。
