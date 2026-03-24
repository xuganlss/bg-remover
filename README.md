# Image Background Remover

A free AI-powered image background remover built with Next.js, deployed on Cloudflare Pages.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **API**: Remove.bg API
- **Deploy**: Cloudflare Pages

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Create a `.env.local` file:
```env
REMOVE_BG_API_KEY=your_api_key_here
```

Get your API key at [remove.bg/api](https://www.remove.bg/api)

### 3. Run locally
```bash
npm run dev
```

## Deploy to Cloudflare Pages

### Prerequisites
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Deploy
```bash
# Login to Cloudflare
wrangler login

# Build and deploy
npm run deploy
```

### Set Environment Variables on Cloudflare
In Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables:
- `REMOVE_BG_API_KEY` = your Remove.bg API key

## Features

- ✅ Drag & drop or click to upload (JPG, PNG, WebP, max 10MB)
- ✅ AI background removal via Remove.bg API
- ✅ Before/After slider comparison
- ✅ Background color picker (transparent, white, custom)
- ✅ Download as PNG
- ✅ No image storage — pure in-memory processing
- ✅ Edge runtime — fast global performance
- ✅ SEO optimized

## Project Structure

```
app/
  layout.tsx          # Root layout + SEO metadata
  page.tsx            # Main page
  globals.css         # Global styles
  api/
    remove-bg/
      route.ts        # API route (Edge runtime) → Remove.bg proxy
components/
  ImageUploader.tsx   # Drag & drop upload component
  ImageComparison.tsx # Before/After slider
  BackgroundColorPicker.tsx  # Background color selector
```
