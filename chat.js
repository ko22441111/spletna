import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase konfiguracija
const firebaseConfig = {
  apiKey: "AIzaSyB0laoIP-Ya8RP9V-5r54ClQ56Zeb7_79k",
  authDomain: "chat-pro-f4efd.firebaseapp.com",
  projectId: "chat-pro-f4efd",
  storageBucket: "chat-pro-f4efd.appspot.com",
  messagingSenderId: "460927168324",
  appId: "1:460927168324:web:7876ebce8ed6a67c767111",
  measurementId: "G-SF7C1QWD83"
};

// Inicializacija Firebase
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Napaka pri inicializaciji Firebase:", error);
}

// Globalne spremenljivke
let mutedUsers = [];
let bannedUsers = [];
let isChatPaused = false;
let userMessages = {};
const MESSAGE_LIMIT = 5; // Največje število sporočil
const TIME_WINDOW = 10000; // 10 sekund

const allowedClearChatUsers = ["Luke", "Matej22441", "Ana Dunovic", "Sly"];

// Obnovitev uporabniškega imena iz lokalne shrambe
document.getElementById("username").value = localStorage.getItem("username") || "";

// Funkcija za pošiljanje sporočil
async function sendMessage(username, message) {
  try {
    // Preverjanje uporabniškega imena in sporočila
    if (!username || !message) {
      showAlert("Uporabniško ime in sporočilo sta obvezna!", false);
      return;
    }

    // Shranjevanje uporabniškega imena v lokalno shrambo
    localStorage.setItem("username", username);

    if (username.trim().toLowerCase() === "system") {
      throw new Error('Ime "System" ni dovoljeno.');
    }
    if (mutedUsers.includes(username)) {
      throw new Error("Tvoj račun je utišan.");
    }
    if (bannedUsers.includes(username)) {
      throw new Error("Tvoj račun je banan.");
    }
    if (isChatPaused) {
      showAlert("Chat je trenutno ustavljen.", false);
      return;
    }

    // Antispam preverjanje
    const now = Date.now();
    if (!userMessages[username]) userMessages[username] = [];
    userMessages[username] = userMessages[username].filter((t) => now - t < TIME_WINDOW);
    if (userMessages[username].length >= MESSAGE_LIMIT) {
      throw new Error("Preveč sporočil v kratkem času. Počakajte trenutek.");
    }
    userMessages[username].push(now);

    // Posebni ukazi
    if (message.trim().toLowerCase() === "/clearchat") {
      if (allowedClearChatUsers.includes(username)) {
        await clearChat();
        showAlert("Chat je bil uspešno izbrisan!", true);
      } else {
        showAlert("Nimaš dovoljenja za uporabo ukaza /clearchat.", false);
      }
      return;
    }

    // Ukaz: /color
    let color = null;
    if (message.trim().toLowerCase().startsWith("/color")) {
      const parts = message.split(" ");
      if (parts.length >= 3) {
        color = parts[1];
        message = parts.slice(2).join(" ");
      } else {
        throw new Error("Napačna uporaba ukaza /color. Primer: /color rdeča To je obarvano sporočilo.");
      }
    }

    // Dodajanje sporočila v Firebase
    await addDoc(collection(db, "messages"), {
      username,
      message,
      color,
      timestamp: new Date(),
    });

    document.getElementById("message").value = ""; // Pošiljanje uspešno
    showAlert("Sporočilo je bilo poslano!", true);
  } catch (error) {
    console.error("Napaka pri pošiljanju sporočila:", error.message);
    showAlert(error.message, false);
  }
}

// Funkcija za poslušanje sporočil
async function listenToMessages() {
  const chatWindow = document.getElementById("chat-window");
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    chatWindow.innerHTML = "";
    snapshot.forEach((doc) => {
      const { username, message, timestamp, color } = doc.data();
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message");

      const usernameSpan = document.createElement("span");
      usernameSpan.classList.add("username");

      // Custom username styling
      if (username === "Matej22441") {
        usernameSpan.classList.add("owner");
        usernameSpan.innerHTML = `[owner] ${username}`;
      } else if (username === "Sly") {
        usernameSpan.classList.add("co-owner");
        usernameSpan.innerHTML = `[Co Owner] ${username}`;
      } else if (username === "Ana Dunovic") {
        usernameSpan.classList.add("owner-girl");
        usernameSpan.innerHTML = `[owner girl] ${username}`;
      } else if (username === "Luke") {
        usernameSpan.classList.add("chill-guy");
        usernameSpan.innerHTML = `[Chill guy] ${username}`;
      } else {
        usernameSpan.classList.add("member");
        usernameSpan.innerHTML = `[member] ${username}`;
      }

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("message-text");
      messageSpan.textContent = message;
      if (color) messageSpan.style.color = color;

      const timestampSpan = document.createElement("span");
      timestampSpan.classList.add("timestamp");
      timestampSpan.textContent = new Date(timestamp.seconds * 1000).toLocaleString();

      messageDiv.append(usernameSpan, messageSpan, timestampSpan);
      chatWindow.appendChild(messageDiv);
    });

    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
}

// Funkcija za prikaz obvestil
function showAlert(message, isSuccess) {
  const alert = document.createElement("div");
  alert.className = isSuccess ? "alert-success" : "alert-error";
  alert.textContent = message;

  document.getElementById("alerts").appendChild(alert);
  setTimeout(() => alert.remove(), 3000);
}

// Dogodki za pošiljanje sporočil
document.getElementById("send-button").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const message = document.getElementById("message").value.trim();
  sendMessage(username, message);
});

document.getElementById("message").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const username = document.getElementById("username").value.trim();
    const message = document.getElementById("message").value.trim();
    sendMessage(username, message);
  }
});

// Zaženi poslušanje sporočil
listenToMessages();
