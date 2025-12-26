# 🚀 How to Access the Tutoring Calendar Application

## ✅ Application Status

Your application is **RUNNING** on:
- **Local**: http://localhost:3000
- **Public**: Via Cloudflare Tunnel (see below)

## 🌐 Access the Application

### Option 1: Local Access (if on the same machine)
```
http://localhost:3000
```

### Option 2: Public Access (from anywhere)
Based on your setup, the Cloudflare tunnel should be running. To find the current URL:

1. Check the tunnel logs:
```bash
# Find the Cloudflare process
ps aux | grep cloudflared

# The URL is printed when the tunnel starts
# It should look like: https://[random-words].trycloudflare.com
```

**Last known URL from your setup:**
```
https://americans-processors-andrews-alternatives.trycloudflare.com
```

⚠️ **Note**: Cloudflare tunnel URLs may change when the tunnel restarts. If the above URL doesn't work, check the console logs for the current URL.

## 🔑 Login Credentials

### Demo Tutor Account
```
Email: tutor@example.com
Password: tutor123
```

**What you can do as a tutor:**
- View dashboard
- Manage student roster
- Check notifications
- View appointments

### Demo Student Account
```
Email: student@example.com  
Password: student123
```

**What you can do as a student:**
- Browse available tutors
- View tutor profiles
- Book appointments (when availability exists)
- View your schedule
- Check notifications

### Admin Account
```
Email: admin@tutoringcalendar.com
Password: (check your .env file or database)
```

## 📱 Login Steps

1. **Open the URL** in your browser
   - Public: Use Cloudflare URL
   - Local: http://localhost:3000

2. **You'll see the login page** with:
   - Quick demo login buttons (Tutor / Student)
   - Manual login form

3. **Quick Login** (easiest):
   - Click the **"Tutor"** button to login as Sarah Johnson
   - OR click the **"Student"** button to login as Alex Smith

4. **Manual Login**:
   - Enter email: `tutor@example.com`
   - Enter password: `tutor123`
   - Click "Sign in"

5. **After login**, you'll be redirected to:
   - Tutors → `/en/tutor` (Tutor Dashboard)
   - Students → `/en/student` (Student Dashboard)

## 🎯 What to Test

### As a Tutor:
- ✅ Login / Logout
- ✅ View dashboard
- ✅ Check notifications
- ⚠️ Set availability (page currently returns 404 - bug discovered by agents!)

### As a Student:
- ✅ Login / Logout  
- ✅ Browse tutors
- ⚠️ Book appointments (no tutors available - needs availability data)
- ✅ View schedule
- ✅ Check notifications

## 🔧 Troubleshooting

### Can't access the public URL?
```bash
# Restart the Cloudflare tunnel
# Kill the old tunnel
pkill -f cloudflared

# Start a new tunnel
npx cloudflared tunnel --url http://localhost:3000
# Look for the new URL in the output
```

### App not running?
```bash
# Check if it's running
lsof -ti:3000

# If not, start it
npm run dev
```

### Login not working?
The multi-agent tests confirmed login works with these credentials:
- `tutor@example.com` / `tutor123`
- `student@example.com` / `student123`

If it still doesn't work, check:
1. Database is running (Docker Postgres on port 5433)
2. Environment variables are set correctly
3. Next.js dev server is running

## 🧪 Multi-Agent Testing

To run the automated agent tests that simulate multiple users:

```bash
# Test single booking scenario
npx playwright test tests/agents/multi-agent-basic.spec.ts -g "Single Booking"

# Test 1 tutor with 3 students
npx playwright test tests/agents/multi-student.spec.ts -g "Sequential"

# Watch agents in action (headed mode)
npx playwright test tests/agents/multi-student.spec.ts -g "Demo" --headed
```

## 📝 Notes

- **Language Support**: The app supports English (`/en/`) and Chinese (`/zh/`)
- **Current Issues** (discovered by agent testing):
  - `/en/tutor/availability` returns 404
  - No tutors showing in student view (need availability data)
- **Database**: PostgreSQL running in Docker on port 5433

Enjoy testing the application! 🎉
