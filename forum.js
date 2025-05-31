import { db } from "./config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// Load and display groups
async function loadGroups() {
  const groupList = document.getElementById("group-list");
  groupList.innerHTML = ""; // clear before loading

  const querySnapshot = await getDocs(collection(db, "groups"));

  if (querySnapshot.empty) {
    groupList.innerHTML = "<p>No groups have been created yet.</p>";
    return;
  }

  querySnapshot.forEach((doc) => {
    const group = doc.data();

    // Skip if title is missing
    if (!group.title) return;

    const div = document.createElement("div");
    div.classList.add("group-card");

    let content = `<h3>${group.title}</h3>`;

    if (group.creator) {
      content += `<p><strong>Created by:</strong> ${group.creator}</p>`;
    }

    if (group.tags && group.tags.length > 0) {
      content += `<p><strong>Tags:</strong> ${group.tags.join(", ")}</p>`;
    }

    if (group.description) {
      content += `<p><strong>Description:</strong> ${group.description}</p>`;
    }

    content += `<button onclick="requestToJoin('${doc.id}')">Request To Join</button>`;

    div.innerHTML = content;
    groupList.appendChild(div);
  });
}
loadGroups();

// Modal controls
const modal = document.getElementById("groupModal");
document.getElementById("openModalBtn").onclick = () => modal.style.display = "flex";
document.getElementById("closeModalBtn").onclick = () => modal.style.display = "none";

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
