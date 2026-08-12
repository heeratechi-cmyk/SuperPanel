# SUPERPANEL - SMM & Digital Services Platform

Full-stack SMM Services and Virtual Number Verification Web Application built with React, Vite, Tailwind CSS, Express, and PostgreSQL.

---

## 🚀 How to Upload to GitHub & Deploy to Netlify

### Step 1: Upload Code to GitHub
1. Open your terminal in the project folder or export the repository from AI Studio.
2. Initialize Git (if not already initialized) and make a commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SuperPanel App"
   ```
3. Create a new repository on [GitHub](https://github.com/new).
4. Link your remote repository and push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/superpanel.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Deploy to Netlify
1. Log into [Netlify](https://app.netlify.com/).
2. Click **Add new site** -> **Import an existing project**.
3. Select **GitHub** and authorize Netlify.
4. Choose your `superpanel` repository.
5. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy superpanel**.

---

## 📄 Included Netlify Configuration Files
- `netlify.toml`: Directs Netlify to use `npm run build` and publish `dist`, handling SPA single-page routing redirect rules (`/*` -> `/index.html`).
- `public/_redirects`: Backup redirect rule for SPA routing.
- `.gitignore`: Prevents temporary data, build artifacts, and secrets from being committed.

---

## 🔐 Admin Credentials
- **Username / Email:** `Abdullah231` (or `abdullah231@superpanel.com`)
- **Password:** `Abdullah@231`
