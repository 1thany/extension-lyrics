console.log("Content script loaded successfully!");

var currentVideoTitle = 'No title detected';
var lastKnownUrl = location.href;

// Function to search for title
function detectTitle() {
  const title = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
  if (title) {
    const newTitle = title.textContent.trim();
    if (newTitle !== currentVideoTitle) {
      currentVideoTitle = newTitle;
      console.log("New title detected:", currentVideoTitle);
      injectLyricsPanel(); // Add or update lyrics panel whenever title changes
    }
  }
}

function removeLyricsPanel() {
  const panel = document.getElementById('lyrics-panel');
  if (panel) {
    panel.remove();
    console.log('Lyrics panel removed due to video change.');
  }
}


function cleanTitle(rawTitle) {
  return rawTitle
    .replace(/\[.*?\]/g, '')   // Remove anything inside [brackets]
    .replace(/\(.*?\)/g, '')   // Remove anything inside (parentheses)
    .replace(/cover/gi, '')    // Remove the word "cover" (case-insensitive)
    .replace(/instrumental/gi, '') // Remove "instrumental"
    .replace(/piano/gi, '')    // Remove "piano"
    .replace(/official/gi, '') // Remove "official"
    .replace(/mv/gi, '')       // Remove "MV"
    .replace(/lyric(s)?/gi, '') // Remove "lyric" or "lyrics"
    .replace(/video/gi, '')    // Remove "video"
    .replace(/music/gi, '')
    .replace(/\s+/g, ' ')      // Replace multiple spaces with one space
    .trim();                   // Trim spaces at both ends
}

// Function to inject the Lyrics Panel
function injectLyricsPanel() { 
  // Check if panel already exists to avoid duplicates
  if (document.getElementById('lyrics-panel')) {
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    #lyrics-panel {
      margin-top: 20px;
      padding: 10px;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 8px;
      max-width: 600px;
      max-height: 500px;
      overflow-y: auto;
      color: #000;
    }

    #lyrics-panel::-webkit-scrollbar {
      width: 8px;
    }

    #lyrics-panel::-webkit-scrollbar-thumb {
      background-color: #999;
      border-radius: 4px;
    }


    #lyrics-panel h2 {
      font-size: 18px;
      margin-bottom: 8px;
    }

    #lyrics-panel button {
      padding: 8px 12px;
      font-size: 14px;
      cursor: pointer;
      background-color: #ffffff;
      color: #000;
      border: 1px solid #aaa;
      border-radius: 4px;
    }

    #lyrics-panel pre {
      margin-top: 10px;
      white-space: pre-wrap;
      font-size: 1.5em
    }

    @media (prefers-color-scheme: dark) {
      #lyrics-panel {
        background-color: #1e1e1e;
        border-color: #444;
        color: #f0f0f0;
      }

      #lyrics-panel button {
        background-color: #333;
        color: #f0f0f0;
        border-color: #666;
      }
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'lyrics-panel';

  const heading = document.createElement('h2');
  heading.innerText = 'Lyrics Search';

  const button = document.createElement('button');
  button.innerText = 'Find Lyrics';

  button.addEventListener('click', () => {
    if (!currentVideoTitle || currentVideoTitle === 'No title detected') {
      console.error('Please wait for video title detection or refresh the page.');
      return;
    }

    const clean = cleanTitle(currentVideoTitle);
    if (!clean) {
      console.error('Failed to clean title');
      return;
    }
    chrome.runtime.sendMessage(
      {
        action: "fetchLyricsSmart",
        query: `${clean} romanji site:animesonglyrics.com`
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Message failed:", chrome.runtime.lastError.message);
          return;
        }

        if (response?.success) {
          const lyricsNode = document.createElement('pre');
          lyricsNode.innerText = response.lyrics;
          lyricsNode.style.marginTop = '10px';
          panel.appendChild(lyricsNode);
        } else {
          console.error("Error fetching lyrics:", response?.error || "Unknown error");
        }
      }
    );
  });


  panel.appendChild(heading);
  panel.appendChild(button);

  // Find YouTube right-hand side panel and insert above comments
  const target = document.querySelector('#secondary-inner');
  if (target) {
    target.prepend(panel);
  }
}

// MutationObserver setup
const observer = new MutationObserver(() => {
  if (location.href !== lastKnownUrl) {
    console.log("URL changed, resetting...");
    lastKnownUrl = location.href;
    currentVideoTitle = 'No title detected';
    removeLyricsPanel();
  }
  detectTitle();
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen to popup messages asking for the current video title
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTitle") {
    sendResponse({ title: currentVideoTitle });
  }
});

