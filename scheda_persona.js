import { openPersona, openScheda } from './tmdb.js';
import { isSawed, addMovie, delMovie } from './dbops.js';

const firebaseConfig = {
  apiKey: "AIzaSyCdDwbIINAMKfNqDEbCYGIZSq_Q1k8VuGM",
  authDomain: "isawyou-1b08b.firebaseapp.com",
  projectId: "isawyou-1b08b",
  storageBucket: "isawyou-1b08b.firebasestorage.app",
  messagingSenderId: "522349831222",
  appId: "1:522349831222:web:d63ae730ba603559c5a497"
};

const API_KEY = "0c09790a4bd5d1e5c478b07ee91113d3";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
console.log("auth:", auth);

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const myId = urlParams.get('id');
  const datiTot = await openPersona(myId);
  //SCHEDA PERSONA  
  document.getElementById("nome").textContent = datiTot.name;
  document.getElementById("profilo").src = datiTot.profile_path
    ? `https://image.tmdb.org/t/p/w300${datiTot.profile_path}`
    : "./assets/noPhoto.png";

  const data = new Date(datiTot.birthday);
  const giorno = data.getDate();
  const mese = data.getMonth()+1;
  const anno = data.getFullYear();
  if (datiTot.birthday) document.getElementById("natoil").textContent=`Nato il ${giorno}/${mese}/${anno}`;
  if (datiTot.place_of_birth) document.getElementById("natoa").textContent=`a ${datiTot.place_of_birth}`;
  if (datiTot.deathday){
    const datamorte = new Date(datiTot.deathday);
    const dayDeath = datamorte.getDate();
    const meseDeath = datamorte.getMonth()+1;
    const annoDeath = datamorte.getFullYear();
    document.getElementById("mortoil").textContent=`Deceduto il ${dayDeath}/${meseDeath}/${annoDeath}`;
    const mortoa = datamorte.getFullYear()-data.getFullYear();
    document.getElementById("eta").textContent=`Morto a ${mortoa} anni`;
  } else {
    const oggi = new Date();
    const yy = oggi.getFullYear();
    const anni = yy-anno;
    document.getElementById("eta").textContent=`Anni ${anni}`;
  }
  const immagini = document.getElementById("images");
  const filmVistiList = document.getElementById("visti");
  immagini.innerHTML=`<a href="https://www.google.com/search?q=${encodeURIComponent(datiTot.name + ' actor')}&tbm=isch">📷 Altre immagini</a>`;
  let counterVisti=0;
  //SEZIONE FILM RECITATI
  if (Array.isArray(datiTot.movie_credits.cast)) {
    //IN FILTEREDFILMNS FILTRO I RILEVANTI, LI ORDINO PER POPOLARITA E AGGIUNGO CON MAP SE E' VISTO
    const filteredFilms = datiTot.movie_credits.cast
      .filter(film =>
        film.poster_path &&
        film.character &&
        !film.character.toLowerCase().includes("self") &&
        !film.character.toLowerCase().includes("cameo") &&
        !film.character.toLowerCase().includes("voice") &&
        !film.character.toLowerCase().includes("uncredited") &&
        !film.genre_ids?.includes(99) &&
        !film.genre_ids?.includes(10770)
      )
      .sort((a, b) => b.popularity - a.popularity)
      .map(async (film) => {
        const visto = await isSawed(film.id + "_movie");
        return { ...film, isVisto: visto };
    });
    const finalFilms = await Promise.all(filteredFilms);
    //AGGANCIO GLI ELEMENTI DEL DOM
    const filmRecitatiTable = document.getElementById("filmRecitati");
    //CICLIAMO TUTTI I FILM IN CUI RECITA
    if (finalFilms.length>0){
      document.getElementById("numeri").innerHTML=`Film recitati all'attivo: ${finalFilms.length}<br>`;
      const filmHeaderRow = document.createElement("tr");
      filmHeaderRow.innerHTML = `
        <td><span></span></td>
        <td><span class="sezione-titolo">FILM</span></td>
      `;
      filmRecitatiTable.appendChild(filmHeaderRow);  
    }
    for (const film of finalFilms) {
      //LI INSERISCO TUTTI NELLA TABLE
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      const btn = createFastSaveButton(film.id, "movie", film.isVisto);
      td.appendChild(btn);
      const td2 = document.createElement("td");
      const year = film.release_date ? film.release_date.slice(0, 4) : "";      
      td2.innerHTML = `
        <span class="anno">${year}</span><br>
        <span class="titolo"><a href="scheda_film.html?id=${film.id}&tipo=movie">${film.title || "(Titolo mancante)"}</a></span><br>
        <span class="personaggio">${film.character}</span>
      `;
      tr.appendChild(td);
      tr.appendChild(td2);
      filmRecitatiTable.appendChild(tr);
      //I VISTI LI METTO NELLO SCROLL
      const li = document.createElement("li");      
    if (film.isVisto){
        const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
        const imgSrc = film.poster_path ? `${IMAGE_BASE}${film.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";  
        const linkHref = `scheda_film.html?id=${film.id}&tipo=movie`;
        li.innerHTML = `
          <a href="${linkHref}" style="text-decoration: none; color: inherit;">
            <img src="${imgSrc}" alt="${film.title}"><br>
            <span>${film.title}</span>
          </a>`;
        filmVistiList.appendChild(li);
        counterVisti++;
      } 
    }  
  }   
  //SEZIONE SERIE TV RECITATE
  if (Array.isArray(datiTot.tv_credits.cast)) {
    //IN FILTEREDTV FILTRO I RILEVANTI, LI ORDINO PER POPOLARITA E AGGIUNGO CON MAP SE E' VISTO
    const filteredTv = datiTot.tv_credits.cast
      .filter(tv =>
        tv.poster_path &&
        tv.character &&
        !tv.character.toLowerCase().includes("self") &&
        !tv.character.toLowerCase().includes("cameo") &&
        !tv.character.toLowerCase().includes("voice") &&
        !tv.character.toLowerCase().includes("uncredited") &&
        !tv.genre_ids?.includes(99) &&
        !tv.genre_ids?.includes(10770)
      )
      .sort((a, b) => b.popularity - a.popularity)
      .map(async (tv) => {
        const visto = await isSawed(tv.id + "_tv");
        return { ...tv, isVisto: visto };
    });
    const finalTv = await Promise.all(filteredTv);
    //AGGANCIO GLI ELEMENTI DEL DOM
    const tvRecitatiTable = document.getElementById("serieRecitate");
    //CICLIAMO TUTTE LE SERIE IN CUI RECITA
    if (finalTv.length>0){
      document.getElementById("numeri").innerHTML+=`Serie recitate all'attivo: ${finalTv.length}<br>`;
      const tvHeaderRow = document.createElement("tr");
      tvHeaderRow.innerHTML = `
        <td><span>-</span></td>
        <td><span class="sezione-titolo">SERIE TV</span></td>
      `;
      tvRecitatiTable.appendChild(tvHeaderRow);  
    }
    for (const tv of finalTv) {
      //LI INSERISCO TUTTI NELLA TABLE
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      const btn = createFastSaveButton(tv.id, "tv", tv.isVisto);
      td.appendChild(btn);
      const td2 = document.createElement("td");
      const year = tv.first_air_date ? tv.first_air_date.slice(0, 4) : "";      
      td2.innerHTML = `
        <span class="anno">${year}</span><br>
        <span class="titolo"><a href="scheda_film.html?id=${tv.id}&tipo=tv">${tv.name || "(Titolo mancante)"}</a></span><br>
        <span class="personaggio">${tv.character} ${tv.episode_count ? ` - ${tv.episode_count} episodi</span>` : ""}`;
      tr.appendChild(td)
      tr.appendChild(td2);
      tvRecitatiTable.appendChild(tr);
      //I VISTI LI METTO NELLO SCROLL
      const li = document.createElement("li");      
      if (tv.isVisto){
          const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
          const imgSrc = tv.poster_path ? `${IMAGE_BASE}${tv.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";  
          const linkHref = `scheda_film.html?id=${tv.id}&tipo=tv`;
          li.innerHTML = `
            <a href="${linkHref}" style="text-decoration: none; color: inherit;">
              <img src="${imgSrc}" alt="${tv.name}"><br>
              <span>${tv.name}</span>
            </a>`;
          filmVistiList.appendChild(li);
          counterVisti++;
      } 
    }  
  }  

  //SEZIONE FILM DIRETTI
  if (Array.isArray(datiTot.movie_credits.crew)) {
    //IN FILTEREDDIR FILTRO I RILEVANTI, LI ORDINO PER POPOLARITA E AGGIUNGO CON MAP SE E' VISTO
    const filteredDir = datiTot.movie_credits.crew
      .filter(film =>
        film.poster_path &&
        film.job.toLowerCase() === "director" &&
        !film.genre_ids?.includes(99) &&
        !film.genre_ids?.includes(10770)
        )
      .sort((a, b) => b.popularity - a.popularity)
      .map(async (film) => {
        const visto = await isSawed(film.id + "_movie");
        return { ...film, isVisto: visto };
    });
    const finalDir = await Promise.all(filteredDir);
    //AGGANCIO GLI ELEMENTI DEL DOM
    const filmDirettiTable = document.getElementById("filmDiretti");
    //CICLIAMO TUTTE I FILM CHE HA DIRETTO
    if (finalDir.length>0){
      document.getElementById("numeri").innerHTML+=`Film diretti : ${finalDir.length}<br>`;
      const dirHeaderRow = document.createElement("tr");
      dirHeaderRow.innerHTML = `
        <td><span></span></td>
        <td><span class="sezione-titolo">REGIA</span></td>
      `;
      filmDirettiTable.appendChild(dirHeaderRow);  
    }
    for (const film of finalDir) {
      //LI INSERISCO TUTTI NELLA TABLE
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      const btn = createFastSaveButton(film.id, "movie", film.isVisto);
      td.appendChild(btn);
      const td2 = document.createElement("td");
      const year = film.release_date ? film.release_date.slice(0, 4) : "";      
      td2.innerHTML = `
        <span class="anno">${year}</span><br>
        <span class="titolo"><a href="scheda_film.html?id=${film.id}&tipo=movie">${film.title || "(Titolo mancante)"}</a></span><br>
        <span class="ruolo">${film.job}</span>`;
      tr.appendChild(td);
      tr.appendChild(td2);
      filmDirettiTable.appendChild(tr);
      //I VISTI LI METTO NELLO SCROLL
      const li = document.createElement("li");      
      if (film.isVisto){
          const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
          const imgSrc = film.poster_path ? `${IMAGE_BASE}${film.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";  
          const linkHref = `scheda_film.html?id=${film.id}&tipo=movie`;
          li.innerHTML = `
            <a href="${linkHref}" style="text-decoration: none; color: inherit;">
              <img src="${imgSrc}" alt="${film.title}"><br>
              <span>${film.title}</span>
            </a>`;
          filmVistiList.appendChild(li);
          counterVisti++;
      } 
    }  
  }
  //SEZIONE SERIE TV CREATE
  if (Array.isArray(datiTot.tv_credits.crew)) {
    //IN FILTEREDTV FILTRO I RILEVANTI, LI ORDINO PER POPOLARITA E AGGIUNGO CON MAP SE E' VISTO
    const filteredCreaTv = datiTot.tv_credits.crew
      .filter(tv =>
        tv.poster_path &&
        tv.job.toLowerCase() === "creator" &&
        !tv.genre_ids?.includes(99) &&
        !tv.genre_ids?.includes(10770)
      )
      .sort((a, b) => b.popularity - a.popularity)
      .map(async (tv) => {
        const visto = await isSawed(tv.id + "_tv");
        return { ...tv, isVisto: visto };
    });
    const finalCreaTv = await Promise.all(filteredCreaTv);
    //AGGANCIO GLI ELEMENTI DEL DOM
    const tvCreatiTable = document.getElementById("serieDirette");
    //CICLIAMO TUTTE LE SERIE IN CUI RECITA
    if (finalCreaTv.length>0){
      document.getElementById("numeri").innerHTML+=`Serie create : ${finalCreaTv.length}`;
      const tvHeaderRow = document.createElement("tr");
      tvHeaderRow.innerHTML = `
        <td><span></span></td>
        <td><span class="sezione-titolo">CREATORE</span></td>
      `;
      tvCreatiTable.appendChild(tvHeaderRow);  
    }
    for (const tv of finalCreaTv) {
      //LI INSERISCO TUTTI NELLA TABLE
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      const btn = createFastSaveButton(tv.id, "tv", tv.isVisto);
      td.appendChild(btn);
      const td2 = document.createElement("td");
      const year = tv.first_air_date ? tv.first_air_date.slice(0, 4) : "";      
      td2.innerHTML = `
        <span class="anno">${year}</span><br>
        <span class="titolo"><a href="scheda_film.html?id=${tv.id}&tipo=tv">${tv.name || "(Titolo mancante)"}</a></span><br>
        <span class="ruolo">${tv.job}</span>`;
      tr.appendChild(td);
      tr.appendChild(td2);
      tvCreatiTable.appendChild(tr);
      //I VISTI LI METTO NELLO SCROLL
      const li = document.createElement("li");      
      if (tv.isVisto){
          const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
          const imgSrc = tv.poster_path ? `${IMAGE_BASE}${tv.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";  
          const linkHref = `scheda_film.html?id=${tv.id}&tipo=tv`;
          li.innerHTML = `
            <a href="${linkHref}" style="text-decoration: none; color: inherit;">
              <img src="${imgSrc}" alt="${tv.name}"><br>
              <span>${tv.name}</span>
            </a>`;
          filmVistiList.appendChild(li);
          counterVisti++;
      } 
    }  
  }  
  if (counterVisti<1){
    document.getElementById("vistiSection").style.display="none";
  }
});

function createFastSaveButton( id, tipo, visto) {
  const my_id = id+"_"+tipo;
  const button = document.createElement("button");
  button.classList.add("fast-save");
  button.style.fontSize = "14px";
  button.style.cursor = "pointer";

  // inizializza stato (color/classe)
  if (visto) button.classList.add("saved");

  button.addEventListener("click", async () => {
    try {
      if (!visto) {
        await fastInsert(id, tipo);           // id: numeric TMDB id, tipo: "movie"|"tv"
        button.classList.add("saved");
      } else {
        await delMovie(my_id);                // my_id: constructed fb id (es. "123_movie")
        button.classList.remove("saved");
      }
    } catch (err) {
      console.error("Errore fast-save:", err);
    }
  });
  return button;
}
 

async function fastInsert(my_id, tipo) {
  try {
    const dati = await openScheda(my_id, tipo);

    const registi = Array.isArray(dati.registi) ? dati.registi : [];
    const attoriPrincipali = Array.isArray(dati.attoriPrincipali) ? dati.attoriPrincipali : [];
    const data = typeof dati.data === "object" && dati.data !== null ? dati.data : {};

    const fb_id = my_id + "_" + tipo;

    await addMovie(fb_id, data, registi, attoriPrincipali, "", "", tipo, 0,"");
    console.log("Film inserito:", fb_id);
  } catch (err) {
    console.error("Errore durante l'aggiunta del film a Firestore:", err);
  }
}