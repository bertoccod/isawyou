import { getDataHome} from './dbops.js';
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
let querySnapshot = await getDataHome();

//GLOBALI
let statistiche = await stats(querySnapshot, 0);
const stat = document.getElementById("global"); 

if (statistiche && stat) {
  let totalElementi = statistiche.numMovie+statistiche.numTv;
  stat.innerHTML = `
    <div class="section">
    <h2>Statistiche Totali</h2>
    Totale Elementi: ${totalElementi}<br>
    Numero Film in collezione: ${statistiche.numMovie}<br>
    Numero Serie TV in collezione: ${statistiche.numTv}<br>
    Distribuzione voti:<br>
    ★☆☆☆☆: ${statistiche.numStar[1]}<br>
    ★★☆☆☆: ${statistiche.numStar[2]}<br>
    ★★★☆☆: ${statistiche.numStar[3]}<br>
    ★★★★☆: ${statistiche.numStar[4]}<br>
    ★★★★★: ${statistiche.numStar[5]}<br>
    </div>
  `;
  let anno = new Date().getFullYear();
  let proseguo=true;
  while (proseguo){
    console.log("Proseguo= "+proseguo);
    statistiche = await stats(querySnapshot, anno);
    totalElementi = statistiche.numMovie+statistiche.numTv;
    const att = statistiche.top.topAttori;
    const reg = statistiche.top.topRegisti;
    if (totalElementi>0){
      console.log("sono in statistiche");
      stat.innerHTML += `
        <div id="section-${anno}" class="scroll-wrapper">
        <h2>Statistiche ${anno}</h2>
	      Totale Elementi: ${totalElementi}<br>
        Numero Film in collezione: ${statistiche.numMovie}<br>
        Numero Serie TV in collezione: ${statistiche.numTv}<br>
        Distribuzione voti:<br>
        ★☆☆☆☆: ${statistiche.numStar[1]}<br>
        ★★☆☆☆: ${statistiche.numStar[2]}<br>
        ★★★☆☆: ${statistiche.numStar[3]}<br>
        ★★★★☆: ${statistiche.numStar[4]}<br>
        ★★★★★: ${statistiche.numStar[5]}<br><br>
        </div>
      `;
      const section = document.getElementById(`section-${anno}`);
      const ulAtt = document.createElement("ul");
      for (const persona of att) {
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
        link.href = `scheda_persona.html?id=${persona.id}`;
        link.appendChild(img);
        link.appendChild(span);
        const liAtt = document.createElement("li");
        liAtt.appendChild(link);
        ulAtt.appendChild(liAtt);
        section.appendChild(ulAtt);
      }
      section.innerHTML+="<br>";
      const ulReg = document.createElement("ul");
      for (const persona of reg) {
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
        link.href = `scheda_persona.html?id=${persona.id}`;
        link.appendChild(img);
        link.appendChild(span);
        const liReg = document.createElement("li");
        liReg.appendChild(link);
        ulReg.appendChild(liReg);
        section.appendChild(ulReg);
      }
      anno--;
    } else {
      proseguo=false;
    }
  }
} else {
  stat.textContent = "Errore nel caricamento delle statistiche.";
}

async function stats(querySnapshot, refYear){
  let id=0;
  let tipo="";
  let numMovie = 0;
  let numTv = 0;
  let vistiAnno = 0;
  let numStar = {0:0,1:0,2:0,3:0,4:0,5:0};

  const attoriMap = new Map();
  const registiMap = new Map();
  const generiMap = new Map();

  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.data_fine) return;

    const vistonel = data.data_fine.toDate?.();
    const year = vistonel.getFullYear();

    if (year !== refYear && refYear !== 0) return;

    // conteggi base
    if (data.tipo === "movie") numMovie++;
    else numTv++;

    vistiAnno++;
    numStar[data.voto]++;
    
    // attori
    const attori = data.attori || [];
    attori.forEach(({ name, id, numVisto }) => {
      if (!name || !id) return;

      const nVisto = (typeof numVisto === "number" && numVisto > 0) ? numVisto : 1;
      const valore = Math.log(nVisto + 1) / Math.log(10);

      if (attoriMap.has(id)) {
        const current = attoriMap.get(id);
        attoriMap.set(id, { ...current, count: current.count + valore });
      } else {
        attoriMap.set(id, { nome: name, id, count: valore });
      }
    });

    // registi
    const registi = data.registi || [];
    registi.forEach(({ name, id }) => {
      if (!name || !id) return;

      if (registiMap.has(id)) {
        const current = registiMap.get(id);
        registiMap.set(id, { ...current, count: current.count + 1 });
      } else {
        registiMap.set(id, { nome: name, id, count: 1 });
      }
    });
  });

  const topAttori = Array.from(attoriMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topRegisti = Array.from(registiMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const top = { topAttori, topRegisti };


  return { id, tipo, numMovie, numTv, vistiAnno, numStar, top };
}
