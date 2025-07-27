import { db } from "./config.js";
import { collection, getDocs, addDoc, getDoc, setDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// DOM Elements
const groupList = document.getElementById("group-list");
const searchBar = document.getElementById("searchBar");
const modal = document.getElementById("groupModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const form = document.getElementById("add-group-form");

// Cache
let cachedGroups = [];
let searchTimeout;

const auth = getAuth();
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  console.log('Auth State Changed:', user ? user.uid : 'Logged out');
});

// Core Functions
async function getAllGroups() {
  try {
    if (cachedGroups.length) return cachedGroups;
    
    const snapshot = await getDocs(collection(db, "groups"));
    cachedGroups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return cachedGroups;
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
}

function handleSearch() {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(async () => {
    const searchTerm = searchBar.value.trim().toLowerCase();

    const allGroups = await getAllGroups();
    if (!searchTerm) {
      loadGroups(allGroups); // If empty, show all
      return;
    }

    const filteredGroups = allGroups.filter(group => {
      const title = group.title?.toLowerCase() || "";
      const description = group.description?.toLowerCase() || "";
      const tags = group.tags?.join(", ").toLowerCase() || "";

      return (
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        tags.includes(searchTerm)
      );
    });

    loadGroups(filteredGroups);
  }, 300); 
}


// Updated loadGroups function with member checking
async function loadGroups(groups = null) {
  try {
    groupList.innerHTML = "<p>Loading groups...</p>";
    
    const groupsToDisplay = groups || await getAllGroups();
    const usersSnapshot = await getDocs(collection(db, "users"));
    
    const usersMap = {};
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      usersMap[user.email] = user;
    });

    groupList.innerHTML = "";
    
    if (!groupsToDisplay.length) {
      groupList.innerHTML = "<p>No groups found</p>";
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;

    groupsToDisplay.forEach(group => {
      const creator = usersMap[group.creator] || {};
      const isCreator = currentUser && (currentUser.uid === group.creatorUid || currentUser.email === group.creator);
      
      // Check if current user is already a member
      const isMember = currentUser && group.members && group.members.includes(currentUser.email);
      
      const card = document.createElement("div");
      card.className = "content-container box-shadow p2034 m10-0";
      card.innerHTML = `
        <div class="content-header">
          <h2 class="container-title m10-0">${group.title}</h2>
          <div class="user-group m10-0">
            <a class="avatar-container" href="/profile.html?email=${encodeURIComponent(group.creator)}">
              <img class="avatar-icons" 
                src="${creator.photoURL || 'https://www.w3schools.com/howto/img_avatar.png'}" 
                alt="Profile Picture">
            </a>
            <a class="userinfo-container" href="/profile.html?email=${encodeURIComponent(group.creator)}">
              <div>
                <h3 class="username-text">${creator.name || group.creator?.split('@')[0] || "User"}</h3>
              </div>  
            </a>
          </div>
        </div>
        
        <div class="content-body">
          <p class="content-text">${group.description || "No description"}</p>
          <div class="content-taglist">
            <p class="content-text">Tags: ${group.tags?.join(", ") || "No tags"}</p>
          </div>
        </div>
        
        ${getActionButton(isCreator, isMember, group.id)}
      `;

      // Add event listener only if there's a button to click
      const button = card.querySelector(".button-box");
      if (button) {
        if (button.dataset.action === "join") {
          button.addEventListener("click", () => requestToJoin(group.id));
        } else if (button.dataset.action === "manage") {
          button.addEventListener("click", () => {
            window.location.href = `/group-management.html?groupId=${group.id}`;
          });
        }
      }
      
      groupList.appendChild(card);
    });

  } catch (error) {
    console.error("Error:", error);
    groupList.innerHTML = `
      <div class="error">
        <p>Failed to load groups</p>
        <button onclick="loadGroups()">Retry</button>
      </div>
    `;
  }
}

// Helper function to determine which button to show
function getActionButton(isCreator, isMember, groupId) {
  if (isCreator) {
    // User is the creator - show manage button
    return `
      <hr class="solid-line" />
      <button class="button-box m10-0" data-action="manage" data-group-id="${groupId}">
        <span class="button-icon material-symbols-outlined">settings</span>
        Manage Group
      </button>
    `;
  } else if (isMember) {
    // User is already a member - show view/enter button
    return `
      <hr class="solid-line" />
      <button class="button-box m10-0" data-action="manage" data-group-id="${groupId}" style="background: #4caf50;">
        <span class="button-icon material-symbols-outlined">group</span>
        View Group
      </button>
    `;
  } else {
    // User is not a member - show join request button
    return `
      <hr class="solid-line" />
      <button class="button-box m10-0" data-action="join" data-group-id="${groupId}">
        <span class="button-icon material-symbols-outlined">add_circle</span>
        Request to Join
      </button>
    `;
  }
}

// Updated requestToJoin function with additional checks
window.requestToJoin = async function(groupId) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert("Please log in to join groups");
      return;
    }

    const groupDoc = await getDoc(doc(db, "groups", groupId));
    if (!groupDoc.exists()) {
      alert("Group not found");
      return;
    }
    
    const group = groupDoc.data();
    
    // Check if current user is the creator
    if (user.uid === group.creatorUid) {
      alert("You cannot join your own group");
      return;
    }

    // Check if user is already a member
    if (group.members && group.members.includes(user.email)) {
      alert("You are already a member of this group");
      return;
    }

    // Check if there's already a pending request
    const existingRequestQuery = query(
      collection(db, "joinRequests"), 
      where("groupId", "==", groupId),
      where("requesterId", "==", user.uid),
      where("status", "==", "pending")
    );
    
    const existingRequests = await getDocs(existingRequestQuery);
    if (!existingRequests.empty) {
      alert("You already have a pending request for this group");
      return;
    }

    // Get user data
    const userDoc = await getDoc(doc(db, "users", user.uid));
    let userData = {
      name: user.email.split('@')[0],
      photoURL: 'https://www.w3schools.com/howto/img_avatar.png'
    };
    
    if (userDoc.exists()) {
      userData = {
        name: userDoc.data().name || user.email.split('@')[0],
        photoURL: userDoc.data().photoURL || userData.photoURL
      };
    }

    // Create the join request
    await addDoc(collection(db, "joinRequests"), {
      groupId: groupId,
      groupName: group.title,
      creatorId: group.creatorUid,
      creatorEmail: group.creator,
      requesterId: user.uid,
      requesterEmail: user.email, 
      requesterName: userData.name,
      requesterPhoto: userData.photoURL,
      status: "pending",
      createdAt: new Date()
    });

    alert("Join request sent successfully!");
    
    // Refresh the groups to update the UI
    cachedGroups = [];
    loadGroups();
    
  } catch (error) {
    console.error("Error sending request:", error);
    alert("Failed to send join request: " + error.message);
  }
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadGroups();
  
  if (searchBar) {
    searchBar.addEventListener("input", handleSearch);
    searchBar.addEventListener("keyup", handleSearch);
  }

  if (openBtn && closeBtn && modal) {
    openBtn.addEventListener("click", () => modal.classList.add("open"));
    closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  }

  onAuthStateChanged(getAuth(), (user) => {
    if (!user) return;
    
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      try {
        const groupRef = await addDoc(collection(db, "groups"), {
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

        await setDoc(doc(db, "chats", groupRef.id), {
          groupId: groupRef.id,
          groupName: document.getElementById("group-title").value.trim(),
          createdAt: new Date(),
          lastActive: new Date(),
          members: [user.email]
        });
        
        alert("Group created!");
        form.reset();
        modal.classList.remove("open");
        cachedGroups = [];
        loadGroups();
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  });
});

window.requestToJoin = async function(groupId) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert("Please log in to join groups");
      return;
    }

    const groupDoc = await getDoc(doc(db, "groups", groupId));
    if (!groupDoc.exists()) {
      alert("Group not found");
      return;
    }
    
    const group = groupDoc.data();
    
    // Check if current user is the creator
    if (user.uid === group.creatorUid) {
      alert("You cannot join your own group");
      return;
    }

    // Get user data
    const userDoc = await getDoc(doc(db, "users", user.uid));
    let userData = {
      name: user.email.split('@')[0],
      photoURL: 'https://www.w3schools.com/howto/img_avatar.png'
    };
    
    if (userDoc.exists()) {
      userData = {
        name: userDoc.data().name || user.email.split('@')[0],
        photoURL: userDoc.data().photoURL || userData.photoURL
      };
    }

    // Create the join request
    await addDoc(collection(db, "joinRequests"), {
      groupId: groupId,
      groupName: group.title,
      creatorId: group.creatorUid,
      creatorEmail: group.creator,
      requesterId: user.uid,
      requesterEmail: user.email, 
      requesterName: userData.name,
      requesterPhoto: userData.photoURL,
      status: "pending",
      createdAt: new Date()
    });

    alert("Join request sent successfully!");
  } catch (error) {
    console.error("Error sending request:", error);
    alert("Failed to send join request: " + error.message);
  }
};

// Loader
window.addEventListener("load", () => {
    const loader = document.querySelector(".loader")

    loader.classList.add("loader-hidden");

    loader.addEventListener("transitionend", () => {
        document.body.removeChild("loader");
    });
})