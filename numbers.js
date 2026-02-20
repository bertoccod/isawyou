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
    const querySnapshot = await getDataHome();
    const data = querySnapshot.docs.map(doc => doc.data());

    // 1. Rendering Globale
    const globalStats = await processStats(data, 0);
    renderSection(globalStats, document.getElementById("global-target"), "OVERALL ARCHIVE");

    // 2. Rendering Timeline
    const years = [...new Set(data.map(d => d.data_fine?.toDate?.()?.getFullYear()).filter(y => y))].sort((a,b) => b-a);
    const timelineTarget = document.getElementById("timeline-target");

    for (const year of years) {
        const yearStats = await processStats(data, year);
        const yearDiv = document.createElement("div");
        timelineTarget.appendChild(yearDiv);
        await renderSection(yearStats, yearDiv, `RECAP ${year}`);
    }
});

async function processStats(data, refYear) {
    let stats = {
        movies: 0, tv: 0, total: 0, sommaVoti: 0,
        stars: { 1:0, 2:0, 3:0, 4:0, 5:0 },
        people: { actors: new Map(), directors: new Map() }
    };

    data.forEach(item => {
        const year = item.data_fine?.toDate?.()?.getFullYear();
        if (refYear !== 0 && year !== refYear) return;

        stats.total++;
        if (item.tipo === "movie") stats.movies++; else stats.tv++;
        
        const v = parseInt(item.voto) || 0;
        if (v > 0) { stats.stars[v]++; stats.sommaVoti += v; }

        // Pesatura logaritmica attori
        (item.attori || []).forEach(a => {
            if (!a.id) return;
            const weight = Math.log((a.numVisto || 1) + 1) / Math.log(10);
            const entry = stats.people.actors.get(a.id) || { name: a.name, id: a.id, score: 0 };
            stats.people.actors.set(a.id, { ...entry, score: entry.score + weight });
        });

        // Registi
        (item.registi || []).forEach(r => {
            if (!r.id) return;
            const entry = stats.people.directors.get(r.id) || { name: r.name, id: r.id, score: 0 };
            stats.people.directors.set(r.id, { ...entry, score: entry.score + 1 });
        });
    });

    return {
        ...stats,
        avg: stats.total > 0 ? (stats.sommaVoti / stats.total).toFixed(1) : "0.0",
        topActors: [...stats.people.actors.values()].sort((a,b) => b.score - a.score).slice(0, 4),
        topDirectors: [...stats.people.directors.values()].sort((a,b) => b.score - a.score).slice(0, 4)
    };
}

async function renderSection(s, container, title) {
    const isGlobal = title.includes("OVERALL");
    let barsHtml = "";
    for(let i=5; i>=1; i--) {
        const p = s.total > 0 ? (s.stars[i] / s.total * 100).toFixed(0) : 0;
        barsHtml += `<div class="bar-row"><span>${i}★</span><div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div></div>`;
    }

    container.innerHTML = `
        <section class="stat-card ${isGlobal ? 'global-card' : ''}">
            <div class="card-header">
                <h2>${title}</h2>
                <div class="badge">${s.avg >= 4 ? 'TOP RATED' : 'ARCHIVE'}</div>
            </div>
            
            <div class="card-body">
                <div class="stat-main">
                    <div class="stat-circle">
                        <span class="avg-val">${s.avg}</span>
                        <span class="avg-lab">MEDIA</span>
                    </div>
                    <div class="stat-info">
                        <div class="total-count"><strong>${s.total}</strong> Elementi</div>
                        <div class="split">🎬 ${s.movies} Film  •  📺 ${s.tv} Serie</div>
                    </div>
                </div>
                
                <div class="stat-viz">
                    <div class="distribution">${barsHtml}</div>
                </div>
            </div>

            <div class="card-footer">
                <div class="people-block">
                    <h4>PROTAGONISTI PREFERITI</h4>
                    <div class="people-list" id="list-a-${title.replace(/\s/g, '')}"></div>
                </div>
            </div>
        </section>
    `;

    // Carica foto
    const listHtml = await Promise.all([...s.topActors, ...s.topDirectors].map(async p => {
        let img = "./assets/noPhoto.png";
        try { img = await getProfilePhoto(p.id); } catch(e) {}
        return `
            <a href="scheda_persona.html?id=${p.id}" class="mini-profile" title="${p.name}">
                <img src="${img}" alt="${p.name}">
                <div class="tooltip">${p.name}</div>
            </a>`;
    }));
    document.getElementById(`list-a-${title.replace(/\s/g, '')}`).innerHTML = listHtml.join("");
}