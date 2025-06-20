const express = require('express');
const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});


app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const romajiHtml = $('.romajilyrics').html();
    if (!romajiHtml) {
      return res.status(404).json({ success: false, error: 'Romaji section not found' });
    }

    // Replace <br> tags with newlines, then clean up text
    const romajiText = romajiHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, '').trim();
    
    // console.log("Sending back response:", { success: true, lyrics: romajiText });
    res.json({ success: true, lyrics: romajiText });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Proxy fetch failed', details: err.message });
  }
});

app.get('/search', async (req, res) => {
  console.log("Search query received:", req.query.q);
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing q parameter" });

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const firstLink = $('a.result__a').attr('href'); // this is the /l/?uddg=... link

  if (!firstLink) {
    return res.status(404).json({ success: false, error: 'No search result found' });
  }

  // Parse `uddg=` parameter
  const parsedUrl = new URL('https://duckduckgo.com' + firstLink);
  const realUrl = parsedUrl.searchParams.get('uddg');

  if (!realUrl) {
    return res.status(500).json({ success: false, error: 'Failed to extract final URL' });
  }

  console.log("Url:", realUrl);
  res.json({ success: true, url: decodeURIComponent(realUrl) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`CORS proxy running at http://localhost:${PORT}`);
});
