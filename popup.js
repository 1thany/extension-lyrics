console.log("popup.js running");

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getTitle" }, (response) => {
      const titleElement = document.getElementById('videoTitle');
      if (response && response.title) {
        titleElement.textContent = response.title;
      } else if (response) {
        titleElement.textContent = 'No title detected';
      } else {
        titleElement.textContent = 'No video detected';
      }
    });

    // Send lyrics request after DOM + tabs loaded
    // console.log("Sending lyrics fetch request...");

    // chrome.runtime.sendMessage({
    //   action: "fetchLyricsFromVocaloid",
    //   url: "https://www.animesonglyrics.com/witch-watch/watch-me"
    // }, (response) => {
    //   if (response?.success) {
    //     console.log("Romaji lyrics:\n", response.lyrics);
    //     document.getElementById("lyricsBox").textContent = response.lyrics;
    //   } else {
    //     console.error("Error fetching lyrics:", response?.error || "Unknown error");
    //   }
    // });    

  });
});
