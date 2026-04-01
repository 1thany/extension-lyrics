// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture") {
        const data = captureAnimeFrame();
        if (data) sendResponse(data);
    }
});

// --- Function to skip forward 88 seconds ---
function skipOpening() {
    const video = document.getElementById('vid');
    if (video) {
        video.currentTime += 88;
        console.log("Skipped 88 seconds forward.");
    } else {
        console.error("Video player not found! Cannot skip.");
    }
}

function captureAnimeFrame() {
    const video = document.getElementById('vid');
    if (!video) {
        console.error("Video player not found!");
        return;
    }

    // --- 1. Get the Anime Name ---
    const titleLink = document.querySelector('.linetitle3.c a');
    const animeName = titleLink ? titleLink.innerText.replace(/[^a-zA-Z0-9]/g, '') : 'UnknownAnime';
    const animeNameShort = animeName.substr(0, 100);

    // --- 2. Get the Episode Number ---
    const titleContainer = document.querySelector('.linetitle3.c');
    const fullText = titleContainer ? titleContainer.textContent : '';
    const epMatch = fullText.match(/Episode\s*(\d+)/i);
    const epNumber = epMatch ? epMatch[1] : '00';

    // --- 3. Format the Timestamp ---
    // Converts seconds into MMmSSs format
    const timeInSeconds = video.currentTime;
    const timestamp = new Date(timeInSeconds * 1000).toISOString().substr(14, 5).replace(':', 'm') + 's';

    // Combine them for the final filename
    const filename = `${animeNameShort}_${epNumber}_${timestamp}.png`;

    // --- 4. Capture the Screenshot ---
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data
    const dataUrl = canvas.toDataURL('image/png');

    console.log("Captured:", filename);
    
    return { dataUrl: dataUrl, filename: filename };
}

// --- UPDATED: Renamed to injectButtons to handle multiple buttons ---
function injectButtons() {
    const titleContainer = document.querySelector('.linetitle3.c');
    
    if (!titleContainer) return;

    // --- Snapshot Button ---
    if (!document.getElementById('anime-snap-btn')) {
        const snapBtn = document.createElement('button');
        snapBtn.id = 'anime-snap-btn';
        snapBtn.innerText = 'Snapshot';
        snapBtn.className = 'boxitem bc2 c1 mar0';
        snapBtn.style.marginLeft = '15px';
        snapBtn.style.border = 'none';
        snapBtn.style.cursor = 'pointer';
        snapBtn.style.display = 'inline-block';

        snapBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            const data = captureAnimeFrame();
            
            if (data) {
                chrome.runtime.sendMessage({
                    action: "download_from_page",
                    dataUrl: data.dataUrl,
                    filename: data.filename
                });
            }
        });
        titleContainer.appendChild(snapBtn);
    }

    // --- Skip OP Button ---
    if (!document.getElementById('anime-skip-btn')) {
        const skipBtn = document.createElement('button');
        skipBtn.id = 'anime-skip-btn';
        skipBtn.innerText = 'Skip OP (88s)';
        skipBtn.className = 'boxitem bc2 c1 mar0';
        skipBtn.style.marginLeft = '10px'; // A little spacing from the snap button
        skipBtn.style.border = 'none';
        skipBtn.style.cursor = 'pointer';
        skipBtn.style.display = 'inline-block';

        skipBtn.addEventListener('click', (e) => {
            e.preventDefault();
            skipOpening();
        });
        titleContainer.appendChild(skipBtn);
    }
}


// Listen for the 'S' key to skip the intro quickly without clicking
document.addEventListener('keydown', (e) => {
    // Ignore key presses if the user is typing in an input field or textarea (like a search bar/comments)
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;

    // Trigger skip if 's' or 'S' is pressed
    if (e.key.toLowerCase() === 's') {
        skipOpening();
    }
});

// Run the injection function after a short delay
setTimeout(injectButtons, 1500);