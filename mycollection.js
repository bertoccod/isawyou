import { getMyCollection } from './dbops.js';
getMyCollection(0);
window.filterList = filterList;

export function filterList(){
  const input = document.getElementById("localSearch");
  const filter = input.value.toLowerCase();
  const ul = document.getElementById("results");
  const li = ul.getElementsByTagName("li");
  for (let i=0; i<li.length; i++){
    const visibleText = li[i].textContent || li[i].innerText;
    const keywords = li[i].getAttribute('data-keywords') || '';
    const combinedText = (visibleText + ' ' + keywords).toLowerCase();
    if (combinedText.indexOf(filter) > -1){
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}