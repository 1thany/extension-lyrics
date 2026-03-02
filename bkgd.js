async function searchDuckDuckGo(query) {
  const res = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.url;
}

async function fetchLyricsFromResolvedUrl(url) {
  try {
    const res = await fetch(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`);
    console.log("Fetched target HTML, status:", res.status);
    const json = await res.json();
    return json;
  } catch (err) {
    return {  
      success: false,
      error: `Proxy fetch failed: ${err.message}`
    };
  }
}

//Single listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.action === "fetchLyricsFromVocaloid") {
    fetchLyricsFromResolvedUrl(message.url).then(sendResponse);
    return true; // Keep channel open
  }

  if (message.action === "fetchLyricsSmart") {
    (async () => {
      try {
        const lyricsPageUrl = await searchDuckDuckGo(message.query);
        console.log("Resolved lyrics page URL:", lyricsPageUrl);
        if (!lyricsPageUrl) {
          sendResponse({ success: false, error: "No search result found" });
          return;
        }

        const lyricsResult = await fetchLyricsFromResolvedUrl(lyricsPageUrl);
        sendResponse(lyricsResult);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === "download_from_page") {
		chrome.downloads.download({
			url: message.dataUrl,
			filename: message.filename,
			saveAs: true 
		});
	}
});

//Tab update listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes("youtube.com/watch")) {
    console.log("YouTube video page detected, injecting content script...");
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content-script.js']
    });
  }
});

//Command listener
chrome.commands.onCommand.addListener((command) => {
	if (command === "take-screenshot") {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			chrome.tabs.sendMessage(tabs[0].id, { action: "capture" }, (response) => {
				if (response) {
					chrome.downloads.download({
						url: response.dataUrl,
						filename: response.filename,
						saveAs: true
					});
				}
			});
		});
	}
});