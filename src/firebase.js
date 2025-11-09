// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCkYAWcNWWjCI3edEgIUBZ9Er3WyhVoL-I",
  authDomain: "party-rental-app.firebaseapp.com",
  projectId: "party-rental-app",
  storageBucket: "party-rental-app.firebasestorage.app",
  messagingSenderId: "681513439831",
  appId: "1:681513439831:web:7420c33cca288bb7034912",
  measurementId: "G-7G2Q5XYRPT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };