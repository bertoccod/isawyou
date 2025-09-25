const API_KEY = "0c09790a4bd5d1e5c478b07ee91113d3";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";

export async function searchAll(query) {
  //const query = document.getElementById("searchInput").value;
  const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}&language=it-IT`;
  try{
    const response = await fetch(url);
    const data = await response.json();

    const resultsList = document.getElementById("results");
    resultsList.innerHTML = "";

    const resultsWithImages = data.results
    .filter(item => item.poster_path || item.profile_path)
    .sort((a, b) => b.popularity - a.popularity);

    resultsWithImages.forEach(item => {
      const li = document.createElement("li");
      li.classList.add("grid-item");
      let imgSrc="";
      let title="";
      let linkHref="";
      if (item.media_type === "movie"){
        imgSrc = item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";
        title = item.title;
        linkHref = `scheda_film.html?id=${item.id}&tipo=movie`;
      } else if (item.media_type === "tv"){
        imgSrc = item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";
        title = item.name;
        linkHref = `scheda_film.html?id=${item.id}&tipo=tv`;
      } else if (item.media_type === "person"){
        imgSrc = item.profile_path ? `${IMAGE_BASE}${item.profile_path}` : "https://via.placeholder.com/300x450?text=No+Image";
        title = item.name;
        linkHref = `scheda_persona.html?id=${item.id}`;
      }
      li.innerHTML = `
      <a href="${linkHref}" style="text-decoration: none; color: inherit;">
        <img src="${imgSrc}" alt="${title}">
        <span>${title}</span>
      </a>`;
      resultsList.appendChild(li);
    });
  } catch(error){
    console.error("Errore nella ricerca:", error);
  }
};

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
  
  const attoriPrincipali = data.credits.cast
    .slice(0, 10) // prende i primi 10
    .map(attore => ({
      id: attore.id,
      name: attore.name
    }));
    return {data, registi, attoriPrincipali}
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
      const container = document.getElementById("trailerContainer");
      container.innerHTML = `
        <iframe
          src="${trailerUrl}"
          title="Trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>`;
      container.style.display = "block";
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

