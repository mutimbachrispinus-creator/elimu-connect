# 🎓 ElimuConnect — Kenya's Premier Learning Hub

> **Connecting Learners to Excellence** — A full-stack Next.js 14 e-learning platform supporting all major curricula (CBC, Cambridge, IB, Montessori, 8-4-4, and more), built for the Kenyan market with M-Pesa and Pesapal payment integration.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Payment Setup](#payment-setup)
- [Deployment to Cloudflare Pages](#deployment-to-cloudflare-pages)
- [Roles & Permissions](#roles--permissions)
- [Classroom (WebRTC)](#classroom-webrtc)
- [Subscription Tiers](#subscription-tiers)

---

## ✨ Features

### 🏫 Multi-Role Platform
| Role | Capabilities |
|------|-------------|
| **Super Admin** | Manage all users, set registration fees, configure subscription pricing, verify teachers, view platform revenue |
| **Teacher** | Register with subjects/curricula, choose subscription tier, accept booking requests, host live sessions, upload paid courses, upload library resources, view earnings |
| **Student** | Search and book teachers, join live sessions, purchase courses, access library |
| **Parent** | Link children's accounts, monitor progress, manage payments |

### 🎥 Built-in Virtual Classroom
- WebRTC peer-to-peer video/audio (no Zoom/Google Meet required)
- Screen sharing
- Interactive whiteboard (Canvas API)
- Real-time chat (Firebase RTDB)
- Hand raise, participant list
- Host controls (mute all, end session)
- Session recording toggle

### 💳 Payments
- **M-Pesa Daraja STK Push** — Lipa Na M-Pesa (Safaricom)
- **Pesapal v3** — Card payments (Visa, Mastercard, Airtel Money)
- Post-payment webhooks automatically activate subscriptions

### 📚 Content
- Paid video courses (teacher uploads, student unlocks with payment)
- Resource library (PDFs, videos, presentations, audio)
- Per-curriculum and per-level filtering

### 📧 Communications
- **Resend** — Transactional emails (OTP, welcome, booking notifications)
- **Africa's Talking** — SMS OTP verification

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + custom design system |
| Database | Firebase Firestore (data) + Firebase RTDB (signaling/chat) |
| Storage | Firebase Storage (videos, files, images) |
| Auth | Firebase Authentication |
| Email | Resend |
| SMS | Africa's Talking |
| Payments | Safaricom M-Pesa Daraja + Pesapal v3 |
| Video | WebRTC (built-in, no third party) |
| Deployment | Cloudflare Pages (`@cloudflare/next-on-pages`) |
| Forms | React Hook Form + Zod |
| State | Zustand + React Context |

---

## 📁 Project Structure

```
elimuconnect/
├── app/
│   ├── (auth)/               # Login, Register (teacher/student/parent), Verify
│   ├── dashboard/
│   │   ├── admin/            # Super admin: overview, teachers, students, settings
│   │   ├── teacher/          # Teacher: overview, sessions, bookings, courses, library, earnings
│   │   ├── student/          # Student: overview, find-teachers, my-bookings, my-courses, library
│   │   └── parent/           # Parent: overview, children
│   ├── classroom/[sessionId]/ # Live WebRTC classroom
│   ├── api/
│   │   ├── send-otp/         # Email (Resend) & SMS (Africa's Talking) OTP
│   │   ├── verify-otp/       # Validate OTP codes
│   │   ├── notify/           # In-app notifications
│   │   └── payments/
│   │       ├── mpesa/        # STK Push initiate + Safaricom callback
│   │       └── pesapal/      # Order submit + IPN callback
│   └── page.tsx              # Landing page
├── components/               # UI components (future expansion)
├── context/AuthContext.tsx   # Firebase Auth context
├── hooks/useWebRTC.ts        # WebRTC classroom hook
├── lib/
│   ├── firebase.ts           # Firebase client SDK
│   ├── resend.ts             # Email templates
│   ├── africas-talking.ts    # SMS OTP
│   ├── mpesa.ts              # M-Pesa Daraja API
│   ├── pesapal.ts            # Pesapal v3 API
│   └── utils.ts              # Helpers
├── types/index.ts            # TypeScript types
├── middleware.ts             # Route protection
├── .env.example              # Environment variable template
├── wrangler.toml             # Cloudflare Pages config
└── next.config.mjs           # Next.js config
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- Safaricom Daraja account (sandbox or production)
- Pesapal merchant account
- Resend account
- Africa's Talking account
- Cloudflare account (for deployment)

### Install

```bash
cd elimuconnect
npm install
cp .env.example .env.local
# Fill in .env.local with your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client SDK config |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | AT username (`sandbox` for testing) |
| `MPESA_CONSUMER_KEY/SECRET` | From Safaricom Developer Portal |
| `MPESA_SHORTCODE` | Your Paybill/Till number |
| `MPESA_PASSKEY` | Lipa Na M-Pesa online passkey |
| `PESAPAL_CONSUMER_KEY/SECRET` | From Pesapal merchant portal |

---

## 🔥 Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database** (start in production mode)
4. Enable **Realtime Database** (for WebRTC signaling & chat)
5. Enable **Storage** (for file uploads)
6. Copy config to `.env.local`

### Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users` | All user accounts |
| `teachers` | Teacher profiles & subscriptions |
| `students` | Student profiles |
| `parents` | Parent profiles |
| `sessions` | Live class sessions |
| `bookings` | Booking requests |
| `courses` | Video courses |
| `library` | Library resources |
| `payments` | Payment records |
| `otps` | Temporary OTP storage |
| `notifications` | In-app notifications |
| `platform` | Admin settings (doc: `settings`) |

### Realtime Database Structure
```
rooms/
  {sessionId}/
    participants/
      {userId}: { uid, displayName, audioEnabled, videoEnabled, ... }
    signals/
      {userId}/
        offer_from_{senderId}: { type, sdp }
        answer_from_{senderId}: { type, sdp }
        ice_from_{senderId}/: [ candidates ]
    chat/
      {messageId}: { senderId, senderName, content, timestamp }
```

### Firestore Security Rules (recommended)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /teachers/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /sessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /library/{resourceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /payments/{paymentId} {
      allow read: if request.auth != null;
    }
    match /notifications/{notifId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /platform/{doc} {
      allow read: if request.auth != null;
      allow write: if false; // Admin writes via server-side only
    }
    match /otps/{otpId} {
      allow read, write: if false; // Server-side only
    }
  }
}
```

---

## 💳 Payment Setup

### M-Pesa (Safaricom Daraja)
1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app and get Consumer Key/Secret
3. Use shortcode `174379` + passkey `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` for **sandbox**
4. Set callback URL: `https://yourdomain.com/api/payments/mpesa/callback`
5. For production, register your Paybill and get your live passkey

### Pesapal
1. Register at [merchant.pesapal.com](https://merchant.pesapal.com)
2. Get Consumer Key/Secret
3. Register IPN URL: `https://yourdomain.com/api/payments/pesapal/callback`
4. Set `PESAPAL_NOTIFICATION_ID` from the IPN registration response

---

## 🚀 Deployment to Cloudflare Pages

### Build for Cloudflare
```bash
npm run pages:build
```

### Deploy
```bash
npm run deploy
```

### Or via Cloudflare Dashboard
1. Push code to GitHub
2. Connect repo in Cloudflare Pages
3. Deploy command: `npx wrangler deploy`
4. Build output: `.vercel/output/static`
5. Add all environment variables in Pages → Settings → Environment Variables
6. Enable `nodejs_compat` compatibility flag

The `wrangler.toml` file runs `npm run pages:build` before deployment, so `npx wrangler deploy` can create and upload `.vercel/output/static`.

### Production environment variables

Set these in Cloudflare Pages → Settings → Environment Variables. Do not commit real secrets to `.env` files.

Required for the app to build and run:

```bash
NEXT_PUBLIC_APP_URL=https://elimuconnect.pages.dev
NEXT_PUBLIC_APP_NAME=ElimuConnect
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_web_app_id
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=ElimuConnect
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
AT_SENDER_ID=ElimuConnect
```

Required if payments are enabled:

```bash
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_paybill_or_till
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://elimuconnect.pages.dev/api/payments/mpesa/callback
MPESA_ENV=sandbox
PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
PESAPAL_CALLBACK_URL=https://elimuconnect.pages.dev/api/payments/pesapal/callback
PESAPAL_NOTIFICATION_ID=your_pesapal_ipn_notification_id
PESAPAL_ENV=sandbox
```

Optional defaults:

```bash
DEFAULT_REGISTRATION_FEE_KES=500
DEFAULT_PLATFORM_COMMISSION_PERCENT=15
TRIAL_DURATION_DAYS=14
```

### Custom Domain
In Cloudflare Pages → Custom Domains, add `elimuconnect.co.ke`

---

## 👥 Roles & Permissions

### Creating a Super Admin
After first deployment, manually set a user's role in Firestore:
```
users/{uid} → role: "superadmin"
```

### Teacher Registration Flow
1. Teacher fills account details + profile
2. Selects subscription tier
3. Pays registration fee + first month via M-Pesa STK Push
4. Receives email + SMS verification codes
5. Admin verifies teacher (badge appears on profile)
6. Teacher can now create sessions, upload courses

---

## 🎥 Classroom (WebRTC)

The classroom uses **pure WebRTC** with **Firebase Realtime Database** as the signaling server — no third-party video SDK required.

### How it works
1. Teacher creates a session → generates unique session ID
2. Participants join → presence written to RTDB
3. Each participant initiates `RTCPeerConnection` with all others
4. SDP offers/answers and ICE candidates exchange via RTDB
5. Once connected, all media flows directly peer-to-peer
6. Chat is stored in RTDB and synced in real-time
7. Whiteboard uses HTML5 Canvas API

### Browser Support
Chrome, Edge, Firefox, Safari (WebRTC supported in all modern browsers)

---

## 📦 Subscription Tiers

| Tier | Price | Students | Courses | Features |
|------|-------|----------|---------|---------|
| **Free Trial** | Free (14 days) | 5 | — | Basic classroom, basic library |
| **Basic** | KES 500/month | 20 | 10 | Full classroom, full library |
| **Professional** | KES 1,500/month | 100 | Unlimited | All features, verified badge, analytics |
| **Enterprise** | KES 5,000/month | Unlimited | Unlimited | Custom branding, API, account manager |

Prices can be changed by Super Admin in **Dashboard → Admin → Settings**.

---

## 📞 Support

For questions about the platform, contact the ElimuConnect team.

**© 2024 ElimuConnect — Connecting Learners to Excellence**
