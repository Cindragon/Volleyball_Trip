# 🏐 VolleyTrip — 排球球迷朝聖旅遊規劃器

> 規劃你的兩天一夜排球聖地之旅：選擇球隊 → 探索主場周邊 → 建立行程 → 地圖視覺化

---

## 專案簡介

VolleyTrip 是一款地圖功能導向的全端應用，專為排球球迷設計。  
你可以選擇義大利、日本、波蘭、土耳其四大頂級聯賽的任一球隊，  
查看其主場位置，搜尋周邊景點、餐廳與住宿，並規劃一趟 **兩天一夜的球星朝聖行程**。

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 🗺️ 地圖整合 | Google Maps 顯示球場位置與行程停靠點 |
| 📍 周邊搜尋 | 透過 Google Places API 搜尋景點、餐廳、飯店 |
| 🔐 帳密登入 | 本地帳號註冊 / 登入，JWT 身份驗證 |
| 📋 行程 CRUD | 建立、編輯、刪除行程及每日停靠點 |
| 🏐 50 支球隊 | 涵蓋四國頂級聯賽完整球隊資料 |
| 🌙 深色主題 | Sports editorial 風格 UI 設計 |

---

## 技術架構

### 前端
- **框架**：React 19 + TypeScript（Vite 8）
- **UI**：Material UI v7 + TailwindCSS v4
- **路由**：React Router v6
- **HTTP**：Axios
- **地圖**：`@vis.gl/react-google-maps`（Google 官方 React wrapper）

### 後端
- **框架**：Node.js + Express + TypeScript（tsx）
- **資料庫**：SQLite（Node.js 內建 `node:sqlite`，無需安裝）
- **認證**：JWT（jsonwebtoken）+ bcryptjs
- **Google Maps**：Places API 伺服器端代理（避免 API Key 外洩）

---

## 聯賽與球隊資料

| 聯賽 | 國家 | 球隊數 |
|------|------|--------|
| SuperLega 2025-26 | 🇮🇹 義大利 | 12 |
| SV.League 2024-25 | 🇯🇵 日本 | 10 |
| PlusLiga 2025-26 | 🇵🇱 波蘭 | 14 |
| Efeler Ligi 2025-26 | 🇹🇷 土耳其 | 14 |
| **總計** | | **50** |

---

## 專案結構

```
volleyball-trip/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts     # SQLite 連線（node:sqlite）
│   │   │   ├── schema.ts       # 資料表定義
│   │   │   └── seed.ts         # 球隊種子資料（50 支）
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT 驗證 middleware
│   │   ├── routes/
│   │   │   ├── auth.ts         # 註冊 / 登入 / /me
│   │   │   ├── teams.ts        # 球隊查詢 API
│   │   │   ├── itineraries.ts  # 行程 CRUD + 停靠點 CRUD
│   │   │   └── places.ts       # Google Places API 代理
│   │   └── index.ts            # Express 主程式
│   ├── data/                   # SQLite 資料庫檔案（gitignore）
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # React + Vite 前端
    ├── src/
    │   ├── components/
    │   │   ├── Layout/         # Navbar、Layout wrapper
    │   │   └── Teams/          # CreateItineraryDialog
    │   ├── context/
    │   │   └── AuthContext.tsx  # 全域登入狀態
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   ├── TeamsPage.tsx
    │   │   ├── TeamDetailPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── ItinerariesPage.tsx
    │   │   └── ItineraryDetailPage.tsx
    │   ├── services/
    │   │   └── api.ts           # Axios instance + 所有 API 呼叫
    │   ├── types/
    │   │   └── index.ts         # TypeScript 型別定義
    │   ├── theme.ts             # MUI 深色主題設定
    │   └── App.tsx              # 路由配置
    └── package.json
```

---

## API 端點

### 認證
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 註冊新帳號 |
| POST | `/api/auth/login` | 登入取得 JWT |
| GET  | `/api/auth/me` | 驗證 token 並取得使用者資訊 |

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
| PUT    | `/api/itineraries/:id` | 更新行程 |
| DELETE | `/api/itineraries/:id` | 刪除行程 |
| POST   | `/api/itineraries/:id/stops` | 新增停靠點 |
| PUT    | `/api/itineraries/:id/stops/:sid` | 更新停靠點 |
| DELETE | `/api/itineraries/:id/stops/:sid` | 刪除停靠點 |

### 地點（Google Places 代理）
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/places/nearby` | 搜尋球場周邊地點 |
| GET | `/api/places/photo` | 取得地點照片（代理，避免 Key 外洩） |

---

## 快速開始

### 環境需求
- Node.js 22 以上（需要內建 `node:sqlite` 模組）
- Google Maps API Key（需開啟 Maps JavaScript API、Places API）

### 後端設定

```bash
cd backend
cp .env.example .env
# 編輯 .env 填入你的 GOOGLE_MAPS_API_KEY 與 JWT_SECRET
npm install
npm run seed    # 初始化資料庫並種入 50 支球隊
npm run dev     # 啟動於 http://localhost:3001
```

### 前端設定

```bash
cd frontend
# 建立 .env 並填入 Google Maps Key
echo "VITE_GOOGLE_MAPS_KEY=你的API_KEY" > .env
npm install
npm run dev     # 啟動於 http://localhost:5173
```

---

## 環境變數

### 後端 `.env`
```env
PORT=3001
JWT_SECRET=自訂一組安全的隨機字串
GOOGLE_MAPS_API_KEY=你的_Google_Maps_API_Key
DB_PATH=./data/volleytrip.db
```

### 前端 `.env`
```env
VITE_GOOGLE_MAPS_KEY=你的_Google_Maps_API_Key
```

> ⚠️ 請勿將 `.env` 檔案提交至 Git。`.gitignore` 已設定忽略所有 `.env` 檔案。

---

## 資料庫結構

```sql
users            -- 使用者帳號（id, username, email, password_hash）
teams            -- 球隊資料（id, name, league, country, city, arena, lat, lng）
itineraries      -- 行程（id, user_id, team_id, title, visit_date, notes）
itinerary_stops  -- 停靠點（id, itinerary_id, name, lat, lng, day, order_index）
```

---

## 練習重點

本專案涵蓋以下全端開發技能：

- ✅ **前後端分離架構**：React SPA + RESTful API
- ✅ **本地帳密登入**：bcrypt 雜湊 + JWT 簽發與驗證
- ✅ **資料庫 CRUD**：SQLite + 自定義 schema + 關聯查詢
- ✅ **Google Maps API**：地圖顯示、標記、InfoWindow
- ✅ **Google Places API**：伺服器端代理搜尋周邊地點
- ✅ **TypeScript**：前後端全型別覆蓋
- ✅ **狀態管理**：React Context（全域 Auth）

---

## 授權

本專案為個人學習用途，僅供練習與參考。
