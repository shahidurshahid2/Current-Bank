# Quick Start Guide

## 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

## 2. Set Up Environment

Create a `.env.local` file in the project root:

```env
API_KEY=your_api_key_here
```

## 3. Install and Run

```bash
npm install
npm run dev
```

Your app will be running at http://localhost:5173

## 4. Deploy (Optional)

Choose your favorite platform:

**Vercel (Easiest):**
```bash
npm install -g vercel
vercel
```

Then add `API_KEY` environment variable in Vercel dashboard.

**See DEPLOYMENT.md for more options**

## 5. Connect Your Google Sheet

1. Create or open a Google Sheet
2. Add financial data with month headers (e.g., "February 2025")
3. Add a row with "Current Balance" and amount
4. Share: "Anyone with the link"
5. Copy the URL
6. In the app, click Settings and paste the URL

## That's it!

Your financial dashboard is now live and connected to your Google Sheet.
