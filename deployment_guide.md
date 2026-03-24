# AgriSmart Deployment Guide

This guide outlines the steps to deploy the AgriSmart platform with the backend hosted on **Render** and the frontend on **Vercel**.

## 1. Backend Deployment (Render)

1. **Create a New Web Service**:
   - Link your GitHub repository (`https://github.com/Lokeshajmera/agrismart`).
   - Give it a name (e.g., `agrismart-backend`).
2. **Configure Settings**:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. **Add Environment Variables**:
   Add the following variables in the Render dashboard under the **Environment** tab:
   - `SUPABASE_URL`: (Your Supabase Project URL)
   - `SUPABASE_SERVICE_ROLE_KEY`: (Your Supabase Service Role Key)
   - `MQTT_BROKER_URL`: (Your MQTT Broker URL)
   - `MQTT_USERNAME`: (Your MQTT Username)
   - `MQTT_PASSWORD`: (Your MQTT Password)
   - `PORT`: `10000` (Render handles this automatically).

## 2. Frontend Deployment (Vercel)

1. **Create a New Project**:
   - Import your GitHub repository (`https://github.com/Lokeshajmera/agrismart`).
2. **Configure Settings**:
   - **Framework Preset**: `Vite` (Detects automatically).
   - **Root Directory**: `frontend`
   - **Output Directory**: `dist`
3. **Add Environment Variables**:
   Add the following variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`: (Your Supabase Project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon/Public Key)
   - `VITE_API_URL`: `https://your-backend-url.onrender.com` (Replace with your actual Render URL).

## 3. Post-Deployment Verification

- **Backend Health**: Visit `https://your-backend-url.onrender.com/api/health` to confirm the API is running.
- **Frontend Connectivity**: Ensure the frontend dashboard correctly authenticates and fetches data from the backend.

---
> [!IMPORTANT]
> Always use the **Service Role Key** only on the backend (Render). Never expose it in the frontend or Git repositories.
