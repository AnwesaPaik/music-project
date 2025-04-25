async function getSongs() {
    let a = await fetch("http://127.0.0.1:8080/songs/")
    let response = await a.text();
    console.log(response)
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    let songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href)
        }
    }
    return songs
}

async function main() {
    //Get the list of all songs
    let songs = await getSongs()
    console.log(songs)

    //play the first song
    document.querySelector('#playButton').addEventListener('click', () => {
        const audio = new Audio(songs[0]);
        audio.play(); 
    });


    audio.addEventListener("loadeddata", () => {
        console.log(audio.duration, audio.currentSrc, audio.currentTime)
        // The duration variable now holds the duration (in seconds) of the audio clip
    });
}

main()


// http://192.168.31.218:8080
// http://127.0.0.1:8080