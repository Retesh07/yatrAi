# 🚀 YatrAI Deployment & Dependencies Guide

This document contains the complete list of dependencies, environment variables, build scripts, and step-by-step instructions for deploying both the **YatrAI Backend Server** and **YatrAI Frontend Client** to production platforms (such as Render, Vercel, Railway, or Netlify).

---

## 📦 1. Dependencies Breakdown

### 🖥️ Backend Dependencies (`/server/package.json`)

All backend dependencies are managed by `npm`. When deploying to a server environment, running `npm install` inside the `server/` directory will install:

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | Web framework for Node.js REST API endpoints |
| `mongoose` | ^9.7.0 | MongoDB object modeling and database connection |
| `jsonwebtoken` | ^9.0.3 | JWT token generation and authorization verification |
| `bcryptjs` | ^3.0.3 | Password hashing and salt encryption |
| `cookie-parser` | ^1.4.7 | Parsing httpOnly cookies for refresh token rotation |
| `cors` | ^2.8.6 | Enabling Cross-Origin Resource Sharing for the client domain |
| `dotenv` | ^17.4.2 | Loading `.env` environment variables into `process.env` |
| `socket.io` | ^4.8.3 | Real-time WebSocket server for live notifications |
| `bullmq` | ^6.0.5 | Redis-backed background job queue for async tasks |
| `ioredis` | ^5.3.2 | High-performance Redis client for BullMQ |
| `nodemailer` | ^9.0.3 | Sending password reset emails via SMTP |
| `express-rate-limit` | ^8.5.2 | Rate limiting middleware for API security |

#### Backend Commands:
- **Install command**: `npm install`
- **Start command (Production)**: `node server.js`
- **Dev command**: `npm run dev`

---

### 🎨 Frontend Dependencies (`/client/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.2.0 | UI rendering engine |
| `react-dom` | ^18.2.0 | React DOM bindings |
| `react-router-dom` | ^6.22.0 | Client-side routing & page navigation |
| `socket.io-client` | ^4.8.3 | Real-time WebSocket client for receiving alerts |
| `tailwindcss` | ^3.4.0 | Utility-first CSS framework for styling |
| `autoprefixer` | ^10.4.0 | CSS vendor prefixing |
| `postcss` | ^8.4.0 | CSS transformations |
| `vite` | ^5.0.0 | High-performance frontend build tool |

#### Frontend Commands:
- **Install command**: `npm install`
- **Build command (Production)**: `npm run build`
- **Output directory**: `dist`

---

## 🔑 2. Required Environment Variables

### Backend `.env` (Set in your hosting provider's dashboard)

```env
# Server Port & Mode
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/yatrAI?retryWrites=true&w=majority

# Authentication Secrets
JWT_SECRET=your_super_secret_jwt_access_key
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Frontend Domain (Crucial for CORS & HTTP Cookies)
CLIENT_URL=https://your-frontend-domain.vercel.app

# Groq AI Key
GROQ_API_KEY=gsk_your_groq_api_key_here

# Redis Configuration (Optional for BullMQ queue; falls back gracefully if absent)
REDIS_URL=rediss://default:your_upstash_password@your-redis-instance.upstash.io:6379

# Email SMTP Settings (For OTP Reset Passwords)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="YatrAI Travel"
```

---

## ☁️ 3. Step-by-Step Deployment Instructions

### A. Deploying Backend to Render (or Railway / Koyeb)

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository (`Retesh07/yatrAi`).
3. Configure the service settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add all environment variables listed in Section 2 under **Environment Variables**.
5. Click **Deploy Web Service**. Render will output your live API URL (e.g. `https://yatrai-api.onrender.com`).

---

### B. Deploying Frontend to Vercel (or Netlify)

1. Import your GitHub repository (`Retesh07/yatrAi`) on [Vercel](https://vercel.com/).
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. If using direct backend URLs, configure rewrites in `client/vite.config.js` or set client API base URL environment variable.
4. Click **Deploy**. Vercel will output your live URL (e.g. `https://yatrai.vercel.app`).
5. **Important**: Go back to your Backend Render dashboard and update `CLIENT_URL` to match your new Vercel domain (`https://yatrai.vercel.app`) so CORS and Socket.io connect securely!

---

## ✅ 4. Post-Deployment Verification Checklist

- [ ] MongoDB Atlas Network Access permits your backend server IP (or `0.0.0.0/0` for cloud hosts).
- [ ] `CLIENT_URL` matches the frontend production domain exactly (no trailing slash).
- [ ] User login and session restoration via cookies works across origins (`credentials: 'include'`).
- [ ] Groq AI itinerary generation succeeds and returns JSON itineraries.
- [ ] Real-time notification bell updates on trip generation.
