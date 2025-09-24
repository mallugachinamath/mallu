function enterApp() {
  document.body.classList.add("fade-out");
  setTimeout(() => {
    window.location.href = "movie-explorer.html";  
  }, 1000);
}

function toggleMusic() {
  const music = document.getElementById("bg-music");
  if (music.paused) {
    music.play();
  } else {
    music.pause();
  }
}

// Optional: allow pressing “Enter” key to trigger Start
document.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    enterApp();
  }
});
