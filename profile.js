import { auth, db, storage } from './config.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, serverTimestamp, arrayUnion} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js';
import { signOut, updateProfile, onAuthStateChanged, getAuth } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

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

    console.log("Loading profile for email:", profileEmail);
    console.log("Current user:", currentUser?.email);

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
            console.log("Fetching profile for:", profileEmail);
            
            // Fetch the requested user's profile
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', profileEmail));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                userToDisplay = {
                    uid: querySnapshot.docs[0].id,
                    ...userData
                };
                console.log("Found user data:", userToDisplay);
            } else {
                console.log("User not found in database, creating basic info");
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
                console.log("This is the current user's profile");
            } else {
                console.log("This is someone else's profile");
            }
            
        } else if (currentUser) {
            console.log("No email parameter, showing current user's profile");
            // No email parameter, show current user's profile
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            userToDisplay = {
                uid: currentUser.uid,
                email: currentUser.email,
                name: currentUser.displayName || currentUser.email.split('@')[0],
                photoURL: currentUser.photoURL,
                ...(userSnap.exists() ? userSnap.data() : {})
            };
            isCurrentUser = true;
        } else {
            console.log("No user logged in, redirecting to login");
            window.location.href = 'index.html';
            return;
        }

        console.log("Final user data to display:", userToDisplay);
        console.log("Is current user:", isCurrentUser);

        // Update the UI
        updateProfileUI(userToDisplay, isCurrentUser);
        
        // Initialize calendar for the profile user
        if (userToDisplay.uid && typeof initializeCalendar === 'function') {
            console.log("Initializing calendar for user:", userToDisplay.uid);
            await initializeCalendar(userToDisplay.uid);
        }
        
        // Set up editing if this is the current user
        if (isCurrentUser && currentUser) {
            setupProfileEditing(currentUser);
            setupPhotoUpload(currentUser);
            setUpRemovePhoto(currentUser);
        }
        
    } catch (error) {
        console.error("Error loading profile:", error);
        // Fallback to showing basic info
        const fallbackUser = {
            name: profileEmail ? profileEmail.split('@')[0] : "User",
            email: profileEmail || "No email",
            photoURL: 'https://www.w3schools.com/howto/img_avatar.png'
        };
        console.log("Using fallback user data:", fallbackUser);
        updateProfileUI(fallbackUser, false);
    }
}

function updateProfileUI(userData, isCurrentUser) {
    console.log("Updating UI with data:", userData);
    console.log("Is current user:", isCurrentUser);

    // Email
    const emailInput = document.getElementById('userEmailInput');
    const displayEmail = document.getElementById('displayUserEmail');
    if (emailInput) emailInput.value = userData.email || '';
    if (displayEmail) displayEmail.textContent = userData.email || '';
    
    // Username
    const nameInput = document.getElementById('userNameInput');
    const displayName = document.getElementById('displayUserName');
    const userName = userData.name || userData.displayName || userData.email?.split('@')[0] || 'Unknown User';
    
    if (nameInput) nameInput.value = userName;
    if (displayName) displayName.textContent = userName;
    
    console.log("Setting username to:", userName);
    
    // About
    const aboutInput = document.getElementById('aboutMeText');
    const displayAbout = document.getElementById('displayAboutText');
    if (aboutInput) aboutInput.value = userData.aboutMe || '';
    if (displayAbout) displayAbout.textContent = userData.aboutMe || '';

    // Activity
    const activityInput = document.getElementById('activityInput');
    const displayActivity = document.getElementById('displayActivity');
    if (activityInput) activityInput.value = userData.activity || '';
    if (displayActivity) displayActivity.textContent = userData.activity || 'No projects';

    // Skills
    const skills = userData.skills || [];
    const displaySkills = document.getElementById('displaySkills');
    if (displaySkills) {
        displaySkills.innerHTML = skills.length > 0 
            ? skills.map(skill => `<span>${skill}</span>`).join('')
            : `<p class="content-text m0">None selected</p>`;
    }

    // Update selected values for skills if they exist
    if (typeof selectedValues !== 'undefined') {
        selectedValues.clear();
        skills.forEach(skill => selectedValues.add(skill));
    }
    
    const skillsOutput = document.getElementById('skillsOutput');
    if (skillsOutput) {
        skillsOutput.textContent = skills.join(', ') || 'None Selected';
    }

    // Modules
    const modulesInput = document.getElementById('modulesInput');
    const displayModules = document.getElementById('displayModules');
    if (modulesInput) modulesInput.value = userData.modulesTaken || '';
    if (displayModules) displayModules.textContent = userData.modulesTaken || 'No experience';
    
    // Telegram
    const telegramInput = document.getElementById('telegramInput');
    const displayTelegram = document.getElementById('displayTelegram');
    if (telegramInput) telegramInput.value = userData.telegram || '';
    if (displayTelegram) displayTelegram.textContent = userData.telegram || 'N/A';

    // Profile Image
    const profileImage = document.getElementById('profileImage');
    const introProfileImage = document.getElementById('introProfileImage');
    const imageUrl = userData.photoURL || 'https://www.w3schools.com/howto/img_avatar.png';
    
    console.log("Setting profile image to:", imageUrl);
    
    if (profileImage) {
        profileImage.src = imageUrl;
        profileImage.onerror = function() {
            console.log("Profile image failed to load, using default");
            this.src = 'https://www.w3schools.com/howto/img_avatar.png';
        };
    }
    
    if (introProfileImage) {
        introProfileImage.src = imageUrl;
        introProfileImage.onerror = function() {
            console.log("Intro profile image failed to load, using default");
            this.src = 'https://www.w3schools.com/howto/img_avatar.png';
        };
    }

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
    
    console.log("Profile UI update completed");
}

function setupProfileEditing(user) {
    if (!user) return;

    const nameInput = document.getElementById('userNameInput');
    const saveNameBtn = document.getElementById('saveNameBtn');
    const saveAboutMeBtn = document.getElementById('saveAboutBtn');
    const saveActivityBtn = document.getElementById('saveActivityBtn');
    const saveSkillsBtn = document.getElementById('saveSkillsBtn');
    const resetSkillsBtn = document.getElementById('resetSkillsBtn');
    const saveModuleBtn = document.getElementById('saveModuleBtn');

    if (saveNameBtn) {
        const newSaveNameBtn = saveNameBtn.cloneNode(true);
        saveNameBtn.parentNode.replaceChild(newSaveNameBtn, saveNameBtn);
        
        newSaveNameBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const newName = nameInput.value.trim();
            await updateDoc(doc(db, 'users', user.uid), { name: newName });
            document.getElementById('displayUserName').textContent = newName || `${user.email?.split('@')[0]}`;
            alert('Intro updated!');
            document.getElementById('introModal').classList.remove('open');
        });
    }

    if (saveAboutMeBtn) {
        const newSaveAboutBtn = saveAboutMeBtn.cloneNode(true);
        saveAboutMeBtn.parentNode.replaceChild(newSaveAboutBtn, saveAboutMeBtn);
        
        newSaveAboutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
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
    }

    if (saveActivityBtn) {
        const newSaveActivityBtn = saveActivityBtn.cloneNode(true);
        saveActivityBtn.parentNode.replaceChild(newSaveActivityBtn, saveActivityBtn);
        
        newSaveActivityBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const newActivity = document.getElementById('activityInput').value.trim();

            await updateDoc(doc(db, 'users', user.uid), { 
                activity: newActivity
            });
            
            document.getElementById('displayActivity').textContent = newActivity || 'No projects';

            alert('Activity Section updated!');
            document.getElementById('activityModal').classList.remove('open');
        });
    }

    if (saveSkillsBtn) {
        const newSaveSkillsBtn = saveSkillsBtn.cloneNode(true);
        saveSkillsBtn.parentNode.replaceChild(newSaveSkillsBtn, saveSkillsBtn);
        
        newSaveSkillsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const skillsArray = Array.from(selectedValues);

            await updateDoc(doc(db, 'users', user.uid), { 
                skills: skillsArray 
            });
            
            document.getElementById('displaySkills').innerHTML = skillsArray
            .map(skill => `<span>${skill}</span>`)
            .join('');

            const skillsOutput = document.getElementById('skillsOutput');
            if (skillsOutput) {
                skillsOutput.textContent = skillsArray.join(', ') || 'None Selected';
            }
            
            const skillsSelectedItems = document.getElementById('skillsSelectedItems');
            if (skillsSelectedItems) {
                skillsSelectedItems.innerHTML = '';
            }

            alert('Skills Section updated!');
            document.getElementById('skillsModal').classList.remove('open');
        });
    }

    if (resetSkillsBtn) {
        const newResetSkillsBtn = resetSkillsBtn.cloneNode(true);
        resetSkillsBtn.parentNode.replaceChild(newResetSkillsBtn, resetSkillsBtn);
        
        newResetSkillsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            selectedValues.clear();
            const skillsSelectedItems = document.getElementById('skillsSelectedItems');
            if (skillsSelectedItems) {
                skillsSelectedItems.innerHTML = '';
            }
            
            const skillsOutput = document.getElementById('skillsOutput');
            if (skillsOutput) {
                skillsOutput.textContent = 'None Selected';
            }

            await updateDoc(doc(db, 'users', user.uid), { 
                skills: [] 
            });

            document.getElementById('displaySkills').innerHTML = '<p class="content-text m0">None selected</p>';

            alert('Skills Section Has Been Reset!');
        });
    }

    if (saveModuleBtn) {
        const newModuleTakenBtn = saveModuleBtn.cloneNode(true);
        saveModuleBtn.parentNode.replaceChild(newModuleTakenBtn, saveModuleBtn);
        
        newModuleTakenBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const newModules = document.getElementById('modulesInput').value.trim();

            await updateDoc(doc(db, 'users', user.uid), { 
                modulesTaken: newModules
            });
            
            document.getElementById('displayModules').textContent = newModules || 'No experience';

            alert('Experience Section updated!');
            document.getElementById('expModal').classList.remove('open');
        });
    }
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
            const introProfileImage = document.getElementById('introProfileImage');
            if (introProfileImage) {
                introProfileImage.src = downloadURL;
            }
            
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
    if (!remvBtn) return;
    
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
            loadUserProfile();
        } catch (error) {
            alert("Failed to remove photo: " + error);
        }
    });
}

// Initialize profile when page loads
onAuthStateChanged(auth, (user) => {
    if (user || new URLSearchParams(window.location.search).get('email')) {
        loadUserProfile();
    } else {
        window.location.href = 'index.html';
    }
});


/// Star Rating System

// Check if two users are in the same group
async function areUsersInSameGroup(userEmail1, userEmail2) {
    try {
        // Query groups where both users are members
        const groupsRef = collection(db, "groups");
        const q1 = query(groupsRef, where("members", "array-contains", userEmail1));
        const q2 = query(groupsRef, where("members", "array-contains", userEmail2));
        
        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);
        
        // Get group IDs for each user
        const user1Groups = new Set();
        const user2Groups = new Set();
        
        snapshot1.forEach(doc => user1Groups.add(doc.id));
        snapshot2.forEach(doc => user2Groups.add(doc.id));
        
        // Check if they share any groups
        for (let groupId of user1Groups) {
            if (user2Groups.has(groupId)) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error("Error checking group membership:", error);
        return false;
    }
}

// Get user's groups for display purposes
async function getUserGroups(userEmail) {
    try {
        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("members", "array-contains", userEmail));
        const snapshot = await getDocs(q);
        
        const groups = [];
        snapshot.forEach(doc => {
            groups.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return groups;
    } catch (error) {
        console.error("Error fetching user groups:", error);
        return [];
    }
}

// REPLACE your existing setupRatingSystem function with this enhanced version
function setupRatingSystem(profileUser) {
    const stars = document.querySelectorAll(".stars i");
    const averageRatingEl = document.getElementById('averageRating');
    const ratingCountEl = document.getElementById('ratingCount');
    const currentUser = getAuth().currentUser;

    // Check if stars exist before proceeding
    if (!stars || stars.length === 0) {
        console.warn('Rating stars not found in DOM. Make sure your HTML has elements with class "stars i"');
        return;
    }

    // Initialize the rating system
    initializeRatingSystem();

    async function initializeRatingSystem() {
        // Case 1: User not logged in
        if (!currentUser) {
            disableRating("Please log in to rate users");
            // Load and display existing ratings for non-logged users
            loadRatings(profileUser.uid);
            return;
        }

        // Case 2: User trying to rate themselves
        if (profileUser.uid === currentUser.uid) {
            disableRating("You cannot rate yourself");
            // Load and display existing ratings even for own profile
            loadRatings(profileUser.uid);
            // Show user's own groups instead
            showUserGroups(profileUser.email);
            return;
        }

        // Case 3: Check if users are in the same group
        const areGroupmates = await areUsersInSameGroup(currentUser.email, profileUser.email);
        
        if (!areGroupmates) {
            disableRating("You can only rate users from your groups");
            // Load and display existing ratings even for non-groupmates
            loadRatings(profileUser.uid);
            return;
        }

        // Case 4: Users are groupmates - enable rating
        enableRating();
        loadRatings(profileUser.uid);
    }

    function disableRating(message) {
        stars.forEach(star => {
            star.style.cursor = 'not-allowed';
            star.style.opacity = '0.5';
            // Remove any existing click listeners
            star.replaceWith(star.cloneNode(true));
        });
        
        // Update the message in the UI
        const messageEl = document.querySelector('.rating-message') || createMessageElement();
        messageEl.textContent = message;
        messageEl.style.color = '#666';
        messageEl.style.fontStyle = 'italic';
    }

    function enableRating() {
        const updatedStars = document.querySelectorAll(".stars i");
        updatedStars.forEach((star, index) => {
            star.style.cursor = 'pointer';
            star.style.opacity = '1';
            star.addEventListener('click', () => handleStarClick(index));
        });
        
        // Update the message in the UI
        const messageEl = document.querySelector('.rating-message') || createMessageElement();
        messageEl.textContent = "Click to rate this groupmate";
        messageEl.style.color = '#333';
        messageEl.style.fontStyle = 'normal';
    }

    function createMessageElement() {
        const messageEl = document.createElement('p');
        messageEl.className = 'rating-message content-text';
        messageEl.style.marginTop = '10px';
        
        // Try multiple ways to find where to insert the message
        let insertTarget = null;
        
        // Method 1: Try to find stars container
        if (stars.length > 0 && stars[0].parentElement) {
            const starsContainer = stars[0].parentElement;
            insertTarget = starsContainer.parentNode;
            if (insertTarget) {
                insertTarget.insertBefore(messageEl, starsContainer.nextSibling);
                return messageEl;
            }
        }
        
        // Method 2: Look for rating-related containers by class
        const ratingContainers = [
            document.querySelector('.stars'),
            document.querySelector('.rating-container'),
            document.querySelector('.about-section'),
            document.querySelector('.profile-content')
        ];
        
        for (let container of ratingContainers) {
            if (container) {
                container.appendChild(messageEl);
                return messageEl;
            }
        }
        
        // Method 3: Fallback - append to body if nothing else works
        console.warn('Could not find suitable container for rating message, appending to body');
        document.body.appendChild(messageEl);
        messageEl.style.position = 'fixed';
        messageEl.style.top = '100px';
        messageEl.style.left = '20px';
        messageEl.style.background = '#f5f5f5';
        messageEl.style.padding = '10px';
        messageEl.style.borderRadius = '4px';
        messageEl.style.zIndex = '1000';
        
        return messageEl;
    }

    async function showUserGroups(userEmail) {
        try {
            const groups = await getUserGroups(userEmail);
            const aboutSection = document.querySelector('.about-section');
            
            if (aboutSection && groups.length > 0) {
                const groupsHtml = groups.map(group => 
                    `<span class="group-tag">${group.title}</span>`
                ).join(' ');
                
                const groupsEl = document.createElement('div');
                groupsEl.className = 'user-groups';
                groupsEl.innerHTML = `
                    <p class="content-text"><strong>Groups:</strong></p>
                    <div class="groups-container">${groupsHtml}</div>
                `;
                
                // Add some basic styling
                const style = document.createElement('style');
                style.textContent = `
                    .group-tag {
                        display: inline-block;
                        background: #e3f2fd;
                        color: #1976d2;
                        padding: 4px 8px;
                        margin: 2px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    .groups-container {
                        margin-top: 8px;
                    }
                `;
                document.head.appendChild(style);
                
                aboutSection.appendChild(groupsEl);
            }
        } catch (error) {
            console.error("Error displaying user groups:", error);
        }
    }

    async function handleStarClick(index1) {
        const rating = index1 + 1;
        
        try {
            const userRef = doc(db, 'users', profileUser.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const ratings = userData.ratings || [];
                
                // Check if current user already rated
                const existingRatingIndex = ratings.findIndex(r => r.userId === currentUser.uid);
                
                if (existingRatingIndex >= 0) {
                    // Update existing rating
                    ratings[existingRatingIndex] = {
                        userId: currentUser.uid,
                        userEmail: currentUser.email,
                        rating: rating,
                        timestamp: new Date()
                    };
                    
                    await updateDoc(userRef, {
                        ratings: ratings,
                        avgRating: calculateAverage(ratings),
                        ratingCount: ratings.length
                    });
                } else {
                    // Add new rating
                    const newRating = {
                        userId: currentUser.uid,
                        userEmail: currentUser.email,
                        rating: rating,
                        timestamp: new Date()
                    };
                    
                    await updateDoc(userRef, {
                        ratings: arrayUnion(newRating),
                        avgRating: calculateAverage([...ratings, newRating]),
                        ratingCount: ratings.length + 1
                    });
                }
                
                // Update UI immediately
                updateStarDisplay(rating);
                
                // Reload ratings to get updated average
                loadRatings(profileUser.uid);
                
                // Show success message
                showRatingFeedback("Rating saved successfully!");
                
            }
        } catch (error) {
            console.error("Error saving rating:", error);
            showRatingFeedback("Failed to save rating: " + error.message, true);
        }
    }

    function updateStarDisplay(rating) {
        const updatedStars = document.querySelectorAll(".stars i");
        updatedStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add("active");
            } else {
                star.classList.remove("active");
            }
        });
    }

    function showRatingFeedback(message, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = 'rating-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            ${isError ? 'background: #f44336;' : 'background: #4caf50;'}
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }

    function calculateAverage(ratings) {
        if (!ratings || ratings.length === 0) return 0;
        const total = ratings.reduce((sum, r) => sum + r.rating, 0);
        return parseFloat((total / ratings.length).toFixed(1));
    }

    async function loadRatings(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const avgRating = userData.avgRating || 0;
                const ratingCount = userData.ratingCount || 0;
                const ratings = userData.ratings || [];
                
                // Update UI
                if (averageRatingEl) averageRatingEl.textContent = avgRating;
                if (ratingCountEl) ratingCountEl.textContent = ratingCount;
                
                // Show current user's rating if they've rated this person
                if (currentUser) {
                    const userRating = ratings.find(r => r.userId === currentUser.uid);
                    if (userRating) {
                        updateStarDisplay(userRating.rating);
                    } else {
                        // Show average rating if user hasn't rated yet
                        const avgRounded = Math.round(avgRating);
                        updateStarDisplay(avgRounded);
                    }
                } else {
                    // Show average rating for non-logged in users
                    const avgRounded = Math.round(avgRating);
                    updateStarDisplay(avgRounded);
                }
            }
        } catch (error) {
            console.error("Error loading ratings:", error);
        }
    }
}
// Safe initialization function - add this to your profile.js
function initializeProfileRating() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeProfileRating);
        return;
    }
    
    try {
        // Get user email from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const profileEmail = urlParams.get('email');
        
        if (!profileEmail) {
            console.error("No profile email specified in URL");
            return;
        }
        
        // Wait a bit more to ensure all elements are rendered
        setTimeout(async () => {
            try {
                // Get user data from Firestore
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("email", "==", profileEmail));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const profileUser = {
                        uid: querySnapshot.docs[0].id,
                        email: profileEmail,
                        ...querySnapshot.docs[0].data()
                    };
                    
                    // Initialize the rating system with group restrictions
                    setupRatingSystem(profileUser);
                } else {
                    console.error("Profile user not found in database");
                }
                
            } catch (error) {
                console.error("Error loading profile user data:", error);
            }
        }, 500); // Wait 500ms for DOM elements to be fully rendered
        
    } catch (error) {
        console.error("Error initializing profile rating:", error);
    }
}

// Call the safe initialization function
initializeProfileRating();

// Sign Out
function setupSignOut() {
    const signOutBtn = document.getElementById('signOutBtn');
    signOutBtn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'index.html';
    });
}

// when user firsts login
auth.onAuthStateChanged(user => {
    if (user) {
        loadUserProfile().then(() => {
            // Only setup editing controls for current user
            if (!window.location.search.includes('email=') || 
                (window.location.search.includes('email=') && 
                 window.location.search.includes(user.email))) {
                setupProfileEditing(user);
                setupPhotoUpload(user);
                setUpRemovePhoto(user);
            }
            setupRatingSystem(user);
            setupSignOut();
        });
    } else {
        window.location.href = 'index.html';
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
// const saveSkillsBtn = document.getElementById('saveSkillsBtn')

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

/*
// displays selected skills when saved
saveSkillsBtn.addEventListener('click', () => {
    if (selectedValues.size === 0) {
        skillsOutput.textContent = 'No items selected.';
    } else {
        skillsOutput.textContent = Array.from(selectedValues).join(', ');
    }
});
*/


// Calendar Related
const date = document.querySelector(".date");
const daysContainer = document.querySelector(".days");
const prev = document.querySelector(".prev");
const next = document.querySelector(".next");
const todayBtn = document.querySelector(".today-btn");
const eventDay = document.querySelector(".event-day");
const eventDate = document.querySelector(".event-date");
const eventsContainer = document.querySelector(".events");
const addEventBtn = document.querySelector(".add-event");
const addEventWrapper = document.querySelector(".add-event-wrapper");
const addEventCloseBtn = document.querySelector(".close");
const addEventTitle = document.querySelector(".event-name");
const addEventFrom = document.querySelector(".event-time-from");
const addEventTo = document.querySelector(".event-time-to");
const addEventSubmit = document.querySelector(".add-event-btn");

// Calendar State
let today = new Date();
let activeDay;
let month = today.getMonth(); // JavaScript months are 0-11
let year = today.getFullYear();
const eventsArr = []; // Stores all calendar events

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Initialize calendar
async function initializeCalendar() {
    console.log("Initializing calendar...");
    
    // Wait for auth state to be ready
    if (auth.currentUser) {
        console.log("User already logged in, loading events...");
        await loadEvents();
    } else {
        console.log("No user logged in yet, waiting for auth state...");
        // Wait for auth state change
        await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
        
        if (auth.currentUser) {
            console.log("User logged in after waiting, loading events...");
            await loadEvents();
        }
    }
    
    renderCalendar(); // Then render the calendar
    
    // Set up event listeners
    setupEventListeners();
    
    // Highlight today
    highlightToday();
}

// Load events from Firebase
async function loadEvents() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log("No user logged in");
            return;
        }

        console.log("Loading events from Firebase for user:", currentUser.uid);
        
        const eventsRef = doc(db, 'calendarEvents', currentUser.uid);
        const docSnap = await getDoc(eventsRef);

        // Clear existing events
        eventsArr.length = 0;

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Raw Firebase data:", data);
            
            if (data.events && Array.isArray(data.events)) {
                data.events.forEach(eventGroup => {
                    // Convert and validate event data
                    const day = Number(eventGroup.day);
                    const month = Number(eventGroup.month); // Stored as 1-12 in Firebase
                    const year = Number(eventGroup.year);
                    
                    console.log(`Processing event group: day=${day}, month=${month}, year=${year}`);
                    
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year) &&
                        Array.isArray(eventGroup.events)) {
                        
                        eventsArr.push({
                            day: day,
                            month: month, // 1-12
                            year: year,
                            events: eventGroup.events.map(event => ({
                                title: event.title,
                                time: event.time,
                                creatorEmail: event.creatorEmail,
                                creatorID: event.creatorID
                            }))
                        });
                        
                        console.log(`Added event group for ${day}/${month}/${year} with ${eventGroup.events.length} events`);
                    } else {
                        console.warn("Invalid event group data:", eventGroup);
                    }
                });
            } else {
                console.log("No events array found in Firebase data");
            }
        } else {
            console.log("No calendar events document found for user");
        }

        console.log("Final eventsArr:", eventsArr);
        
    } catch (error) {
        console.error("Error loading events:", error);
        alert("Failed to load events: " + error.message);
    }
}

// Render the calendar
function renderCalendar() {
    console.log(`Rendering calendar for ${months[month]} ${year}`);
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    const prevDays = prevLastDay.getDate();
    const lastDate = lastDay.getDate();
    const day = firstDay.getDay();
    const nextDays = 7 - lastDay.getDay() - 1;

    date.innerHTML = `${months[month]} ${year}`;
    daysContainer.innerHTML = '';

    // Previous month days
    for (let x = day; x > 0; x--) {
        daysContainer.innerHTML += `<div class="day prev-date">${prevDays - x + 1}</div>`;
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
        // Check if this day has events (note month + 1 for comparison)
        const hasEvent = eventsArr.some(event => {
            const match = event.day === i &&
                         event.month === month + 1 &&
                         event.year === year;
            
            if (match) {
                console.log(`Found event for day ${i}: ${event.events.length} events`);
            }
            
            return match;
        });

        const isToday = i === today.getDate() &&
                       month === today.getMonth() &&
                       year === today.getFullYear();

        let dayClass = '';
        if (isToday) dayClass += 'today ';
        if (hasEvent) dayClass += 'event';

        daysContainer.innerHTML += `<div class="day ${dayClass.trim()}" data-day="${i}">${i}</div>`;
    }

    // Next month days
    for (let j = 1; j <= nextDays; j++) {
        daysContainer.innerHTML += `<div class="day next-date">${j}</div>`;
    }

    // Add day click listeners
    addDayClickListeners();
}

// Add click listeners to calendar days
function addDayClickListeners() {
    const days = document.querySelectorAll(".day:not(.prev-date):not(.next-date)");
    days.forEach(day => {
        day.addEventListener("click", () => {
            const dayNum = parseInt(day.textContent);
            activeDay = dayNum;
            
            console.log(`Clicked on day ${dayNum}`);
            
            // Update active day display
            updateActiveDayDisplay(dayNum);
            
            // Show events for this day
            showEventsForDay(dayNum);
            
            // Update active state
            document.querySelectorAll(".day").forEach(d => d.classList.remove("active"));
            day.classList.add("active");
        });
    });
}

// Update the active day display
function updateActiveDayDisplay(date) {
    const day = new Date(year, month, date);
    const dayName = day.toString().split(" ")[0];
    eventDay.innerHTML = dayName;
    eventDate.innerHTML = `${date} ${months[month]} ${year}`;
}

// Show events for a specific day
function showEventsForDay(date) {
    console.log(`Looking for events on ${date}/${month + 1}/${year}`);
    
    // Find events for this date 
    const dayEvents = eventsArr.find(event => {
        const match = event.day === date &&
                     event.month === month + 1 &&
                     event.year === year;
        
        console.log(`Checking event: day=${event.day}, month=${event.month}, year=${event.year}, match=${match}`);
        return match;
    });
    
    console.log("Found dayEvents:", dayEvents);
    
    // Update events container
    if (dayEvents && dayEvents.events.length > 0) {
        console.log(`Displaying ${dayEvents.events.length} events`);
        eventsContainer.innerHTML = dayEvents.events.map(event => `
            <div class="event">
                <div class="title">
                    <i class="fas fa-circle"></i>
                    <h3 class="event-title">${event.title}</h3>
                </div>
                <div class="event-time">
                    <span class="event-time">${event.time}</span>
                </div>
            </div>
        `).join('');
    } else {
        console.log("No events found for this day");
        eventsContainer.innerHTML = '<div class="no-event"><h3>No Events</h3></div>';
    }
}

// Navigation functions
function goToPreviousMonth() {
    month--;
    if (month < 0) {
        month = 11;
        year--;
    }
    renderCalendar();
}

function goToNextMonth() {
    month++;
    if (month > 11) {
        month = 0;
        year++;
    }
    renderCalendar();
}

function goToToday() {
    today = new Date();
    month = today.getMonth();
    year = today.getFullYear();
    renderCalendar();
    highlightToday();
}

// Highlight today's date
function highlightToday() {
    if (month === today.getMonth() && year === today.getFullYear()) {
        const todayElement = document.querySelector(`.day[data-day="${today.getDate()}"]`);
        if (todayElement) {
            todayElement.click(); // Simulate click to select and show events
        }
    }
}

// Save events to Firebase
async function saveEventsToFirebase() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("Please log in to save events");
            return;
        }

        console.log("Saving events to Firebase:", eventsArr);

        const eventsRef = doc(db, 'calendarEvents', currentUser.uid);
        
        // Prepare events data 
        const eventsToSave = eventsArr.map(event => ({
            day: event.day,
            month: event.month, 
            year: event.year,
            events: event.events.map(e => ({
                title: e.title,
                time: e.time,
                creatorEmail: e.creatorEmail,
                creatorID: e.creatorID,
                createdAt: e.createdAt || new Date().toISOString()
            }))
        }));

        // Save to Firestore
        await setDoc(eventsRef, {
            events: eventsToSave,
            lastUpdated: serverTimestamp(),
            userEmail: currentUser.email,
            userId: currentUser.uid
        }, { merge: true });

        console.log("Events successfully saved to Firebase");
        
    } catch (error) {
        console.error("Error saving events:", error);
        alert("Failed to save events: " + error.message);
    }
}

// Add a new event
async function addNewEvent() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("Please log in to add events");
            return;
        }

        const eventTitle = addEventTitle.value.trim();
        const eventTimeFrom = addEventFrom.value.trim();
        const eventTimeTo = addEventTo.value.trim();

        if (!eventTitle || !eventTimeFrom || !eventTimeTo) {
            alert("Please fill all fields");
            return;
        }

        // Check if activeDay is set
        if (!activeDay) {
            alert("Please select a date first");
            return;
        }

        // Validate time format (HH:MM)
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventTimeFrom) ||
            !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventTimeTo)) {
            alert("Please enter time in HH:MM format");
            return;
        }

        // Create new event
        const newEvent = {
            title: eventTitle,
            time: `${convertTime(eventTimeFrom)} - ${convertTime(eventTimeTo)}`,
            creatorEmail: currentUser.email,
            creatorID: currentUser.uid,
            createdAt: new Date().toISOString()
        };

        console.log(`Adding event for ${activeDay}/${month + 1}/${year}:`, newEvent);

        // Find or create event group for this date
        const eventGroupIndex = eventsArr.findIndex(
            e => e.day === activeDay &&
                 e.month === month + 1 && 
                 e.year === year
        );

        if (eventGroupIndex >= 0) {
            // Add to existing group
            eventsArr[eventGroupIndex].events.push(newEvent);
            console.log("Added to existing event group");
        } else {
            // Create new group
            eventsArr.push({
                day: activeDay,
                month: month + 1,
                year: year,
                events: [newEvent]
            });
            console.log("Created new event group");
        }

        // Save to Firebase
        await saveEventsToFirebase();
        
        // Update UI
        renderCalendar();
        showEventsForDay(activeDay);
        
        // Close modal and clear inputs
        addEventWrapper.classList.remove("active");
        addEventTitle.value = "";
        addEventFrom.value = "";
        addEventTo.value = "";
        
    } catch (error) {
        console.error("Error adding event:", error);
        alert("Failed to add event: " + error.message);
    }
}

// Delete an event
async function deleteEvent(eventElement) {
    if (confirm("Are you sure you want to delete this event?")) {
        const eventTitle = eventElement.querySelector('.event-title').textContent;
        
        // Find the event group for this date
        const eventGroupIndex = eventsArr.findIndex(
            e => e.day === activeDay &&
                 e.month === month + 1 &&
                 e.year === year
        );

        if (eventGroupIndex >= 0) {
            // Remove the specific event
            const eventIndex = eventsArr[eventGroupIndex].events.findIndex(
                e => e.title === eventTitle
            );
            
            if (eventIndex >= 0) {
                eventsArr[eventGroupIndex].events.splice(eventIndex, 1);
                
                // If no more events for this date, remove the entire group
                if (eventsArr[eventGroupIndex].events.length === 0) {
                    eventsArr.splice(eventGroupIndex, 1);
                }
                
                // Save to Firebase
                await saveEventsToFirebase();
                
                // Update UI
                renderCalendar();
                showEventsForDay(activeDay);
            }
        }
    }
}

// Helper Functions

function convertTime(time) {
    const timeArr = time.split(":");
    let timeHour = parseInt(timeArr[0]);
    const timeMin = timeArr[1];
    const timeFormat = timeHour >= 12 ? "PM" : "AM";
    timeHour = timeHour % 12 || 12;
    return `${timeHour}:${timeMin} ${timeFormat}`;
}

function validateTimeInput(e) {
    const input = e.target;
    input.value = input.value.replace(/[^0-9:]/g, "");
    if (input.value.length === 2 && !input.value.includes(":")) {
        input.value += ":";
    }
    if (input.value.length > 5) {
        input.value = input.value.slice(0, 5);
    }
}

function setupEventListeners() {
    prev.addEventListener("click", goToPreviousMonth);
    next.addEventListener("click", goToNextMonth);
    todayBtn.addEventListener("click", goToToday);
    addEventBtn.addEventListener("click", () => addEventWrapper.classList.toggle("active"));
    addEventCloseBtn.addEventListener("click", () => addEventWrapper.classList.remove("active"));
    addEventSubmit.addEventListener("click", addNewEvent);
    
    // Close modal when clicking outside
    document.addEventListener("click", (e) => {
        if (e.target !== addEventBtn && !addEventWrapper.contains(e.target)) {
            addEventWrapper.classList.remove("active");
        }
    });
    
    // Time input validation
    addEventFrom.addEventListener("input", validateTimeInput);
    addEventTo.addEventListener("input", validateTimeInput);
    
    // Event deletion
    eventsContainer.addEventListener("click", (e) => {
        if (e.target.closest(".event")) {
            deleteEvent(e.target.closest(".event"));
        }
    });
}

// Debug function to check Firebase connection and data
async function debugFirebaseData() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log("No user logged in");
            return;
        }

        console.log("=== FIREBASE DEBUG ===");
        console.log("User:", currentUser.uid);
        
        const eventsRef = doc(db, 'calendarEvents', currentUser.uid);
        const docSnap = await getDoc(eventsRef);
        
        if (docSnap.exists()) {
            console.log("Firebase document exists");
            console.log("Raw data:", docSnap.data());
        } else {
            console.log("No Firebase document found");
        }
        
        console.log("Current eventsArr:", eventsArr);
        console.log("Current month/year:", month + 1, year);
        console.log("======================");
        
    } catch (error) {
        console.error("Debug error:", error);
    }
}

// Add debug function to window for manual testing
window.debugCalendar = debugFirebaseData;

// Add a function to reload events when user logs in
async function reloadCalendarForUser() {
    console.log("Reloading calendar for logged in user...");
    await loadEvents();
    renderCalendar();
    if (activeDay) {
        showEventsForDay(activeDay);
    } else {
        highlightToday();
    }
}

// Add auth state listener
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User logged in:", user.uid);
        await reloadCalendarForUser();
    } else {
        console.log("User logged out");
        // Clear events when user logs out
        eventsArr.length = 0;
        renderCalendar();
    }
});

// Initialize the calendar when the page loads
initializeCalendar();
