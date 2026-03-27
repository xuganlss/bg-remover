import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBH2JKsNhD3Eb3mRH7hf-7Nv6JpI4-3hzs",
  authDomain: "bg-remover-f38d1.firebaseapp.com",
  projectId: "bg-remover-f38d1",
  storageBucket: "bg-remover-f38d1.firebasestorage.app",
  messagingSenderId: "787008345946",
  appId: "1:787008345946:web:780fac4fbd1dc62b7e4563"
};

// 防止热重载时重复初始化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
