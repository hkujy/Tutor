# Deployment & Testing Guide

## 🚀 Quick Deploy

The app is currently running on **http://localhost:3000**

### Option 1: Hot Reload (Fastest - if Next.js dev server)
The changes should auto-reload. Just refresh your browser!

### Option 2: Full Restart (Recommended)
```bash
# Kill current process
kill 108977

# Restart development server
cd /home/jy/tutoring-calendar
npm run dev &

# Wait 10 seconds for startup
sleep 10
```

### Option 3: Production Build  
```bash
# Build and start production
npm run build
npm run start
```

---

## 🧪 Testing Instructions

### Test 1: Student Browse Tutors ⭐ NEW FEATURE!

1. **Open:** http://localhost:3000/en/login

2. **Login as Student:**
   - Click "Quick Login as Student" button
   - OR manually enter:
     - Email: `student@example.com`
     - Password: `student123`

3. **Expected Result:**
   - Redirects to `/en/student`
   - **SCROLL DOWN** on dashboard
   - You should see **"Browse Tutors (6)"** section ✅
   - 6 tutor cards displayed with:
     - Name
     - Subjects (tags)
     - Hourly rate
     - Availability (Mon 09:00, etc.)
     - "Book Session" button

4. **Test Filtering:**
   - Type "Mathematics" in the filter box
   - Should show only tutors teaching Math

---

### Test 2: Demo Login Buttons

1. **Open:** http://localhost:3000/en/login

2. **Test Tutor Login:**
   - Click "Quick Login as Tutor"
   - Should redirect to `/en/tutor` ✅
   - No error message

3. **Test Student Login:**
   - Logout (top right)
   - Click "Quick Login as Student"
   - Should redirect to `/en/student` ✅
   - No error message

---

### Test 3: Logout Functionality

1. **From any dashboard:**
   - Click logout button (top right)
   - Should redirect to `/en/login` ✅
   - No timeout errors

---

### Test 4: Tutor Availability Page

1. **Login as Tutor:** tutor@example.com / tutor123

2. **Navigate:** Click "Availability" tab

3. **Expected:**
   - Page loads (no 404!) ✅
   - Calendar or form interface visible
   - Can add time slots

---

## 📊 Expected Test Results

### ✅ What Should Work:
- Login (both manual and demo buttons)
- Logout (no timeouts)
- Student dashboard loads
- **Browse Tutors section shows 6 tutors** ⭐
- Tutor cards have subjects, rates, availability
- Subject filter works
- Tutor availability page loads (no 404)

### ⚠️ Known Limitations:
- **Booking appointment** still in progress (time slot UI)
- Availability page save button needs backend connection
- Some tutor specializations may not match "Mathematics" filter exactly

---

## 🐛 Troubleshooting

### Issue: "Browse Tutors (0)" shows no tutors

**Fix:**
```bash
# Re-run availability seeding
node tests/agents/seed-availability.js
```

### Issue: Page not updating

**Fix:**
```bash
# Hard refresh browser
Ctrl + Shift + R (Linux/Windows)
Cmd + Shift + R (Mac)
```

### Issue: 404 errors

**Fix:**
```bash
# Make sure app is running
curl http://localhost:3000

# If no response, restart:
cd /home/jy/tutoring-calendar
npm run dev
```

---

## 🎯 Testing Checklist

- [ ] Login page loads
- [ ] Demo login buttons work
- [ ] Student dashboard shows "Browse Tutors"
- [ ] 6 tutors are visible
- [ ] Tutor cards show correct info
- [ ] Subject filter works
- [ ] Logout works without errors
- [ ] Tutor availability page loads

---

## 🌐 Access URLs

**Local:**
- http://localhost:3000/en/login
- http://localhost:3000/en/student
- http://localhost:3000/en/tutor

**Tunnel (if running):**
- Check your Cloudflare tunnel URL from USER_RULES

---

## 📸 Screenshot Verification

Take screenshots of:
1. Browse Tutors section with 6 cards
2. Tutor card showing availability
3. Subject filter in action
4. Successful login redirect

---

## ✅ Success Criteria

**Test passes if:**
1. ✅ Students can see tutor cards
2. ✅ Min 5 tutors displayed
3. ✅ Each card shows availability info
4. ✅ Filter reduces results
5. ✅ No console errors

**Ready to test!** 🚀
