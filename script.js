/* --- script.js --- */

/* =========================================
   1. DATA MANAGEMENT
   ========================================= */

// SONG DATA
const songs = [
    { title: "Fallen", artist: "Juan Malalim", genre: "Pop", duration: "3:19", src: "/music/Fallen - Juan Malalim.mp3" },
    { title: "Salamin, Salamin", artist: "Juan Malalim", genre: "Pop", duration: "4:06", src: "/music/Salamin, Salamin - Juan Malalim.mp3" },
    { title: "Sining", artist: "Juan Malalim", genre: "RnB", duration: "3:21", src: "/music/Sining -  Juan Malalim.mp3" },
    { title: "Randomantic", artist: "Juan Malalim", genre: "RnB", duration: "4:23", src: "/music/song1.mp3" },
    { title: "Walang Kapalit", artist: "Juan Malalim", genre: "Indie", duration: "3:39", src: "/music/song2.mp3" },
    { title: "Shy Boi", artist: "Juan Malalim", genre: "Indie", duration: "4:45", src: "/music/song3.mp3" },
    { title: "When I Dream About You", artist: "Juan Malalim", genre: "Rock", duration: "1:42", src: "/music/When I Dream About You.mp3" },
    { title: "YK", artist: "Juan Malalim", genre: "Rock", duration: "2:50", src: "/music/YK - Juan Malalim.mp3" }
];

// UPDATES DATA (Home & Profile)
const updates = [
    { 
        date: "Dec 10, 2025", 
        title: "New Song Drop", 
        message: "Check out the hottest drops of the week.",
        image: "https://picsum.photos/id/10/400/200",
        icon: "fa-compact-disc" // <--- NEW ICON
    },
    { 
        date: "Dec 05, 2025", 
        title: "Website Launch", 
        message: "Welcome to OneMusic V1.0!", 
        icon: "fa-rocket"       // <--- NEW ICON
    },
    { 
        date: "Nov 28, 2025", 
        title: "Studio Vibes", 
        message: "Behind the scenes look.",
        image: "https://picsum.photos/id/453/400/200",
        icon: "fa-microphone"   // <--- NEW ICON
    }
];

// ACHIEVEMENTS DATA (Profile)
const achievements = [
    { icon: "fa-trophy", title: "Top Curator", desc: "Created 50+ Playlists" },
    { icon: "fa-headphones", title: "Audiophile", desc: "1,000 Hours Streamed" },
    { icon: "fa-star", title: "Vibe Master", desc: "Joined 2 Years Ago" },
    { icon: "fa-music", title: "Collector", desc: "100+ Songs Saved" }
];

/* =========================================
   2. DOM ELEMENTS & STATE
   ========================================= */

const audio = document.getElementById('audio-source');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const titleLabel = document.getElementById('current-title');
const artistLabel = document.getElementById('current-artist');
const progressContainer = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const currTimeLabel = document.getElementById('current-time');
const durationLabel = document.getElementById('duration');

// View Containers
const foldersContainer = document.getElementById('folders-container');
const playlistContainer = document.getElementById('playlist-container');
const genreView = document.getElementById('genre-view');
const songsView = document.getElementById('songs-view');
const selectedGenreTitle = document.getElementById('selected-genre-title');

// Queue Elements
const queuePopup = document.getElementById('queue-popup');
const queueListContent = document.getElementById('queue-list-content');
const queueBtn = document.getElementById('queue-btn');

// Form Elements
const suggestForm = document.getElementById('suggest-form');
const formStatus = document.getElementById('form-status');

// State Variables
let currentPlaylist = []; 
let songIndex = 0;
let isPlaying = false;
let queue = []; 

/* =========================================
   3. INITIALIZATION
   ========================================= */

init();

function init() {
    renderFolders();
    renderUpdates();
    renderAchievements();
    
    // Default to All songs initially
    currentPlaylist = songs; 
    loadSong(currentPlaylist[0]);
}

/* =========================================
   4. RENDER FUNCTIONS
   ========================================= */

// Folders
function renderFolders() {
    if(!foldersContainer) return;
    foldersContainer.innerHTML = "";
    
    const genres = [...new Set(songs.map(song => song.genre))];

    createFolderElement("All Songs", "All");
    genres.forEach(genre => {
        createFolderElement(genre, genre);
    });
}

function createFolderElement(displayName, filterKey) {
    const div = document.createElement('div');
    div.classList.add('folder-card');
    div.innerHTML = `
        <i class="fas fa-folder"></i>
        <h3>${displayName}</h3>
        <small>${songs.filter(s => filterKey === 'All' ? true : s.genre === filterKey).length} Songs</small>
    `;
    div.onclick = () => openFolder(filterKey);
    foldersContainer.appendChild(div);
}

// Open Folder Logic
function openFolder(genre) {
    if (genre === 'All') {
        currentPlaylist = songs;
        selectedGenreTitle.innerText = "All Songs";
    } else {
        currentPlaylist = songs.filter(s => s.genre === genre);
        selectedGenreTitle.innerText = genre + " Music";
    }

    renderSongList();
    genreView.style.display = 'none';
    songsView.style.display = 'block';
}

function backToFolders() {
    songsView.style.display = 'none';
    genreView.style.display = 'block';
}

// Render Songs inside Folder
function renderSongList() {
    playlistContainer.innerHTML = "";
    currentPlaylist.forEach((song, index) => {
        const div = document.createElement('div');
        div.classList.add('song-item');
        
        // Highlight active song
        if(song.title === titleLabel.innerText && queue.length === 0) {
            div.classList.add('playing');
        }

        div.innerHTML = `
            <div style="flex:1" onclick="playFromList(${index})">
                <h4>${song.title}</h4>
                <small>${song.artist}</small>
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <span style="font-size:0.8rem; color:#777;">${song.duration}</span>
                <button class="btn-add-queue" onclick="addToQueue('${song.title}')" title="Add to Queue">
                    <i class="fas fa-plus-circle"></i>
                </button>
            </div>
        `;
        playlistContainer.appendChild(div);
    });
}

// Render Updates
function renderUpdates() {
    const homeContainer = document.getElementById('home-updates-container');
    const profileContainer = document.getElementById('profile-updates-container');
    
    if(homeContainer) homeContainer.innerHTML = "";
    if(profileContainer) profileContainer.innerHTML = "";

    updates.forEach(update => {
        const imgHtml = update.image ? `<img src="${update.image}" alt="${update.title}" class="update-img">` : '';
        
        // We add 'data-title' for the tooltip in Icon View
        const html = `
            <div class="update-card" data-title="${update.title} - ${update.date}">
                <i class="fas ${update.icon || 'fa-bell'} update-icon-display" style="display:none;"></i>
                
                ${imgHtml}
                <span class="update-date">${update.date}</span>
                <h4>${update.title}</h4>
                <p>${update.message}</p>
            </div>
        `;
        if(homeContainer) homeContainer.innerHTML += html;
        if(profileContainer) profileContainer.innerHTML += html;
    });
}

// 3. TOGGLE FUNCTION
function setActivityView(viewType) {
    const container = document.getElementById('profile-updates-container');
    const btnTiles = document.getElementById('btn-view-tiles');
    const btnIcons = document.getElementById('btn-view-icons');

    if (viewType === 'icons') {
        container.classList.remove('tiles-view');
        container.classList.add('icons-view');
        
        btnTiles.classList.remove('active');
        btnIcons.classList.add('active');
    } else {
        container.classList.remove('icons-view');
        container.classList.add('tiles-view');
        
        btnIcons.classList.remove('active');
        btnTiles.classList.add('active');
    }
}

// Render Achievements
function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if(!container) return;
    container.innerHTML = "";
    
    achievements.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('achievement-card');
        div.innerHTML = `
            <i class="fas ${item.icon} achievement-icon"></i>
            <h4>${item.title}</h4>
            <small>${item.desc}</small>
        `;
        container.appendChild(div);
    });
}

/* =========================================
   5. PLAYER LOGIC
   ========================================= */

function loadSong(song) {
    titleLabel.innerText = song.title;
    artistLabel.innerText = song.artist;
    audio.src = song.src;
}

function playFromList(index) {
    songIndex = index;
    loadSong(currentPlaylist[songIndex]);
    playSong();
    renderSongList();
}

function playSong() {
    isPlaying = true;
    audio.play();
    playBtn.classList.remove('fa-play-circle');
    playBtn.classList.add('fa-pause-circle');
}

function pauseSong() {
    isPlaying = false;
    audio.pause();
    playBtn.classList.remove('fa-pause-circle');
    playBtn.classList.add('fa-play-circle');
}

function togglePlay() {
    if (isPlaying) pauseSong();
    else playSong();
}

function nextSong() {
    // 1. Check Queue First
    if (queue.length > 0) {
        const nextTrack = queue.shift();
        loadSong(nextTrack);
        playSong();
        renderQueue(); 
    } else {
        // 2. Normal Playlist Flow
        songIndex++;
        if (songIndex > currentPlaylist.length - 1) {
            songIndex = 0; 
        }
        loadSong(currentPlaylist[songIndex]);
        playSong();
        renderSongList();
    }
}

function prevSong() {
    songIndex--;
    if (songIndex < 0) {
        songIndex = currentPlaylist.length - 1;
    }
    loadSong(currentPlaylist[songIndex]);
    playSong();
    renderSongList();
}

/* =========================================
   6. QUEUE LOGIC
   ========================================= */

function addToQueue(songTitle) {
    const songObj = songs.find(s => s.title === songTitle);
    if(songObj) {
        queue.push(songObj);
        renderQueue();
        
        // Visual feedback
        if(!queuePopup.classList.contains('show')) {
            queueBtn.style.color = "#1db954";
            setTimeout(() => queueBtn.style.color = "#b3b3b3", 500);
        }
    }
}

function renderQueue() {
    queueListContent.innerHTML = "";
    if(queue.length === 0) {
        queueListContent.innerHTML = '<p style="color:#666; font-size:0.8rem; text-align:center;">Queue is empty.</p>';
        queueBtn.classList.remove('active');
    } else {
        queueBtn.classList.add('active');
        queue.forEach((song, i) => {
            const div = document.createElement('div');
            div.classList.add('queue-item');
            div.innerHTML = `
                <div>
                    <span style="color:white; font-size:0.9rem;">${song.title}</span><br>
                    <span style="color:#777; font-size:0.7rem;">${song.artist}</span>
                </div>
                <button class="btn-clear-sm" onclick="removeFromQueue(${i})"><i class="fas fa-times"></i></button>
            `;
            queueListContent.appendChild(div);
        });
    }
}

function removeFromQueue(index) {
    queue.splice(index, 1);
    renderQueue();
}

function clearQueue() {
    queue = [];
    renderQueue();
}

function toggleQueuePopup() {
    queuePopup.classList.toggle('show');
}

/* =========================================
   7. PROGRESS & VOLUME
   ========================================= */

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if(isNaN(duration)) return;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    
    const formatTime = (time) => {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    durationLabel.innerText = formatTime(duration);
    currTimeLabel.innerText = formatTime(currentTime);
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function setVolume(value) {
    audio.volume = value / 100;
}

/* =========================================
   8. NAVIGATION & FORM
   ========================================= */

function showSection(sectionId, element) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
}

// FORM HANDLING (AJAX)
if(suggestForm) {
    suggestForm.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        
        const formData = new FormData(suggestForm);
        const submitBtn = suggestForm.querySelector('button');
        const originalBtnText = submitBtn.innerText;

        submitBtn.innerText = "Sending...";
        submitBtn.disabled = true;

        try {
            const response = await fetch(suggestForm.action, {
                method: suggestForm.method,
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                suggestForm.style.display = "none";
                formStatus.style.display = "block";
                suggestForm.reset();
            } else {
                alert("Oops! There was a problem sending your form.");
            }
        } catch (error) {
            alert("Oops! There was a problem sending your form.");
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

function resetForm() {
    formStatus.style.display = "none";
    suggestForm.style.display = "block";
}

/* =========================================
   9. EVENT LISTENERS
   ========================================= */

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', nextSong);

progressContainer.addEventListener('click', setProgress);
