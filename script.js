const clientId = 'a610e7903cd9407baf586ee82386f082';
const clientSecret = 'e0ebe6518ed1427f97160e9742f2fd63';

let accessToken = '';

async function getSpotifyToken() {
    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
        },
        body: "grant_type=client_credentials"
    });

    const data = await result.json();
    accessToken = data.access_token;
}

const searchInput = document.getElementById("searchInput");
const songList = document.querySelector(".playlist");

async function searchSpotifyTracks(query) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    });
    const data = await response.json();
    return data.tracks.items;
}

// const apiBase = "http://127.0.0.1:8080/api";

// document.querySelector(".signupbtn").addEventListener("click", async () => {
//   const email = prompt("Enter your email:");
//   const password = prompt("Enter your password:");
//   const res = await fetch(`${apiBase}/signup`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password })
//   });
//   alert(await res.text());
// });

searchInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    if (!query) return;

     // Avoid duplicate entries
     if (searchHistory[searchHistory.length - 1] !== query) {
        searchHistory.push(query);
        currentHistoryIndex = searchHistory.length - 1;
    }

    await performSearch(query);

    async function performSearch(query) {
        const tracks = await searchSpotifyTracks(query);
    
        songList.innerHTML = ""; // Clear old
    
        tracks.forEach(track => {
            const li = document.createElement("li");
            li.classList.add("songItem");
    
            li.innerHTML = `
                <img src="${track.album.images[0]?.url}" alt="${track.name}">
                <span>${track.name}</span>
                <span class="subtitle">${track.artists.map(a => a.name).join(", ")}</span>
                <audio src="${track.preview_url}" class="previewAudio"></audio>
            `;
    
            li.addEventListener("click", () => {
                const audio = li.querySelector(".previewAudio");
                document.querySelectorAll("audio").forEach(a => a.pause());
                if (audio) audio.play();
            });
    
            songList.appendChild(li);
        });
    }
    
});

let audio = new Audio();
let songs = [];
let currentSongIndex = 0;
let isShuffle = false;
let isRepeat = false;
let searchHistory = [];
let currentHistoryIndex = -1;
let pageHistory = [];
let currentPageIndex = -1;



// DOM
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
const playlistEl = document.getElementById("playlist");
const volumeSlider = document.getElementById("volume");

// Load Songs
async function getSongs() {
    const res = await fetch("http://127.0.0.1:8080/songs/");
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;
    const links = div.getElementsByTagName("a");
    for (let link of links) {
        if (link.href.endsWith(".mp3")) {
            songs.push(link.href);
        }
    }
    renderPlaylist();
}

// Render song list
function renderPlaylist() {
    const grid = document.getElementById("playlist-grid");
    grid.innerHTML = "";

    const images = [
        "http://127.0.0.1:8080/pictures/8f07a5a9314eeb0b1804e8450f72cc13987edd24.avif",
        "http://127.0.0.1:8080/pictures/download.jpeg",
        "http://127.0.0.1:8080/pictures/images.jpeg"
    ];

    songs.forEach((song, index) => {
        const card = document.createElement("div");
        card.classList.add("song-card");

        const imageSrc = images[index % images.length];
        const songTitle = decodeURIComponent(song.split("/").pop().replace(".mp3", ""));

        card.innerHTML = `
            <img src="${imageSrc}" alt="Song Art" />
            <div class="song-title">${songTitle}</div>
            <div class="song-subtitle">Soundtrack</div>
        `;

        card.addEventListener("click", () => {
            currentSongIndex = index;
            loadSong(index);
        });

        grid.appendChild(card);
    });
}

// Load a song
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
    highlightActiveSong(index);
}

// Highlight current song in playlist
function highlightActiveSong(index) {
    const allItems = document.querySelectorAll(".song-item");
    allItems.forEach((item, i) => {
        item.style.color = i === index ? "#1db954" : "";
        item.style.fontWeight = i === index ? "bold" : "";
    });
}

// Format time
function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}

// Toggle play/pause icons
function togglePlayPause(isPlaying) {
    playBtn.style.display = isPlaying ? "none" : "inline";
    pauseBtn.style.display = isPlaying ? "inline" : "none";
}

// Update progress bar
function updateProgress() {
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
}

// Progress click to seek
progressContainer.addEventListener("click", (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

// Handle song end
function handleSongEnd() {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        playNext();
    }
}

// Next/Prev
function playNext() {
    if (isShuffle) {
        let next;
        do {
            next = Math.floor(Math.random() * songs.length);
        } while (next === currentSongIndex);
        currentSongIndex = next;
    } else {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
    }
    loadSong(currentSongIndex);
}

function playPrevious() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
}

// Controls
playBtn.addEventListener("click", () => {
    if (!audio.src) 
        loadSong(currentSongIndex);
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

// Start
(async function () {
    await getSongs();
    if (songs.length > 0) {
        audio = new Audio(songs[currentSongIndex]); // prepare but don't play
        audio.volume = volumeSlider.value;
        audio.addEventListener("loadedmetadata", () => {
            durationEl.textContent = formatTime(audio.duration);
        });
        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("ended", handleSongEnd);
    }
})();

document.querySelector(".a1").addEventListener("click", async () => {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        searchInput.value = searchHistory[currentHistoryIndex];
        await performSearch(searchHistory[currentHistoryIndex]);
    }
});

document.querySelector(".a2").addEventListener("click", async () => {
    if (currentHistoryIndex < searchHistory.length - 1) {
        currentHistoryIndex++;
        searchInput.value = searchHistory[currentHistoryIndex];
        await performSearch(searchHistory[currentHistoryIndex]);
    }
});

getSpotifyToken();


