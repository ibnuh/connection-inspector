# Cloudflare Pages Deployment Guide

This guide will walk you through deploying this Nuxt 3 project to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account (free tier works)
2. Your project code in a Git repository (GitHub, GitLab, or Bitbucket)
3. Node.js 18+ installed locally (for testing builds)

## Step-by-Step Deployment Instructions

### Step 1: Prepare Your Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket). Cloudflare Pages will automatically build and deploy from your repository.

### Step 2: Configure Cloudflare Pages

1. **Log in to Cloudflare Dashboard**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to **Pages** in the sidebar

2. **Create a New Project**
   - Click **Create a project**
   - Click **Connect to Git**
   - Authorize Cloudflare to access your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository

3. **Configure Build Settings**
   - **Project name**: Choose a name for your project
   - **Production branch**: Usually `main` or `master`
   - **Framework preset**: Select **Nuxt** (Cloudflare Pages will auto-detect this)
   - **Build command**: `npm run build`
   - **Build output directory**: `.output/public`
   - **Root directory**: `/` (leave as default unless your project is in a subdirectory)
   - **Environment variables**: Add any if needed (none required for this project)

4. **Advanced Settings** (optional)
   - **Node.js version**: Select `18` or `20` (recommended: `20`)
   - **Build environment variables**: Add any custom variables if needed

5. **Save and Deploy**
   - Click **Save and Deploy**
   - Cloudflare will start building your project

### Step 3: Wait for Build

- The build process typically takes 2-5 minutes
- You can watch the build logs in real-time
- Once complete, your site will be live at `https://<project-name>.pages.dev`

### Step 4: Custom Domain (Optional)

1. In your Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name
4. Follow the DNS configuration instructions
5. Cloudflare will automatically provision SSL certificates

## Build Configuration

The project is configured for Cloudflare Pages with:

- **Nitro preset**: `cloudflare-pages` (configured in `nuxt.config.ts`)
- **SSR**: Disabled (static site generation)
- **API Routes**: Serverless functions deployed as Cloudflare Workers

## Important Notes

### API Routes

The project includes server API routes that will be deployed as Cloudflare Workers:
- `/api/server-info` - Returns server-side connection information
- `/api/reverse-dns` - Performs reverse DNS lookups using DNS over HTTPS

These routes are automatically converted to Cloudflare Workers functions during the build process.

### Reverse DNS Lookup

The reverse DNS API has been updated to use DNS over HTTPS (DoH) instead of Node.js's `dns` module, making it compatible with Cloudflare Workers runtime.

### Environment Variables

No environment variables are required for this project. If you need to add any:
1. Go to your Cloudflare Pages project settings
2. Navigate to **Environment variables**
3. Add your variables for Production, Preview, or both

## Troubleshooting

### Build Fails

1. **Check build logs**: Look for specific error messages
2. **Verify Node.js version**: Ensure you're using Node 18+ (set in build settings)
3. **Check dependencies**: Ensure `package.json` has all required dependencies
4. **Local build test**: Run `npm run build` locally to catch issues early

### API Routes Not Working

1. **Check function logs**: Go to Cloudflare Pages → Functions → Logs
2. **Verify route paths**: Ensure API routes are in `server/api/` directory
3. **Check runtime compatibility**: Ensure code doesn't use Node.js-specific APIs

### Static Assets Not Loading

1. **Verify build output**: Check that `.output/public` contains your assets
2. **Check base URL**: Ensure assets use relative paths
3. **Clear cache**: Cloudflare may cache old builds

## Local Testing

Before deploying, test the build locally:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Preview the build (optional)
npm run preview
```

The build output will be in `.output/public` directory.

## Continuous Deployment

Cloudflare Pages automatically deploys:
- **Production**: Every push to your production branch (usually `main`)
- **Preview**: Every push to other branches (creates preview deployments)

You can configure branch protection and deployment rules in the Cloudflare Pages dashboard.

## Manual Deployment (Alternative)

If you prefer to deploy manually using Wrangler CLI:

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate**:
   ```bash
   wrangler login
   ```

3. **Build your project**:
   ```bash
   npm run build
   ```

4. **Deploy**:
   ```bash
   wrangler pages deploy .output/public --project-name=<your-project-name>
   ```

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Nuxt 3 Deployment Guide](https://nuxt.com/docs/getting-started/deployment)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## Support

If you encounter issues:
1. Check the build logs in Cloudflare Pages dashboard
2. Review the [Cloudflare Pages troubleshooting guide](https://developers.cloudflare.com/pages/platform/build-configuration/)
3. Check Nuxt 3 documentation for deployment-specific issues

