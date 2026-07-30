// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKuWFx5zgdH3f2nM2R2sHRQrsQa1SFacg",
  authDomain: "fogar-web.firebaseapp.com",
  databaseURL: "https://fogar-web-default-rtdb.firebaseio.com",
  projectId: "fogar-web",
  storageBucket: "fogar-web.firebasestorage.app",
  messagingSenderId: "609611221134",
  appId: "1:609611221134:web:bc0909b6c9a3a84d93e1df",
  measurementId: "G-B11GXM8YSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Analytics only works in the browser, so guard it
export let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;