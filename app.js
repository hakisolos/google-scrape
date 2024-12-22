const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express(); // Initialize Express
const PORT = 3000; // Define the port for the API

// Define the Google scraping function
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

// Define the API route
app.get('/', async (req, res) => {
  const query = req.query.q; // Extract 'q' from query parameters

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter "q" is required.',
    });
  }

  console.log(`Processing search for query: ${query}`);

  const response = await scrapeGoogle(query);
  res.json(response); // Send the result as JSON
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
