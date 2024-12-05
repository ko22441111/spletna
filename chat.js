
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyD7FDQWCbIcFwIUAKhVdY-W55zKMmBoXZE",
    authDomain: "chat-8d0b6.firebaseapp.com",
    projectId: "chat-8d0b6",
    storageBucket: "chat-8d0b6.firebasestorage.app",
    messagingSenderId: "583811724281",
    appId: "1:583811724281:web:76bda29fa436b855d18328",
    measurementId: "G-2CG8S380LS"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
