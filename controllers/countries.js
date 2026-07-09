const express = require('express');
const router = express.Router();

const Country = require('../models/country');
const verifyToken = require('../middleware/verify-token');


// Get all countries from MongoDB
router.get('/', verifyToken, async (req, res) => {
  try {
    const allCountries = await Country.find({});
    res.status(200).json(allCountries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/region/:region', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/country?region=${req.params.region}`,
      {
        headers: {
          'X-Api-Key': process.env.COUNTRY_API_KEY
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const countries = data.map((country) => ({
      name: {
        common: country.name
      },
      cca3: country.iso2,
      flags: {
        png: `https://flagcdn.com/w320/${country.iso2.toLowerCase()}.png`
      }
    }));

    res.status(200).json(countries);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get country by code
router.get('/alpha/:code', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/country?name=${req.params.code}`,
      {
        headers: {
          'X-Api-Key': process.env.COUNTRY_API_KEY
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(
      Array.isArray(data) ? data[0] : data
    );

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get one country from MongoDB by id
router.get('/:countryId', verifyToken, async (req, res) => {
  try {
    const country = await Country.findById(req.params.countryId)
      .populate('quests');

    res.status(200).json(country);

  } catch (error) {
    console.log(error);
    res.status(500).json({ err: error.message });
  }
});


module.exports = router;