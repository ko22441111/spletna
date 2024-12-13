// Import the necessary functions from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0laoIP-Ya8RP9V-5r54ClQ56Zeb7_79k",
  authDomain: "chat-pro-f4efd.firebaseapp.com",
  projectId: "chat-pro-f4efd",
  storageBucket: "chat-pro-f4efd.appspot.com",
  messagingSenderId: "460927168324",
  appId: "1:460927168324:web:7876ebce8ed6a67c767111",
  measurementId: "G-SF7C1QWD83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to send a message
async function sendMessage(username, message) {
  // Trim input to prevent empty or whitespace-only messages
  username = username.trim();
  message = message.trim();

  if (username && message) {
    // Check if the message is "/clearchat"
    if (message.toLowerCase() === "/clearchat") {
      if (username.toLowerCase() === "admin") {
        clearChat(); // Clear chat
        return; // Don't send the "/clearchat" message
      } else {
        alert("Only admin can use /clearchat!");
        return; // Stop further execution
      }
    }

    try {
      // Send the message with a timestamp
      await addDoc(collection(db, "messages"), {
        username,
        message,
        timestamp: new Date(),
      });
      document.getElementById("message").value = ""; // Clear message input
      document.getElementById("message").focus(); // Auto-focus back to message input
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
      const { username, message, timestamp } = doc.data();

      // Format the timestamp for display
      const time = timestamp ? new Date(timestamp.seconds * 1000).toLocaleTimeString() : "Unknown Time";

      // Add "[OWNER]" prefix for Matej
      const displayUsername = username === "Matej" ? `[OWNER] ${username}` : username;

      // Create a message element
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message");
      if (username === "Matej") {
        messageDiv.classList.add("owner-message"); // Highlight Matej's messages
      }

      const usernameSpan = document.createElement("span");
      usernameSpan.classList.add("username");
      usernameSpan.textContent = `${displayUsername}: `;

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("message-text");
      messageSpan.textContent = message;

      const timeSpan = document.createElement("span");
      timeSpan.classList.add("timestamp");
      timeSpan.textContent = ` (${time})`;

      // Append elements to the message container
      messageDiv.appendChild(usernameSpan);
      messageDiv.appendChild(messageSpan);
      messageDiv.appendChild(timeSpan);

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
