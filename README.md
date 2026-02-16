<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Current Bank - Financial Dashboard

A real-time financial dashboard that connects to Google Sheets with AI-powered analysis using Google Gemini. Features include live balance tracking, transaction history, and an AI financial analyst.

## Features

- Real-time Google Sheets integration
- PWA support (installable on mobile & desktop)
- AI-powered financial analysis via Gemini
- Responsive design with dark mode
- Deep linking support for sharing
- Automatic polling for updates

## Run Locally

**Prerequisites:** Node.js 16+

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file (copy from `.env.example`):
   ```bash
   cp .env.example .env.local
   ```

4. Add your Gemini API key to `.env.local`:
   ```
   API_KEY=your_gemini_api_key_here
   ```
   Get your API key from: https://makersuite.google.com/app/apikey

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:5173 in your browser

## Deploy to Production

Your app is ready to deploy! See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions for:

- Vercel (Recommended)
- Netlify
- GitHub Pages
- Railway
- Render

Quick deploy with Vercel:
```bash
npm install -g vercel
vercel
```

## Google Sheets Setup

1. Create a Google Sheet with your financial data
2. Format should include month headers (e.g., "January 2025")
3. Add a row with "Current Balance" and the balance amount
4. Set sharing to "Anyone with the link can view"
5. Copy the sheet URL from your browser
6. Paste it in the app settings

## Environment Variables

- `API_KEY` - Google Gemini API key for AI features

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI
- Lucide Icons
