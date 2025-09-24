import { isSawed, addMovie, delMovie, updateMovieDates, getDates, getVoto, setVoto } from './dbops.js';
import { openScheda, getProfilePhoto } from './tmdb.js';

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
/*
fetch("navbar.html")
.then(response => response.text())
.then(data => {
  document.getElementById("navbar").innerHTML = data;
});*/
document.getElementById("singleDay").addEventListener("change", enableSingleDay);
document.getElementById("starterDate").addEventListener("change", setStartDate);
document.getElementById("endDate").addEventListener("change", setEndDate);

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const tipo = urlParams.get('tipo');
const fb_id = movieId+"_"+tipo; //COSTRUISCO L'ID SU FIREBASE
const link = "https://api.themoviedb.org/3/"+tipo+"/"+movieId+"?api_key="+API_KEY+"&language=it-IT&append_to_response=credits";
console.log(link);
let movieData = "";
let registi = "";
let attoriPrincipali = "";
const datiTot = await openScheda(movieId, tipo);
movieData = datiTot.data;
registi = datiTot.registi;
console.log(registi);
attoriPrincipali = datiTot.attoriPrincipali;
let rating=0;
document.getElementById("poster").src = `https://image.tmdb.org/t/p/w300${movieData.poster_path}`;
document.getElementById("title").innerText = tipo=="movie" ? movieData.title : movieData.name;
document.getElementById("overview").innerText = movieData.overview;

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
document.getElementById("filmInfoCompact").textContent = infoParts.join(" — ");

if (movieData.production_countries?.length) {
  const paesi = movieData.production_countries.map(c => c.name).join(" — ");
  document.getElementById("filmCountries").textContent = paesi;
}

renderPersone(registi, document.getElementById("directorList"));
renderPersone(attoriPrincipali, document.getElementById("castList"));

updateSpunta(tipo, movieData, registi, attoriPrincipali);


async function updateSpunta(tipo, data, registi, attoriPrincipali) {
  try{
    const visto = await isSawed(fb_id); //CHIEDO A dbops SE È STATO VISTO
    let button = document.getElementById("toggleSawed");
    button.style.color = visto ? "green" : "gray"; //CAMBIO STATO AL BOTTONE
    if (visto){
      const dates = await getDates(fb_id);
      if ((dates.startDate) && (dates.endDate)){
        document.getElementById("starterDate").valueAsDate = dates.startDate;
        document.getElementById("endDate").valueAsDate = dates.endDate;
      }
      if (dates.startDate!=""){
        if (dates.startDate.getTime()==dates.endDate.getTime()){
          const singleDayCheckbox = document.getElementById("singleDay");
          singleDayCheckbox.checked = true;
         enableSingleDay();
        }
      }
      rating = await getVoto(fb_id);
      setStarRating(rating);
    } else {
      setStarRating(0);
    }
    initStarListeners(); // aggiunge i listener alle stelle una sola volta

    //AGGIUNGO EVENT LISTENER AL BOTTONE
    button.onclick = async function () {
      const visto = await isSawed(fb_id);
      if (!visto) {
        const singleDay = document.getElementById("singleDay")
        let startDate = document.getElementById("starterDate").value;
        if (!startDate){startDate="";}
        let endDate="";
        if (singleDay.checked){
          endDate = startDate;
        } else {
          endDate = document.getElementById("endDate").value;
        }
        const rating = await getStarRating();
        addMovie(fb_id, data, registi, attoriPrincipali, startDate, endDate, tipo, rating);

        button.style.color = "green";
      } else {
        delMovie(fb_id);
        button.style.color = "gray";
      }
    };    
  } catch (error) {
    console.error("Errore nel recupero dello stato del film:", error);
  }
}

//GESTIONE DATA
function enableSingleDay(){
  console.log("enableSingleDay triggered");
  const singleDay = document.getElementById("singleDay").checked;
  const startDateLb = document.getElementById("starterDateLb");
  startDateLb.innerText = singleDay ? "Data" : "Data inizio";
  const endDateLb = document.getElementById("endDateLb");
  endDateLb.style.display = singleDay ? "none" : "inline";
  const endDate = document.getElementById("endDate");
  endDate.style.display = singleDay ? "none" : "inline";
  if (singleDay){
    endDate.value = document.getElementById("starterDate").value;
  }
}
async function setStartDate(){
  const startDate = document.getElementById("starterDate").value;
  let endDate = document.getElementById("endDate").value;
  if (!endDate){
    endDate = startDate;
  }
  try {
    const esiste = await isSawed(fb_id);
    if (!esiste) {   
      rating = await getStarRating();
      await addMovie(fb_id, movieData, registi, attoriPrincipali, startDate, endDate, tipo, rating);
      let button = document.getElementById("toggleSawed");
      button.style.color = "green";
    } else {
      await updateMovieDates(fb_id, startDate, endDate);
    }
  } catch (error){
    console.error("Errore durante l'aggiornamento della data del film:", error);
  }
}
async function setEndDate(){
  const endDate = document.getElementById("endDate").value;
  let startDate = document.getElementById("starterDate").value;
  if (!startDate){
    startDate = endDate;
  }
  try {
    const esiste = await isSawed(fb_id);
    if (!esiste) {   
      rating = await getStarRating();
      await addMovie(fb_id, movieData, registi, attoriPrincipali, startDate, endDate, tipo, rating);
      let button = document.getElementById("toggleSawed");
      button.style.color = "green";
    } else {
      await updateMovieDates(fb_id, startDate, endDate);
    }
  } catch (error){
    console.error("Errore durante l'aggiornamento della data del film:", error);
  }
}

//GESTIONE STELLE
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
      await setStarRating(value);
      try {
        const visto = await isSawed(fb_id); //CHIEDO A dbops SE È STATO VISTO
        if (!visto){// SE HO IMPOSTATO IL VOTO MA NON HO ANCORA AGGIUNTO IL FILM A FIREBASE LO AGGIUNGO
          const singleDay = document.getElementById("singleDay")
          const startDate = document.getElementById("starterDate").value;
          let endDate="";
          if (singleDay.checked){
            endDate = startDate;
          } else {
            endDate = document.getElementById("endDate").value;
          }
          rating = await getStarRating();
          addMovie(fb_id, movieData, registi, attoriPrincipali, startDate, endDate,tipo, rating);
          await setVoto(fb_id, value);
          let button = document.getElementById("toggleSawed");
          button.style.color = "green";
        } else {
          await setVoto(fb_id, value);
        }
        console.log(`Voto ${value} salvato per il film ${fb_id}`);
      } catch (error) {
        console.error("Errore nel salvataggio del voto:", error);
      }
    });
  });
}
async function setStarRating(rating){
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

//GESTIONE FOTO PERSONE
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

