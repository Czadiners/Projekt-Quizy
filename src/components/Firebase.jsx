import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqufpHdvNDROYXMDO2M56B-Te9pC6CSSg",
  authDomain: "projekt-quizy.firebaseapp.com",
  projectId: "projekt-quizy",
  storageBucket: "projekt-quizy.firebasestorage.app",
  messagingSenderId: "21685950673",
  appId: "1:21685950673:web:22b414a069c778c4f00df0",
  measurementId: "G-17DNB7EH6J"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
