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

auth.onAuthStateChanged(user => {
  if (user) {
    console.log("✅ Utente autenticato:", user.email);
  } else {
    console.log("❌ Utente NON autenticato. Redirect...");
    window.location.href = "index.html";
  }
});

export async function isSawed(movieId){
  const docRef = await db.collection("film").doc(movieId).get();
  return docRef.exists;
}

export async function addMovie(fb_id, data, registi, attoriPrincipali, startDate, endDate, tipo, rating){
  const formStartData = startDate ? new Date(startDate) : null;
  const formEndData = endDate ? new Date(endDate) : null;
  if (!formStartData && formEndData) {
    formStartData = formEndData;
  } else if (!formEndData && formStartData) {
    formEndData = formStartData;
  }
  let movieDataToSave = {}
  const nomiRegisti = registi.map(regista => regista.name);
  const nomiAttori = attoriPrincipali.map(attore => attore.name);
  let keywords="";
  if (tipo=="movie"){
    keywords = [...nomiRegisti, ...nomiAttori, data.title];
  } else {
    keywords = [...nomiRegisti, ...nomiAttori, data.name];
  }
  if (tipo=="movie"){
    movieDataToSave = {
      title: data.title,
      poster_path: data.poster_path,
      data_inizio: formStartData,
      data_fine: formEndData,
      registi: registi,
      attori: attoriPrincipali,
      tipo: tipo,
      voto: rating,
      keywords: keywords
    };
  } else {
    movieDataToSave ={
      title: data.name,
      poster_path: data.poster_path,
      data_inizio: formStartData,
      data_fine: formEndData,
      registi: registi,
      attori: attoriPrincipali,
      tipo: tipo,
      voto: rating,
      keywords: keywords
    };
  }
  try {
    await db.collection("film").doc(fb_id).set(movieDataToSave);
    console.log("Dati del film aggiunti a Firestore con successo!");
  } catch (error) {
    console.error("Errore durante l'aggiunta del film a Firestore:", error);
  }
}

export async function delMovie(fb_id){
  try{
    await db.collection("film").doc(fb_id).delete();
    console.log("Film eliminato con successo!");
  } catch (error){
    console.error("Errore durante l'eliminazione del film:", error);
  }
}

export async function updateMovieDates(fb_id, startDate, endDate){
  let formStartData = startDate ? new Date(startDate) : null;
  let formEndData = endDate ? new Date(endDate) : null;

  if (!formStartData && formEndData) formStartData = formEndData;
  if (!formEndData && formStartData) formEndData = formStartData;

  await db.collection("film").doc(fb_id).update({
    data_inizio: formStartData,
    data_fine: formEndData
  });
}

export async function getDates(fb_id){
  const docRef = await db.collection("film").doc(fb_id).get();
  const data = docRef.data();
  let dates = {};
  dates.startDate = data.data_inizio?.toDate?.() || "";
  dates.endDate = data.data_fine?.toDate?.() || "";
  return dates;
}

export async function getVoto(fb_id) {
  const docRef = await db.collection("film").doc(fb_id).get();
  const data = docRef.data();
  const voto = data?.voto;
  return voto || 0;
}

export async function setVoto(fb_id, voto) {
  await db.collection("film").doc(fb_id).update({ voto });
}

export async function getMyCollection(num){
  const resultsList = document.getElementById("results");
  resultsList.innerHTML = "";
  let querySnapshot = "";
  if (num==0){
    querySnapshot = await db.collection("film").orderBy("data_fine","desc").get();
  } else {
    querySnapshot = await db.collection("film").orderBy("data_fine","desc").limit(num).get();
  }
  querySnapshot.forEach((doc) =>{
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
}

export async function esportaCSV() {
  const querySnapshot = await db.collection("film").orderBy("data_fine","desc").get();
  const dati = [];

  // Intestazione CSV
  dati.push(["data_inizio", "data_fine", "title", "voto"]);

  querySnapshot.forEach((doc) => {
    const { data_inizio, data_fine, title, voto } = doc.data();
    dati.push([
      formattaData(data_inizio),
      formattaData(data_fine),
      title,
      voto,
    ]);
  });

  const csvContent = dati.map((riga) => riga.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "myMovieDB.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formattaData(data) {
  if (!data) return "";
  if (data.toDate) return data.toDate().toISOString().split("T")[0]; // Firestore Timestamp
  return new Date(data).toISOString().split("T")[0]; // JS Date
}

export async function getDataHome(){
   try {
    const querySnapshot = await db.collection("film").orderBy("data_fine","desc").get();
    return querySnapshot;
  } catch (error) {
    console.error("Errore nel recupero dei dati:", error);
    return null;
  }
}