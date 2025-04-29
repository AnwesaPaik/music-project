
async function getSongs() {
    let a = await fetch("http://127.0.0.1:8080/songs/");
    let response = await a.text();
    console.log("Fetched HTML:", response); // See if it's listing mp3s

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href);
        }
    }

    console.log("Songs found:", songs);
    return songs;
}


let audio = new Audio(songs[0]); // Replace with your dynamic song
const playPauseBtn = document.getElementById("pause-button");
const playIcon = document.getElementById("play-button");
const seekBar = document.getElementById("seek-bar");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");

audio.addEventListener("loadedmetadata", () => {
    seekBar.max = Math.floor(audio.duration);
    durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
    seekBar.value = Math.floor(audio.currentTime);
    currentTimeEl.textContent = formatTime(audio.currentTime);
});

seekBar.addEventListener("input", () => {
    audio.currentTime = seekBar.value;
});

playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        playIcon.textContent = "play.svg";
    } else {
        audio.pause();
        playIcon.textContent = "pause.svg";
    }
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}


main();



// http://192.168.31.218:8080
// http://127.0.0.1:8080