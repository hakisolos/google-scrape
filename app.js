const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express(); // Initialize Express
const PORT = 3000; // Define the port for the API

// Google scraping function
const scrapeGoogle = async (query, maxPages = 3) => {
  try {
    const results = [];
    const currentTime = new Date().toISOString();

    for (let i = 0; i < maxPages; i++) {
      const start = i * 10; // Start index for pagination
      const response = await axios.get(`https://www.google.com/search?q=${query}&start=${start}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const language = $('html').attr('lang') || 'id';

      // Parse results from the page
      $('.g').each((_, element) => {
        const title = $(element).find('h3').text().trim() || '';
        const link = $(element).find('a').attr('href') || '';
        const description = $(element).find('.VwiC3b').text().trim() || '';

        if (title && link) {
          results.push({
            created_at: currentTime,
            modified_at: currentTime,
            link,
            is_expanded: true,
            title,
            description,
            description_tokens: description.split(/\s+/).length,
            expanded_tokens: Math.ceil(description.split(/\s+/).length * 1.5),
            accept_language: language,
            engine: 'Google Search',
            expanded_description: description.length > 100 
              ? `${description.substring(0, 100)}...` 
              : description,
            scraped_at: currentTime,
          });
        }
      });
    }

    return { success: true, totalResults: results.length, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Anime-Planet character scraping function
const chara = async (query) => {
  try {
    const { data } = await axios.get(`https://www.anime-planet.com/characters/all?name=${query}&sort=likes&order=desc`);
    const $ = cheerio.load(data);
    const linkp = $('#siteContainer > table > tbody > tr:nth-child(1) > td.tableCharInfo > a').attr('href');
    
    if (!linkp) throw new Error('Character not found');

    const { data: charData } = await axios.get(`https://www.anime-planet.com${linkp}`);
    const $$ = cheerio.load(charData);

    return {
      nama: $$('#siteContainer > h1').text(),
      gender: $$('#siteContainer > section.pure-g.entryBar > div:nth-child(1)').text().split('\nGender: ')[1],
      warna_rambut: $$('#siteContainer > section.pure-g.entryBar > div:nth-child(2)').text().split('\nHair Color: ')[1],
      warna_mata: $$('#siteContainer > section:nth-child(11) > div > div > div > div > div:nth-child(1) > div').text().split('\n')[1],
      gol_darah: $$('#siteContainer > section:nth-child(11) > div > div > div > div > div:nth-child(2) > div').text().split('\n')[1],
      birthday: $$('#siteContainer > section:nth-child(11) > div > div > div > div > div:nth-child(3) > div').text().split('\n')[1],
      description: $$('#siteContainer > section:nth-child(11) > div > div > div > div > div:nth-child(1) > p').text(),
    };
  } catch (error) {
    throw new Error(`Error fetching character data: ${error.message}`);
  }
};

// Anime-Planet anime scraping function
const anime = async (query) => {
  try {
    const { data } = await axios.get(`https://www.anime-planet.com/anime/all?name=${query}`);
    const $ = cheerio.load(data);

    const result = [];
    $('#siteContainer > ul.cardDeck.cardGrid > li').each((_, el) => {
      const judul = $(el).find('a > h3').text();
      const link = `https://www.anime-planet.com${$(el).find('a').attr('href')}`;
      const thumb = `https://www.anime-planet.com${$(el).find('a > div.crop > img').attr('src')}`;

      if (judul && link && thumb) {
        result.push({ judul, link, thumb });
      }
    });

    return result;
  } catch (error) {
    throw new Error(`Error fetching anime data: ${error.message}`);
  }
};

// Anime-Planet manga scraping function
const manga = async (query) => {
  try {
    const { data } = await axios.get(`https://www.anime-planet.com/manga/all?name=${query}`);
    const $ = cheerio.load(data);

    const result = [];
    $('#siteContainer > ul.cardDeck.cardGrid > li').each((_, el) => {
      const judul = $(el).find('a > h3').text();
      const link = `https://www.anime-planet.com${$(el).find('a').attr('href')}`;
      const thumb = `https://www.anime-planet.com${$(el).find('a > div.crop > img').attr('src')}`;

      if (judul && link && thumb) {
        result.push({ judul, link, thumb });
      }
    });

    return result;
  } catch (error) {
    throw new Error(`Error fetching manga data: ${error.message}`);
  }
};

// Define API routes
app.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
  }

  const response = await scrapeGoogle(query);
  res.json(response);
});

app.get('/chara', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
  }

  try {
    const response = await chara(query);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/anime', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
  }

  try {
    const response = await anime(query);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/manga', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
  }

  try {
    const response = await manga(query);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
