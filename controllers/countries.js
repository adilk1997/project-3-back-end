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


// Get countries by region from Rest Countries API
router.get('/region/:region', verifyToken, async (req, res) => {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/region/${req.params.region}`
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get country details by code from Rest Countries API
router.get('/alpha/:code', verifyToken, async (req, res) => {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${req.params.code}`
    );

    const data = await response.json();

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