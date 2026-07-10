const express = require('express');
const router = express.Router();

const Quest = require('../models/quest');
const Country = require('../models/country')
const verifyToken = require('../middleware/verify-token');

const fetchFn =
    global.fetch ||
    ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));

const countryApiHeaders = {
    Authorization: `Bearer ${process.env.COUNTRY_API_KEY}`,
};

// RestCountries v5 returns { names: { common }, codes: { alpha_3 }, flag: { url_png, url_svg }, region }
// Normalize to the shape the frontend already expects (name.common, flags.png, cca3)
const normalizeV5Country = (c) => ({
    name: { common: c?.names?.common },
    flags: { png: c?.flag?.url_png, svg: c?.flag?.url_svg },
    cca3: c?.codes?.alpha_3,
    region: c?.region,
});

// Proxy to RestCountries v5 so the paid API key stays server-side, never shipped to the browser bundle
router.get('/external/region/:region', verifyToken, async (req, res) => {
    try {
        const resp = await fetchFn(
            `https://api.restcountries.com/countries/v5/region/${encodeURIComponent(req.params.region)}`,
            { headers: countryApiHeaders }
        );
        if (!resp.ok) {
            const errBody = await resp.text();
            return res.status(resp.status).json({ err: `RestCountries error: ${errBody}` });
        }
        const json = await resp.json();
        const objects = json?.data?.objects || [];
        res.status(200).json(objects.map(normalizeV5Country));
    } catch (error) {
        res.status(500).json({ err: error.message });
    }
});

router.get('/external/alpha/:code', verifyToken, async (req, res) => {
    try {
        const resp = await fetchFn(
            `https://api.restcountries.com/countries/v5/codes.alpha_3/${encodeURIComponent(req.params.code)}`,
            { headers: countryApiHeaders }
        );
        if (!resp.ok) {
            const errBody = await resp.text();
            return res.status(resp.status).json({ err: `RestCountries error: ${errBody}` });
        }
        const json = await resp.json();
        const objects = json?.data?.objects || [];
        res.status(200).json(objects[0] ? normalizeV5Country(objects[0]) : null);
    } catch (error) {
        res.status(500).json({ err: error.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const allCountries = await Country.find({})
        // const countries = allCountries.filter(country => 
        //     country.quests.length > 0
        // )
    res.status(200).json(allCountries)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

router.get('/:countryId', verifyToken, async (req, res) => {
    try {
        const country = await Country.findById(req.params.countryId)
        .populate('quests')
        res.status(200).json(country)
    } catch (error) {
        console.log(error)
        res.status(500).json({ err: error.message });
    }
})

module.exports = router
