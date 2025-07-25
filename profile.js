import { auth, db, storage } from './config.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js';
import { signOut, updateProfile, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

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
            updateProfileUI(userToDisplay, isCurrentUser);
            await getEvents();
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

    // Activity
    document.getElementById('activityInput').value = userData.activity || '';
    document.getElementById('displayActivity').textContent = userData.activity || 'No projects';

    // Skills
    const skills = userData.skills || [];
    document.getElementById('displaySkills').innerHTML = skills
    .map(skill => `<span>${skill}</span>`)
    .join('') || `<p class="content-text m0">None selected</p>`;

    // selected values display in modal
    selectedValues.clear();
    skills.forEach(skill => selectedValues.add(skill));
    skillsOutput.textContent = skills.join(', ') || 'None Selected';


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
    const saveActivityBtn = document.getElementById('saveActivityBtn');
    const saveSkillsBtn = document.getElementById('saveSkillsBtn');
    const resetSkillsBtn = document.getElementById('resetSkillsBtn');
    const moduleTakenBtn = document.getElementById('saveModuleBtn');


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


    saveActivityBtn.addEventListener('click', async () => {
        const newActivity = document.getElementById('activityInput').value.trim();

        await updateDoc(doc(db, 'users', user.uid), { 
            activity: newActivity
        });
        
        document.getElementById('displayActivity').textContent = newActivity || 'No projects';

        alert('Activity Section updated!');
        document.getElementById('activityModal').classList.remove('open');
    });


    saveSkillsBtn.addEventListener('click', async () => {
        const skillsArray = Array.from(selectedValues);

        await updateDoc(doc(db, 'users', user.uid), { 
            skills: skillsArray 
        });
        
        document.getElementById('displaySkills').innerHTML = skillsArray
        .map(skill => `<span>${skill}</span>`)
        .join('');

        skillsOutput.textContent = skillsArray.join(', ') || 'None Selected';
        skillsSelectedItems.innerHTML = '';

        alert('Skills Section updated!');
        document.getElementById('skillsModal').classList.remove('open');
    });

    resetSkillsBtn.addEventListener('click', async (e) => {
        selectedValues.clear();
        skillsSelectedItems.innerHTML = '';
        skillsOutput.textContent = 'None Selected';

        await updateDoc(doc(db, 'users', user.uid), { 
            skills: [] 
        });

        document.getElementById('displaySkills').innerHTML = '<p class="content-text m0">None selected</p>';

        alert('Skills Section Has Been Reset!');
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


/// Star Rating System

// select all elements with the "i" tag and store them in a Nodelist called "stars"
const stars = document.querySelectorAll(".stars i");

// Loop
stars.forEach((star, index1) => {

	// Add event listener that runs a function when "clicked"
	star.addEventListener("click", () => {
		console.log(index1);
		// loop through the "stars" nodeList
		stars.forEach((star, index2) => {
			console.log(index2);
			// add "active" class to clicked star and stars with lower index
			// remove "active" class from stars with higher index
			index1 >= index2 ? star.classList.add("active") : star.classList.remove("active");
		});
	});
});


function setupRatingSystem(profileUser) {
    const stars = document.querySelectorAll(".stars i");
    const averageRatingEl = document.getElementById('averageRating');
    const ratingCountEl = document.getElementById('ratingCount');
    const currentUser = auth.currentUser;

    // Disable rating if not logged in or trying to rate yourself
    if (!currentUser || profileUser.uid === currentUser.uid) {
        stars.forEach(star => {
            star.style.cursor = 'not-allowed';
            star.style.opacity = '0.5';
        });
        const aboutSection = document.querySelector('.about-section'); // Adjust this selector to match your HTML

        if (!currentUser) {
            // For non-logged in users
            document.querySelector('.content-text:last-child').textContent = "Please log in to rate";
        } else if (profileUser.uid === currentUser.uid) {
            // For own profile - show email instead of rating message
            aboutSection.querySelector('.email-display').textContent = profileUser.email;
        } else {
            
        }
        return;
    }

    // Load existing ratings
    loadRatings(profileUser.uid);

    // Star click handler
    stars.forEach((star, index1) => {
        star.addEventListener("click", async () => {
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
                        ratings[existingRatingIndex].rating = rating;
                        await updateDoc(userRef, {
                            ratings: ratings,
                            avgRating: calculateAverage(ratings),
                            ratingCount: ratings.length
                        });
                    } else {
                        // Add new rating
                        await updateDoc(userRef, {
                            ratings: arrayUnion({
                                userId: currentUser.uid,
                                rating: rating,
                                timestamp: new Date()
                            }),
                            avgRating: increment((rating - (userData.avgRating || 0)) / ((userData.ratingCount || 0) + 1)),
                            ratingCount: increment(1)
                        });
                    }
                    
                    // Update UI
                    stars.forEach((star, index2) => {
                        index1 >= index2 
                            ? star.classList.add("active") 
                            : star.classList.remove("active");
                    });
                    
                    // Reload ratings
                    loadRatings(profileUser.uid);
                }
            } catch (error) {
                console.error("Error saving rating:", error);
                alert("Failed to save rating: " + error.message);
            }
        });
    });

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
                
                // Update UI
                averageRatingEl.textContent = avgRating;
                ratingCountEl.textContent = ratingCount;
                
                // Highlight stars based on average
                const avgRounded = Math.round(avgRating);
                stars.forEach((star, index) => {
                    if (index < avgRounded) {
                        star.classList.add("active");
                    } else {
                        star.classList.remove("active");
                    }
                });
            }
        } catch (error) {
            console.error("Error loading ratings:", error);
        }
    }
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