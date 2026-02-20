import { getDataHome } from './dbops.js';
import { getProfilePhoto } from './tmdb.js';

const firebaseConfig = {
  apiKey: "AIzaSyCdDwbIINAMKfNqDEbCYGIZSq_Q1k8VuGM",
  authDomain: "isawyou-1b08b.firebaseapp.com",
  projectId: "isawyou-1b08b",
  storageBucket: "isawyou-1b08b.firebasestorage.app",
  messagingSenderId: "522349831222",
  appId: "1:522349831222:web:d63ae730ba603559c5a497"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

auth.onAuthStateChanged(user => { if (!user) window.location.href = "index.html"; });

document.addEventListener("DOMContentLoaded", async () => {
    const resultsList = document.getElementById("results");
    
    try {
        // Recuperiamo i dati freschi da Firestore invece di affidarci al localStorage
        const querySnapshot = await getDataHome();
        const attoriMap = new Map();

        // Calcolo punteggio logaritmico (coerente con le altre pagine)
        querySnapshot.forEach(doc => {
            const data = doc.data();
            (data.attori || []).forEach(a => {
                if (!a.id) return;
                const weight = Math.log((a.numVisto || 1) + 1) / Math.log(10);
                const entry = attoriMap.get(a.id) || { nome: a.name, id: a.id, score: 0, countVisti: 0 };
                attoriMap.set(a.id, { 
                    ...entry, 
                    score: entry.score + weight,
                    countVisti: entry.countVisti + (a.numVisto || 1)
                });
            });
        });

        const sortedAttori = [...attoriMap.values()]
            .sort((a, b) => b.score - a.score);

        resultsList.innerHTML = ""; // Puliamo il loader

        const batchSize = 10; 
        for (let i = 0; i < sortedAttori.length; i += batchSize) {
            const batch = sortedAttori.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (attore, index) => {
                const globalIndex = i + index;
                let imgUrl = "./assets/noPhoto.png";
                
                try { 
                    // Chiamata TMDB con un piccolo ritardo casuale per sicurezza
                    imgUrl = await getProfilePhoto(attore.id); 
                } catch (err) {
                    console.warn(`Impossibile caricare foto per ${attore.nome}`);
                }
                
                const rank = globalIndex + 1;
                let rankClass = rank <= 3 ? `rank-${rank}` : "";

                return `
                    <div class="actor-card ${rankClass}">
                        <div class="rank-badge">#${rank}</div>
                        <a href="scheda_persona.html?id=${attore.id}" class="actor-link">
                            <div class="img-wrapper">
                                <img src="${imgUrl}" alt="${attore.nome}" loading="lazy">
                            </div>
                            <div class="actor-info">
                                <span class="actor-name">${attore.nome}</span>
                                <div class="score-tag">${attore.score.toFixed(2)} pts</div>
                            </div>
                        </a>
                    </div>
                `;
            });

            const htmlResults = await Promise.all(batchPromises);
            resultsList.innerHTML += htmlResults.join("");
            await new Promise(resolve => setTimeout(resolve, 100));
        }

    } catch (e) {
        console.error("Errore nel caricamento Top Attori:", e);
        resultsList.innerHTML = "<p>Errore nel caricamento della classifica.</p>";
    }
});