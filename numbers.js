import { getDataHome} from './dbops.js';

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
const tot = document.getElementById("totalMovie");
let querySnapshot = await getDataHome();

//GLOBALI
let statistiche = await stats(querySnapshot, 0);
const stat = document.getElementById("Total"); 

if (statistiche && stat) {
  const totalElementi = statistiche.numMovie+statistiche.numTv;
  stat.innerHTML = `
    <li>Totale Elementi: ${totalElementi}</li>
    <li>Numero Film in collezione: ${statistiche.numMovie}</li>
    <li>Numero Serie TV in collezione: ${statistiche.numTv}</li>
    <li>Distribuzione voti:</li>
    <li>★☆☆☆☆: ${statistiche.numStar[1]}</li>
    <li>★★☆☆☆: ${statistiche.numStar[2]}</li>
    <li>★★★☆☆: ${statistiche.numStar[3]}</li>
    <li>★★★★☆: ${statistiche.numStar[4]}</li>
    <li>★★★★★: ${statistiche.numStar[5]}</li>
  `;
  let anno = new Date().getFullYear();
  let proseguo=true;
  while (proseguo){
    statistiche = await stats(querySnapshot, anno);
    if (statistiche){
      const divAnni = document.getElementById("anni");
      divAnni.innerHTML = `
        <h2>Statistiche ${anno}</h2>
        Totale Elementi: ${totalElementi}<br>
        Numero Film in collezione: ${statistiche.numMovie}<br>
        Numero Serie TV in collezione: ${statistiche.numTv}<br>
        Distribuzione voti:<br>
        ★☆☆☆☆: ${statistiche.numStar[1]}<br>
        ★★☆☆☆: ${statistiche.numStar[2]}<br>
        ★★★☆☆: ${statistiche.numStar[3]}<br>
        ★★★★☆: ${statistiche.numStar[4]}<br>
        ★★★★★: ${statistiche.numStar[5]}<br>
      `;
      anno--;
    } else {
      proseguo=false;
    }
  }
} else {
  stat.textContent = "Errore nel caricamento delle statistiche.";
}

async function stats(querySnapshot, refYear){
  let numMovie=0;
  let numTv=0;
  let vistiAnno=0;
  let numStar={0:0, 1:0, 2:0, 3:0, 4:0, 5:0};
  querySnapshot.forEach(doc=>{
    const data = doc.data();
    if (data.data_fine){
      const vistonel = data.data_fine.toDate?.();
      const year = vistonel.getFullYear();
      if ((year ==refYear) || (refYear==0)){
        if (data.tipo==="movie"){numMovie++;} else {numTv++;}
        vistiAnno++;
        switch(data.voto){
          case 0: numStar[0]++; break;
          case 1: numStar[1]++; break;
          case 2: numStar[2]++; break;
          case 3: numStar[3]++; break;
          case 4: numStar[4]++; break;
          case 5: numStar[5]++; break;
        }
      }
    }
  });
  let stats={numMovie, numTv, vistiAnno, numStar};
  return stats;
}

