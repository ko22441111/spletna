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
let isChatPaused = false; // Spremenljivka za preverjanje, ali je chat ustavljen

async function sendMessage(username, message) {
  try {
    if (!username.trim() || !message.trim()) {
      throw new Error("Obe polji sta obvezni!");
    }

    if (mutedUsers.includes(username)) {
      throw new Error("Tvoj račun je utišan.");
    }

    if (bannedUsers.includes(username)) {
      throw new Error("Tvoj račun je banan.");
    }

    // Preverjanje za ukaz /clearchat (dovoli samo lastniku)
    if (message.trim().toLowerCase() === "/clearchat" && username === "Matej22441") {
      await clearChat();
      return;
    }

    // Preverjanje za ukaz /pausechat (dovoli samo lastniku)
    if (message.trim().toLowerCase() === "/pausechat" && username === "Matej22441") {
      isChatPaused = !isChatPaused;  // Preklopi stanje chat-a
      showAlert(isChatPaused ? "Chat je zdaj ustavljen." : "Chat je spet omogočen.", true);
      return;
    }

    // Preverjanje za ukaz /help (prikaže seznam ukazov)
    if (message.trim().toLowerCase() === "/help") {
      showAlert("Dostopni ukazi: /clearchat (za izbris sporočil), /pausechat (za začasno zaustavitev chat-a), /help (ta seznam).", true);
      return;
    }

    // Če je chat ustavljen, ne pošlji sporočila
    if (isChatPaused) {
      showAlert("Chat je trenutno ustavljen. Počakajte, da ga nekdo znova omogoči.", false);
      return;
    }

    // Preverjanje, ali sporočilo vsebuje URL slike
    const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|bmp|tiff))/i;
    const imageMatch = message.match(imageRegex);
    let imageUrl = null;

    if (imageMatch) {
      imageUrl = imageMatch[0]; // Izvleči URL slike
      message = message.replace(imageUrl, ""); // Odstrani URL iz besedila sporočila
    }

    await addDoc(collection(db, "messages"), {
      username,
      message,
      imageUrl,  // Dodaj URL slike v Firestore
      timestamp: new Date()
    });

    document.getElementById("message").value = "";
    showAlert("Sporočilo je bilo poslano!", true);
  } catch (error) {
    console.error("Error sending message:", error.message);
    showAlert(error.message, false);
  }
}

async function listenToMessages() {
  const chatWindow = document.getElementById("chat-window");
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    chatWindow.innerHTML = "";
    snapshot.forEach((doc) => {
      const { username, message, timestamp, imageUrl } = doc.data();
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
      } else {
        usernameSpan.classList.add("member");
        usernameSpan.textContent = username;
      }

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("message-text");
      messageSpan.textContent = message;

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
  });
}

function showAlert(message, isSuccess) {
  const alert = document.createElement("div");
  alert.classList.add("alert");
  if (isSuccess) {
    alert.classList.add("success");
  }
  alert.textContent = message;
  document.body.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 3000);
}

// Funkcija za brisanje vseh sporočil za Matej22441
async function clearChat() {
  try {
    const messagesQuerySnapshot = await getDocs(collection(db, "messages"));
    messagesQuerySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
    showAlert("Sporočila so bila izbrisana!", true);
  } catch (error) {
    console.error("Error clearing chat:", error);
    showAlert("Napaka pri brisanju sporočil.", false);
  }
}

// Mode Switch
document.getElementById("mode-switch").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");
});

// Send message on button click
document.getElementById("send-button").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const message = document.getElementById("message").value;
  sendMessage(username, message);
});

// Listen for new messages
listenToMessages();
