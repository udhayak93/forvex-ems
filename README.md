# Forvex EMS — Enterprise HR & Payroll Suite

An enterprise-grade **Human Resource & Monthly Payroll Management System** built with **React**, **Node.js/Express**, and **MongoDB Atlas**, featuring:
- 🇮🇳 Full Indian Regulatory & Statutory Payroll Engine (EPF, ESI, Professional Tax, TDS Slabs, PAN/UAN compliance, ₹ Lakhs/Crores grouping).
- 📊 Interactive Visual Analytics:
  - **Weekly Attendance Trend**: Smooth Area/Line Chart with daily hover tooltips and 7-day filter.
  - **Department Performance**: Horizontal animated progress visualizer with completion rates.
  - **8 Metric StatCards**: Embedded SVG Sparklines (cubic Bézier curves & mini bar blocks) with trend percentages (`+12%`, `+3%`, `-2%`, `Static`).
  - **Department Payroll Outlay**: Grouped Bar Chart Graph with Net Outlay, Gross Outlay, and Headcount toggles.
  - **Budget Allocation Share**: Interactive Donut / Pie Chart Graph with center hub and dynamic slice legends.
  - **Recent Notifications Feed**: Category badges (🎂 Birthday, 📅 Leave, 💵 Payroll, 👤 Onboarding) with All/Unread filter.
- 🔐 Strict Role-Based Access Control (Admin, HR, Payroll Manager, Employee Self-Service).
- 📱 100% Responsive Design: Offcanvas drawer navigation on mobile/tablet, scrollable filter bars, and horizontal data tables.
- 📄 Automated One-Click PDF Payslip Generator (`html2canvas` + `jspdf`).

---

## 🔑 Master Admin & Access Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **👑 Master Admin & HR** | `udhaya@gmail.com` | `udhaya@123` | Full administrative control, employee management, payroll processing, audit logs |
| **💰 Payroll Lead** | `payroll@nexus.co.in` | `Payroll@123` | Payroll generation, salary rules & disbursement |
| **👥 HR Manager** | `hr@nexus.co.in` | `Hr@123` | Workforce directory, department configs & leave approvals |
| **👤 Employee (Self-Service)** | `rahul.sharma@nexus.co.in` | `Employee@123` | Read-only personal payslips, attendance ledger & leave applications |

---

## 💻 1. Local Setup & Execution

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Free MongoDB Atlas cluster or local MongoDB instance

### Quick Start (from Root Directory)
```bash
# 1. Clone or open the project folder
cd nexus-ems

# 2. Install all dependencies (Backend + Frontend)
npm run install:all

# 3. Setup Backend Environment Variables
cp backend/.env.example backend/.env
# (Your MongoDB connection string is pre-configured in backend/.env)

# 4. (Optional) Seed Initial Data
npm run seed

# 5. Run Backend & Frontend in separate terminals:
# Terminal 1 (Backend - Port 5001):
npm run start:backend

# Terminal 2 (Frontend - Port 5173):
npm run dev:frontend
```

Once running:
- Open your browser at: **`http://localhost:5173`**
- Login using `udhaya@gmail.com` / `udhaya@123`

### Automated Tests
```bash
# Run both Backend & Frontend tests
npm test

# Run Backend tests only (13 tests):
npm run test:backend

# Run Frontend tests only (11 tests):
npm run test:frontend
```

---

## 🐙 2. Posting to GitHub

Follow these steps to upload this complete repository to your personal GitHub account:

### Step 1: Create a new repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Enter Repository name: `forvex-ems` (or `nexus-ems`).
3. Set visibility to **Public** (or **Private**).
4. **Do NOT** check "Initialize with README", .gitignore, or license (we already have them).
5. Click **Create repository**.

### Step 2: Initialize, Commit, and Push
In your project terminal:
```bash
# 1. Initialize git (if not already done)
git init -b main

# 2. Add all files (.gitignore already protects node_modules and .env)
git add .

# 3. Create initial commit
git commit -m "feat: complete Forvex EMS full version with charts, responsive UI and deployment configs"

# 4. Link your GitHub remote (replace with your GitHub username & repo URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/forvex-ems.git

# 5. Push to GitHub main branch
git push -u origin main
```

---

## 🚀 3. Deploy Backend to Render (Web Service)

The backend runs as a Node.js web service on [Render.com](https://render.com).

### Step-by-Step Instructions:
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`forvex-ems`).
4. Configure the settings:
   - **Name**: `forvex-ems-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node src/server.js`)
   - **Plan**: `Free`
5. Click **Advanced** > **Add Environment Variable**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render default port |
   | `MONGODB_URI` | `mongodb+srv://nexus_ems_user:uk1234@todocluster.ae0cziu.mongodb.net/nexus_ems?retryWrites=true&w=majority&appName=TodoCluster` | MongoDB Atlas URI |
   | `JWT_SECRET` | `forvex_ems_super_secure_jwt_secret_2026` | Random secure string |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry |
   | `CLIENT_URL` | `*` | Or your Vercel URL once deployed |
6. Click **Create Web Service**.
7. Once deployed, copy your Render service URL:  
   👉 `https://forvex-ems-backend.onrender.com`

---

## ▲ 4. Deploy Frontend to Vercel

The frontend is a Vite SPA optimized for [Vercel](https://vercel.com) with single-page app routing pre-configured in `frontend/vercel.json`.

### Step-by-Step Instructions:
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository (`forvex-ems`).
4. In the **Configure Project** screen:
   - **Project Name**: `forvex-ems`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build and Output Settings**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
5. Open **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://forvex-ems-backend.onrender.com/api` *(use your actual Render backend URL followed by `/api`)* |
6. Click **Deploy**.
7. In ~30 seconds, your application will be live at:  
   👉 `https://forvex-ems.vercel.app`

---

## 🛠️ Project Architecture

```
nexus-ems/
├── package.json               # Root monorepo scripts (dev, test, install, seed)
├── render.yaml                # Render Infrastructure-as-Code blueprint
├── .gitignore                 # Monorepo gitignore (protects secrets and node_modules)
├── README.md                  # Comprehensive Documentation & Setup Guide
├── backend/                   # Express & MongoDB Backend
│   ├── .env.example           # Backend environment template
│   ├── src/
│   │   ├── config/db.js       # MongoDB Atlas connection
│   │   ├── controllers/       # Auth, Employees, Payroll, Reports, Attendance
│   │   ├── middleware/        # JWT Auth, Role RBAC & Error Handlers
│   │   ├── models/            # Mongoose Schemas (User, Employee, PayrollRecord, etc.)
│   │   ├── routes/            # REST API endpoints
│   │   └── server.js          # Express app entry & permissive CORS
│   └── tests/                 # Jest backend test suite (13 passing tests)
└── frontend/                  # React + Vite Frontend
    ├── vercel.json            # Vercel SPA rewrites configuration
    ├── .env.example           # Frontend environment template
    ├── src/
    │   ├── components/
    │   │   ├── charts/        # LineChartGraph, BarChartGraph, PieChartGraph, Sparkline
    │   │   ├── common/        # StatCard, RecentNotificationsCard, StatusBadge, Loader
    │   │   ├── layout/        # Navbar (Role-Guarded), Sidebar (Mobile Drawer), Layout
    │   │   └── payroll/       # PayslipModal (PDF), RunPayrollModal, EditDraftModal
    │   ├── pages/             # Dashboard, Employees, Departments, Attendance, Payroll
    │   ├── services/          # Axios API clients
    │   ├── styles/            # Vanilla CSS Design System & Mobile Media Queries
    │   └── utils/             # Formatters (Indian Lakhs/Crores, ₹ currency, Dates)
    └── tests/                 # Vitest frontend test suite (11 passing tests)
```

---

## 📄 License
This project is licensed under the ISC License.
