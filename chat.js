// Import the necessary functions from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
  if (username && message) {
    try {
      await addDoc(collection(db, "messages"), {
        username,
        message,
        timestamp: new Date(),
      });
      document.getElementById("message").value = ""; // Clear message input
    } catch (error) {
      console.error("Error sending message:", error);
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
      usernameSpan.textContent = `${username}: `;

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

// Add event listener to the send button
document.getElementById("send-button").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const message = document.getElementById("message").value;
  sendMessage(username, message);
});

// Start listening to messages
listenToMessages();
