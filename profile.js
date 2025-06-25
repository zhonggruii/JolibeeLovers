import { auth, db, storage } from './config.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js';
import { signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

// DOM Elements
const introModal = document.getElementById("introModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");

// Intro Modal Pop Up
openBtn.addEventListener("click", () => introModal.classList.add("open"));
closeBtn.addEventListener("click", () => introModal.classList.remove("open"));

// Calendar Modal Pop Up
const calendarModal = document.getElementById("calendarModal");
const openCalendarBtn = document.getElementById("openCalendarModalBtn");
const closeCalendarBtn = document.getElementById("closeCalendarModalBtn");

openCalendarBtn.addEventListener("click", () => calendarModal.classList.add("open"));
closeCalendarBtn.addEventListener("click", () => calendarModal.classList.remove("open"));

// About Modal Pop Up
const aboutModal = document.getElementById("aboutModal");
const openAboutBtn = document.getElementById("openAboutModalBtn");
const closeAboutBtn = document.getElementById("closeAboutModalBtn");

openAboutBtn.addEventListener("click", () => aboutModal.classList.add("open"));
closeAboutBtn.addEventListener("click", () => aboutModal.classList.remove("open"));

// Activity Modal Pop Up
const activityModal = document.getElementById("activityModal");
const openActivityBtn = document.getElementById("openActivityModalBtn");
const closeActivityBtn = document.getElementById("closeActivityModalBtn");

openActivityBtn.addEventListener("click", () => activityModal.classList.add("open"));
closeActivityBtn.addEventListener("click", () => activityModal.classList.remove("open"));

// Skills Modal Pop Up
const skillsModal = document.getElementById("skillsModal");
const openSkillsBtn = document.getElementById("openSkillsModalBtn");
const closeSkillsBtn = document.getElementById("closeSkillsModalBtn");

openSkillsBtn.addEventListener("click", () => skillsModal.classList.add("open"));
closeSkillsBtn.addEventListener("click", () => skillsModal.classList.remove("open"));

// Load and Display User Profile
async function loadUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();
        document.getElementById('userEmail').textContent = `${user.email}`;
        document.getElementById('userNameInput').value = data.name || '';
        document.getElementById('aboutMeText').value = data.aboutMe || '';
        document.getElementById('modulesInput').value = data.modulesTaken || '';
        if (data.photoURL) {
            document.getElementById('profileImage').src = data.photoURL;
        } else {
            document.getElementById('profileImage').src = "https://www.w3schools.com/howto/img_avatar.png";
        }
    }
}

// Save Display Name and Bio
function setupProfileEditing(user) {
    const nameInput = document.getElementById('userNameInput');
    const aboutInput = document.getElementById('aboutMeText');
    const saveNameBtn = document.getElementById('saveNameBtn');
    const saveAboutMeBtn = document.getElementById('saveAboutMe');
    const moduleTakenBtn = document.getElementById('saveProfileBtn');

    saveNameBtn.addEventListener('click', async () => {
        const newName = nameInput.value.trim();
        await updateDoc(doc(db, 'users', user.uid), { name: newName });
        alert('Name updated!');
    });

    saveAboutMeBtn.addEventListener('click', async () => {
        const newAbout = aboutInput.value.trim();
        await updateDoc(doc(db, 'users', user.uid), { aboutMe: newAbout });
        alert('About Me updated!');
    });

    moduleTakenBtn.addEventListener('click', async () => {
        const newMod = modulesInput.value.trim();
        await updateDoc(doc(db, 'users', user.uid), { modulesTaken: newMod});
        alert('Modules Updated!');
    })
    loadUserProfile(user);
}

// Profile Photo Upload
function setupPhotoUpload(user) {
    const imageUpload = document.getElementById('imageUpload');
    const uploadBtn = document.getElementById('uploadBtn');
    const profileImage = document.getElementById('profileImage');

    uploadBtn.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', async (event) => {
        //take the first file
        const file = event.target.files[0];
        if (!file) return;

        const maxSize = 100 * 1024;
        if (file.size > maxSize) {
            return alert("file size too large!");
        }
        //get the reference path to img before uploading it
        const imageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(imageRef, file);

        //get the download URL of it to put on db
        const downloadURL = await getDownloadURL(imageRef);
        await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });
        profileImage.src = downloadURL;

        //ensures that photoURL is directly modified on auth user profile
        //allows us to change photo multiple times
        await updateProfile(user, {
                photoURL: downloadURL
        });
        alert('Profile photo updated!');
    });
}

// remove profile picture button
function setUpRemovePhoto(user) {
    const remvBtn = document.getElementById("removePhotoBtn");
    remvBtn.addEventListener('click', async () => {
        try {
            const photoPath = `profileImages/${user.uid}`;
            const photoRef = ref(storage, photoPath);
            //dlt in the firebase storage
            await deleteObject(photoRef);
            //dlt in firebase db
            await updateDoc(doc(db, 'users', user.uid), {
                photoURL: ""
            });
            await updateProfile(user, {
                photoURL: null
            });
            alert("Photo removed!");
            loadUserProfile(user);
        } catch (error) {
            alert("Failed to remove photo: " + error);
        }
    });
}


// Star Rating System *TO DO*
function setupRatingSystem(user) {
    const stars = document.querySelectorAll('#ratingStars span');
    const averageRating = document.getElementById('averageRating');
    const ratingCount = document.getElementById('ratingCount');

}

// Sign Out
function setupSignOut() {
    const signOutBtn = document.getElementById('signOutBtn');
    signOutBtn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'login.html';
    });
}

// when user firsts login
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("userEmail").textContent = `Email: ${user.email}`;
        loadUserProfile(user);
        setupProfileEditing(user);
        setupPhotoUpload(user);
        setupRatingSystem(user);
        setupSignOut();
        setUpRemovePhoto(user);
    } else {
        window.location.href = 'login.html';
    }
});
