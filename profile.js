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
        document.querySelector('.content-text:last-child').textContent = 
            profileUser.uid === currentUser?.uid 
                ? "You can't rate yourself" 
                : "Please log in to rate";
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
const date = document.querySelector(".date"),
	daysContainer = document.querySelector(".days"),
	prev = document.querySelector(".prev"),
	next = document.querySelector(".next"),
	todayBtn = document.querySelector(".today-btn"),
	gotoBtn = document.querySelector(".goto-btn"),
	dateInput = document.querySelector(".date-input"),
	eventDay = document.querySelector(".event-day"),
	eventDate = document.querySelector(".event-date"),
	eventsContainer = document.querySelector(".events"),
	addEventBtn = document.querySelector(".add-event"),
	addEventWrapper = document.querySelector(".add-event-wrapper "),
	addEventCloseBtn = document.querySelector(".close "),
	addEventTitle = document.querySelector(".event-name "),
	addEventFrom = document.querySelector(".event-time-from "),
	addEventTo = document.querySelector(".event-time-to "),
	addEventSubmit = document.querySelector(".add-event-btn ");

let today = new Date();
let activeDay;
let month = today.getMonth();
let year = today.getFullYear();

const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

// const eventsArr = [
//   {
//     day: 13,
//     month: 11,
//     year: 2022,
//     events: [
//       {
//         title: "Event 1 lorem ipsun dolar sit genfa tersd dsad ",
//         time: "10:00 AM",
//       },
//       {
//         title: "Event 2",
//         time: "11:00 AM",
//       },
//     ],
//   },
// ];

const eventsArr = [];
getEvents();
console.log(eventsArr);

//function to add days in days with class day and prev-date next-date on previous month and next month days and active on today
	function initCalendar() {
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const prevLastDay = new Date(year, month, 0);
	const prevDays = prevLastDay.getDate();
	const lastDate = lastDay.getDate();
	const day = firstDay.getDay();
	const nextDays = 7 - lastDay.getDay() - 1;

	date.innerHTML = months[month] + " " + year;

	let days = "";

	for (let x = day; x > 0; x--) {
		days += `<div class="day prev-date">${prevDays - x + 1}</div>`;
	}

	for (let i = 1; i <= lastDate; i++) {
		//check if event is present on that day
		let event = false;
		eventsArr.forEach((eventObj) => {
		if (
			eventObj.day === i &&
			eventObj.month === month + 1 &&
			eventObj.year === year
		) {
			event = true;
		}
		});
		if (
		i === new Date().getDate() &&
		year === new Date().getFullYear() &&
		month === new Date().getMonth()
		) {
		activeDay = i;
		getActiveDay(i);
		updateEvents(i);
		if (event) {
			days += `<div class="day today active event">${i}</div>`;
		} else {
			days += `<div class="day today active">${i}</div>`;
		}
		} else {
		if (event) {
			days += `<div class="day event">${i}</div>`;
		} else {
			days += `<div class="day ">${i}</div>`;
		}
		}
	}

	for (let j = 1; j <= nextDays; j++) {
		days += `<div class="day next-date">${j}</div>`;
	}
	daysContainer.innerHTML = days;
	addListner();
	}

//function to add month and year on prev and next button
function prevMonth() {
	month--;
	if (month < 0) {
		month = 11;
		year--;
	}
	initCalendar();
}

function nextMonth() {
  month++;
  if (month > 11) {
    month = 0;
    year++;
  }
  initCalendar();
}

prev.addEventListener("click", prevMonth);
next.addEventListener("click", nextMonth);

initCalendar();

//function to add active on day
function addListner() {
	const days = document.querySelectorAll(".day");
	days.forEach((day) => {
		day.addEventListener("click", (e) => {
		getActiveDay(e.target.innerHTML);
		updateEvents(Number(e.target.innerHTML));
		activeDay = Number(e.target.innerHTML);
		//remove active
		days.forEach((day) => {
			day.classList.remove("active");
		});
		//if clicked prev-date or next-date switch to that month
		if (e.target.classList.contains("prev-date")) {
			prevMonth();
			//add active to clicked day afte month is change
			setTimeout(() => {
			//add active where no prev-date or next-date
			const days = document.querySelectorAll(".day");
			days.forEach((day) => {
				if (
				!day.classList.contains("prev-date") &&
				day.innerHTML === e.target.innerHTML
				) {
				day.classList.add("active");
				}
			});
			}, 100);
		} else if (e.target.classList.contains("next-date")) {
			nextMonth();
			//add active to clicked day afte month is changed
			setTimeout(() => {
			const days = document.querySelectorAll(".day");
			days.forEach((day) => {
				if (
				!day.classList.contains("next-date") &&
				day.innerHTML === e.target.innerHTML
				) {
				day.classList.add("active");
				}
			});
			}, 100);
		} else {
			e.target.classList.add("active");
		}
		});
	});
}

todayBtn.addEventListener("click", () => {
	today = new Date();
	month = today.getMonth();
	year = today.getFullYear();
	initCalendar();
});

dateInput.addEventListener("input", (e) => {
	dateInput.value = dateInput.value.replace(/[^0-9/]/g, "");
	if (dateInput.value.length === 2) {
		dateInput.value += "/";
	}
	if (dateInput.value.length > 7) {
		dateInput.value = dateInput.value.slice(0, 7);
	}
	if (e.inputType === "deleteContentBackward") {
		if (dateInput.value.length === 3) {
		dateInput.value = dateInput.value.slice(0, 2);
		}
	}
});

gotoBtn.addEventListener("click", gotoDate);

function gotoDate() {
	console.log("here");
	const dateArr = dateInput.value.split("/");
	if (dateArr.length === 2) {
		if (dateArr[0] > 0 && dateArr[0] < 13 && dateArr[1].length === 4) {
		month = dateArr[0] - 1;
		year = dateArr[1];
		initCalendar();
		return;
		}
	}
	alert("Invalid Date");
}

//function get active day day name and date and update eventday eventdate
function getActiveDay(date) {
	const day = new Date(year, month, date);
	const dayName = day.toString().split(" ")[0];
	eventDay.innerHTML = dayName;
	eventDate.innerHTML = date + " " + months[month] + " " + year;
}

//function update events when a day is active
function updateEvents(date) {
	let events = "";
	eventsArr.forEach((event) => {
		if (
		date === event.day &&
		month + 1 === event.month &&
		year === event.year
		) {
		event.events.forEach((event) => {
			events += `<div class="event">
				<div class="title">
				<i class="fas fa-circle"></i>
				<h3 class="event-title">${event.title}</h3>
				</div>
				<div class="event-time">
				<span class="event-time">${event.time}</span>
				</div>
			</div>`;
		});
		}
	});
	if (events === "") {
		events = `<div class="no-event">
				<h3>No Events</h3>
			</div>`;
	}
	eventsContainer.innerHTML = events;
	saveEvents();
}

//function to add event
addEventBtn.addEventListener("click", () => {
  	addEventWrapper.classList.toggle("active");
});

addEventCloseBtn.addEventListener("click", () => {
  	addEventWrapper.classList.remove("active");
});

document.addEventListener("click", (e) => {
	if (e.target !== addEventBtn && !addEventWrapper.contains(e.target)) {
		addEventWrapper.classList.remove("active");
	}
});

// allow 50 chars in eventtitle
addEventTitle.addEventListener("input", (e) => {
	addEventTitle.value = addEventTitle.value.slice(0, 60);
});

// allow only time in eventtime from and to
addEventFrom.addEventListener("input", (e) => {
	addEventFrom.value = addEventFrom.value.replace(/[^0-9:]/g, "");
	if (addEventFrom.value.length === 2) {
		addEventFrom.value += ":";
	}
	if (addEventFrom.value.length > 5) {
		addEventFrom.value = addEventFrom.value.slice(0, 5);
	}
});

addEventTo.addEventListener("input", (e) => {
	addEventTo.value = addEventTo.value.replace(/[^0-9:]/g, "");
	if (addEventTo.value.length === 2) {
		addEventTo.value += ":";
	}
	if (addEventTo.value.length > 5) {
		addEventTo.value = addEventTo.value.slice(0, 5);
	}
});

// function to add event to eventsArr
addEventSubmit.addEventListener("click", () => {
	const eventTitle = addEventTitle.value;
	const eventTimeFrom = addEventFrom.value;
	const eventTimeTo = addEventTo.value;
	if (eventTitle === "" || eventTimeFrom === "" || eventTimeTo === "") {
		alert("Please fill all the fields");
		return;
	}

	// check correct time format 24 hour
	const timeFromArr = eventTimeFrom.split(":");
	const timeToArr = eventTimeTo.split(":");
	if (
		timeFromArr.length !== 2 ||
		timeToArr.length !== 2 ||
		timeFromArr[0] > 23 ||
		timeFromArr[1] > 59 ||
		timeToArr[0] > 23 ||
		timeToArr[1] > 59
	) {
		alert("Invalid Time Format");
		return;
	}

	const timeFrom = convertTime(eventTimeFrom);
	const timeTo = convertTime(eventTimeTo);

  	// check if event is already added
  	let eventExist = false;
	eventsArr.forEach((event) => {
		if (
		event.day === activeDay &&
		event.month === month + 1 &&
		event.year === year
		) {
		event.events.forEach((event) => {
			if (event.title === eventTitle) {
			eventExist = true;
			}
		});
		}
	});
	if (eventExist) {
		alert("Event already added");
		return;
	}
	const newEvent = {
		title: eventTitle,
		time: timeFrom + " - " + timeTo,
	};
	console.log(newEvent);
	console.log(activeDay);
	let eventAdded = false;
	if (eventsArr.length > 0) {
		eventsArr.forEach((item) => {
		if (
			item.day === activeDay &&
			item.month === month + 1 &&
			item.year === year
		) {
			item.events.push(newEvent);
			eventAdded = true;
		}
		});
	}

  	if (!eventAdded) {
		eventsArr.push({
		day: activeDay,
		month: month + 1,
		year: year,
		events: [newEvent],
		});
	}

	console.log(eventsArr);
	addEventWrapper.classList.remove("active");
	addEventTitle.value = "";
	addEventFrom.value = "";
	addEventTo.value = "";
	updateEvents(activeDay);
	// select active day and add event class if not added
	const activeDayEl = document.querySelector(".day.active");
	if (!activeDayEl.classList.contains("event")) {
		activeDayEl.classList.add("event");
	}
});

// function to delete event when clicked on event
eventsContainer.addEventListener("click", (e) => {
	if (e.target.classList.contains("event")) {
		if (confirm("Are you sure you want to delete this event?")) {
		const eventTitle = e.target.children[0].children[1].innerHTML;
		eventsArr.forEach((event) => {
			if (
			event.day === activeDay &&
			event.month === month + 1 &&
			event.year === year
			) {
			event.events.forEach((item, index) => {
				if (item.title === eventTitle) {
				event.events.splice(index, 1);
				}
			});
			//if no events left in a day then remove that day from eventsArr
			if (event.events.length === 0) {
				eventsArr.splice(eventsArr.indexOf(event), 1);
				//remove event class from day
				const activeDayEl = document.querySelector(".day.active");
				if (activeDayEl.classList.contains("event")) {
				activeDayEl.classList.remove("event");
				}
			}
			}
		});
		updateEvents(activeDay);
		}
	}
});

//function to save events in local storage
function saveEvents() {
  	localStorage.setItem("events", JSON.stringify(eventsArr));
}

//function to get events from local storage
function getEvents() {
	//check if events are already saved in local storage then return event else nothing
	if (localStorage.getItem("events") === null) {
		return;
	}
	eventsArr.push(...JSON.parse(localStorage.getItem("events")));
}

function convertTime(time) {
	//convert time to 24 hour format
	let timeArr = time.split(":");
	let timeHour = timeArr[0];
	let timeMin = timeArr[1];
	let timeFormat = timeHour >= 12 ? "PM" : "AM";
	timeHour = timeHour % 12 || 12;
	time = timeHour + ":" + timeMin + " " + timeFormat;
	return time;
}