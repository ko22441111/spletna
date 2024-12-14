// Import necessary functions from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0laoIP-Ya8RP9V-5r54ClQ56Zeb7_79k",
  authDomain: "chat-pro-f4efd.firebaseapp.com",
  projectId: "chat-pro-f4efd",
  storageBucket: "chat-pro-f4efd.firebasestorage.app",
  messagingSenderId: "460927168324",
  appId: "1:460927168324:web:7876ebce8ed6a67c767111",
  measurementId: "G-SF7C1QWD83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to send a message
async function sendMessage(username, message) {
  if (username.trim() && message.trim()) {
    // Automatically prepend [OWNER] to "Matej22441"
    if (username === "Matej22441") {
      username = `[OWNER] ${username}`;
    }

    // Automatically prepend [Admin] to "Sly"
    if (username === "Sly") {
      username = `[Admin] ${username}`;
    }

    // Check if the message is "/clearchat"
    if (message.trim().toLowerCase() === "/clearchat") {
      if (username.trim().toLowerCase() === "[owner] matej22441") {
        // Only allow the user "[OWNER] Matej22441" to clear the chat
        await clearChat(); // Clear chat
        return; // Don't send the "/clearchat" message
      } else {
        alert("Only admin can use /clearchat!");
        return; // Stop further execution
      }
    }

    try {
      // Send the message as usual
      await addDoc(collection(db, "messages"), {
        username,
        message,
        timestamp: new Date(),
      });
      document.getElementById("message").value = ""; // Clear message input
    } catch (error) {
      console.error("Error sending message:", error);
      alert("There was an error sending the message. Please try again.");
    }
  } else {
    alert("Both username and message are required!");
  }
}

// Function to listen to messages and display them in the chat window
function listenToMessages() {
  const chatWindow = document.getElementById("chat-window");
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    chatWindow.innerHTML = ""; // Clear previous messages
    snapshot.forEach((doc) => {
      const { username, message } = doc.data();

      // Create a message element
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message");

      const usernameSpan = document.createElement("span");
      usernameSpan.classList.add("username");

      // Check if the username is [OWNER]
      if (username.startsWith("[OWNER]")) {
        usernameSpan.classList.add("owner"); // Add the special class for [OWNER]
        usernameSpan.style.color = "#D5006D"; // Dark pink color
      }

      // Check if the username is [Admin]
      if (username.startsWith("[Admin]")) {
        usernameSpan.classList.add("admin"); // Add the special class for [Admin]
        usernameSpan.style.color = "red"; // Red color for Admin
      }

      // Check if the username is "Ana Dunovic"
      if (username === "Ana Dunovic") {
        usernameSpan.classList.add("owners-girl"); // Add the special class for Ana Dunovic
        usernameSpan.style.color = "darkblue"; // Ensure OWNER'S Girl is darkblue
        usernameSpan.textContent = `[OWNER'S Girl] ${username}:`; // Corrected string template
      } else {
        usernameSpan.textContent = `${username}:`; // Regular username
      }

      const messageSpan = document.createElement("span");
      messageSpan.textContent = message;

      messageDiv.appendChild(usernameSpan);
      messageDiv.appendChild(messageSpan);

      chatWindow.appendChild(messageDiv);
    });

    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
}

// Function to clear all messages from Firestore
async function clearChat() {
  const messagesRef = collection(db, "messages");
  const snapshot = await getDocs(messagesRef);
  snapshot.forEach(async (doc) => {
    await deleteDoc(doc.ref);
  });
  console.log("All messages have been deleted.");
  alert("Chat has been cleared!"); // Notify the user that chat has been cleared
}

// Add event listener to the send button
document.getElementById("send-button").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const message = document.getElementById("message").value;
  sendMessage(username, message);
});

// Send message on Enter key press
document.getElementById("message").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const message = document.getElementById("message").value;
    sendMessage(username, message);
  }
});

// Start listening to messages
listenToMessages();
