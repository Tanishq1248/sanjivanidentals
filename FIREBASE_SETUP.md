# 🔥 Firebase Setup Guide — Sanjivani Dentals

Complete step-by-step guide to set up Firebase for your dental clinic app.

---

## 📋 Quick Checklist

- [ ] Create Firebase project
- [ ] Enable Firestore Database
- [ ] Enable Firebase Authentication
- [ ] Enable Firebase Storage
- [ ] Register a Web App & get config keys
- [ ] Add config to `.env.local`
- [ ] Create admin user in Firebase Auth
- [ ] Deploy Firestore Security Rules
- [ ] Run seed script
- [ ] Test the app

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Project name: `sanjivani-dentals` (or any name you prefer)
4. Enable/disable Google Analytics (optional — not needed for this app)
5. Click **"Create project"**
6. Wait for it to finish → Click **"Continue"**

---

## Step 2: Enable Firestore Database

1. In the left sidebar, click **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Choose a location nearest to your users (e.g., `asia-south1` for India)
4. Start in **"Test mode"** for now (we'll set proper rules later)
5. Click **"Create"**

---

## Step 3: Enable Firebase Authentication

1. In the left sidebar, click **"Build" → "Authentication"**
2. Click **"Get started"**
3. Under **"Sign-in method"** tab, click **"Email/Password"**
4. Toggle **"Enable"** → Click **"Save"**

---

## Step 3.5: Enable Firebase Storage

1. In the left sidebar, click **"Build" → "Storage"**
2. Click **"Get started"**
3. Choose **"Start in Test mode"** (we'll set custom security rules later) → Click **"Next"**
4. Choose a Storage location (defaults to your project's region) → Click **"Done"**
5. Wait for the bucket to provision.
6. Open your **Storage** page, click the **Rules** tab, and paste the rules from `storage.rules`:
   ```rules
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /prescriptions/{fileName} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
7. Click **"Publish"**

---

## Step 4: Register a Web App

1. Go to **Project Settings** (⚙️ gear icon in the left sidebar → "Project settings")
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** (`</>`) to add a web app
4. App nickname: `sanjivani-web`
5. **Don't** check "Firebase Hosting" (we're using Vercel/custom hosting)
6. Click **"Register app"**
7. You'll see the Firebase config object. **Copy these values:**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← Copy this
  authDomain: "xxx.firebaseapp.com",  // ← Copy this
  projectId: "sanjivani-dentals",      // ← Copy this
  storageBucket: "xxx.firebasestorage.app",  // ← Copy this
  messagingSenderId: "123456789",      // ← Copy this
  appId: "1:123456789:web:abc..."      // ← Copy this
};
```

---

## Step 5: Add Config to `.env.local`

Open the file `.env.local` in your project root and replace the placeholder values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your_actual_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sanjivani-dentals.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sanjivani-dentals
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sanjivani-dentals.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> ⚠️ **Important:** The `NEXT_PUBLIC_` prefix is required — it makes these values available to the browser (client-side). This is safe for Firebase client SDK keys as security is enforced by Firestore rules, not key secrecy.

---

## Step 6: Create Admin User

1. Go to Firebase Console → **Authentication** → **Users** tab
2. Click **"Add user"**
3. Enter your admin email and a strong password:
   - Email: `admin@sanjivanidentals.com` (or your preferred email)
   - Password: `YourStrongPassword123!` -Admin@123
4. Click **"Add user"**

> This is the only user who can access `/admin`. You can add more admin users here later.

---

## Step 7: Deploy Firestore Security Rules

### Option A: Via Firebase Console (easiest)

1. Go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with the contents of `firestore.rules` file in your project:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /patients/{patientId} {
      allow read, write: if request.auth != null;
    }
    match /appointments/{appointmentId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /notifications/{notificationId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /clinicSettings/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

### Option B: Via Firebase CLI (advanced)

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

---

## Step 8: Run Seed Script

This populates your database with initial data (services list, clinic settings, sample patients):

```bash
# Install tsx if you don't have it
npm install -D tsx dotenv

# Run the seed script
npx tsx scripts/seed.ts
```

You should see output like:
```
🌱 Starting Firestore seed...

📋 Seeding clinic settings...
   ✅ Clinic settings created

🦷 Seeding services...
   ✅ Routine Checkup & Cleaning
   ✅ Root Canal Therapy
   ...

👤 Seeding sample patients...
   ✅ Sarah Henderson
   ✅ Michael Jenkins
   ...

🎉 Seed complete!
```

---

## Step 9: Test the App

1. **Restart your dev server** (the env vars need a restart):
   ```bash
   npm run dev
   ```

2. **Test the public booking page:**
   - Visit `http://localhost:3000/book`
   - Fill out the booking form and submit
   - Check Firestore Console → `appointments` collection for the new document

3. **Test admin login:**
   - Visit `http://localhost:3000/admin/login`
   - Login with the email/password you created in Step 6
   - You should be redirected to the admin dashboard

4. **Test admin dashboard:**
   - You should see the appointment you created from the booking form
   - Navigate to **Patients** → add/edit/delete patients
   - All data should sync with Firestore in real-time

---

## 🔑 Environment Variables Reference

| Variable | Where to Find | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Project Settings → Web App config | API key for Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Project Settings → Web App config | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project Settings → General | Your project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Project Settings → Web App config | Storage bucket URL |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Project Settings → Cloud Messaging | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Project Settings → Web App config | App ID |

---

## 🛡️ Security Notes

- **Firebase API keys are NOT secret** — they're safe to expose in client-side code. Security is enforced through Firestore Security Rules.
- **Only authenticated users** can read/modify patients, update appointments, and manage notifications.
- **Anyone can create** appointments (public booking) and the associated notifications.
- **Admin accounts** are created manually in Firebase Console — there's no public sign-up.

---

## 📁 Firestore Collections Overview

| Collection | Documents | Access |
|---|---|---|
| `patients` | Patient records | Admin only |
| `appointments` | Booking/appointment records | Public create, Admin CRUD |
| `notifications` | Admin notifications | Public create, Admin read/manage |
| `services` | Dental service catalog | Public read, Admin write |
| `clinicSettings` | Clinic configuration (single doc) | Public read, Admin write |

---

## 🔮 Future Integrations (Not Active Yet)

These are designed into the architecture but not implemented:

- **Email Service** — Appointment confirmation emails
- **Google Calendar Sync** — Auto-sync appointments to Google Calendar
- **Firebase Storage** — Upload patient X-rays, treatment photos

---

## ❓ Troubleshooting

### "Permission Denied" errors
→ Make sure your Firestore Security Rules are published (Step 7)
→ Make sure you're logged in on the admin pages

### "Firebase App not initialized" errors
→ Check that `.env.local` has the correct values
→ Restart the dev server after changing `.env.local`

### Seed script fails
→ Make sure `.env.local` exists and has valid Firebase config
→ Install required deps: `npm install -D tsx dotenv`

### Can't login to admin
→ Verify the user exists in Firebase Console → Authentication → Users
→ Check email/password are correct
→ Look for errors in the browser console
