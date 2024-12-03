// Funkcija za nalaganje sporočil iz LocalStorage
function loadMessages() {
    const chatBox = document.getElementById('chat-box');
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];

    // Za vsako sporočilo iz LocalStorage ga dodamo v chat
    storedMessages.forEach(messageText => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'sent');
        messageElement.textContent = messageText;
        chatBox.appendChild(messageElement);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}

// Funkcija za shranjevanje sporočil v LocalStorage
function saveMessage(messageText) {
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    storedMessages.push(messageText);
    localStorage.setItem('chatMessages', JSON.stringify(storedMessages));
}

// Funkcija za pošiljanje sporočila
function sendMessage() {
    const messageInput = document.getElementById('message');
    const chatBox = document.getElementById('chat-box');
    const messageText = messageInput.value.trim();

    if (messageText !== '') {
        // Ustvari element za sporočilo
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'sent');
        messageElement.textContent = messageText;

        // Dodaj sporočilo v chat
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Shrani sporočilo v LocalStorage
        saveMessage(messageText);

        // Pošlji sporočilo in počisti vnosno polje
        messageInput.value = '';
    }
}

// Ob nalaganju strani naloži vsa shranjena sporočila
window.onload = function() {
    loadMessages();
};
