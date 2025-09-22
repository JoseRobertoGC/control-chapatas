// src/firebase/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyA4M-75pi3JBjGH5tbQNPRvjZGLVnALsn4",
  authDomain: "chapatasapp.firebaseapp.com",
  projectId: "chapatasapp",
  storageBucket: "chapatasapp.appspot.com",
  messagingSenderId: "1058313497469",
  appId: "1:1058313497469:web:ff60d22cc49b42c330ca14",
  measurementId: "G-J4JVRXJE2R"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta Firestore para usarlo donde lo necesites
export const db = getFirestore(app);
export const storage = getStorage(app);
