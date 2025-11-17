// firebase.js - initialize Firestore (modular)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

/*
Replace these placeholders with your Firebase project config.
Make sure Firestore is enabled in your Firebase console.
*/
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
  console.warn('Please replace firebaseConfig placeholders in js/firebase.js with your project values.');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
