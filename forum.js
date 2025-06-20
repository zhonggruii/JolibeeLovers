import { db } from "./config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
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

    groupsToDisplay.forEach(group => {
      const creator = usersMap[group.creator] || {};
      
      const card = document.createElement("div");
      card.className = "content-container box-shadow p2034";
      card.innerHTML = `
        <div class="content-header">
          <h2 class="container-title m10-0">${group.title}</h2>
          <div class="m10-0">
            <a class="user-group" href="/profile.html?email=${encodeURIComponent(group.creator)}">
              <img class="avatar-icons" 
                   src="${creator.photoURL || 'https://www.w3schools.com/howto/img_avatar.png'}" 
                   alt="Profile">
              <div class="userinfo-container">
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
        <hr class="solid-line" />
        <button class="button-box m10-0" data-group-id="${group.id}">
          <span class="button-icon material-symbols-outlined">add_circle</span>
          Request to Join
        </button>
      `;
      
      card.querySelector(".button-box").addEventListener("click", () => {
        requestToJoin(group.id);
      });
      
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

async function searchGroupsByTag(searchTerm) {
  try {
    searchTerm = searchTerm.trim().toLowerCase();
    if (!searchTerm) return await getAllGroups();

    const allGroups = await getAllGroups();
    return allGroups.filter(group => {
      const searchContent = [
        group.title,
        group.description,
        ...(group.tags || [])
      ].join(" ").toLowerCase();
      
      return searchContent.includes(searchTerm);
    });
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// Event Handlers
function handleSearch(event) {
  if (event.type === "keyup" && event.key !== "Enter") return;
  
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const results = await searchGroupsByTag(event.target.value);
    loadGroups(results);
  }, event.type === "keyup" ? 0 : 300);
}

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
        await addDoc(collection(db, "groups"), {
          title: document.getElementById("group-title").value.trim(),
          description: document.getElementById("group-description").value.trim(),
          tags: document.getElementById("group-tags").value
            .split(",")
            .map(tag => tag.trim())
            .filter(tag => tag),
          creator: user.email,
          createdAt: new Date()
        });
        
        alert("Group created!");
        form.reset();
        modal.classList.remove("open");
        cachedGroups = []; // Reset cache
        loadGroups();
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  });
});

// Global Functions
window.requestToJoin = function(groupId) {
  alert("Request to join group: " + groupId);
};