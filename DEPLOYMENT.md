# Current Bank - Deployment Guide

Your app has been successfully built and is ready for deployment! Here are your hosting options:

## Quick Deployment Options

### 1. Vercel (Recommended - Easiest)

**Steps:**
1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy: **Yes**
   - Which scope: Choose your account
   - Link to existing project: **No**
   - Project name: **current-bank** (or your choice)
   - Directory: **./** (current directory)
   - Override settings: **No**

4. Set environment variable:
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add: `API_KEY` = your Gemini API key
   - Redeploy for changes to take effect

**Your app will be live at:** `https://your-project.vercel.app`

---

### 2. Netlify

**Steps:**
1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Follow the prompts:
   - Create & configure a new site
   - Team: Choose your team
   - Site name: **current-bank** (or your choice)
   - Publish directory: **dist**

4. Set environment variable:
   - Go to Netlify dashboard
   - Site settings > Environment variables
   - Add: `API_KEY` = your Gemini API key
   - Redeploy

**Your app will be live at:** `https://your-site.netlify.app`

---

### 3. GitHub Pages (Free Static Hosting)

**Steps:**
1. Create a new GitHub repository

2. Add this to your `package.json` scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```

3. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

4. Update `vite.config.ts` to add base path:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

5. Build and deploy:
   ```bash
   npm run build
   npm run deploy
   ```

6. Enable GitHub Pages in your repo settings (Settings > Pages > Source: gh-pages branch)

**Note:** GitHub Pages doesn't support environment variables at build time. You'll need to use a different approach for the API key (like a config file or runtime injection).

---

### 4. Railway

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Railway will auto-detect Vite and deploy
6. Add environment variable `API_KEY` in the Variables tab

---

### 5. Render

**Steps:**
1. Go to [render.com](https://render.com)
2. Click "New Static Site"
3. Connect your GitHub repository
4. Settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
5. Add environment variable `API_KEY` in the Environment tab

---

## Environment Variables Required

Your app needs one environment variable:

- `API_KEY` - Your Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

---

## Custom Domain Setup

After deployment, you can add a custom domain:

**Vercel:**
- Go to Project Settings > Domains
- Add your domain and follow DNS instructions

**Netlify:**
- Go to Site Settings > Domain Management
- Add custom domain and update DNS

---

## PWA Features

Your app is configured as a Progressive Web App (PWA) with:
- Offline support via Service Worker
- Install prompt for mobile/desktop
- App icons and manifest
- Responsive design

Users can install it directly from their browser!

---

## Testing Your Deployment

After deployment:
1. Visit your live URL
2. Connect your Google Sheet (must be public or "Anyone with link")
3. Test the AI Analyst feature (requires valid `API_KEY`)
4. Try installing as a PWA (browser will show install prompt)

---

## Troubleshooting

**API Key Not Working:**
- Ensure environment variable is named exactly `API_KEY`
- Redeploy after adding environment variables
- Check browser console for errors

**Sheet Not Loading:**
- Verify Google Sheet sharing is set to "Anyone with link can view"
- Check if the URL is correct
- Look at browser console for CORS errors

**PWA Not Installing:**
- Ensure HTTPS is enabled (all platforms above use HTTPS by default)
- Clear browser cache and try again
- Check that manifest.json is loading correctly

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html
