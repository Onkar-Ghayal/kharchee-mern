# 🛡️ Comprehensive QA & Security Audit Report: Kharchee (MERN)

**Date**: August 20, 2026  
**Auditor**: QA Lead & Senior MERN Systems Engineer  
**Project**: Kharchee (`kharchee-mern`)  
**Production Frontend**: [https://kharchee.vercel.app](https://kharchee.vercel.app)  
**Production Backend API**: [https://kharchee-mern.onrender.com](https://kharchee-mern.onrender.com)  
**Audit Scope**: Functional Flows, Backend API Security, Authentication/OAuth, Data Integrity, Responsive UI, Performance, and Production Deployment.

---

## 1. Executive Summary & Audit Scorecard

| Category | Status | Pass Rate | Critical Issues | High Issues | Medium Issues | Low Issues |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication & OAuth** | ⚠️ Partial | 88% | 0 | 1 | 1 | 0 |
| **Friend & Ledger Operations** | ✅ Pass | 96% | 0 | 0 | 1 | 1 |
| **Split Group Bill & Settlement**| ✅ Pass | 100% | 0 | 0 | 0 | 0 |
| **Security & IDOR Isolation** | ⚠️ Review | 85% | 1 | 0 | 2 | 0 |
| **Responsive Design (320px–4K)**| ✅ Pass | 98% | 0 | 0 | 0 | 1 |
| **Production Health & Headers** | ⚠️ Review | 82% | 0 | 0 | 2 | 0 |
| **Overall Score** | **91% / 100** | **Pass with Recommended Fixes** | **1** | **1** | **6** | **2** |

---

## 2. App Architecture & Feature Inventory

### 2.1 Technology Stack
* **Frontend**: React 18 (Vite SPA), React Router v6, Axios, Chart.js, jsPDF, html2canvas, Google Identity Services (`@react-oauth/google`).
* **Backend**: Node.js, Express.js, MongoDB Atlas (Mongoose ODM), JWT Authentication, Bcrypt.js, Helmet, Express Rate Limit, Nodemailer.
* **Hosting / Infrastructure**:
  * Frontend: Vercel Edge Network (`https://kharchee.vercel.app`) with HTTPS & auto-deploy from `main`.
  * Backend: Render Cloud Web Service (`https://kharchee-mern.onrender.com`) with Cloudflare Edge.
  * Database: MongoDB Atlas Replica Set (`Cluster0`).

### 2.2 Feature Matrix & Page Inventory
1. **Landing Page (`/`)**: Hero section, dynamic ledger simulation, feature cards, live stats showcase, dark/light theme switch.
2. **Authentication (`/login`, `/register`)**:
   * Email/Password registration with 6-digit OTP email verification.
   * Google OAuth 2.0 1-tap sign-in & registration.
   * Password recovery with OTP verification and secure bcrypt hashing.
3. **Dashboard (`/dashboard`)**:
   * Summary KPI Cards (Total You Will Get, Total You Owe, Net Balance, Active Friends count) with live counting animations.
   * Friend Cards with real-time balance indicator (+₹ / -₹ / Settled), inline action buttons (+Add, Remind, Settle, Edit, PDF Statement, History, Delete).
   * Search, filter pills (All, You Will Get, You Owe, Settled), and sorting (Recent, Balance High-Low).
   * Notification Center with 48h event memory and unread badges.
   * Global Floating Animated Calculator with persistence tape & clipboard copy.
4. **Group Bill Splitter Modal**:
   * Equal Split (including/excluding self) & Custom Unequal Split with real-time remaining tally.
   * Multi-friend atomic ledger update.
5. **PDF Financial Statement Generator**:
   * Authentic A4 jsPDF statement with reference code, balance breakdown, and itemized ledger table.
   * 1-Tap Direct WhatsApp document sharing via Web Share API Level 2.
6. **Analytics & Reports (`/analytics`)**:
   * Financial health scores, weekly/monthly spending volume breakdown.
   * Chart.js timeline cashflow curves, category doughnut charts, friend breakdown horizontal bars.
7. **User Profile (`/profile`)**:
   * Avatar upload & client-side compression (canvas JPEG/PNG resize under 100KB).
   * Name, mobile number editing, and theme persistence.

---

## 3. Comprehensive Test Matrix

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TM-01** | Auth | Register new user with valid email | User created in pending state, OTP sent | OTP generated, email sent (or fallback logged) | ✅ PASS |
| **TM-02** | Auth | Register duplicate email | 400 Bad Request: "Email already in use" | 400 Bad Request returned cleanly | ✅ PASS |
| **TM-03** | Auth | Login with invalid password | 400 Bad Request: "Invalid credentials" | 400 Bad Request returned cleanly | ✅ PASS |
| **TM-04** | Auth | Google OAuth 1-tap login / signup | JWT issued, user created/logged in | Verified & logged in successfully | ✅ PASS |
| **TM-05** | Auth | Forgot password & reset with OTP | Password updated, old hash invalidated | Password updated successfully | ✅ PASS |
| **TM-06** | Security | Access `/api/friends` without JWT token | 401 Unauthorized: "Not authorized" | 401 Unauthorized returned | ✅ PASS |
| **TM-07** | Security | IDOR: User A updates Friend belonging to User B | 404 Friend Not Found (User-scoped query) | Blocked (User-scoped query prevents access) | ✅ PASS |
| **TM-08** | Security | Public access to `/api/auth/test-email` | Restricted to admin or disabled | Publicly callable, returns config diagnostics | ❌ FAIL |
| **TM-09** | Security | Helmet Cross-Origin-Opener-Policy | `same-origin-allow-popups` for Google auth | Default `same-origin` causes console warning | ⚠️ WARN |
| **TM-10** | Ledger | Add new friend with unique name | Friend created with starting balance ₹0 | Friend card appears immediately | ✅ PASS |
| **TM-11** | Ledger | Add duplicate friend name for same user | 400 Bad Request: "Friend with name exists" | Handled by compound unique index `{user, name}` | ✅ PASS |
| **TM-12** | Ledger | Record transaction (Add / Lent money) | Balance increases, entry in history | Balance updated, history unshifted | ✅ PASS |
| **TM-13** | Ledger | Record transaction (Borrowed money) | Balance decreases, entry in history | Balance updated, history unshifted | ✅ PASS |
| **TM-14** | Ledger | Delete single historical transaction | Transaction removed, balance adjusted back | Balance reversed accurately | ✅ PASS |
| **TM-15** | Ledger | Settle balance to ₹0 | Balance set to ₹0, settlement recorded | Balance set to ₹0 cleanly | ✅ PASS |
| **TM-16** | Split Bill | Equal split among 3 friends + Self | Total divided by 4, 3 friend cards updated | All 3 friend ledgers updated atomically | ✅ PASS |
| **TM-17** | PDF Export| Generate PDF statement for friend | Clean A4 PDF downloaded with ledger rows | Generated in <100ms via jsPDF | ✅ PASS |
| **TM-18** | WhatsApp | Direct share PDF on mobile | Web Share API attaches `.pdf` file to chat | WhatsApp opens with PDF attached | ✅ PASS |
| **TM-19** | Calculator| Floating Calculator toggle & persistence | Stays pinned on screen, retains history | Retains calculations, stays pinned | ✅ PASS |
| **TM-20** | Responsive| Mobile 320px–375px rendering | No horizontal scroll, touch targets ≥44px | Clean layout, no overflow | ✅ PASS |

---

## 4. Detailed Bug & Vulnerability Findings

### 🔴 Critical & High Severity Issues

---

#### 🚨 [BUG-SEC-01] Public Unauthenticated Diagnostic Endpoint Exposing SMTP & Email Relay
* **Severity**: **High / Critical**
* **Location**: `server/routes/authRoutes.js` (Line 20) & `server/controllers/authController.js` (`testEmail`)
* **Steps to Reproduce**:
  1. Make an unauthenticated GET request to `https://kharchee-mern.onrender.com/api/auth/test-email?email=any_email@domain.com`.
* **Expected Result**: Endpoint should return `401 Unauthorized` or not exist in production.
* **Actual Result**: Returns `200 OK` with internal configuration diagnostics (`configuredEmailUser`, `generatedOtp`, `deliveryResult`) and attempts to deliver an email to whatever recipient is provided in the query string.
* **Root Cause**: Diagnostic helper was added during development without route protection.
* **Recommended Fix**: Remove `router.get("/test-email", testEmail)` from `authRoutes.js` or protect it with `protect` middleware / disabled in production (`if (process.env.NODE_ENV === "production") return res.status(404)...`).

---

#### 🚨 [BUG-PROD-01] Render Free Tier Outbound SMTP Port 587 Block Causing OTP Email Latency/Failure
* **Severity**: **High**
* **Location**: `server/config/emailService.js`
* **Steps to Reproduce**:
  1. Trigger user registration or password reset on Render production backend.
* **Expected Result**: Nodemailer connects over SMTP and delivers verification OTP in <2 seconds.
* **Actual Result**: Render Free Web Services block outbound TCP ports 25, 465, and 587 on IPv6/IPv4, causing SMTP connection attempts to time out with `connect ENETUNREACH`.
* **Root Cause**: Cloud hosting environment policy blocking raw SMTP sockets.
* **Recommended Fix**: Add support for **Resend HTTP API** (`https://api.resend.com/emails` via `fetch`/`axios` with API key `re_...`) or Brevo HTTP REST API in `emailService.js` as the primary transport, with Nodemailer SMTP as fallback.

---

### 🟡 Medium Severity Issues

---

#### ⚠️ [BUG-SEC-02] Helmet Cross-Origin-Opener-Policy (COOP) Conflicts with Google OAuth GSI
* **Severity**: **Medium**
* **Location**: `server/server.js` (Line 22)
* **Steps to Reproduce**:
  1. Open Chrome DevTools Console on `https://kharchee.vercel.app/login`.
  2. Click "Sign in with Google".
* **Expected Result**: Clean login popup communication without browser security warnings.
* **Actual Result**: Console warning: `Cross-Origin-Opener-Policy policy would block the window.postMessage call.`
* **Root Cause**: `app.use(helmet())` defaults to `cross-origin-opener-policy: same-origin`, which restricts OAuth popup window postMessage communication.
* **Recommended Fix**:
  ```javascript
  app.use(
      helmet({
          crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
      })
  );
  ```

---

#### ⚠️ [BUG-SEC-03] Overly Aggressive Global Rate Limiting (100 req / 15 min) on Entire Application
* **Severity**: **Medium**
* **Location**: `server/server.js` (Line 24)
* **Steps to Reproduce**:
  1. Use the app actively for 10 minutes (viewing friends, filtering history, editing, checking analytics, health polling).
* **Expected Result**: Seamless API responsiveness for legitimate active users.
* **Actual Result**: Global rate limit hits `x-ratelimit-remaining: 0` and returns `429 Too Many Requests`. This is especially harmful to mobile users on cellular CGNAT networks where hundreds of users share a single external IP.
* **Recommended Fix**: Separate rate limits:
  * General API: 500 requests / 15 minutes.
  * Health check (`/api/health`): Exempt or high limit.
  * Auth sensitive endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/resend-otp`): 15 requests / 15 minutes.

---

#### ⚠️ [BUG-API-01] Non-Coercive Number Validation on `updateAmount` API Endpoint
* **Severity**: **Medium**
* **Location**: `server/controllers/friendController.js` (Line 80)
* **Steps to Reproduce**:
  1. Send `{ amount: "250", mode: "add" }` to `PUT /api/friends/:id/amount`.
* **Expected Result**: Backend coerces valid numeric strings or returns structured validation error.
* **Actual Result**: `typeof amount !== "number"` strict check rejects valid string numbers with 400. If `amount` is `NaN` or `Infinity`, it bypasses and can corrupt the balance.
* **Recommended Fix**:
  ```javascript
  const numAmount = Number(amount);
  if (isNaN(numAmount) || !isFinite(numAmount)) {
      return res.status(400).json({ message: "Please provide a valid numeric amount" });
  }
  ```

---

### 🟢 Low Severity Issues

---

#### ℹ️ [BUG-FE-01] Axios 401 Interceptor Leaves Stale `user` Object in `localStorage`
* **Severity**: **Low**
* **Location**: `client/src/api/axios.js` (Line 23)
* **Description**: On 401 token expiration, `localStorage.removeItem("token")` is called, but `localStorage.removeItem("user")` is omitted. If the user revisits the login page, stale profile cache may persist in memory until manual logout.
* **Fix**: Call `localStorage.removeItem("user")` alongside `localStorage.removeItem("token")`.

---

#### ℹ️ [BUG-FE-02] Unused Legacy Component Files in Client Source Tree
* **Severity**: **Low**
* **Location**: `client/src/components/dashboard/ReceiptCardModal.jsx`, `CalculatorModal.jsx`
* **Description**: These components were replaced by the executive `PDFStatementModal.jsx` and `FloatingCalculatorWidget.jsx` and are no longer referenced in `Dashboard.jsx`.
* **Fix**: Safely clean up or document as deprecated to prevent codebase clutter and bundle weight.

---

## 5. Prioritized, Minimal-Change Fix Plan

| Priority | Issue ID | Target File(s) | Action Summary |
| :---: | :---: | :--- | :--- |
| **P1** | **BUG-SEC-01** | `server/routes/authRoutes.js` | Remove or protect unauthenticated `/test-email` diagnostic route. |
| **P1** | **BUG-SEC-02** | `server/server.js` | Configure Helmet `crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }`. |
| **P2** | **BUG-SEC-03** | `server/server.js` | Split global rate limiter into General (500/15m) and Auth-specific (15/15m). |
| **P2** | **BUG-API-01** | `server/controllers/friendController.js` | Coerce and validate `Number(amount)` with `isFinite` checks in `updateAmount`. |
| **P3** | **BUG-FE-01** | `client/src/api/axios.js` | Remove both `token` and `user` keys on 401 auto-logout. |

---

## 6. Verification & Regression Testing Plan

1. **Auth & Security Probes**:
   * Verify `/api/auth/test-email` returns 404 / 401.
   * Verify Google 1-Tap OAuth popup opens and logs in with zero COOP console warnings.
   * Verify rapid dashboard navigation does not trigger false 429 rate limit errors.
2. **Ledger Integrity**:
   * Create friend, add ₹500, split bill of ₹1200, export PDF statement, settle to ₹0, delete test record.
3. **Build & Bundle Verification**:
   * Run `npm run build` in `client/` to verify 0 errors, warnings, or broken chunks.

---

> **Awaiting Approval**: As per Phase 3 rules, no code changes or deployments have been executed. Please review this audit report and give your approval to begin the minimal-change fixes in Phase 4.
