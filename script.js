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

const updates = [
    { date: "Dec 12", title: "Winter Collection", message: "Chill vibes for cold nights.", image: "https://cdn.pixabay.com/photo/2019/12/18/04/11/dj-4702977_1280.jpg", icon: "fa-snowflake" },
    { date: "Dec 10", title: "New Album Drop", message: "Check the library.", icon: "fa-compact-disc" }
];
const achievements = [
    { icon: "fa-trophy", title: "Pro", desc: "50 Playlists" },
    { icon: "fa-headphones", title: "Audiophile", desc: "1k Hours" }
];

// --- DOM ---
const deckA = document.getElementById('audio-deck-a');
const deckB = document.getElementById('audio-deck-b');
const playWrapper = document.getElementById('play-btn');
const playIcon = playWrapper.querySelector('i');
const vinylImg = document.getElementById('vinyl-spin');
const titleLbl = document.getElementById('current-title');
const artistLbl = document.getElementById('current-artist');
const progressBg = document.getElementById('progress-container');
const progressFill = document.getElementById('progress');
const currTime = document.getElementById('current-time');
const durTime = document.getElementById('duration');
const likeBtn = document.getElementById('player-like-btn');
const queuePopup = document.getElementById('queue-popup');
const queueListContent = document.getElementById('queue-list-content');
const queueBtn = document.getElementById('queue-btn');
const suggestForm = document.getElementById('suggest-form');
const formStatus = document.getElementById('form-status');
const volSlider = document.querySelector('.vol-slider');

// --- STATE ---
let isPlaying = false;
let isShuffle = false;
let repeatState = 'none'; 
let currentPlaylist = [];
let originalPlaylist = [];
let songIndex = 0;
let queue = [];
let likedSongs = JSON.parse(localStorage.getItem('liked')) || [];
let userVolume = 1.0; 
let isFading = false;
let activeDeck = deckA; 
let inactiveDeck = deckB;
let crossfadeTriggered = false; 

// --- INIT ---
init();
function init() {
    renderFolders(); renderUpdates(); renderAchievements();
    originalPlaylist = [...songs];
    currentPlaylist = [...songs];
    
    // Init Deck A
    activeDeck.src = songs[0].src;
    activeDeck.load();
    updateTrackInfo(songs[0]);
    activeDeck.volume = userVolume;
}

// --- DUAL DECK ENGINE ---
function updateTrackInfo(s) {
    titleLbl.innerText = s.title;
    artistLbl.innerText = s.artist;
    updateLikeBtn();
}

function playSong() {
    if(isFading) return; 
    isPlaying = true;
    activeDeck.play();
    updateUI(true);
}

function pauseSong() {
    if(isFading) return;
    isPlaying = false;
    activeDeck.pause();
    updateUI(false);
}

function updateUI(play) {
    if(play) {
        playWrapper.classList.add('playing');
        playIcon.className = "fas fa-pause";
        vinylImg.classList.add('spinning');
    } else {
        playWrapper.classList.remove('playing');
        playIcon.className = "fas fa-play";
        vinylImg.classList.remove('spinning');
    }
}

playWrapper.onclick = () => isPlaying ? pauseSong() : playSong();
document.getElementById('next-btn').onclick = () => nextSong(true);
document.getElementById('prev-btn').onclick = prevSong;

/* --- SEAMLESS FADE (AUTO) --- */
async function transitionToSong(songObj) {
    if(isFading) return;
    isFading = true;
    crossfadeTriggered = true;
    
    inactiveDeck.src = songObj.src;
    inactiveDeck.load();
    updateTrackInfo(songObj);
    updateUI(true); 

    inactiveDeck.volume = 0;
    inactiveDeck.play();

    const fadeDur = 8000; 
    const steps = 80;
    const interval = fadeDur / steps;
    const volStep = userVolume / steps;

    for (let i = 0; i <= steps; i++) {
        if(!isFading) break; // Abort if manual interruption
        activeDeck.volume = Math.max(0, userVolume - (i * volStep));
        inactiveDeck.volume = Math.min(userVolume, i * volStep);
        await new Promise(r => setTimeout(r, interval));
    }

    if(isFading) {
        activeDeck.pause();
        activeDeck.currentTime = 0;
        activeDeck.volume = userVolume; 
        
        let temp = activeDeck;
        activeDeck = inactiveDeck;
        inactiveDeck = temp;
        
        isFading = false;
        crossfadeTriggered = false;
        isPlaying = true;
        setupProgressEvents(); 
    }
}

/* --- HARD CUT (MANUAL) --- */
function loadDeckInstant(s) {
    isFading = false;
    crossfadeTriggered = false;
    
    inactiveDeck.pause();
    inactiveDeck.currentTime = 0;
    inactiveDeck.volume = userVolume; 

    activeDeck.src = s.src;
    activeDeck.load();
    activeDeck.volume = userVolume;
    updateTrackInfo(s);
    
    playSong(); 
    setupProgressEvents(); 
}

function nextSong(manual = false) {
    let nextTrack;
    
    // 1. QUEUE Logic
    if(queue.length > 0) { 
        nextTrack = queue.shift(); 
        renderQueue(); 
    } 
    // 2. REPEAT ONE (Auto Only)
    else if(repeatState === 'one' && !manual) {
        activeDeck.currentTime = 0; 
        activeDeck.play(); 
        return;
    }
    // 3. PLAYLIST Logic
    else {
        songIndex++;
        if (songIndex > currentPlaylist.length - 1) {
            if(repeatState === 'none' && !manual) { 
                songIndex = currentPlaylist.length - 1; 
                pauseSong(); 
                return; 
            } else { 
                songIndex = 0; 
            }
        }
        nextTrack = currentPlaylist[songIndex];
    }
    
    if(manual) loadDeckInstant(nextTrack);
    else transitionToSong(nextTrack);
    
    renderSongList();
}

function prevSong() {
    songIndex--;
    if (songIndex < 0) songIndex = currentPlaylist.length - 1;
    loadDeckInstant(currentPlaylist[songIndex]);
    renderSongList();
}

// --- PROGRESS & AUTO-TRIGGER ---
function setupProgressEvents() {
    deckA.ontimeupdate = null; deckB.ontimeupdate = null;
    deckA.onended = null; deckB.onended = null;

    activeDeck.ontimeupdate = (e) => {
        const dur = e.srcElement.duration;
        const cur = e.srcElement.currentTime;
        if(!dur) return;

        const pct = (cur / dur) * 100;
        progressFill.style.width = pct + "%";
        currTime.innerText = fmt(cur);
        durTime.innerText = fmt(dur);

        // AUTO-CROSSFADE (10s before end)
        const timeLeft = dur - cur;
        if (timeLeft <= 10 && !isFading && !crossfadeTriggered && isPlaying && repeatState !== 'one') {
            nextSong(false); 
        }
    };
    
    // Fallback if song ends without trigger
    activeDeck.onended = () => {
        if(!crossfadeTriggered && repeatState !== 'one') nextSong(false);
        else if (repeatState === 'one') { activeDeck.currentTime = 0; activeDeck.play(); }
    };
}
setupProgressEvents(); 

progressBg.onclick = (e) => activeDeck.currentTime = (e.offsetX / progressBg.clientWidth) * activeDeck.duration;
const fmt = t => { const m=Math.floor(t/60), s=Math.floor(t%60); return `${m}:${s<10?'0'+s:s}`; };

function setVolume(val) {
    userVolume = val / 100;
    if(!isFading) activeDeck.volume = userVolume;
}

// --- SHUFFLE & REPEAT (FIXED) ---

// Helper to shuffle any array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('shuffle-btn');
    const curTitle = titleLbl.innerText;
    
    if (isShuffle) {
        btn.classList.add('active');
        
        // 1. Shuffle Main Playlist
        shuffleArray(currentPlaylist);
        
        // 2. Shuffle Queue (The Fix!)
        if(queue.length > 0) {
            shuffleArray(queue);
            renderQueue(); // Update UI immediately
        }
        
    } else {
        btn.classList.remove('active');
        // Restore playlist order
        currentPlaylist = [...originalPlaylist];
        // Note: We usually don't un-shuffle the user queue as that's confusing
    }
    
    // Re-sync index
    songIndex = currentPlaylist.findIndex(s => s.title === curTitle);
    if(document.getElementById('songs-view').style.display==='block') renderSongList();
}

function toggleRepeat() {
    const btn = document.getElementById('repeat-btn');
    if(repeatState === 'none') { repeatState='all'; btn.className="fas fa-redo active"; }
    else if(repeatState === 'all') { repeatState='one'; btn.className="fas fa-redo active repeat-one"; }
    else { repeatState='none'; btn.className="fas fa-redo"; }
}

function playFromList(i) {
    songIndex = i;
    loadDeckInstant(currentPlaylist[songIndex]);
}

// --- FOLDERS & LIBRARY ---
function renderFolders() {
    const c = document.getElementById('folders-container'); c.innerHTML = "";
    const liked = document.createElement('div'); liked.className='folder-card'; liked.style.borderColor='#ff007f';
    liked.innerHTML=`<i class="fas fa-heart" style="color:#ff007f"></i><h3>Liked</h3><small>${likedSongs.length} Songs</small>`;
    liked.onclick=()=>openFolder('Liked'); c.appendChild(liked);

    const all = document.createElement('div'); all.className='folder-card';
    all.innerHTML=`<i class="fas fa-music"></i><h3>All Songs</h3><small>${songs.length} Songs</small>`;
    all.onclick=()=>openFolder('All'); c.appendChild(all);

    [...new Set(songs.map(s=>s.genre))].forEach(g => {
        const d = document.createElement('div'); d.className='folder-card'; 
        d.innerHTML=`<i class="fas fa-folder"></i><h3>${g}</h3><small>${songs.filter(s=>s.genre===g).length}</small>`;
        d.onclick=()=>openFolder(g); c.appendChild(d);
    });
}
function openFolder(f) {
    if(f==='Liked') currentPlaylist = songs.filter(s=>likedSongs.includes(s.title));
    else if(f==='All') currentPlaylist = [...songs];
    else currentPlaylist = songs.filter(s=>s.genre===f);
    
    if(isShuffle) shuffleArray(currentPlaylist);

    document.getElementById('genre-view').style.display='none';
    document.getElementById('songs-view').style.display='block';
    document.getElementById('selected-genre-title').innerText = f==='All'?'All Songs':f;
    renderSongList();
}
function backToFolders() {
    document.getElementById('songs-view').style.display='none';
    document.getElementById('genre-view').style.display='block';
    renderFolders();
}
function renderSongList() {
    const c = document.getElementById('playlist-container'); c.innerHTML = "";
    if(currentPlaylist.length===0) c.innerHTML = "<p style='color:#777; text-align:center;'>No songs found.</p>";
    currentPlaylist.forEach((s,i) => {
        const d = document.createElement('div'); d.className = "song-item" + (s.title===titleLbl.innerText ? " playing":"");
        const heartClass = likedSongs.includes(s.title) ? "fas fa-heart reaction-btn liked" : "far fa-heart reaction-btn";
        d.innerHTML = `
            <div style="flex:1" onclick="playFromList(${i})"><h4>${s.title}</h4><small>${s.artist}</small></div>
            <div style="display:flex; gap:15px; align-items:center;">
                <i class="${heartClass}" onclick="toggleLike('${s.title}')"></i>
                <span style="font-size:0.8rem;color:#777;">${s.duration}</span>
                <button class="btn-add-queue" onclick="addToQueue('${s.title}')"><i class="fas fa-plus-circle"></i></button>
            </div>`;
        c.appendChild(d);
    });
}
function toggleLikeCurrent() {
    const t = titleLbl.innerText;
    likedSongs.includes(t) ? likedSongs=likedSongs.filter(x=>x!==t) : likedSongs.push(t);
    localStorage.setItem('liked', JSON.stringify(likedSongs));
    updateLikeBtn(); renderFolders(); 
    if(document.getElementById('songs-view').style.display === 'block') renderSongList();
}
function updateLikeBtn() {
    likeBtn.className = likedSongs.includes(titleLbl.innerText) ? "fas fa-heart reaction-btn liked" : "far fa-heart reaction-btn";
}
function toggleLike(t) {
    likedSongs.includes(t) ? likedSongs=likedSongs.filter(x=>x!==t) : likedSongs.push(t);
    localStorage.setItem('liked', JSON.stringify(likedSongs));
    renderSongList(); updateLikeBtn(); renderFolders();
}

// --- QUEUE ---
function addToQueue(t) { 
    const s = songs.find(x => x.title === t); 
    if(s) { queue.push(s); renderQueue(); if(!queuePopup.classList.contains('show')) queueBtn.style.color="#ff007f"; }
}
function renderQueue() { 
    const c = document.getElementById('queue-list-content'); c.innerHTML=""; 
    queue.forEach((s,i)=>c.innerHTML+=`<div class="queue-item"><div>${s.title}</div><button class="btn-clear-sm" onclick="removeFromQueue(${i})">x</button></div>`); 
    queueBtn.classList.toggle('active', queue.length > 0);
}
function removeFromQueue(i) { queue.splice(i, 1); renderQueue(); }
function clearQueue() { queue=[]; renderQueue(); }
function toggleQueuePopup() { queuePopup.classList.toggle('show'); }

// --- UI HELPERS ---
function renderUpdates() {
    const homeC = document.getElementById('home-updates-container');
    const profC = document.getElementById('profile-updates-container');
    if(homeC) homeC.innerHTML = updates.map(u=>`<div class="update-card"><img src="${u.image||''}" class="update-img" style="${!u.image?'display:none':''}"><h4>${u.title}</h4><p>${u.message}</p></div>`).join('');
    if(profC) profC.innerHTML = updates.map(u=>`<div class="update-card" data-title="${u.title}"><i class="fas ${u.icon} update-icon-display" style="display:none"></i><img src="${u.image||''}" class="update-img" style="${!u.image?'display:none':''}"><h4>${u.title}</h4><p>${u.message}</p></div>`).join('');
}
function renderAchievements() {
    document.getElementById('achievements-container').innerHTML = achievements.map(a=>`<div class="achievement-card"><i class="fas ${a.icon} achievement-icon"></i><h4>${a.title}</h4></div>`).join('');
}
function setActivityView(t) {
    const c = document.getElementById('profile-updates-container');
    c.className = t==='icons'?'updates-list icons-view':'updates-list tiles-view';
    document.getElementById('btn-view-tiles').classList.toggle('active', t==='tiles');
    document.getElementById('btn-view-icons').classList.toggle('active', t==='icons');
}
function showSection(id, el) {
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-links li').forEach(l=>l.classList.remove('active'));
    el.classList.add('active');
}

document.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    switch (e.code) {
        case 'Space': e.preventDefault(); isPlaying ? pauseSong() : playSong(); break;
        case 'ArrowRight': case 'KeyN': nextSong(true); break;
        case 'ArrowLeft': case 'KeyP': prevSong(); break;
        case 'KeyL': toggleLikeCurrent(); break;
        case 'ArrowUp': e.preventDefault(); setVolume(Math.min((userVolume*100)+10, 100)); volSlider.value = userVolume*100; break;
        case 'ArrowDown': e.preventDefault(); setVolume(Math.max((userVolume*100)-10, 0)); volSlider.value = userVolume*100; break;
    }
});

if(suggestForm) {
    suggestForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = suggestForm.querySelector('button'); btn.innerText = "Sending...";
        try { await fetch(suggestForm.action, { method:'POST', body:new FormData(suggestForm), headers:{'Accept':'application/json'} }); suggestForm.style.display='none'; formStatus.style.display='block'; }
        catch { alert("Error sending."); }
        btn.innerText = "Submit Suggestion";
    };
}
function resetForm() { formStatus.style.display='none'; suggestForm.style.display='block'; suggestForm.reset(); }