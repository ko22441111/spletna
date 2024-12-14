// Import necessary functions from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

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
const storage = getStorage(app);

// Function to send a message
async function sendMessage(username, message) {
  const messageInput = document.getElementById("message");
  const imageInput = document.getElementById("image");
  
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

    // If there's an image, upload it first
    let imageUrl = null;
    if (imageInput.files.length > 0) {
      const file = imageInput.files[0];
      const storageRef = ref(storage, 'chat_images/' + file.name);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          // Optional: Handle upload progress if needed
        }, 
        (error) => {
          console.error("Error uploading image:", error);
          alert("Error uploading image. Please try again.");
        }, 
        async () => {
          // Get image URL after upload completes
          imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
          sendToFirestore(username, message, imageUrl);  // Send to Firestore
        }
      );
    } else {
      // No image, just send the message
      sendToFirestore(username, message, imageUrl);
    }
  } else {
    alert("Both username and message are required!");
  }
}

// Function to send data to Firestore
async function sendToFirestore(username, message, imageUrl) {
  try {
    // Send the message as usual (with or without image)
    await addDoc(collection(db, "messages"), {
      username,
      message,
      imageUrl,
      timestamp: new Date(),
    });
    document.getElementById("message").value = ""; // Clear message input
    document.getElementById("image").value = ""; // Clear image input
  } catch (error) {
    console.error("Error sending message:", error);
    alert("There was an error sending the message. Please try again.");
  }
}

// Function to listen to messages and display them in the chat window
function listenToMessages() {
  const chatWindow = document.getElementById("chat-window");
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    chatWindow.innerHTML = ""; // Clear previous messages
    snapshot.forEach((doc) => {
      const { username, message, imageUrl } = doc.data();

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
        usernameSpan.style.color = "red"; // Blue color for Admin
      }

      // Check if the username is "Ana Dunovic"
      if (username === "Ana Dunovic") {
        usernameSpan.classList.add("owners-girl"); // Add the special class for Ana Dunovic
        usernameSpan.style.color = "darkblue"; // Ensure OWNER'S Girl is red
        usernameSpan.textContent = `[OWNER'S Girl] ${username}:`; // Corrected string template
      } else {
        usernameSpan.textContent = `${username}:`; // Regular username
      }

      const messageSpan = document.createElement("span");
      messageSpan.textContent = message;

      messageDiv.appendChild(usernameSpan);
      messageDiv.appendChild(messageSpan);

      // If an image is attached, display it
      if (imageUrl) {
        const imageElement = document.createElement("img");
        imageElement.src = imageUrl;
        imageElement.alt = "Attached image";
        messageDiv.appendChild(imageElement);
      }

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
