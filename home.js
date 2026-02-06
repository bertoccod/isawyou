import { esportaCSV, getDataHome} from './dbops.js';
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

const tot = document.getElementById("totalMovie");
let querySnapshot = await getDataHome();
// NUMERO TOTALE DI FILM IN DB
const totale = querySnapshot.size;
tot.textContent = `Hai registrato ${totale} film`;
//ULTIMI FILM VISTI
const resultsList = document.getElementById("results");
resultsList.innerHTML = "";
let count = 0;
querySnapshot.forEach((doc) => {
  if (count >= 5) return;
    count++;
  const data = doc.data();
  const li = document.createElement("li");
  li.setAttribute("data-keywords", data.keywords);
  li.setAttribute("data-stars", String(data.voto));
  li.setAttribute("data-type", data.tipo); // tipo è "movie" o "tv"

  const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
  const imgSrc = data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";
  const title = data.title;
  const numero = doc.id.split("_")[0];
  const tipo = doc.id.split("_")[1];
  const linkHref = `scheda_film.html?id=${numero}&tipo=${tipo}`;
  li.innerHTML = `
  <a href="${linkHref}" style="text-decoration: none; color: inherit;">
    <img src="${imgSrc}" alt="${title}"><br>
    <span>${title}</span>
  </a>`;
  resultsList.appendChild(li);
});
//TOP PERSONE IN DB
const ulAttori = document.getElementById("TopAttore");
const ulRegisti = document.getElementById("TopRegista");
const top = await getTopPersone(querySnapshot, 6, 6);
const att = top.topAttori;
const reg = top.topRegisti;
const sliceAtt = att.slice(0,6);
renderTopPersone(sliceAtt, ulAttori);
renderTopPersone(reg, ulRegisti)
//SCRIVO ATTORI IN JSON BROWSER PER ESPANSIONE
const attoriFiltrati = att.filter(attore => attore.count > 1);
const attoriJSON = JSON.stringify(attoriFiltrati);
localStorage.setItem('tuttiGliAttori',attoriJSON);
//TOP E FLOP FILMS
const ulTop = document.getElementById("5Stars");
const ulFlop = document.getElementById("1Star");
const topflop = await getTopFlop(querySnapshot);
const topFilm = topflop.topFilms;
const flopFilm = topflop.flopFilms;
renderTopFlop(topFilm, ulTop);
renderTopFlop(flopFilm, ulFlop);


async function getTopPersone(querySnapshot, numAttori, numRegisti) {
  const attoriMap = new Map();
  const registiMap = new Map();

  querySnapshot.forEach(doc => {
    const attori = doc.data().attori || [];
    const registi = doc.data().registi || [];
/*
    attori.forEach(({ name, id, numVisto }) => {
      if (name && id) {
        attoriMap.set(id, attoriMap.has(id)
          ? { ...attoriMap.get(id), count: attoriMap.get(id).count + 1 }
          : { nome: name, id, count: 1 });
      }
    });
    */
   attori.forEach(({ name, id, numVisto }) => {
    const nVisto =(typeof numVisto=== 'number' && numVisto>0) ? numVisto: 1;
    //const valore = (nVisto === 1) ? 1 : Math.log(nVisto+1) / Math.log(10);
    const valore = Math.log(nVisto+1) / Math.log(10);
  if (name && id) {
    if (attoriMap.has(id)){
      const current = attoriMap.get(id);
      attoriMap.set(id, {
        ...current,
        count: current.count + valore
      });
    } else {
      attoriMap.set(id,{
        nome: name,
        id: id,
        count: valore
      });
    }
  }
});


    registi.forEach(({ name, id }) => {
      if (name && id) {
        registiMap.set(id, registiMap.has(id)
          ? { ...registiMap.get(id), count: registiMap.get(id).count + 1 }
          : { nome: name, id, count: 1 });
      }
    });
  });

  const topAttori = Array.from(attoriMap.values())
    .sort((a, b) => b.count - a.count)
    //.slice(0, numAttori);

  const topRegisti = Array.from(registiMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, numRegisti);
  const top = {topAttori, topRegisti};
  return top;
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
      span.innerHTML = `${persona.nome}<br>${persona.count.toFixed(2)} punti`;

      const link = document.createElement("a");
      link.style="text-decoration: none; color: inherit";
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
    link.style="text-decoration: none; color: inherit";
    link.href = `scheda_film.html?id=${film.numero}&tipo=${film.tipo}`;

    link.appendChild(img);
    link.appendChild(span);

    const li = document.createElement("li");

    li.appendChild(link);

    ulElement.appendChild(li);
  }
}

async function getTopFlop(querySnapshot) {
  const topFilms = [];
  const flopFilms = [];
  querySnapshot.forEach(doc => {
    const data = doc.data();
    const voto = data.voto;
    const titolo = data.title;
    const tipo = data.tipo;
    const numero = doc.id.split("_")[0];

    if (voto === 5) {
      topFilms.push({ numero, titolo, tipo });
    } else if (voto === 1) {
      flopFilms.push({ numero, titolo, tipo });
    }
  });
  const top = {topFilms, flopFilms};
  return top;
}