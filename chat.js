window.onload = function () {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyACqe57kSVxPhk-254DiM5lbvHRX8xSNWk",
    authDomain: "chat-21c97.firebaseapp.com",
    databaseURL: "https://chat-21c97-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "chat-21c97",
    storageBucket: "chat-21c97.appspot.com",
    messagingSenderId: "274739720114",
    appId: "1:274739720114:web:d4856b344dd8e0dc953eab",
    measurementId: "G-QKQ8ESGSS1"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  class MEME_CHAT {
    home() {
      document.body.innerHTML = '';
      this.create_title();
      this.create_join_form();
    }

    chat() {
      this.create_title();
      this.create_chat();
    }

    create_title() {
      const titleContainer = document.createElement('div');
      titleContainer.id = 'title_container';
      const titleInner = document.createElement('div');
      titleInner.id = 'title_inner_container';

      const title = document.createElement('h1');
      title.id = 'title';
      title.textContent = 'MemeChat 2.0';

      titleInner.appendChild(title);
      titleContainer.appendChild(titleInner);
      document.body.appendChild(titleContainer);
    }

    create_join_form() {
      const parent = this;

      const joinContainer = document.createElement('div');
      joinContainer.id = 'join_container';

      const joinInner = document.createElement('div');
      joinInner.id = 'join_inner_container';

      const joinInputContainer = document.createElement('div');
      joinInputContainer.id = 'join_input_container';

      const joinInput = document.createElement('input');
      joinInput.id = 'join_input';
      joinInput.placeholder = "What's your name?";
      joinInput.maxLength = 15;

      const joinButtonContainer = document.createElement('div');
      joinButtonContainer.id = 'join_button_container';

      const joinButton = document.createElement('button');
      joinButton.id = 'join_button';
      joinButton.textContent = 'Join Chat';

      joinInput.addEventListener('keyup', () => {
        if (joinInput.value.trim().length > 0) {
          joinButton.classList.add('enabled');
          joinButton.onclick = () => {
            parent.save_name(joinInput.value.trim());
            joinContainer.remove();
            parent.chat();
          };
        } else {
          joinButton.classList.remove('enabled');
        }
      });

      joinInputContainer.appendChild(joinInput);
      joinButtonContainer.appendChild(joinButton);
      joinInner.appendChild(joinInputContainer);
      joinInner.appendChild(joinButtonContainer);
      joinContainer.appendChild(joinInner);
      document.body.appendChild(joinContainer);
    }

    save_name(name) {
      localStorage.setItem('name', name);
    }

    get_name() {
      return localStorage.getItem('name');
    }

    create_chat() {
      const parent = this;

      const chatContainer = document.createElement('div');
      chatContainer.id = 'chat_container';

      const chatInner = document.createElement('div');
      chatInner.id = 'chat_inner_container';

      const chatContent = document.createElement('div');
      chatContent.id = 'chat_content_container';

      const chatInputContainer = document.createElement('div');
      chatInputContainer.id = 'chat_input_container';

      const chatInput = document.createElement('input');
      chatInput.id = 'chat_input';
      chatInput.placeholder = `${parent.get_name()}, say something...`;
      chatInput.maxLength = 1000;

      const chatSend = document.createElement('button');
      chatSend.id = 'chat_input_send';
      chatSend.disabled = true;
      chatSend.innerHTML = '<i class="far fa-paper-plane"></i>';

      chatInput.addEventListener('keyup', () => {
        if (chatInput.value.trim().length > 0) {
          chatSend.removeAttribute('disabled');
          chatSend.classList.add('enabled');
          chatSend.onclick = () => {
            parent.send_message(chatInput.value.trim());
            chatInput.value = '';
          };
        } else {
          chatSend.setAttribute('disabled', true);
          chatSend.classList.remove('enabled');
        }
      });

      const logoutContainer = document.createElement('div');
      logoutContainer.id = 'chat_logout_container';

      const logoutButton = document.createElement('button');
      logoutButton.id = 'chat_logout';
      logoutButton.textContent = `${parent.get_name()} • Logout`;
      logoutButton.onclick = () => {
        localStorage.clear();
        parent.home();
      };

      logoutContainer.appendChild(logoutButton);
      chatInputContainer.appendChild(chatInput);
      chatInputContainer.appendChild(chatSend);
      chatInner.appendChild(chatContent);
      chatInner.appendChild(chatInputContainer);
      chatInner.appendChild(logoutContainer);
      chatContainer.appendChild(chatInner);
      document.body.appendChild(chatContainer);

      parent.refresh_chat();
    }

    send_message(message) {
      const name = this.get_name();
      if (!name || !message) return;

      db.ref('chats/').once('value', snapshot => {
        const index = snapshot.numChildren() + 1;
        db.ref('chats/message_' + index).set({
          name,
          message,
          index
        });
      });
    }

    refresh_chat() {
      const chatContent = document.getElementById('chat_content_container');
      db.ref('chats/').on('value', snapshot => {
        chatContent.innerHTML = '';
        if (!snapshot.exists()) return;

        const messages = Object.values(snapshot.val()).sort((a, b) => a.index - b.index);
        messages.forEach(msg => {
          const messageContainer = document.createElement('div');
          messageContainer.className = 'message_container';

          const messageUser = document.createElement('p');
          messageUser.className = 'message_user';
          messageUser.textContent = msg.name;

          const messageText = document.createElement('p');
          messageText.className = 'message_content';
          messageText.textContent = msg.message;

          messageContainer.appendChild(messageUser);
          messageContainer.appendChild(messageText);
          chatContent.appendChild(messageContainer);
        });
        chatContent.scrollTop = chatContent.scrollHeight;
      });
    }
  }

  const app = new MEME_CHAT();
  if (app.get_name()) {
    app.chat();
  } else {
    app.home();
  }
};
