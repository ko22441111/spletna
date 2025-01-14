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

// Inicializacija Fire
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

let mutedUsers = [];
let bannedUsers = [];
let isChatPaused = false;

// Spremljanje uporabniških sporočil za antispam
let userMessages = {};
const MESSAGE_LIMIT = 5; // Največje število sporočil
const TIME_WINDOW = 10000; // Časovno obdobje v milisekundah (10 sekund)

const allowedClearChatUsers = ["Luke", "Matej22441", "Ana Dunovic", "Sly"];

// Funkcija za pošiljanje sporočil
async function sendMessage(username, message) {
  try {
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

    if (isChatPaused) {
      showAlert("Chat je trenutno ustavljen. Počakajte, da ga nekdo znova omogoči.", false);
      return;
    }

    // **Antispam preverjanje**
    const now = Date.now();
    if (!userMessages[username]) {
      userMessages[username] = [];
    }

    // Odstranimo stare vnose
    userMessages[username] = userMessages[username].filter(timestamp => now - timestamp < TIME_WINDOW);

    // Preverimo, ali uporabnik presega omejitev
    if (userMessages[username].length >= MESSAGE_LIMIT) {
      throw new Error("Preveč sporočil v kratkem času. Počakajte trenutek.");
    }

    // Dodamo trenutni časovni žig
    userMessages[username].push(now);

    // Preverjanje za ukaz /clearchat
    if (message.trim().toLowerCase() === "/clearchat") {
      if (allowedClearChatUsers.includes(username)) {
        await clearChat();
        showAlert("Chat je bil uspešno izbrisan!", true);
      } else {
        showAlert("Nimaš dovoljenja za uporabo ukaza /clearchat.", false);
      }
      return;
    }

    // Ukaz: /help
    if (message.trim().toLowerCase() === "/help") {
      showAlert("Available commands: /clearchat, /pausechat, /resumechat, /mute, /unmute, /ban, /unban, /setnickname, /obvestilo", true);
      return;
    }

    let color = null;

    // Preverjanje ukaza /color
    if (message.trim().toLowerCase().startsWith("/color")) {
      const parts = message.trim().split(" ");
      if (parts.length >= 3) {
        color = parts[1];
        message = parts.slice(2).join(" ");
      } else {
        throw new Error("Napačna uporaba ukaza /color. Primer: /color rdeča To je obarvano sporočilo.");
      }
    }

    await addDoc(collection(db, "messages"), {
      username,
      message,
      color,
      timestamp: new Date()
    });

    document.getElementById("message").value = "";
    showAlert("Sporočilo je bilo poslano!", true);
  } catch (error) {
    console.error("Error sending message:", error.message);
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

      // Custom Username Labels
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
      } else if (username !== "System") {
        usernameSpan.classList.add("member");
        usernameSpan.innerHTML = `[member] ${username}`;
      }

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("message-text");
      messageSpan.textContent = message;

      // Če je barva nastavljena, uporabi stil za sporočilo
      if (color) {
        messageSpan.style.color = color;
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

    chatWindow.scrollTop = chatWindow.scrollHeight;
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

// Redno čiščenje zastarelih podatkov o uporabnikih (antispam)
setInterval(() => {
  const now = Date.now();
  for (const user in userMessages) {
    userMessages[user] = userMessages[user].filter(timestamp => now - timestamp < TIME_WINDOW);
    if (userMessages[user].length === 0) {
      delete userMessages[user];
    }
  }
}, TIME_WINDOW);

// Zaženi poslušanje sporočil
listenToMessages();
