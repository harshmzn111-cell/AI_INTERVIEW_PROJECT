
import { initializeApp } from "firebase/app";
import { getAuth , GoogleAuthProvider } from "firebase/auth";




const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "intellihireiq-123.firebaseapp.com",
  projectId: "intellihireiq-123",
  storageBucket: "intellihireiq-123.firebasestorage.app",
  messagingSenderId: "451586211613",
  appId: "1:451586211613:web:f1bf8b0d0bf989e1656bf4"
};


const app = initializeApp(firebaseConfig);
   
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };