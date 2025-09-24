import { searchAll } from './tmdb.js';

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("searchInput");
  
  input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    document.title = `Cerca: ${input.value} – I Saw You`;
    searchAll(input.value);
  }
  });

});