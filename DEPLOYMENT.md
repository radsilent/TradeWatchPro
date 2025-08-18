# Deployment Guide

## GitHub Pages Deployment

The TradeWatch app is automatically deployed to GitHub Pages when you push to the `master` branch. The deployment is handled by GitHub Actions.

### Manual Deployment

If you need to deploy manually:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_BASE44_API_KEY=your_base44_api_key_here
VITE_BASE44_PROJECT_ID=your_project_id_here
```

## Production Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Docker Deployment

You can also deploy using Docker:

```bash
# Build the Docker image
docker build -t tradewatch .

# Run the container
docker run -p 3000:3000 tradewatch
```

## Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Vite configuration
3. Set environment variables in the Vercel dashboard
4. Deploy!

## Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables in Netlify dashboard
5. Deploy!

## Local Development

For local development, use:

```bash
./start-app.sh
```

This will start the development server at `http://localhost:5173`.
