import { db } from "./config.js";
import { collection, getDocs, addDoc, deleteDoc, updateDoc, arrayRemove, query, where, doc, arrayUnion, onSnapshot} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// DOM Elements
const groupList = document.getElementById("group-list");
const searchBar = document.getElementById("searchBar");
const modal = document.getElementById("groupModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const form = document.getElementById("add-group-form");
const notificationsModal = document.getElementById("notificationsModal");
const openNotificationsBtn = document.getElementById("openNotificationsBtn");
const closeNotificationsBtn = document.getElementById("closeNotificationsBtn");
const notificationList = document.getElementById("notificationList");
const notificationBadge = document.getElementById("notificationBadge");

// Cache
let cachedGroups = [];
let searchTimeout;

// Core Functions

async function getUserGroups(userEmail) {
  try {
    if (cachedGroups.length) return cachedGroups;
    
    // Query groups where user is the creator
    const createdGroupsQuery = query(
      collection(db, "groups"),
      where("creator", "==", userEmail)
    );
    
    // Query groups where user is a member 
    const memberGroupsQuery = query(
      collection(db, "groups"),
      where("members", "array-contains", userEmail)
    );
    
    const [createdSnapshot, memberSnapshot] = await Promise.all([
      getDocs(createdGroupsQuery),
      getDocs(memberGroupsQuery)
    ]);
    
    // Combine results, removing duplicates
    const createdGroups = createdSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isCreator: true
    }));
    
    const memberGroups = memberSnapshot.docs
      .filter(doc => doc.data().creator !== userEmail) // Exclude groups user already created
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        isCreator: false
      }));
    
    cachedGroups = [...createdGroups, ...memberGroups];
    return cachedGroups;
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return [];
  }
}

async function loadGroups(groups = null) {
  try {
    groupList.innerHTML = "<p>Loading your groups...</p>";
    
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      groupList.innerHTML = "<p>Please log in to view your groups</p>";
      return;
    }

    cachedGroups = [];
    const groupsToDisplay = groups || await getUserGroups(user.email);
    const usersSnapshot = await getDocs(collection(db, "users"));
    
    const usersMap = {};
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      usersMap[userData.email] = userData;
    });

    groupList.innerHTML = "";
    
    if (!groupsToDisplay.length) {
      groupList.innerHTML = `
        <div class="content-container box-shadow p2034">
          <p>Cant find any groups. Create a new one or find one!</p>
          <button class="button-box-green m10-0" id="openModalBtn" onclick="window.location.href='home.html'">
            <span class="button-icon material-symbols-outlined">group_add</span>
            Create Your First Group
          </button>
        </div>
      `;
      return;
    }

    groupsToDisplay.forEach(group => {
		const creator = usersMap[group.creator] || {};
		
		const card = document.createElement("div");
		card.className = "content-container box-shadow p2034 m10-0";
		card.innerHTML = `
			<div class="element-group-row w100pct">
				<div class="element-group-row m10-0 w58pct">
					<h2 class="container-title m10-0">${group.title}</h2>

					${group.isCreator ? 
						'<div class="owner-role m0-20"><span>owner</span></div>' : 
						'<div class="member-role m0-20"><span>member</span></div>'
					}
				</div>

				<div class="element-group-row-end w42pct">
					<button class="button-box m10-0" onclick="window.location.href='group-management.html?groupId=${group.id}'">
						<span class="button-icon material-symbols-outlined">group</span>
						View
					</button>

					${group.isCreator ? `
						<button class="button-box-red m0-0-0-12" onclick="deleteGroup('${group.id}')">
							<span class="button-icon material-symbols-outlined">delete</span>
							Delete
						</button>
					` : `
						<button class="button-box-red m0-0-0-12" onclick="leaveGroup('${group.id}')">
							<span class="button-icon material-symbols-outlined">exit_to_app</span>
							Leave
						</button>
					`}
				</div>
			</div>
		`;
		
      	groupList.appendChild(card);
    });

	} catch (error) {
		console.error("Error:", error);
		groupList.innerHTML = `
		<div class="error">
			<p>Failed to load your groups</p>
			<button onclick="loadGroups()">Retry</button>
		</div>
		`;
	}
}

window.manageGroup = function(groupId) {
  // Use the correct parameter name 'groupId'
  window.location.href = `group-management.html?groupId=${groupId}`;
};

// Event Handlers
function handleSearch(event) {
  if (event.type === "keyup" && event.key !== "Enter") return;
  
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    
    const allGroups = await getUserGroups(user.email);
    const searchTerm = event.target.value.trim().toLowerCase();
    
    if (!searchTerm) {
      loadGroups(allGroups);
      return;
    }
    
    const results = allGroups.filter(group => {
      const searchContent = [
        group.title,
        group.description,
        ...(group.tags || [])
      ].join(" ").toLowerCase();
      
      return searchContent.includes(searchTerm);
    });
    
    loadGroups(results);
  }, event.type === "keyup" ? 300 : 0);
}

// Delete group function (for group creators)
window.deleteGroup = async function(groupId) {
  if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
    return;
  }

  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert("Please log in to delete a group");
      return;
    }

    // Delete the group document
    await deleteDoc(doc(db, "groups", groupId));
    
    // Optional: Clean up related join requests
    const requestsQuery = query(
      collection(db, "joinRequests"),
      where("groupId", "==", groupId)
    );
    
    const requestsSnapshot = await getDocs(requestsQuery);
    const deletePromises = requestsSnapshot.docs.map(requestDoc => 
      deleteDoc(requestDoc.ref)
    );
    
    await Promise.all(deletePromises);

    alert("Group deleted successfully!");
    
    // Clear cache and reload groups
    cachedGroups = [];
    loadGroups();
    
  } catch (error) {
    console.error("Error deleting group:", error);
    alert("Failed to delete group: " + error.message);
  }
};

// Leave group function (for group members)
window.leaveGroup = async function(groupId) {
  if (!confirm("Are you sure you want to leave this group?")) {
    return;
  }

  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert("Please log in to leave a group");
      return;
    }

    // Remove user from group members array
    await updateDoc(doc(db, "groups", groupId), {
      members: arrayRemove(user.email)
    });

    // Optional: Remove group from user's groups array (if you're tracking this)
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", user.email)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(userDoc.ref, {
          groups: arrayRemove(groupId)
        });
      }
    } catch (error) {
      console.log("Optional user update skipped:", error);
    }

    alert("Successfully left the group!");
    
    // Clear cache and reload groups
    cachedGroups = [];
    loadGroups();
    
  } catch (error) {
    console.error("Error leaving group:", error);
    alert("Failed to leave group: " + error.message);
  }
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
	const auth = getAuth();
	
	onAuthStateChanged(auth, (user) => {
		if (user) {
		// Load groups
		loadGroups();
		
		// Load and setup notifications
		loadNotifications(user.uid);
		setupNotificationListener(user.uid);
		
		// Notification modal handlers
		if (openNotificationsBtn && closeNotificationsBtn && notificationsModal) {
			openNotificationsBtn.addEventListener("click", () => {
			notificationsModal.classList.add("open");
			});
			
			closeNotificationsBtn.addEventListener("click", () => {
			notificationsModal.classList.remove("open");
			});
		}
		} else {
		// Handle non-authenticated state
		groupList.innerHTML = `
			<div class="content-container box-shadow p2034">
			<p>Please log in to view your groups</p>
			<button class="button-box m10-0" onclick="window.location.href='index.html'">
				<span class="button-icon material-symbols-outlined">login</span>
				Log In
			</button>
			</div>
		`;
		}
	});
	
	// Search functionality
	if (searchBar) {
		searchBar.addEventListener("input", handleSearch);
		searchBar.addEventListener("keyup", handleSearch);
	}

	// Modal handlers (if you have them)
	if (openBtn && closeBtn && modal) {
		openBtn.addEventListener("click", () => modal.classList.add("open"));
		closeBtn.addEventListener("click", () => modal.classList.remove("open"));
	}

	// Form submission (if you have it)
	form?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const user = auth.currentUser;
		if (!user) return;
		
		try {
			await addDoc(collection(db, "groups"), {
				title: document.getElementById("group-title").value.trim(),
				description: document.getElementById("group-description").value.trim(),
				tags: document.getElementById("group-tags").value
					.split(",")
					.map(tag => tag.trim())
					.filter(tag => tag),
				creator: user.email,
				creatorUid: user.uid,
				creatorName: user.name || user.email.split('@')[0],
				members: [user.email],
				createdAt: new Date()
			});
		
		alert("Group created successfully!");
		form.reset();
		modal.classList.remove("open");
		cachedGroups = []; // Reset cache
		loadGroups();
		} catch (err) {
		alert("Error creating group: " + err.message);
		}
	});

  	// Add event delegation for notification buttons
	const notificationList = document.getElementById("notificationList");
	if (notificationList) {
		notificationList.addEventListener("click", (e) => {
		console.log("Button clicked:", e.target);
		console.log("Button classes:", e.target.classList);
		
		if (e.target.classList.contains("accept-btn")) {
			console.log("Accept button clicked");
			handleAcceptRequest(e);
		} else if (e.target.classList.contains("decline-btn")) {
			console.log("Decline button clicked");
			handleDeclineRequest(e);
		}
		});
	}
});

//updates the notification badge with current amount of requests
function updateBadge(count) {
  const badge = document.getElementById("notificationBadge");
  if (badge) {
    // Update the badge text (show nothing if count is 0)
    badge.textContent = count > 0 ? count : "";
    
    // Show/hide the badge based on count
    badge.style.display = count > 0 ? "block" : "none";
    
    // Optional: Add animation for new notifications
    if (count > 0) {
      badge.classList.add("badge-pulse");
      setTimeout(() => {
        badge.classList.remove("badge-pulse");
      }, 500);
    }
  }
}

async function loadNotifications(userId) {
  	try {
		const requestsQuery = query(
			collection(db, "joinRequests"),
			where("creatorId", "==", userId),
			where("status", "==", "pending")
		);

		const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
			notificationList.innerHTML = "";
			
			if (snapshot.empty) {
				notificationList.innerHTML = "<p>No pending requests</p>";
				updateBadge(0);
				return;
			}

			snapshot.forEach(doc => {
				const request = doc.data();
				const notificationItem = document.createElement("div");
				notificationItem.className = "element-group-col member-container box-shadow p2034 m10-0 w100pct";
				notificationItem.innerHTML = `

					<div class="element-group-row w100pct">
						<p class="content-text-bold mb10">${request.createdAt.toDate().toLocaleString()}</p>
					</div>

					<img class="profile-icon" id="introProfileImage" src="${request.requesterPhoto || 'https://www.w3schools.com/howto/img_avatar.png'}" alt="${request.requesterName}"/>
					
					<h3 class="m10-0"><a class="content-subtitle-blue" href="/profile.html?email=${encodeURIComponent(request.requesterEmail)}">${request.requesterName}</a></h3>

					<p class="content-text m0">wants to join <strong>${request.groupName}</strong></p>

					<div class="element-group-row mt15">
						<button class="round-button-box mr5 accept-btn" data-request-id="${doc.id}" data-group-id="${request.groupId}" data-user-email="${request.requesterEmail}">
							Accept
						</button>

						<button class="red-round-button-box ml5 decline-btn" data-request-id="${doc.id}">
							Decline
						</button>
					</div>
				`;
				notificationList.appendChild(notificationItem);
			});

			updateBadge(snapshot.size);
		});

		window.notificationUnsubscribe = unsubscribe;
  	} catch (error) {
		console.error("Error loading notifications:", error);
		notificationList.innerHTML = "<p>Error loading notifications</p>";
  	}
}

async function handleAcceptRequest(e) {
  const requestId = e.target.getAttribute('data-request-id');
  const groupId = e.target.getAttribute('data-group-id');
  const userEmail = e.target.getAttribute('data-user-email');

  console.log("Accept request data:", { requestId, groupId, userEmail }); // Debug line

  if (!requestId || !groupId || !userEmail) {
    alert("Missing request data. Please try again.");
    return;
  }

  try {
    // Disable the button to prevent double-clicks
    e.target.disabled = true;
    e.target.textContent = "Processing...";

    // 1. Update request status
    await updateDoc(doc(db, "joinRequests", requestId), {
      status: "accepted",
      respondedAt: new Date()
    });

    // 2. Add user to group members
    await updateDoc(doc(db, "groups", groupId), {
      members: arrayUnion(userEmail)
    });

    // 3. Find user UID by email and add group to their document
    try {
		// Query users collection by email to find the UID
		const usersQuery = query(
			collection(db, "users"),
			where("email", "==", userEmail)
		);
		
		const querySnapshot = await getDocs(usersQuery);
		
		if (!querySnapshot.empty) {
			// Get the first matching user document
			const userDoc = querySnapshot.docs[0];
			await updateDoc(userDoc.ref, {
			groups: arrayUnion(groupId)
			});
		}
    } catch (error) {
      	console.log("Optional user update skipped:", error);
    }

	// 4. Reload notifications
	loadNotifications(getAuth().currentUser.uid);
	
	alert("User successfully added to group!");
  	} catch (error) {
    console.error("Error accepting request:", error);
    alert(`Failed to accept request: ${error.message}`);
    
		// Re-enable the button on error
		e.target.disabled = false;
		e.target.textContent = "Accept";
	}
}

async function handleDeclineRequest(e) {
  const requestId = e.target.getAttribute('data-request-id');
  
  console.log("Decline request data:", { requestId }); // Debug line

  if (!requestId) {
    alert("Missing request data. Please try again.");
    return;
  }

  if (!confirm("Are you sure you want to decline this request?")) {
    return;
  }

  try {
    // Disable the button to prevent double-clicks
    e.target.disabled = true;
    e.target.textContent = "Processing...";

    // Update the request status to "declined"
    await updateDoc(doc(db, "joinRequests", requestId), {
      status: "declined",
      respondedAt: new Date()
    });

    // Reload notifications to reflect the change
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      loadNotifications(user.uid);
    }
    
    console.log("Request declined successfully");
  } catch (error) {
    console.error("Error declining request:", error);
    alert(`Failed to decline request: ${error.message}`);
    
    // Re-enable the button on error
    e.target.disabled = false;
    e.target.textContent = "Decline";
  }
}

function setupNotificationListener(userId) {
  const requestsQuery = query(
    collection(db, "joinRequests"),
    where("creatorId", "==", userId),
    where("status", "==", "pending")
  );

  const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
    updateBadge(snapshot.size);
  });

  window.notificationUnsubscribe = unsubscribe;
}

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