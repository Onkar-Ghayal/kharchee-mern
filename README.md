# 🚀 Kharchee — Full-Stack Shared Expense Management Application (MERN)

A modern, fast, and feature-rich shared expense tracking application built on the MERN stack with 1-tap UPI settlement, Group Bill Splitting, Financial Analytics, and WhatsApp payment reminders.

---

## 🏗️ Architecture

- **`server/`** — Node.js + Express + MongoDB (Mongoose) REST API with JWT Authentication, bcrypt, Helmet security, rate limiting, and OTP email verification.
- **`client/`** — React 18 + Vite with high-performance CSS design system, Chart.js financial analytics, and responsive mobile-first UI.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or free MongoDB Atlas cluster)

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
```
Configure your `.env` variables:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/kharcheDB
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
```
Run the development server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
cp .env.example .env
```
Configure your `.env` variables:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
Run the frontend:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Production Deployment Guide

### Step 1: Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a Database User and whitelist all IP addresses (`0.0.0.0/0`).
3. Copy your MongoDB connection string (e.g. `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/kharchee?retryWrites=true&w=majority`).

---

### Step 2: Backend Deployment (Render / Railway)

#### Deploying on Render (Web Service):
1. Push your repository to GitHub.
2. Log in to [Render](https://render.com) and click **New > Web Service**.
3. Connect your repository and configure:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add the following **Environment Variables**:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = *Your MongoDB Atlas connection string*
   - `JWT_SECRET` = *A strong random 32+ character string*
   - `CLIENT_URL` = `https://your-frontend.vercel.app` *(or Netlify URL)*
   - `EMAIL_USER` = *(Optional: Gmail address for sending OTPs)*
   - `EMAIL_PASS` = *(Optional: Gmail App Password)*
5. Click **Deploy**. Render will generate your backend URL (e.g., `https://kharchee-api.onrender.com`).

---

### Step 3: Frontend Deployment (Vercel / Netlify)

#### Deploying on Vercel:
1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In Project Settings:
   - **Root Directory:** `client`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://kharchee-api.onrender.com/api` *(Your Render backend URL)*
5. Click **Deploy**. Vercel will build and launch your site!

*(Note: SPA routing configuration is already set up in `client/vercel.json` and `client/public/_redirects`)*.

---

## ✨ Features Checklist
- [x] **Add & Manage Friends** with WhatsApp numbers & linked UPI IDs.
- [x] **Clear Financial Terminology:** You Will Get (Green) vs You Owe (Red).
- [x] **⚡ Split Group Bills:** Equal & Itemized Custom splits with safety confirmation.
- [x] **💳 1-Tap UPI Settle:** Direct deep-link payments to Google Pay, PhonePe, and Paytm.
- [x] **💬 WhatsApp Reminders:** 4 customized reminder templates with live chat preview.
- [x] **🧮 Built-in Smart Calculator:** On-the-spot receipt division with 1-tap auto-apply.
- [x] **📊 Financial Analytics & Insights:** Dynamic cash flow charts, bills paid & split KPIs.
- [x] **📜 Ledger History & Statements:** 1-click reversal & branded PDF/CSV export.
- [x] **👑 Executive Profile Settings:** Avatar photo uploads, Light/Dark appearance mode, and session management.
- [x] **🚀 First-Time Guided Tour:** 7-step interactive walkthrough.
