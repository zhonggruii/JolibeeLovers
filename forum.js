import { db } from "./config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// Load and display groups
async function loadGroups(groups = null) {
	const groupList = document.getElementById("group-list");
  	groupList.innerHTML = ""; // clear before loading

	// If groups array is provided, use that (for search results)
	// Otherwise load all groups from Firestore
	const groupsToDisplay = groups || await getAllGroups();

	if (!groupsToDisplay || groupsToDisplay.length === 0) {
		groupList.innerHTML = groups 
		? "<p>No groups found with that tag.</p>"
		: "<p>No groups have been created yet.</p>";
		return;
	}

	groupsToDisplay.forEach(group => {
		// Skip if title is missing
		if (!group.title) return;

		const div = document.createElement("div");
		div.classList.add("content-container", "box-shadow");

		let content = `<h3>${group.title}</h3>`;

		if (group.creator) {
		content += `<p><strong>Created by:</strong> ${group.creator}</p>`;
		}

		if (group.description) {
		content += `<p><strong>Description:</strong> ${group.description}</p>`;
		}

		if (group.tags && group.tags.length > 0) {
		content += `<p><strong>Tags:</strong> ${group.tags.join(", ")}</p>`;
		}

		content += `<button onclick="requestToJoin('${group.id}')">Request To Join</button>`;

		div.innerHTML = content;
		groupList.appendChild(div);
	});
}

// Helper function to get all groups
async function getAllGroups() {
	const querySnapshot = await getDocs(collection(db, "groups"));
	return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


loadGroups();

// Modal controls
/*
const modal = document.getElementById("groupModal");
document.getElementById("openModalBtn").onclick = () => modal.style.display = "flex";
document.getElementById("closeModalBtn").onclick = () => modal.style.display = "none";
*/

const modal = document.getElementById("groupModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");

openBtn.addEventListener("click", () => {
	modal.classList.add("open");
})

closeBtn.addEventListener("click", () => {
	modal.classList.remove("open");
});

// Handle form submission
const form = document.getElementById("add-group-form");

onAuthStateChanged(getAuth(), (user) => {
	if (!user) {
		alert("You must be logged in to create a group.");
		return;
	}

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const title = document.getElementById("group-title").value.trim();
		const description = document.getElementById("group-description").value.trim();
		const tagString = document.getElementById("group-tags").value;
		const tags = tagString.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
		const creator = user.displayName || user.email;

		try {
			await addDoc(collection(db, "groups"), {
				title,
				description,
				tags,
				creator
			});

			alert("Group created!");
			form.reset();
			modal.style.display = "none";
			loadGroups(); // reload list without full page refresh
		} catch (err) {
			alert("Error: " + err.message);
		}
	});
});

// Placeholder function
window.requestToJoin = function (groupId) {
	alert("Request sent for group: " + groupId);
};

//search bar function
async function searchGroupsByTag(searchTerm) {
  	try {
			searchTerm = searchTerm.trim().toLowerCase();
		if (!searchTerm) return getAllGroups();

		const allGroups = await getAllGroups();
		
		return allGroups.filter(group => 
			group.tags?.some(tag => 
			tag.toLowerCase().includes(searchTerm)
			)
		);
    
	} catch (error) {
		console.error("Search error:", error);
		return [];
	}
}

document.getElementById("searchBar").addEventListener("input", async (e) => {
	const results = await searchGroupsByTag(e.target.value);
	displayGroups(results);
});

//connecting it to the searchGroup function to a search bar so when enter is clicked
//the search will query
document.getElementById("searchBar").addEventListener("keyup", async (event) => {
  	if (event.key === "Enter") {
		const searchTerm = event.target.value.trim();
		if (searchTerm) {
			const filteredGroups = await searchGroupsByTag(searchTerm);
			loadGroups(filteredGroups);
		} else {
			// If search is empty, show all groups
			loadGroups();
		}
  	}
});
