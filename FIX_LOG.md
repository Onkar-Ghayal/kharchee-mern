# 📋 Fix & Verification Log: Kharchee (MERN)

**Date**: August 20, 2026  
**Auditor**: QA Lead & Senior MERN Engineer  
**Release**: v1.1.0-production-hardened  

---

## 1. Summary of Applied Fixes

| Issue ID | Severity | File(s) Changed | Description of Fix | Verification Status |
| :--- | :---: | :--- | :--- | :---: |
| **BUG-SEC-01** | High | `server/routes/authRoutes.js` | Removed unauthenticated `/test-email` diagnostic route to prevent open email relay / diagnostic leakage. | ✅ VERIFIED |
| **BUG-SEC-02** | Medium | `server/server.js` | Configured Helmet `crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }` to eliminate Google OAuth popup postMessage warnings. | ✅ VERIFIED |
| **BUG-SEC-03** | Medium | `server/server.js` | Split global rate limiter into General API tier (500 req/15m) and strict Auth tier (25 req/15m) on sensitive auth endpoints. | ✅ VERIFIED |
| **BUG-API-01** | Medium | `server/controllers/friendController.js` | Added strict `Number(amount)` coercion with `isFinite` and `isNaN` checks on `updateAmount`. | ✅ VERIFIED |
| **BUG-FE-01** | Low | `client/src/api/axios.js` | Added `localStorage.removeItem("user")` alongside `token` cleanup on 401 response interceptor. | ✅ VERIFIED |

---

## 2. Detailed Fix Log

### 1. [BUG-SEC-01] Removed Public Diagnostic Route
* **Files**: `server/routes/authRoutes.js`
* **Changes**:
  * Removed `router.get("/test-email", testEmail)` and removed `testEmail` from controller import.
* **Verification**:
  * GET requests to `/api/auth/test-email` now return standard Express 404 handler, stopping all open relay and diagnostic leakage.

---

### 2. [BUG-SEC-02] Helmet Cross-Origin-Opener-Policy Update
* **Files**: `server/server.js`
* **Changes**:
  ```javascript
  app.use(
      helmet({
          crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
      })
  );
  ```
* **Verification**:
  * Google 1-Tap OAuth popup now communicates with the parent window without browser COOP policy blockage.

---

### 3. [BUG-SEC-03] Tiered Rate Limiting Architecture
* **Files**: `server/server.js`
* **Changes**:
  * `generalLimiter` configured with 500 requests per 15 minutes across `/api`.
  * `authLimiter` configured with 25 requests per 15 minutes specifically across `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, and `/api/auth/resend-otp`.
* **Verification**:
  * Rapid dashboard navigation, filter queries, and polling no longer trigger false `429 Too Many Requests`.

---

### 4. [BUG-API-01] Robust Number Validation on `updateAmount`
* **Files**: `server/controllers/friendController.js`
* **Changes**:
  * Replaced brittle `typeof amount !== "number"` check with `const numAmount = Number(amount); if (isNaN(numAmount) || !isFinite(numAmount)) ...`.
* **Verification**:
  * Valid numeric inputs and string numbers are handled accurately; `NaN` and `Infinity` are rejected with 400 Bad Request.

---

### 5. [BUG-FE-01] Complete Cache Invalidation on 401
* **Files**: `client/src/api/axios.js`
* **Changes**:
  * Updated 401 interceptor to remove both `"token"` and `"user"` keys from `localStorage`.
* **Verification**:
  * Session expiration invalidates both credentials and cached user metadata.

---

## 3. Production Deployment Checklist

- [x] Client production build verified with zero errors (`npm run build` -> `dist/`).
- [x] Clean Git working tree with all security and functional patches staged.
- [x] Pushed to GitHub `main` branch.
- [x] Vercel Frontend auto-deployment triggered (`https://kharchee.vercel.app`).
- [x] Render Backend auto-deployment triggered (`https://kharchee-mern.onrender.com`).
