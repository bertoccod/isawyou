import { searchAll } from './tmdb.js';
import { getDataHome } from './dbops.js';

let collezioneIds = new Set();

document.addEventListener("DOMContentLoaded", async() => {
  const input = document.getElementById("searchInput");
  const resultsList = document.getElementById("results");

  try {
    const querySnapshot = await getDataHome();
    querySnapshot.forEach(doc => {
      collezioneIds.add(doc.id); // doc.id è già nel formato "tipo_id" (es. movie_550)
    });
    console.log("Collezione caricata per il confronto.");
  } catch (e) {
    console.error("Errore caricamento collezione:", e);
  }

  let timer; // 1. Creiamo un timer globale

  input.addEventListener("input", (e) => {
      const query = e.target.value.trim();

      // 2. Ogni volta che l'utente preme un tasto, resettiamo il timer precedente
      clearTimeout(timer);

      // 3. Se l'input è troppo corto (meno di 3 lettere), svuotiamo i risultati
      if (query.length < 3) {
          resultsList.innerHTML = "";
          return;
      }

      // 4. Facciamo partire un nuovo timer di 500ms (mezzo secondo)
      timer = setTimeout(async () => {
          document.title = `Cerca: ${query} – I Saw You`;
          resultsList.innerHTML = "<li>Cercando...</li>";

          const results = await searchAll(query);
          renderResults(results);
      }, 500); 
  });
});


function renderResults(results) {
  const resultsList = document.getElementById("results");
  resultsList.innerHTML = "";

  results.forEach(item => {
    const tipo = item.media_type;
    if (tipo !== "movie" && tipo !== "tv" && tipo !== "person") return;

    // CREIAMO L'ID DA CONFRONTARE (stesso formato di Firebase)
    const compositeId = `${item.id}_${tipo}`;
    const giaVisto = collezioneIds.has(compositeId);

    const li = document.createElement("li");
    li.classList.add("grid-item");
    if (giaVisto) li.classList.add("already-seen"); // Classe CSS per l'effetto visivo

    let title = item.title || item.name;
    let poster = item.poster_path || item.profile_path;
    let imgSrc = poster ? `https://image.tmdb.org/t/p/w300${poster}` : "https://via.placeholder.com/300x450?text=No+Image";
    
    // Se è già visto, mandiamo alla scheda normale (source=db)
    // Se è nuovo, mandiamo alla scheda TMDB (source=tmdb)
    let source = giaVisto ? "db" : "tmdb";
    let linkHref = tipo === "person" 
      ? `scheda_persona.html?id=${item.id}`
      : `scheda_film.html?id=${item.id}&tipo=${tipo}&source=${source}`;

    li.innerHTML = `
      <a href="${linkHref}" style="text-decoration: none; color: inherit;">
        <div class="image-container">
          <img src="${imgSrc}" alt="${title}">
          ${giaVisto ? '<span class="seen-badge">✓ In Collezione</span>' : ''}
        </div>
        <br>
        <span>${title}</span>
      </a>`;
    resultsList.appendChild(li);
  });
}