---
description: Deploy the application
---

# Deployment Workflow

This workflow deploys the application to production.

## Pre-deployment Checklist

1. **Run tests**
   ```bash
   npm test
   ```

2. **Run linter**
   ```bash
   npm run lint
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Test production build locally**
   ```bash
   npm run preview
   ```

## Deployment Steps

5. **Commit and push changes**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

6. **Deploy** (method depends on your hosting platform)
   - For Vercel: `vercel --prod`
   - For Netlify: `netlify deploy --prod`
   - For custom server: Follow your deployment script

## Post-deployment

7. **Verify deployment**
   - Check the production URL
   - Test critical functionality
   - Monitor for errors

## Notes
- Always test thoroughly before deploying
- Keep deployment credentials secure
- Monitor application logs after deployment
- Have a rollback plan ready
