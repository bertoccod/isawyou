import { esportaCSV, getDataHome} from './dbops.js';
import { getProfilePhoto } from './tmdb.js';
  
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
        await esportaCSV();
        alert("CSV scaricato con successo!");
      } catch (err) {
        alert("Errore durante il download. ",err);
      }
    });
  }
});
//CARICO ELEMENTI DEL DOM
const tot = document.getElementById("totalMovie");
const resultsList = document.getElementById("results");
const container = document.getElementById("accadde-oggi-container");
const list = document.getElementById("accadde-oggi-list");
const ulAttori = document.getElementById("TopAttore");
const ulRegisti = document.getElementById("TopRegista");
const ulTop = document.getElementById("5Stars");
const ulFlop = document.getElementById("1Star");

//ESEGUO LA QUERY
let querySnapshot = await getDataHome();


// NUMERO TOTALE DI FILM IN DB
const totale = querySnapshot.size;
tot.textContent = `Hai registrato ${totale} film`;

let last =[];
let ricordi=[];
let attoriMap = new Map();
let registiMap = new Map();
let topFilm=[];
let flopFilm=[];

//CICLO SNAPSHOT PER ESTRARRE DATI
let count = 0;
querySnapshot.forEach((doc) => {
  const data = doc.data();
  const [dbId, dbTipo] = doc.id.split("_");
  //ULTIMI VISTI
  if (count <= 5){
    last.push({
        id: dbId,
        tipo: dbTipo,
        titolo: data.title,
        poster: data.poster_path,
        voto: data.voto,
        keywords: data.keywords,
    });
  }
  count++;
  //ACCADDE OGGI
  const oggi = new Date();
  const giornoOggi = oggi.getDate();
  const meseOggi = oggi.getMonth();
  const annoOggi = oggi.getFullYear();
  if (data.data_inizio && data.data_fine) {
    const inizio = data.data_inizio.toDate();
    const fine = data.data_fine.toDate();
    if (inizio.getFullYear() < annoOggi){
      const inizioConfronto = new Date(annoOggi, inizio.getMonth(), inizio.getDate());
      const fineConfronto = new Date(annoOggi, fine.getMonth(), fine.getDate());
      if (oggi >= inizioConfronto && oggi <= fineConfronto) {
        ricordi.push({
          id: dbId,
          tipo: dbTipo,
          titolo: data.title,
          poster: data.poster_path,
          anno: fine.getFullYear()
        });
      }
    }
  }
  //ATTORI E REGISTI
  const attori = doc.data().attori || [];
  attori.forEach(({ name, id, numVisto }) => {
    const nVisto =(typeof numVisto=== 'number' && numVisto>0) ? numVisto: 1;
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
  const registi = doc.data().registi || [];
  registi.forEach(({ name, id }) => {
    if (name && id) {
      registiMap.set(id, registiMap.has(id)
        ? { ...registiMap.get(id), count: registiMap.get(id).count + 1 }
        : { nome: name, id, count: 1 });
    }
  });
  const filmObj = {
      id: dbId,
      tipo: dbTipo,
      titolo: data.title,
      poster: data.poster_path,
      voto: data.voto,
      keywords: data.keywords,
      type: data.tipo
  };

  if (data.voto === 5) {
      topFilm.push(filmObj);
  } else if (data.voto === 1) {
      flopFilm.push(filmObj);
  }
});

//RENDER ULTIMI FILM VISTI  
resultsList.innerHTML = "";
last.forEach(film=>{
  const li = document.createElement("li");
  li.setAttribute("data-keywords", film.keywords);
  li.setAttribute("data-stars", String(film.voto));
  li.setAttribute("data-type", film.tipo);
  const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
  const imgSrc = film.poster ? `${IMAGE_BASE}${film.poster}` : "https://via.placeholder.com/300x450?text=No+Image";  
  const linkHref = `scheda_film.html?id=${film.id}&tipo=${film.tipo}`;
  li.innerHTML = `
    <a href="${linkHref}" style="text-decoration: none; color: inherit;">
      <img src="${imgSrc}" alt="${film.titolo}"><br>
      <span>${film.titolo}</span>
    </a>`;
  resultsList.appendChild(li);
});

//RENDER ACCADDE OGGI
if (ricordi.length>0){
  container.style.display = "block";
  list.innerHTML="";
  ricordi.forEach(film=>{
    const li = document.createElement("li");
    const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
    const imgSrc = film.poster ? `${IMAGE_BASE}${film.poster}` : "https://via.placeholder.com/300x450?text=No+Image";
    li.innerHTML = `
      <a href="scheda_film.html?id=${film.id}&tipo=${film.tipo}" style="text-decoration: none; color: inherit;">
        <div style="position: relative;"> 
          <img src="${imgSrc}" alt="${film.titolo}">
          <div class="memory-label">Nel ${film.anno}</div>
        </div>
        <span>${film.titolo}</span>
      </a>`;
  list.appendChild(li);
  });
} else {
  container.style.display = "none"; // Nascondi se non ci sono ricordi oggi
}
//RENDER TOP ATTORI
const topAttori = Array.from(attoriMap.values())
  .sort((a, b) => b.count - a.count)
const sliceAtt = topAttori.slice(0,6);
for (const persona of sliceAtt) {
  const img = document.createElement("img");
  img.alt = persona.nome;
  try {
    img.src = await getProfilePhoto(persona.id);
  } catch {
    img.src = "./assets/noPhoto.png";
  }
  const span = document.createElement("span");
  span.innerHTML = `${persona.nome}<br>${persona.count.toFixed(1)} punti`;

  const link = document.createElement("a");
  link.style="text-decoration: none; color: inherit";
  link.href = `scheda_persona.html?id=${persona.id}`;
  link.appendChild(img);
  link.appendChild(span);
  const li = document.createElement("li");
  li.appendChild(link);
  ulAttori.appendChild(li);
}
//RENDER TOP REGISTI
const topRegisti = Array.from(registiMap.values())
  .sort((a, b) => b.count - a.count)
const sliceReg = topRegisti.slice(0,6);
for (const persona of sliceReg) {
  const img = document.createElement("img");
  img.alt = persona.nome;
  try {
    img.src = await getProfilePhoto(persona.id);
  } catch {
    img.src = "./assets/noPhoto.png";
  }
  const span = document.createElement("span");
  span.innerHTML = `${persona.nome}<br>${persona.count} punti`;

  const link = document.createElement("a");
  link.style="text-decoration: none; color: inherit";
  link.href = `scheda_persona.html?id=${persona.id}`;
  link.appendChild(img);
  link.appendChild(span);
  const li = document.createElement("li");
  li.appendChild(link);
  ulRegisti.appendChild(li);
}

//RENDER TOP FILM
ulTop.innerHTML = "";
topFilm.forEach(film=>{
  const li = document.createElement("li");
  const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
  const imgSrc = film.poster ? `${IMAGE_BASE}${film.poster}` : "https://via.placeholder.com/300x450?text=No+Image";  
  const linkHref = `scheda_film.html?id=${film.id}&tipo=${film.tipo}`;
  li.innerHTML = `
    <a href="${linkHref}" style="text-decoration: none; color: inherit;">
      <img src="${imgSrc}" alt="${film.titolo}"><br>
      <span>${film.titolo}</span>
    </a>`;
  ulTop.appendChild(li);
});

//RENDER FLOP FILM
ulFlop.innerHTML = "";
flopFilm.forEach(film=>{
  const li = document.createElement("li");
  const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
  const imgSrc = film.poster ? `${IMAGE_BASE}${film.poster}` : "https://via.placeholder.com/300x450?text=No+Image";  
  const linkHref = `scheda_film.html?id=${film.id}&tipo=${film.tipo}`;
  li.innerHTML = `
    <a href="${linkHref}" style="text-decoration: none; color: inherit;">
      <img src="${imgSrc}" alt="${film.titolo}"><br>
      <span>${film.titolo}</span>
    </a>`;
  ulFlop.appendChild(li);
});