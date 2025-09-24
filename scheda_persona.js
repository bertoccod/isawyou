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
console.log(urlParams);
const myId = urlParams.get('id');

const datiTot = await openPersona(myId);
  
document.getElementById("nome").textContent = datiTot.name;
document.getElementById("profilo").src = datiTot.profile_path
  ? `https://image.tmdb.org/t/p/w300${datiTot.profile_path}`
  : "./assets/noPhoto.png";

const infoParts = [];

if (datiTot.birthday) infoParts.push(`Nato il: ${datiTot.birthday}`);
if (datiTot.place_of_birth) infoParts.push(`A: ${datiTot.place_of_birth}`);
if (datiTot.deathday) infoParts.push(`Deceduto: ${datiTot.deathday}`);

document.getElementById("personInfoCompact").textContent = infoParts.join(" — ");


 const tableBody = document.querySelector("#filmografia");

// 🔹 Titolo sezione: FILM
const filmHeaderRow = document.createElement("tr");
filmHeaderRow.innerHTML = `
  <td><span></span></td>
  <td><span class="sezione-titolo">FILM</span></td>
`;
tableBody.appendChild(filmHeaderRow);

// 🔍 Verifica e filtro
if (Array.isArray(datiTot.movie_credits.cast)) {
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
    .sort((a, b) => b.popularity - a.popularity);

  for (const film of filteredFilms) {
    const row = document.createElement("tr");

    // 🔘 Pulsante inserimento rapido
    const infoCell = document.createElement("td");
    const my_id = film.id + "_movie";

    const btn = createFastSaveButton({ id: film.id, tipo: "movie", my_id });
    infoCell.appendChild(btn);


    // 🎬 Dati film
    const titleCell = document.createElement("td");
    const year = film.release_date ? film.release_date.slice(0, 4) : "";

    titleCell.innerHTML = `
      <span class="anno">${year}</span>
      <span class="titolo"><a href="scheda_film.html?id=${film.id}&tipo=movie">${film.title || "(Titolo mancante)"}</a></span>
      <span class="personaggio">${film.character}</span>
    `;

    row.appendChild(infoCell);
    row.appendChild(titleCell);
    tableBody.appendChild(row);
  }
} else {
  console.warn("movie_credits.cast non è un array valido");
}

// 🔹 Titolo sezione: SERIE TV
const serieHeaderRow = document.createElement("tr");
serieHeaderRow.innerHTML = `
  <td><span></span></td>
  <td><span class="sezione-titolo">SERIE TV</span></td>
`;
tableBody.appendChild(serieHeaderRow);

// 🔍 Verifica e filtro
if (Array.isArray(datiTot.tv_credits.cast)) {
  const filteredSeries = datiTot.tv_credits.cast
    .filter(serie =>
      serie.poster_path &&
      serie.character &&
      !serie.character.toLowerCase().includes("self") &&
      !serie.character.toLowerCase().includes("cameo") &&
      !serie.character.toLowerCase().includes("voice") &&
      !serie.character.toLowerCase().includes("uncredited")
    )
    .sort((a, b) => b.popularity - a.popularity);

  for (const serie of filteredSeries) {
    const row = document.createElement("tr");

    // 🔘 Pulsante inserimento rapido
    const infoCell = document.createElement("td");
    const my_id = serie.id + "_tv";
    const btn = createFastSaveButton({ id: serie.id, tipo: "tv", my_id });
    infoCell.appendChild(btn);


    // 📺 Dati serie
    const titleCell = document.createElement("td");
    const year = serie.first_air_date ? serie.first_air_date.slice(0, 4) : "";

    titleCell.innerHTML = `
      <span class="anno">${year}</span><b
      <span class="titolo"><a href="scheda_film.html?id=${serie.id}&tipo=tv">${serie.name || "(Titolo mancante)"}</a></span>
      <span class="personaggio">${serie.character}
      ${serie.episode_count ? ` - ${serie.episode_count} episodi</span>` : ""}
    `;

    row.appendChild(infoCell);
    row.appendChild(titleCell);
    tableBody.appendChild(row);
  }
} else {
  console.warn("tv_credits.cast non è un array valido");
}

  
  // 🔹 Titolo sezione: REGISTA/CREATORE
const regiaHeaderRow = document.createElement("tr");
regiaHeaderRow.innerHTML = `
  <td><span></span></td>
  <td><span class="sezione-titolo">REGISTA / CREATORE</span></td>
`;
tableBody.appendChild(regiaHeaderRow);

// 🎬 Film diretti
if (Array.isArray(datiTot.movie_credits.crew)) {
  const filteredFilms = datiTot.movie_credits.crew
    .filter(film =>
      film.poster_path &&
      film.job.toLowerCase() === "director" &&
      !film.genre_ids?.includes(99) &&
      !film.genre_ids?.includes(10770)
    )
    .sort((a, b) => b.popularity - a.popularity);

  for (const film of filteredFilms) {
    const row = document.createElement("tr");

    // 🔘 Pulsante
    const infoCell = document.createElement("td");
    const my_id = film.id + "_movie";
    const btn = createFastSaveButton({ id: film.id, tipo: "movie", my_id });
    infoCell.appendChild(btn);


    // 📽️ Dati film
    const titleCell = document.createElement("td");
    const year = film.release_date ? film.release_date.slice(0, 4) : "";

    titleCell.innerHTML = `
      <span class="anno">${year}</span><br>
      <span class="titolo"><a href="scheda_film.html?id=${film.id}&tipo=movie">${film.title || "(Titolo mancante)"}</a></span><br>
      <span class="ruolo">${film.job}</span>
    `;

    row.appendChild(infoCell);
    row.appendChild(titleCell);
    tableBody.appendChild(row);
  }
}

// 📺 Serie TV create
if (Array.isArray(datiTot.tv_credits.crew)) {
  const filteredTv = datiTot.tv_credits.crew
    .filter(tv =>
      tv.poster_path &&
      tv.job.toLowerCase() === "creator" &&
      !tv.genre_ids?.includes(99) &&
      !tv.genre_ids?.includes(10770)
    )
    .sort((a, b) => b.popularity - a.popularity);

  for (const tv of filteredTv) {
    const row = document.createElement("tr");

    // 🔘 Pulsante
    const infoCell = document.createElement("td");
    const my_id = tv.id + "_tv";
    const btn = createFastSaveButton({ id: tv.id, tipo: "tv", my_id });
    infoCell.appendChild(btn);


    // 📺 Dati serie
    const titleCell = document.createElement("td");
    const year = tv.first_air_date ? tv.first_air_date.slice(0, 4) : "";

    titleCell.innerHTML = `
      <span class="anno">${year}</span><br>
      <span class="titolo"><a href="scheda_film.html?id=${tv.id}&tipo=tv">${tv.name || "(Titolo mancante)"}</a></span><br>
      <span class="ruolo">${tv.job}</span>
    `;

    row.appendChild(infoCell);
    row.appendChild(titleCell);
    tableBody.appendChild(row);
  }
}

});

async function fastInsert(my_id, tipo) {
  try {
    const dati = await openScheda(my_id, tipo);

    const registi = Array.isArray(dati.registi) ? dati.registi : [];
    const attoriPrincipali = Array.isArray(dati.attoriPrincipali) ? dati.attoriPrincipali : [];
    const data = typeof dati.data === "object" && dati.data !== null ? dati.data : {};

    const fb_id = my_id + "_" + tipo;

    await addMovie(fb_id, data, registi, attoriPrincipali, "", "", tipo, 0);
    console.log("Film inserito:", fb_id);
  } catch (err) {
    console.error("Errore durante l'aggiunta del film a Firestore:", err);
  }
}


function createFastSaveButton({ id, tipo, my_id }) {
  const button = document.createElement("button");
  button.classList.add("fast-save");
  button.style.fontSize = "14px";
  button.style.cursor = "pointer";

  // inizializza stato (color/classe) dal DB
  (async () => {
    try {
      const visto = await isSawed(my_id);
      if (visto) button.classList.add("saved");

    } catch (err) {
      console.warn("Errore in isSawed:", err);
    }
  })();

  // click handler unificato
  button.addEventListener("click", async () => {
    const isSaved = button.classList.contains("saved");
    try {
      if (!isSaved) {
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
