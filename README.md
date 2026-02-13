# Mamma Testa Pizza Dough Calculator

This is a React application built with Vite for calculating pizza dough recipes.

## 🚀 Quick Start (Local Development)

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start the Dev Server**:
    ```bash
    npm run dev
    ```
    Open the link shown in the terminal (usually `http://localhost:5173`).

3.  **Build for Production**:
    ```bash
    npm run build
    ```

---

## 📦 Deployment Guide

### Phase 1: Create GitHub Repository

1.  Log in to [GitHub](https://github.com).
2.  Click the **+** icon in the top right and select **New repository**.
3.  **Repository name**: `mamma-testa-calc` (or similar).
4.  Set to **Public**.
5.  **Do not** check "Add a README", .gitignore, or license (we already have them).
6.  Click **Create repository**.

**Push your code:**
Open your terminal in this project folder and run:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mamma-testa-calc.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your actual GitHub username)*

### Phase 2: Deploy to Vercel

1.  Log in to [Vercel](https://vercel.com).
2.  Click **Add New...** > **Project**.
3.  Select **Import Git Repository**.
4.  Find `mamma-testa-calc` in the list and click **Import**.
5.  **Configure Project**:
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Root Directory**: `./` (leave default).
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `dist` (default).
6.  Click **Deploy**.
    *   *Wait about a minute. You should see a "Congratulations!" screen.*

### Phase 3: Connect GoDaddy Domain

1.  In your Vercel Project Dashboard, go to **Settings** > **Domains**.
2.  Enter `mammatesta.com` and click **Add**.
3.  Vercel will give you a set of DNS records (likely an **A Record** and a **CNAME**).
    *   **A Record** value: `76.76.21.21` (Verify this in Vercel UI).
    *   **CNAME (www)** value: `cname.vercel-dns.com` (Verify this in Vercel UI).

4.  **Go to GoDaddy**:
    *   Log in and go to **My Products** > **mammatesta.com** > **DNS**.
    *   **Delete** any existing "Parked" or "Forwarding" records if present.
    *   **Add/Edit** the **A Record** (@):
        *   Type: **A**
        *   Name: **@**
        *   Value: `76.76.21.21` (or what Vercel gave you)
        *   TTL: **600 seconds** (or lowest possible).
    *   **Add/Edit** the **CNAME Record** (www):
        *   Type: **CNAME**
        *   Name: **www**
        *   Value: `cname.vercel-dns.com`
        *   TTL: **1 Hour**.
5.  **Verify**:
    *   Go back to Vercel Domains settings. It might take up to 24-48 hours, but usually works within minutes.
    *   Vercel will automatically generate an SSL certificate (HTTPS) once DNS propagates.

---

## 🛠 Troubleshooting

*   **Build Fails?**
    *   Check the Vercel logs. Ensure `package.json` has `"build": "vite build"`.
    *   Ensure all imports in `App.jsx` are used or removed.
*   **Page is Blank?**
    *   Open Developer Tools (F12) > Console. Look for red errors.
    *   Make sure `index.html` points to `/src/main.jsx`.
*   **Domain not working?**
    *   Use [whatsmydns.net](https://www.whatsmydns.net/) to check if your A record points to Vercel's IP.
    *   Clear your browser cache.
