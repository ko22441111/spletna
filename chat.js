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
let customNicknames = {};  // Za shranjevanje vzdevkov uporabnikov

const allowedClearChatUsers = ["Luke", "Matej22441", "Ana Dunovic", "Sly"];
const allowedPauseChatUsers = ["Luke", "Matej22441"];
const allowedBanUsers = ["Luke", "Matej22441", "Ana Dunovic"];
const allowedUnbanUsers = ["Luke", "Matej22441"];

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
      showAlert("Available commands: /clearchat, /color, /pausechat, /resumechat, /mute, /unmute, /ban, /unban, /setnickname, /quote, /emoji, /roll, /info", true);
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
        color: "lime",
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
            message: "Klepet OČIŠČEN!",
            timestamp: new Date(),
            color: "lime",
            isNotification: true
          });
        }
      }, 1000); // Posodabljaj vsakih 1 sekundo

      return;
    }

    // Ukaz: /pausechat
    if (message.trim().toLowerCase() === "/pausechat") {
      if (!allowedPauseChatUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za ustavitev klepeta.");
      }
      isChatPaused = true;
      showAlert("Klepet je bil ustavljen.", true);
      return;
    }

    // Ukaz: /resumechat
    if (message.trim().toLowerCase() === "/resumechat") {
      if (!allowedPauseChatUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za nadaljevanje klepeta.");
      }
      isChatPaused = false;
      showAlert("Klepet je bil ponovno omogočen.", true);
      return;
    }

    // Ukaz: /mute
    if (message.trim().toLowerCase().startsWith("/mute")) {
      if (!allowedBanUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za utišanje uporabnikov.");
      }

      const parts = message.split(" ");
      if (parts.length < 2) {
        throw new Error("Prosim, navedite uporabniško ime, ki ga želite utišati.");
      }

      const userToMute = parts[1].trim();
      mutedUsers.push(userToMute);
      showAlert(`${userToMute} je bil utišan.`, true);
      return;
    }

    // Ukaz: /unmute
    if (message.trim().toLowerCase().startsWith("/unmute")) {
      if (!allowedBanUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za odstranitev utišanja uporabnikov.");
      }

      const parts = message.split(" ");
      if (parts.length < 2) {
        throw new Error("Prosim, navedite uporabniško ime, ki ga želite odstraniti iz utišanja.");
      }

      const userToUnmute = parts[1].trim();
      mutedUsers = mutedUsers.filter(user => user !== userToUnmute);
      showAlert(`${userToUnmute} je bil odstranjen iz utišanja.`, true);
      return;
    }

    // Ukaz: /ban
    if (message.trim().toLowerCase().startsWith("/ban")) {
      if (!allowedBanUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za bananje uporabnikov.");
      }

      const parts = message.split(" ");
      if (parts.length < 2) {
        throw new Error("Prosim, navedite uporabniško ime, ki ga želite banati.");
      }

      const userToBan = parts[1].trim();
      bannedUsers.push(userToBan);
      showAlert(`${userToBan} je bil banan.`, true);
      return;
    }

    // Ukaz: /unban
    if (message.trim().toLowerCase().startsWith("/unban")) {
      if (!allowedUnbanUsers.includes(username)) {
        throw new Error("Nimate dovoljenja za odstranitev ban-a uporabnikov.");
      }

      const parts = message.split(" ");
      if (parts.length < 2) {
        throw new Error("Prosim, navedite uporabniško ime, ki ga želite odstraniti iz ban-a.");
      }

      const userToUnban = parts[1].trim();
      bannedUsers = bannedUsers.filter(user => user !== userToUnban);
      showAlert(`${userToUnban} je bil odstranjen iz ban-a.`, true);
      return;
    }

    // Ukaz: /setnickname
    if (message.trim().toLowerCase().startsWith("/setnickname")) {
      const parts = message.split(" ");
      if (parts.length < 3) {
        throw new Error("Prosim, navedite uporabniško ime in novi vzdevek.");
      }

      const userToNickname = parts[1].trim();
      const newNickname = parts.slice(2).join(" ").trim();
      customNicknames[userToNickname] = newNickname;
      showAlert(`${userToNickname} je zdaj znan kot ${newNickname}.`, true);
      return;
    }

    // Ukaz: /quote
    if (message.trim().toLowerCase().startsWith("/quote")) {
      const parts = message.split(" ");
      if (parts.length < 2) {
        throw new Error("Prosim, navedite sporočilo, ki ga želite citirati.");
      }

      const quotedMessage = parts.slice(1).join(" ");
      showAlert(`Citat: "${quotedMessage}"`, true);
      return;
    }

    // Ukaz: /emoji
    if (message.trim().toLowerCase().startsWith("/emoji")) {
      const emoji = message.split(" ")[1];
      if (!emoji) {
        throw new Error("Prosim, navedite emoji.");
      }

      showAlert(`Poslan emoji: ${emoji}`, true);
      return;
    }

    // Ukaz: /roll
    if (message.trim().toLowerCase().startsWith("/roll")) {
      const rollResult = Math.floor(Math.random() * 6) + 1;
      showAlert(`Zadet kocko: ${rollResult}`, true);
      return;
    }

    // Ukaz: /info
    if (message.trim().toLowerCase() === "/info") {
      showAlert("Klepet omogoča ukaze za administracijo, igre in obvestila.", true);
      return;
    }

    // Dodajemo sporočilo v Firestore
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
