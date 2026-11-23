# VolleyTrip — 排球球迷朝聖旅遊規劃器

> 規劃你的兩天一夜排球聖地之旅：選擇球隊 → 探索主場周邊 → 建立行程 → 地圖視覺化

**🌐 線上網址：<https://volleyball-trip.vercel.app>**

| 項目 | 網址 |
|------|------|
| 網站 | <https://volleyball-trip.vercel.app> |
| API 健康檢查 | <https://volleyball-trip.vercel.app/api/health> |
| 原始碼 | <https://github.com/Cindragon/Volleyball_Trip> |

> 瀏覽球隊與地圖不需登入；建立行程請先註冊帳號。API 透過前端網域的 `/api` 轉發到後端，細節見「部署（Vercel）」。

---

## 專案簡介

VolleyTrip 是一款地圖功能導向的全端應用，專為排球球迷設計。  
你可以選擇義大利、日本、波蘭、土耳其四大頂級聯賽的任一球隊，  
查看其主場位置，搜尋周邊景點、餐廳與住宿，並規劃一趟 **兩天一夜的球星朝聖行程**。

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 地圖整合 | Google Maps 顯示球場位置與行程停靠點 |
| 周邊搜尋 | Google Places API + 手工策展景點資料雙層備援 |
| 帳密登入 | 本地帳號註冊 / 登入 / 修改密碼，JWT 存在 httpOnly cookie（前端程式讀不到），可一鍵登出所有裝置 |
| 行程 CRUD | 建立、編輯、刪除行程及每日停靠點 |
| 50 支球隊 | 涵蓋四國頂級聯賽完整球隊資料 |
| 管理後台 | 管理員可新增/刪除球隊、策展景點、管理會員 |
| 明亮 UI | FixIt 風格極簡明亮介面（花青藍 + 蓮瓣紅） |
| 安全與穩定 | 統一錯誤處理、輸入驗證、CSRF 防護、安全性 header（CSP、禁止被 iframe 嵌入）、跨 instance 共用的速率限制、登入失效自動登出；部署新版後自動重新載入，不會白畫面 |

---

## 技術架構

### 前端
- **框架**：React 19 + TypeScript（Vite）
- **UI**：Material UI v9 + TailwindCSS v4
- **路由**：React Router v7
- **HTTP**：Axios
- **地圖**：`@vis.gl/react-google-maps`（Google 官方 React wrapper）

### 後端
- **框架**：Node.js + Express + TypeScript（tsx watch）
- **資料庫**：Neon PostgreSQL（Serverless）— 使用 `@neondatabase/serverless` 驅動，透過 `DATABASE_URL` 連線
- **認證**：JWT（jsonwebtoken）+ bcryptjs，JWT 放在 httpOnly cookie；登入 / 註冊有速率限制（express-rate-limit，Vercel 上計數存在 Postgres）
- **Google Maps**：Places API 伺服器端代理（避免 API Key 外洩）

---

## 聯賽與球隊資料

| 聯賽 | 國家 | 球隊數 |
|------|------|--------|
| SuperLega 2025-26 | 義大利 | 12 |
| SV.League 2024-25 | 日本 | 9 |
| PlusLiga 2025-26 | 波蘭 | 14 |
| Efeler Ligi 2025-26 | 土耳其 | 13 |
| **總計** | | **50** |

---

## 專案結構

```
volleyball-trip/
├── start-all.sh                # 一鍵啟動前後端腳本
├── .github/workflows/ci.yml    # CI：後端型別檢查 + 測試、前端 lint + build
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts     # Neon PostgreSQL 連線（@neondatabase/serverless）
│   │   │   ├── schema.ts       # 資料表定義
│   │   │   ├── seed.ts         # 球隊種子資料（50 支）+ 預設 admin
│   │   │   └── curatedPlaces.ts# 手工策展景點資料（25+ 城市）
│   │   ├── auth/
│   │   │   └── session.ts      # session cookie 讀寫、JWT 簽發 / 驗證、CSRF 檢查
│   │   ├── middleware/
│   │   │   ├── auth.ts         # requireAuth / requireAdmin middleware
│   │   │   ├── asyncRouter.ts  # 自動包裝 async handler、驗證 :id 參數
│   │   │   ├── errorHandler.ts # 全域錯誤處理（不外洩內部錯誤）
│   │   │   ├── rateLimit.ts    # 登入 / 照片代理速率限制
│   │   │   └── postgresRateLimitStore.ts # 速率限制計數存在 Postgres（跨 instance 共用）
│   │   ├── routes/
│   │   │   ├── auth.ts         # 註冊 / 登入 / 登出 / /me
│   │   │   ├── teams.ts        # 球隊查詢 API
│   │   │   ├── itineraries.ts  # 行程 CRUD + 停靠點 CRUD
│   │   │   ├── places.ts       # Google Places API 代理 + 備援資料
│   │   │   └── admin.ts        # 管理員專用 API（球隊/景點/會員）
│   │   ├── app.ts              # Express app（路由、CORS、錯誤處理）
│   │   └── index.ts            # 本機啟動入口（初始化 schema 後 listen）
│   ├── api/index.ts            # Vercel serverless 入口
│   ├── test/                   # API 與速率限制 store 測試（vitest + supertest，資料庫為 mock）
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # React + Vite 前端
    ├── src/
    │   ├── components/
    │   │   ├── Layout/         # Navbar、Layout wrapper
    │   │   ├── Itinerary/      # 行程頁元件：TripMap、StopCard、AddStopDialog、EditItineraryDialog
    │   │   ├── Admin/          # 後台元件：Teams / Places / Users 表格、分頁、新增球隊 / 景點對話框
    │   │   └── ErrorBoundary.tsx # 攔截畫面錯誤；部署新版後自動重新載入
    │   ├── context/
    │   │   ├── AuthContext.tsx # 全域登入狀態（AuthProvider）
    │   │   └── useAuth.ts      # useAuth hook
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   ├── TeamsPage.tsx
    │   │   ├── TeamDetailPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── ItinerariesPage.tsx
    │   │   ├── ItineraryDetailPage.tsx # 行程詳情（載入資料、分天切換，畫面交給 components/Itinerary）
    │   │   └── AdminPage.tsx   # 管理後台（需 is_admin；表格與對話框在 components/Admin）
    │   ├── services/
    │   │   └── api.ts          # Axios instance + 所有 API 呼叫
    │   ├── types/
    │   │   └── index.ts        # TypeScript 型別定義
    │   ├── utils/
    │   │   ├── errors.ts       # 取出 API 錯誤訊息
    │   │   ├── chunkReload.ts  # 偵測舊版程式檔載入失敗並重新整理一次
    │   │   ├── limits.ts       # 表單欄位長度上限（與後端 utils/limits.ts 一致）
    │   │   ├── stopCategory.ts # 搜尋類型 → 停靠點類別
    │   │   └── tripMap.ts      # 行程地圖中心點計算
    │   ├── config/
    │   │   └── maps.ts         # Google Maps Key 與 Map ID（讀取環境變數）
    │   ├── theme.ts            # MUI 明亮主題（花青藍 #2376b7）
    │   ├── test/               # 測試設定（setup.ts）與共用測試資料（fixtures.ts）
    │   └── App.tsx             # 路由配置（頁面 lazy 載入）+ RequireAuth / RequireAdmin
    ├── vercel.json             # SPA fallback、/api 轉發到後端、安全性 header（CSP 等）
    └── package.json
```

---

## 快速開始

### 環境需求
- Node.js **22.12 以上的 22.x**（版本寫在根目錄 `.nvmrc`，用 nvm / fnm 執行 `nvm use` 即可切換；`package.json` 的 `engines` 也會在版本不符時警告）
- [Neon](https://neon.tech) PostgreSQL 資料庫（免費方案即可）
- Google Maps API Key（需開啟 Maps JavaScript API、Places API）

### 一鍵啟動（推薦）

完成各自的 `.env` 設定後，在專案根目錄執行：

```bash
bash start-all.sh
```

前端 → http://localhost:5173  
後端 → http://localhost:3001  
按 `Ctrl+C` 同時關閉前後端。

---

### 手動啟動

#### 後端設定

```bash
cd backend
cp .env.example .env
# 編輯 .env，填入 DATABASE_URL、GOOGLE_MAPS_API_KEY 與 JWT_SECRET
npm install
npm run migrate # 在 Neon 上建立資料表
npm run seed    # 種入 50 支球隊、建立預設 admin
npm run dev     # 啟動於 http://localhost:3001
```

#### 前端設定

```bash
cd frontend
npm install
cp .env.example .env
# 編輯 .env，填入 VITE_GOOGLE_MAPS_KEY（與選填的 VITE_GOOGLE_MAP_ID）
npm run dev     # 啟動於 http://localhost:5173
```

---

## 環境變數

### 後端 `backend/.env`
```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=3001
JWT_SECRET=自訂一組安全的隨機字串   # 至少 16 字元，否則後端無法啟動
GOOGLE_MAPS_API_KEY=你的_Google_Maps_API_Key
FRONTEND_URL=https://your-app.vercel.app
ADMIN_EMAILS=你的email@example.com   # 逗號分隔，用這些 email 註冊時自動設為 admin
TRUST_PROXY=0                         # 經由 ngrok 等反向代理時設為 1（Vercel 上自動啟用）
RATE_LIMIT_STORE=                     # 選填：postgres | memory；未設定時 Vercel 用 postgres、本機用 memory
SEED_ADMIN_EMAIL=admin@volleytrip.local   # 選填，npm run seed 建立的管理員 email
SEED_ADMIN_PASSWORD=                  # 選填，未設定時隨機產生並只顯示一次（見「預設管理員帳號」）
```

### 前端 `frontend/.env`
```env
VITE_GOOGLE_MAPS_KEY=你的_Google_Maps_API_Key
VITE_GOOGLE_MAP_ID=你的_Map_ID              # 選填，未設定時使用 DEMO_MAP_ID（僅適合本機開發）
VITE_API_BASE_URL=http://localhost:3001   # 選填，只用於景點照片網址（直接向後端載入）；API 呼叫一律走同網域 /api
```

> Vite 只在啟動時讀取 `.env`，修改後請重新執行 `npm run dev`。

### Google Maps 設定

在 [Google Cloud Console](https://console.cloud.google.com/apis/dashboard) 完成以下設定，否則地圖可能顯示 `ApiProjectMapError`：

1. **啟用 API**：Maps JavaScript API（前端地圖）、Places API（後端周邊搜尋）
2. **綁定帳單帳戶**：Google Maps 必須啟用帳單（有每月免費額度）
3. **建立 Map ID**：Google Maps Platform → Map Management → Create Map ID，類型選 **JavaScript / Vector**，填入 `VITE_GOOGLE_MAP_ID`。地圖上的 AdvancedMarker 需要有效的 Map ID
4. **前後端各用一把金鑰並設定限制**：

| 金鑰 | 應用程式限制 | API 限制 |
|------|-------------|----------|
| 前端 `VITE_GOOGLE_MAPS_KEY` | HTTP referrers：`http://localhost:5173/*`、`https://你的網域.vercel.app/*` | Maps JavaScript API |
| 後端 `GOOGLE_MAPS_API_KEY` | 不可用 HTTP referrer（伺服器呼叫不帶 referrer），可選 None 或 IP 限制 | Places API |

設定變更可能需要幾分鐘才會生效。

**疑難排解**：打開瀏覽器主控台查看 Google Maps 的錯誤訊息。
- 出現 `NoApiKeys` 或 `[VolleyTrip] VITE_GOOGLE_MAPS_KEY is not set`：前端沒有讀到金鑰，請確認 `frontend/.env` 存在、已填入 `VITE_GOOGLE_MAPS_KEY`，並重新啟動 `npm run dev`
- 出現 `RefererNotAllowedMapError`：金鑰的 HTTP referrer 清單沒有包含目前網址
- 出現 `ApiNotActivatedMapError`：專案尚未啟用 Maps JavaScript API

> 請勿將 `.env` 檔案提交至 Git。`.gitignore` 已設定忽略所有 `.env` 檔案。

---

## 預設管理員帳號

執行 `npm run seed` 時，如果資料庫裡還沒有管理員帳號，會自動建立一個。密碼**不會**寫在程式碼裡：

| 欄位 | 值 |
|------|-----|
| Email | `SEED_ADMIN_EMAIL`，未設定時為 `admin@volleytrip.local` |
| 密碼 | `SEED_ADMIN_PASSWORD`；未設定時隨機產生，**只在終端機顯示一次** |

- 忘記密碼或要更換：在 `backend/.env` 設定 `SEED_ADMIN_PASSWORD`（至少 8 字元）後重新執行 `npm run seed`，會更新既有管理員的密碼。
- 舊版本建立的管理員密碼是公開的 `admin123`，請用上面的方式換掉。

------|-----|
| Email | `admin@volleytrip.local` |
| 密碼 | `admin123` |

> 首次登入後請立即修改密碼。

---

## API 端點

### 認證
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 註冊新帳號，並設定 session cookie |
| POST | `/api/auth/login` | 登入並設定 session cookie（email 不分大小寫） |
| POST | `/api/auth/logout` | 清除這個裝置的 session cookie |
| POST | `/api/auth/logout-all` | 登出所有裝置：讓這個帳號之前發出的所有 token 失效（需登入） |
| PUT  | `/api/auth/password` | 修改密碼（`current_password`、`new_password`）；其他裝置會被登出，目前裝置取得新的 cookie |
| GET  | `/api/auth/me` | 取得目前使用者；未登入時回傳 `{ "user": null }` |

**Session 與 CSRF**
- 登入 / 註冊成功後，JWT 只放在 `vt_session` cookie（`HttpOnly`、`SameSite=Lax`、`Path=/api`，正式環境加上 `Secure`），回應內容不含 token，前端 JavaScript 讀不到。
- 用 cookie 驗證的寫入請求（POST / PUT / PATCH / DELETE）必須帶 `X-Requested-With` header，否則回傳 403；前端的 axios 已預設帶上。
- 給 API 工具或測試使用時，仍可改用 `Authorization: Bearer <jwt>` header。
- **撤銷 session**：`users.token_version` 記錄目前的版本，token 內帶著簽發時的版本（`tv`）。每次請求都會比對，不一致就回傳 401 `Session has been revoked`。「登出所有裝置」與「修改密碼」（都在導覽列帳號選單）會把版本加 1，讓所有裝置上的舊 token 立即失效；舊版沒有 `tv` 的 token 視為版本 0。
- 新欄位由 `src/db/upgrades.ts` 在每個 instance 第一次用到時自動加上（`ADD COLUMN IF NOT EXISTS`），Vercel 部署不需要先手動 migrate。

### 球隊
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/teams` | 取得所有球隊（支援 `?league=` `?country=` 篩選） |
| GET | `/api/teams/leagues` | 依國家分組的聯賽清單 |
| GET | `/api/teams/:id` | 單一球隊詳細資訊 |

### 行程（需登入）
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET    | `/api/itineraries` | 取得我的行程列表 |
| POST   | `/api/itineraries` | 建立新行程 |
| GET    | `/api/itineraries/:id` | 取得行程詳情（含停靠點） |
| PUT    | `/api/itineraries/:id` | 更新行程（只更新有帶的欄位；`notes` 送空字串或 `null` 會清除） |
| DELETE | `/api/itineraries/:id` | 刪除行程 |
| POST   | `/api/itineraries/:id/stops` | 新增停靠點 |
| PUT    | `/api/itineraries/:id/stops/:sid` | 更新停靠點（`notes` / `address` 可清除） |
| DELETE | `/api/itineraries/:id/stops/:sid` | 刪除停靠點 |

### 地點（Google Places 代理）
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/places/nearby` | 搜尋球場周邊地點（Google + 策展備援） |
| GET | `/api/places/photo` | 取得地點照片代理（`ref` 必填、`maxwidth` 1–1600；每 IP 每分鐘 60 次） |

### 管理員（需 is_admin，需登入）
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST   | `/api/admin/teams` | 新增球隊 |
| DELETE | `/api/admin/teams/:id` | 刪除球隊（連同行程） |
| GET    | `/api/admin/places?limit=&offset=` | 分頁取得策展景點（回傳 `places`、`total`） |
| POST   | `/api/admin/places` | 新增策展景點 |
| DELETE | `/api/admin/places/:id` | 刪除策展景點 |
| GET    | `/api/admin/users?limit=&offset=` | 分頁取得會員（回傳 `users`、`total`） |
| PATCH  | `/api/admin/users/:id/status` | 停用 / 啟用帳號 |
| PATCH  | `/api/admin/users/:id/admin` | 設定 / 移除管理員權限 |

> 分頁參數：`limit` 1–100（預設 25）、`offset` ≥ 0（預設 0），格式錯誤回傳 400。後台的「Places」與「Members」分頁表格使用這兩個參數，超過一頁時下方會出現分頁控制。

### 輸入驗證規則
| 欄位 | 規則 |
|------|------|
| `:id` / `:sid` | 正整數 |
| `email` | 會先 trim 並轉小寫；email 與 username 重複檢查不分大小寫 |
| `password` | 新密碼（註冊、修改密碼）至少 8 字元、最多 72 bytes（bcrypt 上限）；既有較短的密碼仍可登入 |
| `visit_date` | 合法的 `YYYY-MM-DD`（`2026-02-31` 這類日期會被拒絕） |
| `title` / 停靠點 `name` | 不可為空白 |
| `team_id` | 正整數 |
| 停靠點 `day` | `1` 或 `2` |
| 停靠點 `order_index` | 非負整數 |
| 停靠點 `lat` / `lng` | 數字，範圍 ±90 / ±180 |

### 錯誤回應格式

所有錯誤都回傳 `{ "error": "訊息" }`，不會外洩資料庫等內部錯誤細節。

| 狀態碼 | 情境 |
|--------|------|
| 400 | 輸入驗證失敗、id 格式錯誤、JSON 格式錯誤 |
| 401 | 未登入、token 無效、過期或已被撤銷（前端會自動登出並導回登入頁） |
| 403 | 帳號已停用、非管理員、不允許的 CORS 來源、cookie 寫入請求缺少 `X-Requested-With` |
| 404 | 資源或路由不存在 |
| 409 | 資料重複（如 email / username 已被使用） |
| 422 | 註冊 / 登入欄位格式錯誤 |
| 429 | 超過速率限制：登入 / 註冊 / 修改密碼每個「IP + 帳號」15 分鐘內最多 10 次失敗嘗試（IPv6 以 /56 網段計算，換位址無法繞過）；照片代理每 IP 每分鐘 60 次 |
| 500 | 未預期的伺服器錯誤（詳細內容只寫入伺服器 log） |
| 503 | 未設定 Google Maps API Key 時呼叫照片代理 |

> 在 Vercel 上，速率限制的計數存在 Postgres 的 `rate_limits` 資料表，所有 serverless instance 共用（第一次使用時自動建表）；本機與測試使用記憶體。資料庫暫時連不上時會放行請求，不會把所有人擋在登入頁外。

---

## 資料庫（Neon PostgreSQL）

### 為什麼選擇 Neon？

[Neon](https://neon.tech) 是 Serverless PostgreSQL 服務，適合部署在 Vercel 等 Serverless 平台：
- **Serverless 驅動**：使用 `@neondatabase/serverless` 套件，透過 HTTP 發送 SQL，無需維持長連線
- **免費方案**：提供 0.5 GB 儲存空間，適合個人專案
- **與 Vercel 整合良好**：同為 Serverless 架構，冷啟動快速

### 連線方式

```ts
// backend/src/db/database.ts
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

// 使用 Tagged Template 語法執行查詢（自動參數化，防 SQL Injection）
const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

### 資料表結構

```sql
users            -- 使用者帳號（id, username, email, password_hash, is_admin, is_active）
teams            -- 球隊資料（id, name, league, country, city, arena, lat, lng）UNIQUE(name, league)
itineraries      -- 行程（id, user_id, team_id, title, visit_date, notes）
itinerary_stops  -- 停靠點（id, itinerary_id, name, lat, lng, day, order_index）
admin_places     -- 管理員策展景點（id, city, name, lat, lng, category, rating）
```

### 資料表關聯

```
users ──1:N──→ itineraries ──1:N──→ itinerary_stops
teams ──1:N──→ itineraries
users ──1:N──→ admin_places（created_by）
```

### 常用指令

```bash
npm run migrate  # 執行 schema.ts，建立所有資料表（CREATE TABLE IF NOT EXISTS）
npm run seed     # 執行 seed.ts，寫入 50 支球隊 + 預設 admin 帳號
```

---

## 測試與 CI

```bash
cd backend
npm test           # vitest + supertest，資料庫為 mock，不會連到 Neon
npm run typecheck

cd ../frontend
npm run lint
npm test           # vitest + Testing Library（jsdom）：API client、登入狀態、受保護路由、行程頁（分天、刪除停靠點、新增 / 編輯流程）
npm run build
```

每次 push 到 `main` 或開 PR 時，GitHub Actions（`.github/workflows/ci.yml`）會自動執行上述檢查，Node 版本同樣讀取 `.nvmrc`。

### 相依套件安全性

定期在 `backend/` 與 `frontend/` 執行 `npm audit --omit=dev`，確認正式環境用到的套件沒有已知漏洞（目前兩邊都是 0）。

**Dependabot**（`.github/dependabot.yml`）每週一自動檢查 `backend/`、`frontend/` 的 npm 套件，每月檢查 GitHub Actions：
- **互相依賴的套件綁在同一個 PR 一起升級（包含 major）**：前端的 ESLint 全家（`eslint`、`@eslint/*`、`typescript-eslint`、`eslint-plugin-*`）、React、MUI、Vite / Vitest / Testing Library / Tailwind；後端的 Express 相關（含 `express-rate-limit`、`helmet`、`cors`）、測試工具。避免像 `@eslint/js` 10 單獨合併、`eslint` 還停在 9 而讓 CI 壞掉的狀況。
- 其他套件：minor / patch 合併成一個 PR，major 版本各自獨立成 PR，方便看 changelog。
- `@types/node` 不自動升 major，型別版本應跟著實際執行的 Node 版本（`.nvmrc`）。
- 前端暫時不升 TypeScript 7：`typescript-eslint` 8.x 只支援 TypeScript 6.1 以下，裝 TS 7 會讓 `npm install` 失敗。等 `typescript-eslint` 支援 TS 7 後，再把 `dependabot.yml` 裡的這條忽略規則拿掉。
- 有安全漏洞的套件，GitHub 會另外開 security update PR（需在 repo 的 Settings → Code security 開啟 Dependabot security updates）。

### 合併規則（分支保護）

`main` 已開啟分支保護，GitHub 會自動把關：
- 必須透過 PR 合併，且 `backend`、`frontend` 兩個 CI 都通過才能合併（只認 GitHub Actions 回報的結果）。
- PR 分支必須跟上最新的 `main`（落後時按「Update branch」），CI 會在合併後的結果上執行，避免兩個各自通過的 PR 合在一起才壞掉。
- 管理員也適用；禁止 force push 與刪除 `main`；PR 上的討論需標記為已解決。
- **解衝突時兩邊都保留**：每個 PR 通常會新增自己的程式或測試區塊（例如 `backend/test/api.test.ts` 的 `describe`），在 GitHub 網頁解衝突時不要只留其中一邊；解完後確認 CI 的測試數量沒有變少。
- Major 升級合併前先看 changelog，一次合併一個。

- 後端用 `package.json` 的 `overrides` 把 Express 間接使用的 `qs` 固定在已修補版本（`^6.17.1`）。
- `npm audit`（含開發工具）仍會列出 `picomatch` / `esbuild` 的警告：它們只在 vite、vitest、tsx 等開發工具中使用，不會部署到正式環境，且 `picomatch` 目前所有版本都被標記、尚無修補版。請不要執行 `npm audit fix --force`，它會把 vite / vitest 降版。

---

## 部署（Vercel）

前端與後端是兩個 Vercel 專案：

| 專案 | 網址 | Root Directory |
|------|------|----------------|
| 前端 | `https://volleyball-trip.vercel.app` | `frontend` |
| 後端 | `https://volleyball-trip-7gmb.vercel.app` | `backend` |

`*.vercel.app` 的各個子網域對瀏覽器來說是**不同網站**，後端直接設定的 cookie 會被當成第三方 cookie（Safari 等瀏覽器會擋）。因此 `frontend/vercel.json` 把 `/api/*` 轉發到後端，讓瀏覽器只跟前端網域溝通，session cookie 維持第一方：

```json
{ "source": "/api/:path*", "destination": "https://volleyball-trip-7gmb.vercel.app/api/:path*" }
```

- 後端網址改變時，記得一起修改 `frontend/vercel.json`。
- 前端專案的 `VITE_API_BASE_URL` 請設為後端網址：只用於景點照片，讓照片直接向後端載入，後端可依訪客的真實 IP 做速率限制。
- 部署後請實際測試：登入 → 重新整理仍保持登入 → 登出。

### 安全性 header

- **前端**（`frontend/vercel.json`）：`Content-Security-Policy`（只允許本站與 Google Maps 的網域）、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`。`/assets/*` 設為長期快取，且不會被導向 `index.html`，舊版檔案不存在時會正確回 404。
- **後端**：使用 `helmet`，移除 `X-Powered-By`，API 回應套用最嚴格的 CSP；`Cross-Origin-Resource-Policy` 設為 `cross-origin`，讓前端可以載入景點照片。
- 修改 CSP 後可在本機用正式版設定測試：`cd frontend && npm run build && npm run preview`（`vite preview` 會套用 `vercel.json` 裡同樣的 header）。注意 Google Maps 金鑰的 HTTP referrer 若只允許 `localhost:5173`，在 preview 的 4173 port 地圖會顯示 `RefererNotAllowedMapError`，可暫時把 `http://localhost:4173/*` 加進金鑰限制。

### 部署新版時不會白畫面

頁面是按需載入的，部署後舊版的程式檔會消失。如果使用者的分頁是在部署前打開的，切換頁面時會載入失敗；`ErrorBoundary` 與 `vite:preloadError` 會偵測到並自動重新整理一次，載入新版。其他非預期錯誤則顯示「Something went wrong」與重新載入按鈕，不會整頁空白。

---

## 技術練習重點

- **前後端分離架構**：React SPA + RESTful API
- **本地帳密登入**：bcrypt 雜湊 + JWT 簽發與驗證
- **角色權限控管**：is_admin / is_active 軟刪除 + requireAdmin middleware
- **資料庫 CRUD**：Neon PostgreSQL + 自定義 schema + 關聯查詢 + UNIQUE 約束
- **Google Maps API**：地圖顯示、標記、InfoWindow
- **Google Places API**：伺服器端代理 + 策展資料備援機制
- **TypeScript**：前後端全型別覆蓋
- **錯誤處理**：async handler 自動包裝 + 全域 error handler，Postgres 錯誤對應 4xx
- **API 安全**：輸入驗證、速率限制（express-rate-limit）、啟動時檢查 `JWT_SECRET`
- **自動化測試**：後端 vitest + supertest（mock 資料庫）、前端 vitest + Testing Library，GitHub Actions CI
- **Session 安全**：httpOnly cookie + SameSite + CSRF header 檢查，前端與 API 同網域（Vite proxy / Vercel rewrite）
- **效能**：路由層級 code splitting（`React.lazy`），主程式 bundle 從約 700 kB 降到約 270 kB；外鍵欄位建立索引（「我的行程」、行程停靠點、刪除時的 cascade）
- **狀態管理**：React Context（全域 Auth）
- **無障礙**：所有圖示按鈕與開關都有 `aria-label`（例如「Delete trip …」「Account menu for …」），帳號選單提供 `aria-haspopup` / `aria-expanded`

---

## 授權

本專案為個人學習用途，僅供練習與參考。
