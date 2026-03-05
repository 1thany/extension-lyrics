// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "capture") {
		const data = captureAnimeFrame();
		if (data) sendResponse(data);
	}
});

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

function injectScreenshotButton() {
	// Find the container where we want to place the button
	const titleContainer = document.querySelector('.linetitle3.c');
	
	// If the container doesn't exist yet, or our button is already there, do nothing
	if (!titleContainer || document.getElementById('anime-snap-btn')) return;

	// Create the button element
	const btn = document.createElement('button');
	btn.id = 'anime-snap-btn';
	btn.innerText = 'Snapshot';
    btn.className = 'boxitem bc2 c1 mar0';
	
	btn.style.marginLeft = '15px';
	btn.style.border = 'none';
	btn.style.cursor = 'pointer';
	btn.style.display = 'inline-block';

	// Attach the click event
	btn.addEventListener('click', (e) => {
		e.preventDefault(); // Prevents the link inside the div from being clicked
		const data = captureAnimeFrame();
		
		if (data) {
			// Send the data directly to the background script to download
			chrome.runtime.sendMessage({
				action: "download_from_page",
				dataUrl: data.dataUrl,
				filename: data.filename
			});
		}
	});

	// Add the button to the page inside the title container
	titleContainer.appendChild(btn);
}

// Run the injection function after a short delay to ensure the DOM is fully loaded
setTimeout(injectScreenshotButton, 1500);