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

//Login
function login(){
  const email = document.getElementById("email").value;
  const pw = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, pw)
    .then(() => {
      window.location.href = "home.html";
    })
    .catch((error) => {
      document.getElementById("errorMessage").innerText="Login fallito. Controlla i dati";
    });;
}

//Logout
function logout(){
  auth.signOut().then(() =>{
    window.location.href = "index.html";
  });
}
