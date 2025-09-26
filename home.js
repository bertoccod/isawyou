import { getMyCollection, getTopPersone, getTotalMovie, getTopFlop, stats, esportaCSV} from './dbops.js';
import { getProfilePhoto, getMoviePoster } from './tmdb.js';
  
const firebaseConfig = {
  apiKey: "AIzaSyCdDwbIINAMKfNqDEbCYGIZSq_Q1k8VuGM",
  authDomain: "isawyou-1b08b.firebaseapp.com",
  projectId: "isawyou-1b08b",
  storageBucket: "isawyou-1b08b.firebasestorage.app",
  messagingSenderId: "522349831222",
  appId: "1:522349831222:web:d63ae730ba603559c5a497"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
console.log("auth:", auth);

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scarica-csv");
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        console.log("Download CSV in corso...");
        await esportaCSV();
        alert("CSV scaricato con successo!");
      } catch (err) {
        console.error("Errore nel download:", err);
        alert("Errore durante il download.");
      }
    });
  }
});


//INTESTAZIONE CON NUMERO FILM
const tot = document.getElementById("totalMovie");
tot.textContent = `Hai registrato ${await getTotalMovie()} film`;

//ULTIMI FILM VISTI
getMyCollection(5);

//TOP PERSONE IN DB
const ulAttori = document.getElementById("TopAttore");
const ulRegisti = document.getElementById("TopRegista");
const top = await getTopPersone(6, 6);
const att = top.topAttori;
const reg = top.topRegisti;

renderTopPersone(att, ulAttori);
renderTopPersone(reg, ulRegisti)

//TOP E FLOP FILMS
const ulTop = document.getElementById("5Stars");
const ulFlop = document.getElementById("1Star");
const topflop = await getTopFlop();
const topFilm = topflop.topFilms;
const flopFilm = topflop.flopFilms;
renderTopFlop(topFilm, ulTop);
renderTopFlop(flopFilm, ulFlop);

//STATISTICHE
statistiche();

async function statistiche(){
  try{
    const statistiche = await stats();
    const stat = document.getElementById("statistiche"); 

      if (statistiche && stat) {
        stat.innerHTML = `
          Numero Film in collezione: ${statistiche.numMovie}<br>
          Numero Serie TV in collezione: ${statistiche.numTv}<br>
          Visti quest'anno: ${statistiche.vistiAnno}<br>
          Distribuzione voti:<br>
            ★☆☆☆☆: ${statistiche.numStar[1]}<br>
            ★★☆☆☆: ${statistiche.numStar[2]}<br>
            ★★★☆☆: ${statistiche.numStar[3]}<br>
            ★★★★☆: ${statistiche.numStar[4]}<br>
            ★★★★★: ${statistiche.numStar[5]}
        `;
      } else {
        stat.textContent = "Errore nel caricamento delle statistiche.";
      }
  }
  catch (error){}
}

async function renderTopPersone(lista, ulElement) {
  for (const persona of lista) {
    const img = document.createElement("img");
    img.alt = persona.nome;

    try {
      img.src = await getProfilePhoto(persona.id);
    } catch {
      img.src = "./assets/noPhoto.png";
    }

    const span = document.createElement("span");
    span.innerHTML = `${persona.nome}<br>${persona.count} titoli`;

    const link = document.createElement("a");
    link.href = `scheda_persona.html?id=${persona.id}`;

    link.appendChild(img);
    link.appendChild(span);

    const li = document.createElement("li");

    li.appendChild(link);

    ulElement.appendChild(li);
  }
}

async function renderTopFlop(lista, ulElement) {
  for (const film of lista) {
    const img = document.createElement("img");
    img.alt = film.titolo;
    
    try {
      img.src = await getMoviePoster(film.numero, film.tipo);
    } catch {
      img.src = "placeholder.jpg";
    }

    const span = document.createElement("span");
    span.classList.add("titolo-film");
    span.textContent = `${film.titolo}`;

    const link = document.createElement("a");
    link.href = `scheda_film.html?id=${film.numero}&tipo=${film.tipo}`;

    link.appendChild(img);
    link.appendChild(span);

    const li = document.createElement("li");

    li.appendChild(link);

    ulElement.appendChild(li);
  }
}

