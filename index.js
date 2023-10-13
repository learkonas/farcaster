// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9mCnzLxpSSzxKME5RXfkT192p6eJZXF0",
  authDomain: "farcaster-post-permissionless.firebaseapp.com",
  projectId: "farcaster-post-permissionless",
  storageBucket: "farcaster-post-permissionless.appspot.com",
  messagingSenderId: "8658554511",
  appId: "1:8658554511:web:9a2cf74d827a3a38f52afa",
  measurementId: "G-38KRYD1258",
  databaseURL: "https://farcaster-post-permissionless-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);