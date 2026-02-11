const firebaseConfig = {
  apiKey: "AIzaSyCdDwbIINAMKfNqDEbCYGIZSq_Q1k8VuGM",
  authDomain: "isawyou-1b08b.firebaseapp.com",
  projectId: "isawyou-1b08b",
  storageBucket: "isawyou-1b08b.firebasestorage.app",
  messagingSenderId: "522349831222",
  appId: "1:522349831222:web:d63ae730ba603559c5a497"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrato:', reg))
      .catch(err => console.error('Errore nella registrazione:', err));
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    login();
  }
});


//Login
function login(){
  const emailEl = document.getElementById("email");
  const pwEl = document.getElementById("password");
  const btn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("errorMessage");
  if (!emailEl || !pwEl) return;

  const email = emailEl.value;
  const pw = pwEl.value;

  // Feedback visivo
  const originalText = btn.innerText;
  btn.innerText = "Accesso in corso...";
  btn.disabled = true;

  auth.signInWithEmailAndPassword(email, pw)
    .then(() => {
      window.location.href = "home.html";
    })
    .catch((error) => {
      console.error("Errore:", error);
      btn.innerText = originalText;
      btn.disabled = false;
      errorEl.innerText = "Login fallito. Controlla i dati";
    });
}

//Logout
function logout(){
  auth.signOut().then(() =>{
    window.location.href = "index.html";
  });
}
