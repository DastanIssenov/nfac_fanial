const user = localStorage.getItem('loggedInUser');

let currentTrack = null;
let currentTrackIndex = -1;
let selectedAlbumId = null;

let tracks = JSON.parse(localStorage.getItem(`${user}_tracks`) || '[]');
let albums = JSON.parse(localStorage.getItem(`${user}_albums`) || '[]');
let favorites = JSON.parse(localStorage.getItem(`${user}_favorites`) || '[]');

const favouritesAlbum = {
  id: 998,
  title: "Favourites",
  artist: "Your Picks",
  cover: "fav.jpg", 
  trackIds: favorites.slice()
};

const youtubeAlbum = {
  id: 999,
  title: "YouTube Downloads",
  artist: "YouTube",
  cover: "downloaded.png", 
  trackIds: []
};

if (!albums.find(a => a.id === favouritesAlbum.id)) {
  albums.push(favouritesAlbum);
} else {
  const fav = albums.find(a => a.id === favouritesAlbum.id);
  fav.cover = favouritesAlbum.cover;
}

if (!albums.find(a => a.id === youtubeAlbum.id)) {
  albums.push(youtubeAlbum);
} else {
  const yt = albums.find(a => a.id === youtubeAlbum.id);
  yt.cover = youtubeAlbum.cover;
}

function saveUserData() {
  localStorage.setItem(`${user}_tracks`, JSON.stringify(tracks));
  localStorage.setItem(`${user}_albums`, JSON.stringify(albums));
  localStorage.setItem(`${user}_favorites`, JSON.stringify(favorites));
}

const trackListEl = document.getElementById("track-list");
const albumsEl = document.getElementById("albums");
const playerEl = document.getElementById("player");
const playerCover = document.getElementById("player-cover");
const playerTitle = document.getElementById("player-title");
const playerArtist = document.getElementById("player-artist");
const progressEl = document.getElementById("progress");

const controlContainer = document.createElement("div");
controlContainer.style.display = "flex";
controlContainer.style.gap = "10px";
controlContainer.style.alignItems = "center";

const prevBtn = document.createElement("button");
prevBtn.textContent = "⏮";
const playPauseBtn = document.createElement("button");
playPauseBtn.textContent = "⏸";
const nextBtn = document.createElement("button");
nextBtn.textContent = "⏭";

controlContainer.appendChild(prevBtn);
controlContainer.appendChild(playPauseBtn);
controlContainer.appendChild(nextBtn);
playerEl.appendChild(controlContainer);

const timeDisplay = document.createElement("div");
timeDisplay.id = "time-display";
timeDisplay.style.color = "white";
timeDisplay.style.minWidth = "80px";
timeDisplay.textContent = "0:00 / 0:00";
playerEl.appendChild(timeDisplay);

const audio = new Audio();

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function renderTracks(trackArray, container) {
  container.innerHTML = "";
  trackArray.forEach((track) => {
    const trackEl = document.createElement("div");
    trackEl.className = "track";

    trackEl.innerHTML = `
      <img src="${track.cover}" alt="cover" />
      <div>
        <div><strong>${track.title}</strong></div>
        <div>${track.artist} | ${track.genre}</div>
      </div>
      <div>
        <button onclick="playTrack('${track.src}', '${track.title}', '${track.artist}', '${track.cover}', ${tracks.findIndex(t => t.src === track.src)})">Play</button>
        <button onclick="toggleFavorite(${track.id})">
          ${favorites.includes(track.id) ? "❤️" : "🤍"}
        </button>
        <button onclick="openAlbumModal(${track.id})">➕ Add to Album</button>
      </div>
    `;
    container.appendChild(trackEl);
  });
}

function renderAlbums() {
  albumsEl.innerHTML = "<h2>🎶 Albums</h2>";
  albums.forEach((album) => {
    const el = document.createElement("div");
    el.className = "album";
    el.innerHTML = `
      <img src="${album.cover}" alt="album cover" />
      <div>
        <strong>${album.title}</strong><br />
        <em>${album.artist}</em>
      </div>
      <button onclick="showAlbum(${album.id})">Open</button>
    `;
    albumsEl.appendChild(el);
  });
}

function showAlbum(albumId) {
  selectedAlbumId = albumId;
  const album = albums.find((a) => a.id === albumId);
  const albumTracks = tracks.filter((t) => album.trackIds.includes(t.id));
  renderTracks(albumTracks, trackListEl);
}

function playTrack(src, title, artist, cover, index) {
  currentTrack = tracks[index];
  currentTrackIndex = index;
  audio.src = src;
  audio.play();
  playerCover.src = cover;
  playerTitle.textContent = title;
  playerArtist.textContent = artist;
  playerEl.classList.remove("hidden");
  playPauseBtn.textContent = "⏸";
}

playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸";
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶";
  }
});

prevBtn.addEventListener("click", () => {
  const prevIndex = currentTrackIndex - 1;
  if (prevIndex >= 0) {
    const prev = tracks[prevIndex];
    playTrack(prev.src, prev.title, prev.artist, prev.cover, prevIndex);
  }
});

nextBtn.addEventListener("click", () => {
  const nextIndex = currentTrackIndex + 1;
  if (nextIndex < tracks.length) {
    const next = tracks[nextIndex];
    playTrack(next.src, next.title, next.artist, next.cover, nextIndex);
  }
});

audio.ontimeupdate = () => {
  const current = audio.currentTime;
  const total = audio.duration || 0;
  progressEl.value = (current / total) * 100 || 0;
  timeDisplay.textContent = `${formatTime(current)} / ${formatTime(total)}`;
};

progressEl.addEventListener("input", () => {
  audio.currentTime = (progressEl.value / 100) * audio.duration;
});

function toggleFavorite(id) {
  const favAlbum = albums.find(a => a.id === 998);
  if (!favAlbum) return;

  const isFav = favorites.includes(id);

  if (isFav) {
    favorites = favorites.filter(f => f !== id);
    favAlbum.trackIds = favAlbum.trackIds.filter(t => t !== id);
  } else {
    favorites.push(id);
    if (!favAlbum.trackIds.includes(id)) {
      favAlbum.trackIds.push(id);
    }
  }

  saveUserData();

  if (selectedAlbumId === favAlbum.id) {
    showAlbum(favAlbum.id);
  } else if (selectedAlbumId !== null) {
    showAlbum(selectedAlbumId);
  }
}

function submitYoutube() {
  const url = document.getElementById("youtube-url").value;
  if (!url) return alert("Please enter a valid URL.");

  fetch("http://127.0.0.1:5000/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Track added!");
        const newTrack = data.track;
        const ytAlbum = albums.find(a => a.id === 999);

        tracks.push(newTrack);
        if (ytAlbum && !ytAlbum.trackIds.includes(newTrack.id)) {
          ytAlbum.trackIds.push(newTrack.id);
        }

        saveUserData();
        renderAlbums();
        renderTracks(tracks, trackListEl);
      } else {
        alert("Download failed.");
      }
    });
}

function openAlbumModal(trackId) {
  document.getElementById("album-modal").style.display = "flex";
  document.getElementById("album-modal").dataset.trackId = trackId;

  const select = document.getElementById("album-select");
  select.innerHTML = "";
  albums.forEach(album => {
    if (album.id !== 998 && album.id !== 999) {
      const option = document.createElement("option");
      option.value = album.id;
      option.textContent = album.title;
      select.appendChild(option);
    }
  });

  document.getElementById("new-album-name").value = "";
  document.getElementById("new-album-image").value = "";
  const preview = document.getElementById("preview-album-cover");
  preview.src = "";
  preview.style.display = "none";
}

function closeAlbumModal() {
  document.getElementById("album-modal").style.display = "none";
}

function confirmAddToAlbum() {
  const trackId = parseInt(document.getElementById("album-modal").dataset.trackId);
  const existingAlbumId = parseInt(document.getElementById("album-select").value);
  const newName = document.getElementById("new-album-name").value.trim();
  const imageInput = document.getElementById("preview-album-cover");
  const newCover = imageInput.dataset.base64 || "";

  let albumIdToUse = existingAlbumId;

  if (newName) {
    const newId = Date.now();
    albums.push({
      id: newId,
      title: newName,
      artist: user,
      cover: newCover || "https://via.placeholder.com/50x50?text=ALBUM",
      trackIds: []
    });
    albumIdToUse = newId;
  }

  const album = albums.find(a => a.id === albumIdToUse);
  if (!album.trackIds.includes(trackId)) {
    album.trackIds.push(trackId);
  }

  saveUserData();
  closeAlbumModal();
  renderAlbums();
  if (selectedAlbumId === album.id) {
    showAlbum(album.id);
  }
}

// запускаем
renderAlbums();
renderTracks(tracks, trackListEl);
