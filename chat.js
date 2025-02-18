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
let customNicknames = {};  // Za shranjevanje vzdevkov uporabnikov
let userRoles = {
  "Matej22441": "owner",
  "Sly": "co-owner",
  "Ana Dunovic": "ownergirl",
  "luke": "chill-guy"
};

const allowedClearChatUsers = ["Luke", "Matej22441", "Ana Dunovic", "Sly"];
const allowedPauseChatUsers = ["Luke", "Matej22441"];
const allowedBanUsers = ["Luke", "Matej22441", "Ana Dunovic"];
const allowedUnbanUsers = ["Luke", "Matej22441"];
const allowedSetRoleUsers = ["Luke", "Matej22441", "Sly"]; // Dovoljenje za uporabo /setrole

function getUserRole(username) {
  if (username.toLowerCase() === "system") {
    return { rolePrefix: "[HOST]", role: "host", color: "turquoise" }; // SYSTEM z barvo turquoise
  }

  const role = userRoles[username] || "member";
  let rolePrefix = "";
  let color = "white";

  switch (role) {
    case "owner":
      rolePrefix = "[🍃Weed OWNER🍃]";
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

    // Ukaz: /help
    if (message.trim().toLowerCase() === "/help") {
      showAlert("Available commands: /clearchat, /color, /pausechat, /resumechat, /mute, /unmute, /ban, /unban, /setnickname, /quote, /emoji, /roll, /info, /setrole", true);
      return;
    }

    // Ukaz: /clearchat
    if (message.trim().toLowerCase() === "/clearchat") {
      if (!allowedClearChatUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za čiščenje klepeta.");
      }
      clearChat();
      return;
    }

    // Ukaz: /color
    if (message.trim().toLowerCase().startsWith("/color")) {
      const color = message.split(" ")[1];
      if (!color) {
        throw new Error("Prosim, navedite barvo.");
      }
      customNicknames[username] = color;
      showAlert(`Tvoja barva je nastavljena na ${color}.`, true);
      return;
    }

    // Ukaz: /pausechat
    if (message.trim().toLowerCase() === "/pausechat") {
      if (!allowedPauseChatUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za ustavitev klepeta.");
      }
      isChatPaused = true;
      showAlert("Chat je ustavljen.", true);
      return;
    }

    // Ukaz: /resumechat
    if (message.trim().toLowerCase() === "/resumechat") {
      if (!allowedPauseChatUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za nadaljevanje klepeta.");
      }
      isChatPaused = false;
      showAlert("Chat je ponovno omogočen.", true);
      return;
    }

    // Ukaz: /mute
    if (message.trim().toLowerCase().startsWith("/mute")) {
      if (!allowedBanUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za utišanje uporabnikov.");
      }
      const userToMute = message.split(" ")[1];
      if (!userToMute) {
        throw new Error("Prosim, navedite uporabnika, ki ga želite utišati.");
      }
      mutedUsers.push(userToMute);
      showAlert(`${userToMute} je bil utišan.`, true);
      return;
    }

    // Ukaz: /unmute
    if (message.trim().toLowerCase().startsWith("/unmute")) {
      if (!allowedBanUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za odstranitev utišanja.");
      }
      const userToUnmute = message.split(" ")[1];
      if (!userToUnmute) {
        throw new Error("Prosim, navedite uporabnika, ki ga želite odstraniti iz utišanja.");
      }
      mutedUsers = mutedUsers.filter(user => user !== userToUnmute);
      showAlert(`${userToUnmute} je bil odstranjeni iz utišanja.`, true);
      return;
    }

    // Ukaz: /ban
    if (message.trim().toLowerCase().startsWith("/ban")) {
      if (!allowedBanUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za bananje uporabnikov.");
      }
      const userToBan = message.split(" ")[1];
      if (!userToBan) {
        throw new Error("Prosim, navedite uporabnika, ki ga želite banati.");
      }
      bannedUsers.push(userToBan);
      showAlert(`${userToBan} je bil banan.`, true);
      return;
    }

    // Ukaz: /unban
    if (message.trim().toLowerCase().startsWith("/unban")) {
      if (!allowedUnbanUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za odstranjevanje banov.");
      }
      const userToUnban = message.split(" ")[1];
      if (!userToUnban) {
        throw new Error("Prosim, navedite uporabnika, ki ga želite odstraniti iz ban liste.");
      }
      bannedUsers = bannedUsers.filter(user => user !== userToUnban);
      showAlert(`${userToUnban} je bil odstranjen iz ban liste.`, true);
      return;
    }

    // Ukaz: /setnickname
    if (message.trim().toLowerCase().startsWith("/setnickname")) {
      const nickname = message.split(" ")[1];
      if (!nickname) {
        throw new Error("Prosim, navedite nov vzdevek.");
      }
      customNicknames[username] = nickname;
      showAlert(`${username}, vaš nov vzdevek je: ${nickname}`, true);
      return;
    }

    // Ukaz: /quote
    if (message.trim().toLowerCase().startsWith("/quote")) {
      const quote = message.split(" ").slice(1).join(" ");
      if (!quote) {
        throw new Error("Prosim, navedite besedilo, ki ga želite citirati.");
      }
      showAlert(`Citirate: "${quote}"`, true);
      return;
    }

    // Ukaz: /emoji
    if (message.trim().toLowerCase().startsWith("/emoji")) {
      const emoji = message.split(" ")[1];
      if (!emoji) {
        throw new Error("Prosim, navedite emoji.");
      }
      showAlert(`Poslali ste emoji: ${emoji}`, true);
      return;
    }

    // Ukaz: /roll
    if (message.trim().toLowerCase() === "/roll") {
      const roll = Math.floor(Math.random() * 6) + 1;
      showAlert(`Valj se je ustavil na: ${roll}`, true);
      return;
    }

    // Ukaz: /info
    if (message.trim().toLowerCase() === "/info") {
      showAlert("To je klepetni prostor, kjer lahko komunicirate z drugimi!", true);
      return;
    }

    // Ukaz: /setrole
    if (message.trim().toLowerCase().startsWith("/setrole")) {
      const [command, user, role] = message.split(" ");
      if (!allowedSetRoleUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za spremembo vlog.");
      }
      if (!user || !role) {
        throw new Error("Prosim, navedite uporabnika in vlogo.");
      }
      userRoles[user] = role;
      showAlert(`Vloga ${role} je bila dodeljena uporabniku ${user}.`, true);
      return;
    }

    // Dodajanje sporočila v Firestore
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

// Funkcija za brisanje klepeta
function clearChat() {
  const chatWindow = document.getElementById("chat-window");
  chatWindow.innerHTML = "";
  showAlert("Klepeto je bilo očiščeno.", true);
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
