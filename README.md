# The Artisans Hub — Website

Premium customized gifts, trophies, mementos and corporate gifts from OOTY, Tamil Nadu.

## 🚀 Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
3. No build command needed (static site)
4. Click **Deploy** — done!

## 📁 File Structure

```
/
├── index.html          # Main website
├── vercel.json         # Vercel routing config
├── logo.jpeg           # Brand logo
├── css/
│   └── style.css       # All styles
├── js/
│   ├── main.js         # Main app logic (Firebase, cart, products)
│   └── firebase.js     # Firebase initialization
└── admin/
    ├── index.html      # Admin dashboard
    ├── admin.css       # Admin styles
    └── admin.js        # Admin logic
```

## ⚙️ Firebase Setup

The site connects to Firebase Firestore for live product data.
If Firebase is unavailable, sample products are shown automatically.

## 💬 WhatsApp

Orders are sent to: **+91 63792 99336**
Update `WHATSAPP_NUMBER` in `js/main.js` to change.

## 🛠️ Bugs Fixed

- `vercel.json` routing fixed for correct static file serving
- CSS `flex-wrap: gap` invalid value fixed → `flex-wrap: wrap; gap: 12px`
- Hero grid cards: removed broken `grid-column: span 2` on first card
- Font loading: moved Google Fonts from `@import` to `<link>` in HTML (faster)
- `currentProduct` scope conflict between ES module and inline scripts resolved
- Form inputs use `font-size: 16px` to prevent iOS auto-zoom
- Modal overlay clicks now close modals
- WhatsApp float stays on left; toast stays on right — no overlap on mobile
- Nav scrolls horizontally on small screens without visible scrollbar
- All `onclick="return false"` added to anchor tags to prevent page jump
- Keyboard Escape closes all modals
- Added `aria-label` and `role` attributes for accessibility

