import { isSawed, addMovie, delMovie, updateMovieDates, getDates, getVoto, setVoto, getNote, updateNote } from './dbops.js';
import { openScheda, getProfilePhoto, renderTrailer } from './tmdb.js';

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

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const tipo = urlParams.get('tipo');
const fb_id = movieId+"_"+tipo; //COSTRUISCO L'ID PER FIREBASE
let movieData = "";
let registi = "";
let attoriPrincipali = "";
const link = "https://api.themoviedb.org/3/"+tipo+"/"+movieId+"?api_key="+API_KEY+"&language=it-IT&append_to_response=credits";
const datiTot = await openScheda(movieId, tipo);
movieData = datiTot.data; //DATI SUL FILM
registi = datiTot.registi; //DATI SUI REGISTI
attoriPrincipali = datiTot.attoriPrincipali; //DATI SUGLI ATTORI

//HEADER SECTION
document.getElementById("poster").src = `https://image.tmdb.org/t/p/w300${movieData.poster_path}`;
let visto = await isSawed(fb_id);
if (visto){
  const timbro = document.getElementById("bollino");
  timbro.style.display="block";
}
document.getElementById("titolo").innerText = tipo=="movie" ? movieData.title : movieData.name;
const infoParts = [];

if (tipo === "tv") {
  const firstdate = movieData.first_air_date.slice(0, 4);
  const lastdate = movieData.last_air_date.slice(0,4)
  infoParts.push(`${firstdate} - ${lastdate}`);
  const stagioni = movieData.number_of_seasons;
  const episodi = movieData.number_of_episodes;
  if (stagioni || episodi) {
    infoParts.push(`${stagioni || ''} Stag. / ${episodi || ''} Ep.`.trim());
  }
} else {
  infoParts.push(movieData.release_date.slice(0, 4));
}

if (movieData.genres && movieData.genres.length > 0) {
  const generi = movieData.genres.map(g => g.name).join(", ");
  infoParts.push(generi);
}
document.getElementById("YSG").textContent = infoParts.join(" — ");
if (movieData.production_countries?.length) {
  const paesi = movieData.production_countries.map(c => c.name).join(" — ");
  document.getElementById("nazione").textContent = paesi;
}


//OPERATION SETTINGS
let rating=0;
if (visto){
  rating = await getVoto(fb_id);
  setStarRating(rating);
  let button = document.getElementById("toggleSawed");
  button.style.background ="yellow";
  const dates = await getDates(fb_id);
  if ((dates.startDate) && (dates.endDate)){
    document.getElementById("starterDate").valueAsDate = dates.startDate;
    document.getElementById("endDate").valueAsDate = dates.endDate;
  }
  if (dates.startDate!=""){
    if (dates.startDate.getTime()==dates.endDate.getTime()){
      const singleDayCheckbox = document.getElementById("singleDay");
      singleDayCheckbox.checked = true;
      document.getElementById("endDate").style.display="none";
      const endDateLb = document.getElementById("lbEndDate");
      endDateLb.style.display = "none";
    }
  }
  let nota = document.getElementById("noteText");
  nota.value = await getNote(fb_id);
}

//TRAILER SECTION
await renderTrailer(movieId, tipo);

//CAPTION SECTION
document.getElementById("overview").innerText = movieData.overview;

//CAST SECTION
renderPersone(registi, document.getElementById("directorList"));
renderPersone(attoriPrincipali, document.getElementById("castList"));

//EVENT LISTNER
document.getElementById("starterDate").addEventListener("change", () => {
   writeUpdate(movieData, registi, attoriPrincipali);
});
document.getElementById("endDate").addEventListener("change", () => {
   writeUpdate(movieData, registi, attoriPrincipali);
});
document.getElementById("singleDay").addEventListener("change", enableSingleDay);
document.getElementById("toggleSawed").addEventListener("click", async() => {
  const visto = await isSawed(fb_id);
  if (visto){
    await delMovie(fb_id);
    let button = document.getElementById("toggleSawed");
    button.style.background ="#00E68A";
    document.getElementById("starterDate").value = "";
    document.getElementById("endDate").value = "";
    setStarRating(0);
    document.getElementById("noteText").value="";

  } else {
    writeUpdate(movieData, registi, attoriPrincipali);
  }
});
document.getElementById("saveNote").addEventListener("click", () => {
   writeUpdate(movieData, registi, attoriPrincipali);
});
initStarListeners();

//WORK FUNCTIONS

async function renderPersone(lista, ulElement) {
  ulElement.innerHTML = "";

  for (const persona of lista) {
    const img = document.createElement("img");
    let foto = "";

    try {
      foto = await getProfilePhoto(persona.id); // correggo anche persona.it → persona.id
    } catch {
      foto = "./assets/noPhoto.png";
    }

    img.alt = persona.name;
    img.src = foto;

    const span = document.createElement("span");
    span.textContent = persona.name;

    const link = document.createElement("a");
    link.href = `scheda_persona.html?id=${persona.id}`;
    link.appendChild(img);
    link.appendChild(span);

    const li = document.createElement("li");
    li.appendChild(link);
    ulElement.appendChild(li);
  }
}

async function setStarRating(rating){
  console.log("Sono in set star");
  const stars = document.querySelectorAll('#starRating .star');
  stars.forEach(star => {
    const value = parseInt(star.getAttribute('data-value'));
    star.classList.toggle('selected', value <= rating);
  });
}
async function getStarRating(){
  const stars = document.querySelectorAll('#starRating .star');
  let rating = 0;
  stars.forEach(star => {
    if (star.classList.contains('selected')) {
      rating = parseInt(star.getAttribute('data-value'));
    }
  });
  return rating;
}

function initStarListeners() {
        
  const stars = document.querySelectorAll('#starRating .star');

  // Rimuovi eventuali listener precedenti (opzionale ma consigliato)
  stars.forEach(star => {
    const newStar = star.cloneNode(true);
    star.parentNode.replaceChild(newStar, star);
  });

  // Aggiungi i nuovi listener
  const freshStars = document.querySelectorAll('#starRating .star');
  freshStars.forEach(star => {
    star.addEventListener('click', async () => {
      const value = parseInt(star.getAttribute('data-value'));
      console.log("sono in initStar");
      await setStarRating(value);
      writeUpdate(movieData, registi, attoriPrincipali);
    });
  });
}

function enableSingleDay(){
  const singleDay = document.getElementById("singleDay").checked;
  const startDateLb = document.getElementById("lbStarterDate");
  startDateLb.innerText = singleDay ? "Data: " : "Inizio: ";
  const endDateLb = document.getElementById("lbEndDate");
  endDateLb.style.display = singleDay ? "none" : "inline";
  const endDate = document.getElementById("endDate");
  endDate.style.display = singleDay ? "none" : "inline";
  if (singleDay){
    endDate.value = document.getElementById("starterDate").value;
  }
  writeUpdate(movieData, registi, attoriPrincipali);
}

//async function writeUpdate(fb_id, data, registi, attoriPrincipali){
async function writeUpdate(data, registi, attoriPrincipali){
  const visto = await isSawed(fb_id);
  const startDate = document.getElementById("starterDate").value;
  const unico = document.getElementById("singleDay").checked;
  let endDate="";
  if (unico){
    endDate = startDate;
  } else {
    endDate = document.getElementById("endDate").value;
  }
  const rating = await getStarRating();
  const nota = document.getElementById("noteText").value;
  console.log("id: "+fb_id);
  console.log("start Date: "+startDate);
  console.log("end Date: "+endDate);
  console.log("voto: "+rating);
  console.log("note: "+nota);
  addMovie(fb_id, data, registi, attoriPrincipali, startDate, endDate, tipo, rating, nota)
  let button = document.getElementById("toggleSawed");
  button.style.background ="yellow";

}