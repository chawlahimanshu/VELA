import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAVRF64eg0T9iyOHi0ZxmbiIJjNOl0TMeY",
  authDomain: "vela-46027.firebaseapp.com",
  projectId: "vela-46027",
  storageBucket: "vela-46027.firebasestorage.app",
  messagingSenderId: "976244951224",
  appId: "1:976244951224:web:1791b412dbd009b7018c4d",
  measurementId: "G-3JBKN9P3RR"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export{ app, auth };