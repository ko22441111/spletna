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
  console.log("Firebase initialized:", app);
  db = getFirestore(app);
  console.log("Firestore initialized:", db);
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

let mutedUsers = [];
let bannedUsers = [];
let isChatPaused = false;

const allowedClearChatUsers = ["Matej22441"]; // Samo Matej22441 lahko uporablja /clearchat

// Seznam uporabnikov z vlogami
const userRoles = {
  "Matej22441": "owner",
  "Sly": "co-owner",
  "Ana Dunovic": "ownergirl",
  "luke": "chill-guy"
};

// Funkcija za pridobitev vloge uporabnika
function getUserRole(username) {
  const role = userRoles[username] || "member"; // Če ni vloge, dodeli 'member'
  let rolePrefix = "";

  switch (role) {
    case "owner":
      rolePrefix = "[owner]";
      break;
    case "ownergirl":
      rolePrefix = "[owner girl]";
      break;
    case "co-owner":
      rolePrefix = "[co-owner]";
      break;
    default:
      rolePrefix = "[member]"; // Če ni vloge, dodeli privzeto vlogo
  }

  return { rolePrefix, role }; // Vrnemo tako oznako kot vlogo
}

// Funkcija za pošiljanje sporočil
async function sendMessage(username, message) {
  try {
    // Preveri, da ime ni "System"
    if (username.trim().toLowerCase() === "system") {
      throw new Error('Ime "System" ni dovoljeno.');
    }

    if (!username.trim() || !message.trim()) {
      throw new Error("Obe polji sta obvezni!");
    }

    if (mutedUsers.includes(username)) {
      throw new Error("Tvoj račun je utišan.");
    }

    if (bannedUsers.includes(username)) {
      throw new Error("Tvoj račun je banan.");
    }

    // Če je chat ustavljen, ne pošlji sporočila
    if (isChatPaused) {
      showAlert("Chat je trenutno ustavljen. Počakajte, da ga nekdo znova omogoči.", false);
      return;
    }

    // Ukaz: /help
    if (message.trim().toLowerCase() === "/help") {
      showAlert("Available commands: /clearchat, /color, /pausechat, /resumechat, /mute, /unmute, /ban, /unban, /setnickname, /info, /quote, /emoji, /roll, /obvestilo", true);
      return;
    }

    // Ukaz: /color
    if (message.trim().toLowerCase().startsWith("/color")) {
      const parts = message.trim().split(" ");
      if (parts.length >= 3) {
        const color = parts[1]; // Prva beseda po /color je barva
        message = parts.slice(2).join(" "); // Preostanek je sporočilo
        await addDoc(collection(db, "messages"), {
          username,
          message,
          color, // Shrani barvo
          timestamp: new Date()
        });
        document.getElementById("message").value = "";
        showAlert("Sporočilo z barvo je bilo poslano!", true);
        return;
      } else {
        throw new Error("Napačna uporaba ukaza /color. Primer: /color rdeča To je obarvano sporočilo.");
      }
    }

    // Ukaz: /obvestilo
    if (message.trim().toLowerCase().startsWith("/obvestilo")) {
      if (message.length <= 11) {
        throw new Error("Obvestilo ne sme biti prazno.");
      }
      const notificationMessage = "[OBVESTILO] " + message.slice(11).trim();
      await addDoc(collection(db, "messages"), {
        username,
        message: notificationMessage,
        timestamp: new Date(),
        isNotification: true // Označimo sporočilo kot obvestilo
      });
      document.getElementById("message").value = "";
      showAlert("Obvestilo je bilo poslano!", true);
      return;
    }

    // Ukaz: /clearchat (dostopen samo Matej22441)
    if (message.trim().toLowerCase() === "/clearchat") {
      if (username !== "Matej22441") {
        throw new Error("Samo Matej22441 lahko uporabi to komando.");
      }
      clearChat();
      return;
    }

    // Pošlji običajno sporočilo
    await addDoc(collection(db, "messages"), {
      username,
      message,
      timestamp: new Date()
    });

    document.getElementById("message").value = "";
    showAlert("Sporočilo je bilo poslano!", true);
  } catch (error) {
    console.error("Error sending message:", error.message);
    showAlert(error.message, false);
  }
}

// Funkcija za čiščenje klepeta (izbriši vsa sporočila)
async function clearChat() {
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  snapshot.forEach((doc) => {
    deleteDoc(doc.ref); // Izbriši vsako sporočilo
  });
  showAlert("Klepet je bil očiščen.", true);
}

// Funkcija za poslušanje sporočil
function listenToMessages() {
  const chatWindow = document.getElementById("chat-window");
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    chatWindow.innerHTML = ""; // Ponovno naloži vse sporočila

    snapshot.forEach((doc) => {
      const { username, message, timestamp, color, isNotification } = doc.data();
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message");

      const usernameSpan = document.createElement("span");
      const { rolePrefix, role } = getUserRole(username); // Preveri vlogo uporabnika
      usernameSpan.classList.add("username", role);  // Dodaj vlogo kot razred
      usernameSpan.textContent = rolePrefix + " " + username; // Dodaj oznako pred imenom

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("message-text");
      messageSpan.textContent = message;

      if (color) {
        messageSpan.style.color = color;
      }

      if (isNotification) {
        messageDiv.classList.add("notification");
      }

      const timestampSpan = document.createElement("span");
      timestampSpan.classList.add("timestamp");
      if (timestamp?.seconds) {
        timestampSpan.textContent = new Date(timestamp.seconds * 1000).toLocaleString();
      } else {
        timestampSpan.textContent = new Date().toLocaleString();
      }

      messageDiv.appendChild(usernameSpan);
      messageDiv.appendChild(messageSpan);
      messageDiv.appendChild(timestampSpan);
      chatWindow.appendChild(messageDiv);
    });

    chatWindow.scrollTop = chatWindow.scrollHeight; // Premik na zadnje sporočilo
  });
}

// Funkcija za prikaz obvestil
function showAlert(message, isSuccess) {
  const alert = document.createElement("div");
  alert.classList.add(isSuccess ? "alert-success" : "alert-error");
  alert.textContent = message;

  const alertContainer = document.getElementById("alerts");
  alertContainer.appendChild(alert);

  setTimeout(() => alert.remove(), 3000);
}

// Poslušanje dogodkov za pošiljanje sporočil
document.getElementById("send-button").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const message = document.getElementById("message").value.trim();
  sendMessage(username, message);
});

// Kliči funkcijo za poslušanje sporočil
listenToMessages();
