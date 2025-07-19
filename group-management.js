// Import necessary Firebase modules
import { db } from "./config.js";
import { 
  collection, getDocs, addDoc, getDoc, doc, 
  query, where, onSnapshot, serverTimestamp,
  orderBy, limit, updateDoc
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// DOM Elements
const membersList = document.getElementById("members-list");
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const closeChatBtn = document.querySelector(".close-chat");

// Global variables
let currentGroupId = null;
let unsubscribeChat = null;
const auth = getAuth();

// Get group ID from URL
function getGroupIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('groupId');
}

// Load group members
async function loadGroupMembers(groupId) {
  try {
    membersList.innerHTML = "<p>Loading members...</p>";
    
    const groupDoc = await getDoc(doc(db, "groups", groupId));
    if (!groupDoc.exists()) {
      membersList.innerHTML = "<p>Group not found</p>";
      return;
    }
    
    const group = groupDoc.data();
    const members = group.members || [];
    
    if (members.length === 0) {
      membersList.innerHTML = "<p>No members in this group</p>";
      return;
    }
    
    // Get user data for each member
    const usersQuery = query(collection(db, "users"), where("email", "in", members));
    const usersSnapshot = await getDocs(usersQuery);
    
    const usersMap = {};
    usersSnapshot.forEach(doc => {
      usersMap[doc.data().email] = doc.data();
    });
    
    // Display members
    membersList.innerHTML = "";
    members.forEach(email => {
      const user = usersMap[email] || { name: email.split('@')[0] };
      
      const memberElement = document.createElement("div");
      memberElement.className = "member-item";
      memberElement.innerHTML = `
        <div class="user-group">
          <a class="avatar-container" href="/profile.html?email=${encodeURIComponent(email)}">
            <img class="avatar-icons" 
              src="${user.photoURL || 'https://www.w3schools.com/howto/img_avatar.png'}" 
              alt="Profile Picture">
          </a>
          <a class="userinfo-container" href="/profile.html?email=${encodeURIComponent(email)}">
            <div>
              <h3 class="username-text">${user.name || email.split('@')[0]}</h3>
              <p class="user-email">${email}</p>
            </div>  
          </a>
        </div>
      `;
      
      membersList.appendChild(memberElement);
    });
    
  } catch (error) {
    console.error("Error loading members:", error);
    membersList.innerHTML = `
      <div class="error">
        <p>Failed to load members</p>
        <button onclick="loadGroupMembers('${groupId}')">Retry</button>
      </div>
    `;
  }
}

// Load chat messages
async function loadChatMessages(groupId) {
  if (unsubscribeChat) unsubscribeChat();

  chatMessages.innerHTML = "<p>Loading messages...</p>";

  try {
    const messagesRef = collection(db, "chats", groupId, "messages");
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc")); // Changed to "asc" for proper ordering

    unsubscribeChat = onSnapshot(messagesQuery, (snapshot) => {
      chatMessages.innerHTML = ""; // Clear existing messages
      
      if (snapshot.empty) {
        chatMessages.innerHTML = "<p>No messages yet. Start the conversation!</p>";
        return;
      }

      snapshot.forEach((doc) => {
        const message = doc.data();
        const messageElement = document.createElement("div");
        messageElement.className = "message";
        messageElement.innerHTML = `
          <div class="message-header">
            <img src="${message.senderPhoto || 'https://www.w3schools.com/howto/img_avatar.png'}" 
                 class="message-avatar" alt="${message.senderName}">
            <div>
              <strong>${message.senderName}</strong>
              <small>${formatMessageTime(message.timestamp?.toDate())}</small>
            </div>
          </div>
          <p class="message-text">${message.text}</p>
        `;
        chatMessages.appendChild(messageElement);
      });
      
      // Auto-scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });

  } catch (error) {
    console.error("Error loading messages:", error);
    chatMessages.innerHTML = `<p>Error loading messages: ${error.message}</p>`;
  }
}

// Format message timestamp
function formatMessageTime(date) {
  if (!date) return "";
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Send message
async function sendMessage() {
  const messageText = messageInput.value.trim();
  if (!messageText || !currentGroupId || !auth.currentUser) return;
  
  try {
    const user = auth.currentUser;
    
    // Add message to chat
    await addDoc(collection(db, "chats", currentGroupId, "messages"), {
      text: messageText,
      senderId: user.uid,
      senderEmail: user.email,
      senderName: user.displayName || user.email.split('@')[0],
      senderPhoto: user.photoURL || 'https://www.w3schools.com/howto/img_avatar.png',
      timestamp: serverTimestamp()
    });
    
    // Clear input
    messageInput.value = "";
    
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message. Please try again.");
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded - starting initialization"); // Debug log
  
  // Get group ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentGroupId = urlParams.get('groupId') || urlParams.get('id'); // This should match the document ID
  
  if (!currentGroupId) {
    console.error("No group ID found in URL");
    alert("Group not specified. Redirecting...");
    window.location.href = "my-group.html";
    return;
  }

  try {
    console.log("Checking group document..."); // Debug log
    const groupDoc = await getDoc(doc(db, "groups", currentGroupId));
    
    if (!groupDoc.exists()) {
      console.error("Group document doesn't exist");
      alert("Group not found. Redirecting...");
      window.location.href = "my-group.html";
      return;
    }

    const groupData = groupDoc.data();
    console.log("Group data:", groupData); // Debug log

    // Check auth state
    const user = auth.currentUser;
    console.log("Current user:", user); // Debug log
    
    if (!user) {
      console.error("No authenticated user");
      alert("Please log in to view this group");
      window.location.href = "login.html";
      return;
    }

    if (!groupData.members.includes(user.email)) {
      console.error("User not in group members");
      alert("You don't have access to this group");
      window.location.href = "my-group.html";
      return;
    }

    console.log("Initializing chat document..."); // Debug log
    const chatDoc = await getDoc(doc(db, "chats", currentGroupId));
    
    if (!chatDoc.exists()) {
      console.log("Creating new chat document..."); // Debug log
      await setDoc(doc(db, "chats", currentGroupId), {
        groupId: currentGroupId,
        groupName: groupData.title,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        members: groupData.members // Include all group members
      });
    }

    console.log("Loading group members and messages..."); // Debug log
    loadGroupMembers(currentGroupId);
    loadChatMessages(currentGroupId);

  } catch (error) {
    console.error("Initialization error:", error);
    alert("Failed to initialize group chat: " + error.message);
    window.location.href = "my-group.html";
  }
  
  // Event listeners
  sendMessageBtn?.addEventListener("click", sendMessage);
  messageInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
  closeChatBtn?.addEventListener("click", () => {
    window.location.href = "my-group.html";
  });
});

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  if (unsubscribeChat) {
    unsubscribeChat();
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