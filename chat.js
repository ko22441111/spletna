// Firebase modul - pravilno uvažanje
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase konfiguracija
const firebaseConfig = {
  apiKey: "AIzaSyB0laoIP-Ya8RP9V-5r54ClQ56Zeb7_79k",
  authDomain: "chat-pro-f4efd.firebaseapp.com",
  projectId: "chat-pro-f4efd",
  storageBucket: "chat-pro-f4efd.firebasestorage.app",
  messagingSenderId: "460927168324",
  appId: "1:460927168324:web:7876ebce8ed6a67c767111",
  measurementId: "G-SF7C1QWD83"
};

// Inicializacija Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Funkcija za pošiljanje sporočil
async function sendMessage(username, message) {
  if (username && message) {
    try {
      await addDoc(collection(db, "messages"), {
        username,
        message,
        timestamp: new Date(),
      });
      document.getElementById("message").value = ""; // Pošiljanje izprazni polje
    } catch (error) {
      console.error("Napaka pri pošiljanju sporočila:", error);
      alert("Prišlo je do napake pri pošiljanju sporočila. Poskusite znova.");
    }
  } else {
    alert("Ime in sporočilo sta obvezna!");
  }
}

// Poslušanje sporočil
function listenToMessages() {
  const chatWindow = document.getElementById("chat-window");
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    chatWindow.innerHTML = ""; // Počisti prejšnja sporočila
    snapshot.forEach((doc) => {
      const { username, message } = doc.data();

      // Oblikovanje sporočila
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

    // Samodejni premik na dno pogovora
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
}

// Klik na gumb za pošiljanje
document.getElementById("send-button").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const message = document.getElementById("message").value;
  sendMessage(username, message);
});

// Pošiljanje s tipko Enter
document.getElementById("message").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const message = document.getElementById("message").value;
    sendMessage(username, message);
  }
});

// Začetek poslušanja sporočil
listenToMessages();
