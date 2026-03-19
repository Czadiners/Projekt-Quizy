// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqufpHdvNDROYXMDO2M56B-Te9pC6CSSg",
  authDomain: "projekt-quizy.firebaseapp.com",
  projectId: "projekt-quizy",
  storageBucket: "projekt-quizy.firebasestorage.app",
  messagingSenderId: "21685950673",
  appId: "1:21685950673:web:22b414a069c778c4f00df0",
  measurementId: "G-17DNB7EH6J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);