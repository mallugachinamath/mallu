const OMDB_API_KEY = "thewdb"; // replace with your own for better usage
const resultsDiv = document.getElementById("results");
const favDiv = document.getElementById("favourites");
const searchBtn = document.getElementById("searchBtn");
const langFilter = document.getElementById("langFilter");
const yearSort = document.getElementById("yearSort");
const toggleThemeBtn = document.getElementById("toggleTheme");
const clearFavBtn = document.getElementById("clearFav");

let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
let currentResults = []; // store results for filtering/sorting

window.onload = () => {
  loadDefaultMoviesAndBooks();
  renderFavourites();
};

// Search
searchBtn.addEventListener("click", () => searchItems());
document.getElementById("searchInput").addEventListener("keyup", (e) => {
  if (e.key === "Enter") searchItems();
});

// Filters
langFilter.addEventListener("change", applyFilters);
yearSort.addEventListener("change", applyFilters);

// Theme Toggle
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// Clear Favourites
clearFavBtn.addEventListener("click", () => {
  favourites = [];
  localStorage.setItem("favourites", JSON.stringify(favourites));
  renderFavourites();
});

// Search Function
async function searchItems() {
  const query = document.getElementById("searchInput").value.trim();
  const type = document.getElementById("typeSelect").value;

  if (!query) {
    resultsDiv.innerHTML = "<p style='text-align:center'>Type something to search.</p>";
    return;
  }

  resultsDiv.innerHTML = "<p style='text-align:center'>Loading...</p>";

  try {
    if (type === "movie") {
      const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!data.Search) {
        resultsDiv.innerHTML = "<p>No movies found.</p>";
        return;
      }

      const detailed = await Promise.all(
        data.Search.slice(0, 10).map(m => fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${m.imdbID}`).then(r => r.json()))
      );

      currentResults = detailed.map(d => ({
        id: d.imdbID,
        title: d.Title,
        img: d.Poster !== "N/A" ? d.Poster : "https://via.placeholder.com/100x150",
        lang: d.Language || "N/A",
        year: d.Year || ""
      }));
    } else {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      currentResults = data.docs.slice(0, 10).map(d => ({
        id: d.key,
        title: d.title,
        img: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : "https://via.placeholder.com/100x150",
        lang: d.language ? d.language.join(", ") : "N/A",
        year: d.first_publish_year || ""
      }));
    }
    populateLangFilter(currentResults);
    applyFilters();
  } catch (err) {
    resultsDiv.innerHTML = "<p>Error fetching results.</p>";
    console.error(err);
  }
}

// Apply Filters & Sorting
function applyFilters() {
  let filtered = [...currentResults];
  
  // Language Filter
  const langValue = langFilter.value;
  if (langValue !== "all") {
    filtered = filtered.filter(item => item.lang.toLowerCase().includes(langValue.toLowerCase()));
  }

  // Sort by Year
  if (yearSort.value === "newest") {
    filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (yearSort.value === "oldest") {
    filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
  }

  displayResults(filtered);
}

// Populate Language Dropdown
function populateLangFilter(items) {
  const langs = new Set();
  items.forEach(i => {
    if (i.lang && i.lang !== "N/A") {
      i.lang.split(",").forEach(l => langs.add(l.trim()));
    }
  });

  langFilter.innerHTML = `<option value="all">All</option>`;
  langs.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    langFilter.appendChild(opt);
  });
}

// Display Results
function displayResults(items) {
  resultsDiv.innerHTML = "";
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.img}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>Language: ${item.lang}</p>
      <p>Year: ${item.year}</p>
      <button onclick='addFavourite(${JSON.stringify(item)})'>Add to Favourites</button>
    `;
    resultsDiv.appendChild(card);
  });
}

// Favourites
function addFavourite(item) {
  if (!favourites.some(f => f.id === item.id)) {
    favourites.push(item);
    localStorage.setItem("favourites", JSON.stringify(favourites));
    renderFavourites();
  }
}

function renderFavourites() {
  favDiv.innerHTML = "";
  if (favourites.length === 0) {
    favDiv.innerHTML = "<p>No favourites yet.</p>";
    return;
  }
  favourites.forEach((fav, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${fav.img}" alt="${fav.title}">
      <h3>${fav.title}</h3>
      <p>Language: ${fav.lang}</p>
      <p>Year: ${fav.year}</p>
      <button onclick="removeFavourite(${index})">Remove</button>
    `;
    favDiv.appendChild(card);
  });
}

function removeFavourite(index) {
  favourites.splice(index, 1);
  localStorage.setItem("favourites", JSON.stringify(favourites));
  renderFavourites();
}

// Default Loader
async function loadDefaultMoviesAndBooks() {
  const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=batman`);
  const data = await res.json();
  if (data.Search) {
    currentResults = await Promise.all(
      data.Search.slice(0, 5).map(m => fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${m.imdbID}`).then(r => r.json()))
    ).then(arr => arr.map(d => ({
      id: d.imdbID,
      title: d.Title,
      img: d.Poster !== "N/A" ? d.Poster : "https://via.placeholder.com/100x150",
      lang: d.Language || "N/A",
      year: d.Year || ""
    })));
    populateLangFilter(currentResults);
    applyFilters();
  }
}
