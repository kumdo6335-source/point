import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// ─────────────────────────────────────────────────────────────
// Firebase 설정
//
// 기존 Firebase 프로젝트의 웹앱 구성값을 아래에 채워 넣으세요.
// (Firebase 콘솔 → 프로젝트 설정 → 내 앱 → 웹앱 → SDK 설정 및 구성)
//
// 값이 있는 파일을 커밋하고 싶지 않다면 .env(VITE_ 접두사) 를 사용하고
// import.meta.env.VITE_FIREBASE_API_KEY 형태로 불러오세요.
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'YOUR_PROJECT.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'YOUR_PROJECT.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'YOUR_APP_ID',
}

export const isFirebaseConfigured =
  firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY'

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
