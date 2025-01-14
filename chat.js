import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase konfiguracija
const firebaseConfig = {
  apiKey: "AIzaSyB0laoIP-Ya8RP9V-5r54ClQ56Zeb7_79k",
  authDomain: "chat-pro-f4efd.firebaseapp.com",
  projectId: "chat-pro-f4efd",
  storageBucket: "chat-pro-f4efd.appspot.com",
  messagingSenderId: "460927168324",
  appId: "1:460927168324:web:7876ebce8ed6a67c767111",
  measurementId: "G-SF7C1QWD83",
};

// Inicializacija Firebase in Firestore
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase in Firestore uspešno inicializirana.");
} catch (error) {
  console.error("Napaka pri inicializaciji Firebase:", error);
}

// Globalne spremenljivke
let mutedUsers = [];
let bannedUsers = [];
let isChatPaused = false;

// Funkcija za pošiljanje sporočil
async function sendMessage() {
  const username = document.getElementById("username").value.trim();
  const message = document.getElementById("message").value.trim();

  try {
    // Validacija vnosa
    if (!username || !message) {
      throw new Error("Uporabniško ime in sporočilo sta obvezna.");
    }

    if (mutedUsers.includes(username)) {
      throw new Error("Tvoj račun je utišan.");
    }

    if (bannedUsers.includes(username)) {
      throw new Error("Tvoj račun je banan.");
    }

    if (isChatPaused) {
      throw new Error("Chat je trenutno ustavljen. Počakajte, da ga nekdo znova omogoči.");
    }

    // Pošlji sporočilo v Firestore
    await addDoc(collection(db, "messages"), {
      username,
      message,
      timestamp: new Date(),
    });

    // Po čiščenju polja za sporočilo
    document.getElementById("message").value = "";
  } catch (error) {
    console.error("Napaka pri pošiljanju sporočila:", error.message);
    showAlert(error.message, false);
  }
}

// Funkcija za poslušanje sporočil
function listenToMessages() {
  const chatWindow = document.getElementById("chat-window");

  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
  onSnapshot(q, (snapshot) => {
    chatWindow.innerHTML = ""; // Počisti prejšnja sporočila

    snapshot.forEach((doc) => {
      const { username, message, timestamp } = doc.data();

      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message");

      const usernameSpan = document.createElement("span");
      usernameSpan.classList.add("username");
      usernameSpan.textContent = username;

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("message-text");
      messageSpan.textContent = message;

      const timestampSpan = document.createElement("span");
      timestampSpan.classList.add("timestamp");
      timestampSpan.textContent = new Date(timestamp.seconds * 1000).toLocaleString();

      messageDiv.appendChild(usernameSpan);
      messageDiv.appendChild(messageSpan);
      messageDiv.appendChild(timestampSpan);

      chatWindow.appendChild(messageDiv);
    });

    chatWindow.scrollTop = chatWindow.scrollHeight; // Pomik na zadnje sporočilo
  });
}

// Funkcija za prikaz obvestil
function showAlert(message, isSuccess) {
  const alertContainer = document.getElementById("alerts");
  const alert = document.createElement("div");
  alert.className = isSuccess ? "alert-success" : "alert-error";
  alert.textContent = message;

  alertContainer.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 3000);
}

// Dogodki za pošiljanje sporočil
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Poslušanje sporočil ob nalaganju
listenToMessages();
