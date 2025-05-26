// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAepIXxtHG4gOZybSe9TTtHhO5diakYND4",
  authDomain: "jolibeelovers.firebaseapp.com",
  projectId: "jolibeelovers",
  storageBucket: "jolibeelovers.firebasestorage.app",
  messagingSenderId: "616572060127",
  appId: "1:616572060127:web:ddab0935c3beb43a95046a",
  measurementId: "G-6JFYHYYK7L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth }; 

