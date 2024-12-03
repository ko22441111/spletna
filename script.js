document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const loginUsername = document.getElementById('loginUsername').value;
    const loginPassword = document.getElementById('loginPassword').value;

    // Pridobi podatke iz localStorage
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');

    // Preveri, če se uporabniško ime in geslo ujemata
    if (loginUsername === storedUsername && loginPassword === storedPassword) {
        alert('Vpis uspešen!');
        window.location.href = 'zacetna.html'; // Preusmeri na začetno stran
    } else {
        alert('Uporabniško ime ali geslo ni pravilno!');
    }
});
