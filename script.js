const clientId = 'a610e7903cd9407baf586ee82386f082';
const clientSecret = 'e0ebe6518ed1427f97160e9742f2fd63';

let accessToken = '';
let pageHistory = [];
let currentPageIndex = -1;

async function getSpotifyToken() {
  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
    },
    body: "grant_type=client_credentials",
  });
  const data = await result.json();
  accessToken = data.access_token;
}

function recordPage(view, data) {
  pageHistory = pageHistory.slice(0, currentPageIndex + 1);
  pageHistory.push({ view, data });
  currentPageIndex = pageHistory.length - 1;
}

const searchInput = document.getElementById("searchInput");
const grid = document.getElementById("playlist-grid");

async function searchSpotifyTracks(query) {
  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  return data.tracks.items;
}

async function performSearch(query, tracks = null) {
  if (!tracks) tracks = await searchSpotifyTracks(query);
  grid.innerHTML = "";
  tracks.forEach(track => {
    const card = document.createElement("div");
    card.className = "song-card";
    card.innerHTML = `
      <img src="${track.album.images[0]?.url}" alt="${track.name}">
      <div class="song-title">${track.name}</div>
      <div class="song-subtitle">${track.artists.map(a => a.name).join(", ")}</div>
    `;
    card.addEventListener("click", () => {
      const audio = new Audio(track.preview_url);
      document.querySelectorAll("audio").forEach(a => a.pause());
      audio.play();
    });
    grid.appendChild(card);
  });
}

searchInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (!query) return;
  const tracks = await searchSpotifyTracks(query);
  await performSearch(query, tracks);
  recordPage("search", { query, tracks });
});

let songs = [];
let audio = new Audio();
let currentSongIndex = 0;
let isShuffle = false;
let isRepeat = false;

const playBtn = document.getElementById("play-button");
const pauseBtn = document.getElementById("pause-button");
const progressContainer = document.getElementById("progress-container");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const shuffleIcon = document.querySelector(".controls img[src='shuffle.svg']");
const repeatIcon = document.querySelector(".controls img[src='repeat.svg']");
const nextIcon = document.querySelector(".controls img[src='nextsong.svg']");
const prevIcon = document.querySelector(".controls img[src='prevsong.svg']");
const volumeSlider = document.getElementById("volume");

async function getSongs() {
  const res = await fetch("http://127.0.0.1:8080/songs/");
  const text = await res.text();
  const div = document.createElement("div");
  div.innerHTML = text;
  const links = div.getElementsByTagName("a");
  songs = [];
  for (let link of links) {
    if (link.href.endsWith(".mp3")) songs.push(link.href);
  }
  renderPlaylist();
  recordPage("local", {});
}

function renderPlaylist() {
  grid.innerHTML = "";
  const images = [
    "http://127.0.0.1:8080/pictures/8f07a5a9314eeb0b1804e8450f72cc13987edd24.avif",
    "http://127.0.0.1:8080/pictures/download.jpeg",
    "http://127.0.0.1:8080/pictures/images.jpeg"
  ];
  songs.forEach((song, index) => {
    const card = document.createElement("div");
    card.className = "song-card";
    const image = images[index % images.length];
    const title = decodeURIComponent(song.split("/").pop().replace(".mp3", ""));
    card.innerHTML = `
      <img src="${image}" alt="cover">
      <div class="song-title">${title}</div>
      <div class="song-subtitle">Soundtrack</div>
    `;
    card.addEventListener("click", () => {
      currentSongIndex = index;
      loadSong(index);
    });
    grid.appendChild(card);
  });
}

function loadSong(index) {
  if (audio) audio.pause();
  audio = new Audio(songs[index]);
  audio.volume = volumeSlider.value;
  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
  });
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("ended", handleSongEnd);
  audio.play();
  togglePlayPause(true);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function togglePlayPause(playing) {
  playBtn.style.display = playing ? "none" : "inline";
  pauseBtn.style.display = playing ? "inline" : "none";
}

function updateProgress() {
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${percent}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
}

progressContainer.addEventListener("click", (e) => {
  const rect = progressContainer.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
});

function handleSongEnd() {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
}

function playNext() {
  currentSongIndex = isShuffle
    ? Math.floor(Math.random() * songs.length)
    : (currentSongIndex + 1) % songs.length;
  loadSong(currentSongIndex);
}

function playPrevious() {
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(currentSongIndex);
}

playBtn.addEventListener("click", () => {
  if (!audio.src) loadSong(currentSongIndex);
  else {
    audio.play();
    togglePlayPause(true);
  }
});

pauseBtn.addEventListener("click", () => {
  audio.pause();
  togglePlayPause(false);
});

nextIcon.addEventListener("click", playNext);
prevIcon.addEventListener("click", playPrevious);
shuffleIcon.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleIcon.classList.toggle("active", isShuffle);
});
repeatIcon.addEventListener("click", () => {
  isRepeat = !isRepeat;
  repeatIcon.classList.toggle("active", isRepeat);
});
volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

// HOME button
document.querySelector("img[alt='home']").addEventListener("click", async () => {
  await getSongs();
  pageHistory = [{ view: "local", data: {} }];
  currentPageIndex = 0;
});

// BACK button
document.querySelector(".a1").addEventListener("click", async () => {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    const { view, data } = pageHistory[currentPageIndex];
    if (view === "local") renderPlaylist();
    else if (view === "search") await performSearch(data.query, data.tracks);
  }
});

// FORWARD button
document.querySelector(".a2").addEventListener("click", async () => {
  if (currentPageIndex < pageHistory.length - 1) {
    currentPageIndex++;
    const { view, data } = pageHistory[currentPageIndex];
    if (view === "local") renderPlaylist();
    else if (view === "search") await performSearch(data.query, data.tracks);
  }
});

// INIT
(async function () {
  await getSpotifyToken();
  await getSongs();
})();
