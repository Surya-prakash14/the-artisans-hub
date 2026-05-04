// ===== FIREBASE CONFIGURATION =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBceUXo8EWF7w8aPvtXKa-rrizVVFx2MJM",
  authDomain: "the-artisans-hub.firebaseapp.com",
  projectId: "the-artisans-hub",
  storageBucket: "the-artisans-hub.firebasestorage.app",
  messagingSenderId: "351977926945",
  appId: "1:351977926945:web:17c86b5a75e61afd514e60",
  measurementId: "G-RV4D6DBSTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Expose to window for non-module scripts
window.firebaseApp = app;
window.firebaseDb = db;
window.firebaseAuth = auth;
window.firebaseStorage = storage;

console.log('✅ Firebase Connected — The Artisans Hub');

export { app, analytics, auth, db, storage };
