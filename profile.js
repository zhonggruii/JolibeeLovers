import { auth, db, storage } from './config.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js';
import { signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

// Intro Modal Pop Up
const introModal = document.getElementById("introModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");

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


// Experience Modal Pop Up
const expModal = document.getElementById("expModal");
const openExpBtn = document.getElementById("openExpModalBtn");
const closeExpBtn = document.getElementById("closeExpModalBtn");

openExpBtn.addEventListener("click", () => expModal.classList.add("open"));
closeExpBtn.addEventListener("click", () => expModal.classList.remove("open"));


// Load and Display User Profile
async function loadUserProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const profileEmail = urlParams.get('email');
    const currentUser = auth.currentUser;

    // Check if this is the owner's profile
    const isOwner = !profileEmail || (currentUser && profileEmail === currentUser.email);
    
    // Get the main profile container
    const profileContainer = document.querySelector('.profile-body') || document.body;
    
    // Toggle owner class
    if (isOwner) {
        profileContainer.classList.add('is-owner');
    } else {
        profileContainer.classList.remove('is-owner');
    }
    
    let userToDisplay;
    let isCurrentUser = false;

    try {
        if (profileEmail) {
            // Fetch the requested user's profile
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', profileEmail));
            const querySnapshot = await getDocs(q); // Make sure this is defined
            
            if (!querySnapshot.empty) {
                userToDisplay = {
                    uid: querySnapshot.docs[0].id,
                    ...querySnapshot.docs[0].data()
                };
            } else {
                // If user not found in 'users' collection, create basic info
                userToDisplay = {
                    email: profileEmail,
                    name: profileEmail.split('@')[0],
                    photoURL: 'https://www.w3schools.com/howto/img_avatar.png'
                };
            }
            
            // Check if this is the current user's profile
            if (currentUser && currentUser.email === profileEmail) {
                isCurrentUser = true;
            }
        } else if (currentUser) {
            // No email parameter, show current user's profile
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            userToDisplay = {
                uid: currentUser.uid,
                email: currentUser.email,
                ...(userSnap.exists() ? userSnap.data() : {})
            };
            isCurrentUser = true;
        } else {
            window.location.href = 'login.html';
            return;
        }

        // Update the UI
        updateProfileUI(userToDisplay, isCurrentUser);
    } catch (error) {
        console.error("Error loading profile:", error);
        // Fallback to showing basic info
        updateProfileUI({
            name: profileEmail ? profileEmail.split('@')[0] : "User",
            email: profileEmail || "No email",
            photoURL: 'https://www.w3schools.com/howto/img_avatar.png'
        }, false);
    }
}

function updateProfileUI(userData, isCurrentUser) {
    // Email
    document.getElementById('userEmailInput').value = userData.email || '';
    document.getElementById('displayUserEmail').textContent = userData.email || '';
    
    // Username
    document.getElementById('userNameInput').value = userData.name || '';
    document.getElementById('displayUserName').textContent = userData.name || `${userData.email?.split('@')[0]}`;
    
    // About
    document.getElementById('aboutMeText').value = userData.aboutMe || '';
    document.getElementById('displayAboutText').textContent = userData.aboutMe || '';

    // Modules
    document.getElementById('modulesInput').value = userData.modulesTaken || '';
    
    // Telegram
    document.getElementById('telegramInput').value = userData.telegram || '';
    document.getElementById('displayTelegram').textContent = userData.telegram || 'N/A';

    // Profile Image
    document.getElementById('profileImage').src = userData.photoURL || 'https://www.w3schools.com/howto/img_avatar.png';
    document.getElementById('introProfileImage').src = userData.photoURL || 'https://www.w3schools.com/howto/img_avatar.png';

    // Show/hide edit controls based on ownership
    const editControls = document.querySelectorAll('.edit-control');
    editControls.forEach(control => {
        if (isCurrentUser) {
            control.classList.remove('hidden'); // Show if owner
        } else {
            control.classList.add('hidden');    // Hide if visitor
        }
    });

    // Disable form elements if not current user
    const formElements = document.querySelectorAll('input, textarea, button');
    formElements.forEach(element => {
        if (!element.classList.contains('view-only')) {
            element.disabled = !isCurrentUser;
        }
    });
}

function setupProfileEditing(user) {
    if (!user) return;

    const nameInput = document.getElementById('userNameInput');
    const saveNameBtn = document.getElementById('saveNameBtn');
    const saveAboutMeBtn = document.getElementById('saveAboutBtn');
    const moduleTakenBtn = document.getElementById('saveProfileBtn');

    saveNameBtn.addEventListener('click', async () => {
        const newName = nameInput.value.trim();
        await updateDoc(doc(db, 'users', user.uid), { name: newName });
        document.getElementById('displayUserName').textContent = newName || `${user.email?.split('@')[0]}`;
        alert('Intro updated!');
        document.getElementById('introModal').classList.remove('open');
    });

    saveAboutMeBtn.addEventListener('click', async () => {
        const newAboutText = document.getElementById('aboutMeText').value.trim();
        const newTelegram = document.getElementById('telegramInput').value.trim();

        await updateDoc(doc(db, 'users', user.uid), { 
            aboutMe: newAboutText, 
            telegram: newTelegram
        });
        
        document.getElementById('displayAboutText').textContent = newAboutText;
        document.getElementById('displayTelegram').textContent = newTelegram || 'N/A';

        alert('About Section updated!');
        document.getElementById('aboutModal').classList.remove('open');
    });

    moduleTakenBtn.addEventListener('click', async () => {
        const newMod = modulesInput.value.trim();
        await updateDoc(doc(db, 'users', user.uid), { modulesTaken: newMod});
        alert('Modules Updated!');
    });
}

// Profile Photo Upload
function setupPhotoUpload(user) {
    const imageUpload = document.getElementById('imageUpload');
    const uploadBtn = document.getElementById('uploadBtn');
    const profileImage = document.getElementById('profileImage');

    // Add null checks
    if (!uploadBtn || !imageUpload || !profileImage) {
        console.warn("Photo upload elements not found");
        return;
    }

    uploadBtn.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const maxSize = 100 * 1024; // 100KB
            if (file.size > maxSize) {
                alert("File size too large! Max 100KB allowed.");
                return;
            }
            
            const imageRef = ref(storage, `profileImages/${user.uid}`);
            await uploadBytes(imageRef, file);
            const downloadURL = await getDownloadURL(imageRef);
            
            await updateDoc(doc(db, 'users', user.uid), { 
                photoURL: downloadURL 
            });
            
            profileImage.src = downloadURL;
            document.getElementById('introProfileImage').src = downloadURL;
            
            await updateProfile(user, {
                photoURL: downloadURL
            });
            
            alert('Profile photo updated!');
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload photo: " + error.message);
        }
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
        loadUserProfile();
        setupProfileEditing(user);
        setupPhotoUpload(user);
        setupRatingSystem(user);
        setupSignOut();
        setUpRemovePhoto(user);
    } else {
        window.location.href = 'login.html';
    }
});

// Loader
window.addEventListener("load", () => {
    const loader = document.querySelector(".loader");
    if (loader) {
        loader.classList.add("loader-hidden");
        loader.addEventListener("transitionend", () => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        });
    }
});

// Custom Multi-Select Dropdown
const skillsMultiSelect = document.getElementById('skillsMultiSelect');
const skillsDropdown = document.getElementById('skillsDropdown');
const skillsSelectedItems = document.getElementById('skillsSelectedItems');
const skillsOutput = document.getElementById('skillsOutput');
const skillsShowBtn = document.getElementById('skillsShowBtn');

const selectedValues = new Set();

skillsMultiSelect.addEventListener('click', () => {
    skillsMultiSelect.classList.toggle('active');
});

// tags
skillsDropdown.addEventListener('click', (e) => {
    const value = e.target.getAttribute('data-value');
    const label = e.target.textContent;

    if (!selectedValues.has(value)) {
        selectedValues.add(value);

        const tag = document.createElement('span');
        tag.innerHTML = `${label} <i class="multi-dropdown-icon material-symbols-outlined" data-remove="${value}">close_small</i>`;
        skillsSelectedItems.appendChild(tag);
    }
});

// tags unselected when pressing 'x'
skillsSelectedItems.addEventListener('click', (e) => {
    if (e.target.dataset.remove) {
        const valueToRemove = e.target.dataset.remove;
        selectedValues.delete(valueToRemove);
        e.target.parentElement.remove();
    }
});

// dropdown closes when clicking outside
document.addEventListener('click', (e) => {
    if (!skillsMultiSelect.contains(e.target)) {
        skillsMultiSelect.classList.remove('active');
    }
});

// save button function
skillsShowBtn.addEventListener('click', () => {
    if (selectedValues.size === 0) {
        skillsOutput.textContent = 'No items selected.';
    } else {
        skillsOutput.textContent = Array.from(selectedValues).join(', ');
    }
});