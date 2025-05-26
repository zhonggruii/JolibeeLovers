import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { auth } from './config.js';

//creating account
const signupForm = document.getElementById("register-form"); //look for html id
if (signupForm) {
    signupForm.addEventListener("submit", (eventAfterSubmit) => {
        eventAfterSubmit.preventDefault(); //stops page from submitting the form
        const email = document.getElementById("username-input").value;
        const password = document.getElementById("cfmpass").value;

        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert("Sign up failed: " + error.message);
        });
    })
}


//sign in
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", (eventAfterSubmit) => {
        eventAfterSubmit.preventDefault();
        const email = document.getElementById("username-input").value;
        const password = document.getElementById("pass").value;

        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            window.location.href = "index.html";
        })
        .catch((error) => {
            alert("Login failed: " + error.message);
        });
    })
} 
