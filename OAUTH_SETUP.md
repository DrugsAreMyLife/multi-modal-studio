# OAuth Provider Setup Guide

## Google OAuth 2.0 Setup

### 1. Create OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select or create a project

2. **Configure OAuth Consent Screen**
   - Click "OAuth consent screen" in the left sidebar
   - User Type: **External** (or Internal if using Google Workspace)
   - Click "Create"
   - App name: `Multi-Modal Generation Studio`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes"
     - Add: `openid`, `email`, `profile`
     - Add: `https://www.googleapis.com/auth/drive.file` (for Drive integration)
   - Click "Save and Continue"
   - Test users: Add your email (for testing)
   - Click "Save and Continue"

3. **Create OAuth Client ID**
   - Click "Credentials" in the left sidebar
   - Click "+ Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `Multi-Modal Studio Local Dev`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
   - Click "Create"

4. **Copy Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Add to your `.env` file:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
   ```

---

## GitHub OAuth Setup

### 1. Create OAuth App

1. **Go to GitHub Developer Settings**
   - Visit: https://github.com/settings/developers
   - Click "OAuth Apps" in the left sidebar
   - Click "New OAuth App"

2. **Configure App**
   - Application name: `Multi-Modal Generation Studio`
   - Homepage URL: `http://localhost:3000`
   - Application description: (optional)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Click "Register application"

3. **Generate Client Secret**
   - After creation, click "Generate a new client secret"
   - Copy the secret immediately (you won't see it again!)

4. **Copy Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Add to your `.env` file:
   ```bash
   GITHUB_CLIENT_ID=Iv1.your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret-here
   ```

---

## Quick Setup Commands

After obtaining credentials, add them to your `.env` file:

```bash
# Open .env file
open .env

# Or use command line:
echo "" >> .env
echo "# OAuth Credentials" >> .env
echo "GOOGLE_CLIENT_ID=your-google-client-id" >> .env
echo "GOOGLE_CLIENT_SECRET=your-google-client-secret" >> .env
echo "GITHUB_CLIENT_ID=your-github-client-id" >> .env
echo "GITHUB_CLIENT_SECRET=your-github-client-secret" >> .env
```

Then restart your dev server:

```bash
# Kill current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## Production Setup (For Deployment)

When deploying to production (Vercel, etc.):

### Google OAuth

1. Add production URLs to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

### GitHub OAuth

1. Create a separate OAuth app for production
2. Homepage URL: `https://yourdomain.com`
3. Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`

### Environment Variables

Add to your deployment platform:

```bash
GOOGLE_CLIENT_ID=prod-client-id
GOOGLE_CLIENT_SECRET=prod-client-secret
GITHUB_CLIENT_ID=prod-client-id
GITHUB_CLIENT_SECRET=prod-client-secret
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

---

## Testing Your Setup

1. Restart the dev server
2. Visit http://localhost:3000
3. Click "Sign in with Google" or "Sign in with GitHub"
4. Authorize the app
5. You should be redirected back and logged in!

---

## Troubleshooting

### "Redirect URI mismatch" error

- Verify the callback URL in Google/GitHub matches exactly:
  - `http://localhost:3000/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/github`

### "Invalid client" error

- Check that Client ID and Secret are correctly copied to `.env`
- Restart the dev server after changing `.env`

### "Access blocked" error (Google)

- Make sure you added your email as a test user
- Or publish the app (OAuth consent screen → Publish App)

---

**Ready to configure?** Follow the steps above and you'll be logged in within 5 minutes!
