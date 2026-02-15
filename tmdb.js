const API_KEY = "0c09790a4bd5d1e5c478b07ee91113d3";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";

//RICERCA GENERICA - USATA IN SEARCH
export async function searchAll(query) {
  const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=it-IT`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Filtriamo e ordiniamo, ma non creiamo HTML qui!
    return data.results
      .filter(item => item.poster_path || item.profile_path)
      .sort((a, b) => b.popularity - a.popularity);
      
  } catch (error) {
    console.error("Errore nella ricerca:", error);
    return []; // Restituiamo un array vuoto in caso di errore
  }
}

export async function openScheda(id, tipo){
  console.log(`https://api.themoviedb.org/3/${tipo}/${id}?api_key=${API_KEY}&language=it-IT&append_to_response=credits`);
  const res = await fetch(`https://api.themoviedb.org/3/${tipo}/${id}?api_key=${API_KEY}&language=it-IT&append_to_response=credits`);
  const data = await res.json();
  let registi = "";
  if (tipo=="movie"){
    registi = data.credits.crew
      .filter(persona => persona.job === "Director")
      .slice(0,3)
      .map(regista => ({
        id: regista.id,
        name: regista.name
      }));
  } else {
    registi = data.created_by
      .slice(0,3)
      .map(regista => ({
        id: regista.id,
        name: regista.name
      }));
  }
  if (tipo=="movie"){
    const attoriPrincipali = data.credits.cast
      .slice(0, 10) // prende i primi 10
      .map(attore => ({
        id: attore.id,
        name: attore.name,
        numVisto: 1
      }));
      return {data, registi, attoriPrincipali}
  } else {
    const attoriPrincipali = await Promise.all(
      data.credits.cast.slice(0, 10).map(async attore => {
        const episodeCount = await countEpisodes(attore.id, id);
        return {
          id: attore.id,
          name: attore.name,
          numVisto: episodeCount
        };
      })
   );
   return { data, registi, attoriPrincipali};
  }
}
export async function renderTrailer(id, tipo) {
  const endpoint = `https://api.themoviedb.org/3/${tipo}/${id}/videos?api_key=${API_KEY}&language=it-IT`;
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    const trailer = data.results.find(video =>
      video.type === "Trailer" && video.site === "YouTube"
    );
    if (trailer) {
      const trailerUrl = `https://www.youtube.com/embed/${trailer.key}`;
      const container = document.getElementById("trailer-container");
      container.innerHTML = `
        <iframe
          src="${trailerUrl}"
          title="Trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>`;
      container.style.display = "block";
    } else {
      let sec = document.getElementById("trailer");
      sec.style.display="none";
    }
  } catch (error) {
    console.error("Errore nel recupero trailer:", error);
  }
}



export async function openPersona(id){
  const res = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&language=it-IT&append_to_response=movie_credits,tv_credits`);
  console.log(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&language=it-IT&append_to_response=movie_credits,tv_credits`);
  const data = await res.json();
  return data;
}

//RESTITUISCE LINK A FOTO PERONA - USATA IN HOME
export async function getProfilePhoto(id) {
  const res = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&language=it-IT`);
  const data = await res.json();

  if (!data.profile_path) {
    throw new Error("Nessuna immagine disponibile");
  }

  return `https://image.tmdb.org/t/p/w500${data.profile_path}`;
}

export async function getMoviePoster(id, tipo) {
  const res = await fetch(`https://api.themoviedb.org/3/${tipo}/${id}?api_key=${API_KEY}&language=it-IT`);
  const data = await res.json();

  if (!data.poster_path) {
    throw new Error("Nessuna immagine disponibile");
  }

  return `${IMAGE_BASE}/${data.poster_path}`;
}

export async function countEpisodes(idAttore, idSerie) {
  const res = await fetch(`https://api.themoviedb.org/3/person/${idAttore}/tv_credits?api_key=${API_KEY}&language=it-IT`);
  console.log (`https://api.themoviedb.org/3/person/${idAttore}/tv_credits?api_key=${API_KEY}&language=it-IT`);
  const data = await res.json();

  const match = data.cast.find(serie => Number(serie.id) === Number(idSerie));
  if (!match) {
  console.warn(`Attore ${idAttore} non trovato nella serie ${idSerie}`);
} else {
  console.log(`Attore ${idAttore} → ${match.name} → Episodi: ${match.episode_count}`);
}
  return match?.episode_count ?? 0;
}



