import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

const allowedClearChatUsers = ["Luke", "Matej22441", "Ana Dunovic", "Sly"];

// Seznam uporabnikov z vlogami
const userRoles = {
  "Matej22441": "owner",
  "Sly": "co-owner",
  "Ana Dunovic": "ownergirl",
  "luke": "chill-guy"
};

// Funkcija za pridobitev vloge uporabnika
function getUserRole(username) {
  if (username.toLowerCase() === "system") {
    return { rolePrefix: "[HOST]", role: "host", color: "darkred" };
  }

  const role = userRoles[username] || "member";
  let rolePrefix = "";
  let color = "white";

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
      rolePrefix = "[member]";
      break;
  }

  return { rolePrefix, role, color };
}

// Funkcija za pošiljanje sporočil
async function sendMessage(username, message) {
  try {
    // Preveri, če je ime uporabnika "system"
    if (username.trim().toLowerCase() === "system") {
      throw new Error('Ime "System" ni dovoljeno.');
    }

    // Preveri, če sta polja za uporabniško ime in sporočilo prazna
    if (!username.trim() || !message.trim()) {
      throw new Error("Obe polji sta obvezni!");
    }

    // Preveri, če je uporabnik utišan
    if (mutedUsers.includes(username)) {
      throw new Error("Tvoj račun je utišan.");
    }

    // Preveri, če je uporabnik banan
    if (bannedUsers.includes(username)) {
      throw new Error("Tvoj račun je banan.");
    }

    // Preveri, če je klepet ustavljen
    if (isChatPaused) {
      showAlert("Chat je trenutno ustavljen. Počakajte, da ga nekdo znova omogoči.", false);
      return;
    }

    // Ukaz: /help
    if (message.trim().toLowerCase() === "/help") {
      showAlert("Available commands: /clearchat, /color, /pausechat, /resumechat, /mute, /unmute, /ban, /unban, /setnickname, /info, /quote, /emoji, /roll, /obvestilo", true);
      return;
    }

    // Ukaz: /clearchat
    if (message.trim().toLowerCase() === "/clearchat") {
      if (!allowedClearChatUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za čiščenje klepeta.");
      }

      // Pošlji obvestilo v klepet kot "SYSTEM"
      const initialMessageRef = await addDoc(collection(db, "messages"), {
        username: "SYSTEM",
        message: "Vsa sporočila bodo izbrisana čez 10 sekund. Prosimo, počakajte...",
        timestamp: new Date(),
        color: "orange",
        isNotification: true
      });

      let remainingSeconds = 10;
      const intervalId = setInterval(async () => {
        remainingSeconds--;

        // Posodobi sporočilo z preostalimi sekundami
        await updateDoc(initialMessageRef, {
          message: `Vsa sporočila bodo izbrisana čez ${remainingSeconds} sekund. Prosimo, počakajte...`
        });

        if (remainingSeconds <= 0) {
          clearInterval(intervalId); // Ustavimo števec

          // Preberi vse dokumente in jih izbriši
          const messagesRef = collection(db, "messages");
          const snapshot = await getDocs(messagesRef);
          snapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref); // Briši vsak dokument
          });

          // Obvesti uporabnike, da so bila sporočila očiščena
          await addDoc(collection(db, "messages"), {
            username: "SYSTEM",
            message: "Klepeta je bilo očiščeno!",
            timestamp: new Date(),
            color: "red",
            isNotification: true
          });
        }
      }, 1000); // Posodabljaj vsakih 1 sekundo

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
          color,
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

      // Dodaj sporočilo z imenom SYSTEM in barvo rdečo
      await addDoc(collection(db, "messages"), {
        username: "SYSTEM",  
        message: notificationMessage,
        timestamp: new Date(),
        color: "red",
        isNotification: true
      });
      document.getElementById("message").value = "";
      showAlert("Obvestilo je bilo poslano!", true);
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

// Funkcija za prikaz obvestil
function showAlert(message, isSuccess) {
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("alert");
  alertDiv.style.backgroundColor = isSuccess ? "green" : "red";
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Poslušanje dogodkov za pošiljanje sporočil
document.getElementById("send-button").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const message = document.getElementById("message").value.trim();
  sendMessage(username, message);
});

// Funkcija za poslušanje sporočil
function listenToMessages() {
  const chatWindow = document.getElementById("chat-window");
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    chatWindow.innerHTML = "";

    snapshot.forEach((doc) => {
      const { username, message, timestamp, color, isNotification } = doc.data();
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message");

      const usernameSpan = document.createElement("span");
      const { rolePrefix, role, color: userColor } = getUserRole(username);
      usernameSpan.classList.add("username", role);
      usernameSpan.textContent = rolePrefix + " " + username;

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("message-text");
      messageSpan.textContent = message;

      if (userColor) {
        messageSpan.style.color = userColor;
      } else if (color) {
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

    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
}

// Kliči funkcijo za poslušanje sporočil
listenToMessages();
