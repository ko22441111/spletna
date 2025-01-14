import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

    // Preverjanje za ukaz /clearchat
    if (message.trim().toLowerCase() === "/clearchat") {
      if (allowedClearChatUsers.includes(username)) {
        await clearChat();
        showAlert("Chat je bil uspešno izbrisan!", true);
      } else {
        showAlert("Nimaš dovoljenja za uporabo ukaza /clearchat.", false);
      }
      return; // Ukaz je obdelan, ne pošlji običajnega sporočila
    }

    // Ukaz: /obvestilo
    if (message.trim().toLowerCase().startsWith("/obvestilo")) {
      const notificationMessage = message.slice(11).trim(); // Odstrani /obvestilo in prostore
      if (notificationMessage) {
        message = `[OBVESTILO!] ${notificationMessage}`; // Dodaj [OBVESTILO!] pred sporočilo
        await addDoc(collection(db, "messages"), {
          username: "System",  // Uporabi "System" kot ime uporabnika za obvestilo
          message,
          color: "#e60012",  // Rdeča barva za obvestilo
          timestamp: new Date()
        });
        showAlert("Obvestilo je bilo poslano!", true);
      } else {
        showAlert("Nisi navedel nobenega besedila za obvestilo.", false);
      }
      return; // Ukaz je obdelan, ne pošlji običajnega sporočila
    }

    // Ukaz: /help
    if (message.trim().toLowerCase() === "/help") {
      showAlert("Available commands: /clearchat, /color, /pausechat, /resumechat, /mute, /unmute, /ban, /unban, /setnickname, /info, /quote, /emoji, /roll, /obvestilo", true);
      return;
    }

    // Command: /pausechat
    if (message.trim().toLowerCase() === "/pausechat" && allowedClearChatUsers.includes(username)) {
      isChatPaused = true;
      showAlert("Chat is now paused.", true);
      return;
    }

    // Command: /resumechat
    if (message.trim().toLowerCase() === "/resumechat" && allowedClearChatUsers.includes(username)) {
      isChatPaused = false;
      showAlert("Chat is now resumed.", true);
      return;
    }

    // Command: /mute [username]
    if (message.trim().toLowerCase().startsWith("/mute")) {
      const parts = message.trim().split(" ");
      const userToMute = parts[1];
      if (allowedClearChatUsers.includes(username)) {
        mutedUsers.push(userToMute);
        showAlert(`${userToMute} has been muted.`, true);
      } else {
        showAlert("You don't have permission to mute users.", false);
      }
      return;
    }

    // Command: /unmute [username]
    if (message.trim().toLowerCase().startsWith("/unmute")) {
      const parts = message.trim().split(" ");
      const userToUnmute = parts[1];
      if (allowedClearChatUsers.includes(username)) {
        mutedUsers = mutedUsers.filter(user => user !== userToUnmute);
        showAlert(`${userToUnmute} has been unmuted.`, true);
      } else {
        showAlert("You don't have permission to unmute users.", false);
      }
      return;
    }

    // Command: /ban [username]
    if (message.trim().toLowerCase().startsWith("/ban")) {
      const parts = message.trim().split(" ");
      const userToBan = parts[1];
      if (allowedClearChatUsers.includes(username)) {
        bannedUsers.push(userToBan);
        showAlert(`${userToBan} has been banned.`, true);
      } else {
        showAlert("You don't have permission to ban users.", false);
      }
      return;
    }

    // Command: /unban [username]
    if (message.trim().toLowerCase().startsWith("/unban")) {
      const parts = message.trim().split(" ");
      const userToUnban = parts[1];
      if (allowedClearChatUsers.includes(username)) {
        bannedUsers = bannedUsers.filter(user => user !== userToUnban);
        showAlert(`${userToUnban} has been unbanned.`, true);
      } else {
        showAlert("You don't have permission to unban users.", false);
      }
      return;
    }

    // Command: /setnickname [nickname]
    if (message.trim().toLowerCase().startsWith("/setnickname")) {
      const parts = message.trim().split(" ");
      const newNickname = parts.slice(1).join(" ");
      if (newNickname) {
        username = newNickname; // Temporarily change username for the current session
        showAlert(`Your nickname has been set to ${newNickname}.`, true);
      } else {
        showAlert("Please provide a nickname.", false);
      }
      return;
    }

    // Command: /roll [number]
    if (message.trim().toLowerCase().startsWith("/roll")) {
      const parts = message.trim().split(" ");
      const sides = parseInt(parts[1], 10) || 6; // Default to 6 sides if not specified
      const rollResult = Math.floor(Math.random() * sides) + 1;
      showAlert(`You rolled a ${rollResult} on a ${sides}-sided die.`, true);
      return;
    }

    let color = null;

    // Preverjanje ukaza /color
    if (message.trim().toLowerCase().startsWith("/color")) {
      const parts = message.trim().split(" ");
      if (parts.length >= 3) {
        color = parts[1]; // Prva beseda po /color je barva
        message = parts.slice(2).join(" "); // Preostanek je sporočilo
      } else {
        throw new Error("Napačna uporaba ukaza /color. Primer: /color rdeča To je obarvano sporočilo.");
      }
    }

    await addDoc(collection(db, "messages"), {
      username,
      message,
      color, // Shrani barvo
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
      const { username, message, timestamp, color, imageUrl } = doc.data();
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

      // Prikaz slike, če URL slike obstaja
      if (imageUrl) {
        const imageElement = document.createElement("img");
        imageElement.classList.add("message-image");
        imageElement.src = imageUrl;
        imageElement.alt = "Image in message";
        messageDiv.appendChild(imageElement);
      }

      messageDiv.appendChild(usernameSpan);
      messageDiv.appendChild(messageSpan);
      messageDiv.appendChild(timestampSpan);
      chatWindow.appendChild(messageDiv);
    });

    // Premik na zadnje sporočilo
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

listenToMessages();
