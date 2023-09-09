// Import required modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const validUrl = require('valid-url');

// Initialize Express app
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const mySecret = process.env['MONGO_URI'];
// Connect to MongoDB using Mongoose
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

// Create a URL schema for MongoDB
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const Url = mongoose.model('Url', urlSchema);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve the HTML file
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Handle URL shortening and redirection
// ...

// Handle URL shortening and redirection
app.post('/api/shorturl', async function(req, res) {
  const originalUrl = req.body.url;

  // Check if the URL is valid
  if (!validUrl.isWebUri(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Check if the URL exists in the database
    const data = await Url.findOne({ original_url: originalUrl }).exec();

    if (data) {
      // URL already exists, return the existing short URL
      res.json({ original_url: data.original_url, short_url: data.short_url });
    } else {
      // Generate a new short URL
      const count = await Url.countDocuments().exec();

      const shortUrl = count + 1;
      const newUrl = new Url({ original_url: originalUrl, short_url: shortUrl });

      // Save the URL in the database
      const savedUrl = await newUrl.save();

      res.json({ original_url: savedUrl.original_url, short_url: savedUrl.short_url });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

// Redirect to the original URL based on the short URL
app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortUrl = req.params.short_url;

  try {
    const data = await Url.findOne({ short_url: shortUrl }).exec();

    if (data) {
      res.redirect(data.original_url);
    } else {
      res.json({ error: 'short url not found' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

// ...

// Start the server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
