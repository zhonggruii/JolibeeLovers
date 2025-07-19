import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js"
import { auth, db } from './config.js';

//creating account
const signupForm = document.getElementById("register-form"); //look for html id
if (signupForm) {
    signupForm.addEventListener("submit", (eventAfterSubmit) => {
        eventAfterSubmit.preventDefault(); //stops page from submitting the form
        const email = document.getElementById("username-input").value;
        const cfmPassword = document.getElementById("cfmpass").value;
        const password = document.getElementById("pass").value;

        if (cfmPassword != password) alert("Passwords dont match!");

        else {
            createUserWithEmailAndPassword(auth, email, cfmPassword)
            .then(async (userCredential) => {
                // setting up user db
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    telegram: "", 
                    name: "",
                    aboutMe:"",
                    photoURL: "",
                    ratings: "", 
                    activity: "",
                    modulesTaken: "",
                    skills: "",
                });
                window.location.href = "login.html";
            })
            .catch((error) => {
                alert("Sign up failed: " + error.message);
            });
        }
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

//reset password
const resetForm = document.getElementById("reset-form");
const resetMsg = document.getElementById("reset-message");
if (resetMsg) {
    resetForm.addEventListener("submit", async (eventAfterSubmit) => {
        eventAfterSubmit.preventDefault();
        const email = document.getElementById("reset-email").value;
        sendPasswordResetEmail(auth, email)
        .then((userCredential) => {
            alert("Email succesffuly sent! Check your inbox!");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert("Error with resetting password: " + error.message);
        }
    );
    })
}