import { getProfilePhoto } from "./tmdb.js";
load();

export async function load(){
    const resultsList = document.getElementById("results");
    resultsList.innerHTML = "";
    const attoriJSON = localStorage.getItem('tuttiGliAttori');
    
    if (attoriJSON){
        try{
            const topAttori = JSON.parse(attoriJSON);
            const promises = topAttori.map(async (attore) => {
                let imgUrl = "./assets/noPhoto.png";
                try {
                    imgUrl = await getProfilePhoto(attore.id);
                } catch {}
                return { ...attore, imgUrl };
            });
            const attoriConFoto = await Promise.all(promises);
            attoriConFoto.forEach(attore => {
                const li = document.createElement("li");
                const desc = `${attore.nome}<br>${attore.count.toFixed(1)} punti`;
                const linkHref = `scheda_persona.html?id=${attore.id}`;
                
                li.innerHTML = `
                    <a href="${linkHref}" style="text-decoration: none; color: inherit;">
                        <img src="${attore.imgUrl}" alt="${attore.nome}"><br>
                        <span>${desc}</span>
                    </a>`;
                
                resultsList.appendChild(li);
            });
            
        } catch(e) {
            console.error("Errore critico nella funzione load:", e);
        }
    }
}