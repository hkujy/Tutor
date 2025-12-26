# Vercel Deployment Configuration for Tutoring Calendar

## ⚠️ CRITICAL: Database Migration Issue

**Problem:** "Run database migration fails" error on Vercel

**Root Cause:** Prisma migrations are in `.gitignore`, so Vercel doesn't have access to them during deployment.

---

## �� Quick Fix Options

### Option 1: Use Prisma DB Push (Recommended for Development)

Update `package.json` build script:

```json
"scripts": {
  "build": "prisma db push --accept-data-loss && prisma generate && next build"
}
```

**Pros:**
- Works immediately on Vercel
- No need to commit migrations
- Simpler for small teams

**Cons:**  
- Not recommended for production with real user data
- Can cause data loss if schema changes aren't careful

---

### Option 2: Commit Migrations to Git (Recommended for Production)

1. **Remove migrations from `.gitignore`:**

```bash
# Edit .gitignore and remove this line:
/prisma/migrations/
```

2. **Commit existing migrations:**

```bash
git add prisma/migrations/
git commit -m "Add Prisma migrations for Vercel deployment"
git push origin master
```

3. **Keep build script as is:**

```json
"build": "prisma generate && next build"
```

**Pros:**
- Production-safe
- Version control for schema changes
- Proper migration history

**Cons:**
- Requires committing migrations
- More files in Git

---

## 🔧 Vercel Environment Variables

Make sure these are set in your Vercel dashboard (`Settings` → `Environment Variables`):

### Required Variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
DIRECT_URL=postgresql://user:password@host:port/database?schema=public

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-min-32-characters
NEXTAUTH_URL=https://your-app.vercel.app

# Optional: Redis (if using)
REDIS_URL=redis://your-redis-url:6379
REDIS_TOKEN=your-redis-token
```

### Environment Variable Scope:

- Set for: **Production**, **Preview**, and **Development**
- Or just **Production** if you only deploy to prod

---

## 🚀 Vercel Build Settings

In Vercel dashboard (`Settings` → `General`):

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node Version: 18.x or higher
```

---

## ✅ Deployment Checklist

- [ ] Database is accessible from Vercel (check connection string)
- [ ] DATABASE_URL environment variable is set
- [ ] NEXTAUTH_SECRET is set (generate with `openssl rand -base64 32`)
- [ ] NEXTAUTH_URL points to your Vercel deployment URL
- [ ] Either migrations are committed OR using `prisma db push`
- [ ] Build command includes `prisma generate`

---

## 🔍 Testing the Fix

### Test Locally First:

```bash
# Simulate Vercel's build process
npm run build

# If it fails, check:
# 1. Is DATABASE_URL in .env.production?
# 2. Can you connect to the database?
# 3. Are migrations applied?
```

### After Deploying to Vercel:

1. Check Vercel build logs for errors
2. Look for "Prisma" in the logs
3. Verify `/api/health` endpoint works
4. Try logging in

---

## 🐛 Common Issues

### Issue: "Can't reach database server"

**Solution:** Make sure your database allows connections from Vercel's IP ranges. If using a local database, it won't be accessible from Vercel. You need a cloud database (Supabase, Neon, PlanetScale, Railway, etc.)

### Issue: "Environment variable not found: DATABASE_URL"

**Solution:** Set the variable in Vercel dashboard, then redeploy

### Issue: "Prisma Client did not initialize yet"

**Solution:** Make sure `prisma generate` runs in the build command

### Issue: "Migration failed"

**Solution:** Use Option 1 (`prisma db push`) for quick fix

---

## 📝 Recommended Immediate Action

**For Quick Fix (Get it working now):**

```bash
# 1. Update package.json locally
# Change build script to:
"build": "prisma db push --accept-data-loss && prisma generate && next build"

# 2. Commit and push
git add package.json
git commit -m "Fix: Use prisma db push for Vercel deployment"
git push origin master

# 3. Wait for Vercel to auto-deploy
```

**For Production Setup (Proper way):**

```bash
# 1. Remove /prisma/migrations/ from .gitignore
nano .gitignore  # or use your editor

# 2. Add migrations to git
git add prisma/migrations/
git add .gitignore
git commit -m "Add Prisma migrations for production deployment"
git push origin master
```

---

## 🎯 Next Steps After Fixing

Once Vercel deploys successfully:

1. Test login functionality
2. Verify API endpoints work (`/api/health`, `/api/assignments`)
3. Check database connection in Vercel logs
4. Test assignment features end-to-end

---

**Need Help?** Check Vercel deployment logs for specific error messages and search for "Prisma" to see what went wrong.
