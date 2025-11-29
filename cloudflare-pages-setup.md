# Cloudflare Pages Deployment Setup

This guide will help you deploy VennStack to Cloudflare Pages.

## Prerequisites

1. A GitHub account
2. A Cloudflare account (free tier works)

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `vennstack`)
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)

## Step 2: Add Git Remote and Push

Run these commands in your terminal:

```bash
cd /Users/kylehamilton/Desktop/VennStack
git remote add origin https://github.com/YOUR_USERNAME/vennstack.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Deploy to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended)

1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Select **Connect to Git**
5. Authorize Cloudflare to access your GitHub account
6. Select your `vennstack` repository
7. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave as default)
8. Click **Save and Deploy**

### Option B: Via Wrangler CLI

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create a Pages project:
   ```bash
   wrangler pages project create vennstack
   ```

4. Deploy:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=vennstack
   ```

## Build Configuration

The project is already configured for Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing: `public/_redirects` file handles client-side routing

## Custom Domain (Optional)

After deployment:
1. Go to your Pages project in Cloudflare dashboard
2. Click **Custom domains**
3. Add your domain and follow DNS setup instructions

## Environment Variables (if needed)

If you need environment variables:
1. Go to your Pages project settings
2. Navigate to **Environment variables**
3. Add your variables for Production, Preview, and Branch previews

## Continuous Deployment

Once connected to GitHub, Cloudflare Pages will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run builds automatically

