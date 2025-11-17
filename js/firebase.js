// firebase.js - initialize Firestore (modular)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

/*
Replace these placeholders with your Firebase project config.
Make sure Firestore is enabled in your Firebase console.
*/
const firebaseConfig = {
    apiKey: "AIzaSyD_E4uKPS_0uxmx1wMTm3jGikBgf7HwiYY",
    authDomain: "campusbites-4e430.firebaseapp.com",
    projectId: "campusbites-4e430",
    storageBucket: "campusbites-4e430.firebasestorage.app",
    messagingSenderId: "897068032498",
    appId: "1:897068032498:web:7a28767d0c8c7b85610b6b",
    measurementId: "G-NFEK422PTC"
  };



if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
  console.warn('Please replace firebaseConfig placeholders in js/firebase.js with your project values.');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
