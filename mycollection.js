import { getDataHome } from './dbops.js';

// Stato globale dei filtri
let activeTypes = new Set(["movie", "tv"]);
let activeStars = "all";
let allMedia = []; // Cache locale dei dati

// Espongo le funzioni necessarie al window per gli eventi inline (onkeyup, ecc)
window.applyFilters = applyFilters;

window.addEventListener("DOMContentLoaded", async () => {
    // 1. Leggi parametri dall'URL per ripristinare lo stato
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const starsParam = urlParams.get('stars');

    if (typeParam) {
        activeTypes = new Set(typeParam.split(','));
        ["movie", "tv"].forEach(type => {
            const btn = document.getElementById(`filter-${type}`);
            if (btn) {
                activeTypes.has(type) ? btn.classList.add("active") : btn.classList.remove("active");
            }
        });
    }

    if (starsParam) {
        activeStars = starsParam;
        const starFilter = document.getElementById("starFilter");
        if (starFilter) starFilter.value = starsParam;
    }

    // 2. Caricamento dati (usando la funzione della Home)
    try {
        const querySnapshot = await getDataHome();
        allMedia = []; // Reset

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const [dbId, dbTipo] = doc.id.split("_");
            allMedia.push({
                id: dbId,
                tipo: dbTipo,
                titolo: data.title,
                poster: data.poster_path,
                voto: data.voto,
                keywords: data.keywords || []
            });
        });

        // 3. Primo render e applicazione filtri
        renderCollection(allMedia);
        applyFilters();

    } catch (error) {
        console.error("Errore nel caricamento collezione:", error);
    }

    // 4. Event Listeners per i filtri
    document.getElementById("filter-movie").addEventListener("click", () => toggleType("movie"));
    document.getElementById("filter-tv").addEventListener("click", () => toggleType("tv"));
    document.getElementById("starFilter").addEventListener("change", (e) => {
        activeStars = e.target.value;
        applyFilters();
    });
});

/**
 * Renderizza fisicamente i LI nel DOM
 */
function renderCollection(dataList) {
    const ul = document.getElementById("results");
    if (!ul) return;
    ul.innerHTML = "";

    dataList.forEach(item => {
        const li = document.createElement("li");
        
        // Impostiamo i dataset per facilitare il filtraggio
        li.setAttribute("data-type", item.tipo);
        li.setAttribute("data-stars", String(item.voto));
        // Uniamo le keywords in una stringa per il search testuale
        const keywordsString = Array.isArray(item.keywords) ? item.keywords.join(' ') : '';
        li.setAttribute("data-keywords", keywordsString.toLowerCase());

        const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
        const imgSrc = item.poster ? `${IMAGE_BASE}${item.poster}` : "https://via.placeholder.com/300x450?text=No+Image";
        
        li.innerHTML = `
            <a href="scheda_film.html?id=${item.id}&tipo=${item.tipo}" style="text-decoration: none; color: inherit;">
                <img src="${imgSrc}" alt="${item.titolo}"><br>
                <span>${item.titolo}</span>
            </a>`;
        ul.appendChild(li);
    });
}


/**
 * Gestisce l'accensione/spegnimento dei tasti Film/Serie TV
 */
function toggleType(type) {
    const btn = document.getElementById(`filter-${type}`);
    if (activeTypes.has(type)) {
        activeTypes.delete(type);
        btn.classList.remove("active");
    } else {
        activeTypes.add(type);
        btn.classList.add("active");
    }
    applyFilters();
}

/**
 * Filtra gli elementi esistenti nel DOM e aggiorna l'URL
 */
export function applyFilters() {
    const input = document.getElementById("localSearch");
    const searchText = input ? input.value.toLowerCase() : "";
    const ul = document.getElementById("results");
    const items = ul.getElementsByTagName("li");

    for (let li of items) {
        const tipo = li.getAttribute("data-type");
        const voto = li.getAttribute("data-stars");
        const keywords = li.getAttribute("data-keywords");
        const titolo = (li.querySelector("span")?.innerText || "").toLowerCase();

        const matchType = activeTypes.has(tipo);
        const matchStars = activeStars === "all" || voto === activeStars;
        // Cerca sia nel titolo che nelle keywords
        const matchText = titolo.includes(searchText) || keywords.includes(searchText);

        li.style.display = (matchType && matchStars && matchText) ? "" : "none";
    }

    // Aggiorna l'URL senza ricaricare la pagina
    const params = new URLSearchParams();
    params.set('type', Array.from(activeTypes).join(','));
    params.set('stars', activeStars);
    if (searchText) params.set('search', searchText);
    
    window.history.replaceState(null, '', `?${params.toString()}`);
}