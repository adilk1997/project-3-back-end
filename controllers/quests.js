const express = require('express');
const router = express.Router({ mergeParams: true });

const Quest = require('../models/quest');
const Country = require('../models/country')
const verifyToken = require('../middleware/verify-token');


const fetchFn =
    global.fetch ||
    ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));



const continentFromRestCountries = (region) => {
    if (!region) return null
    const r = region.toLowerCase()

    if (r === 'europe') return 'europe'
    if (r === 'asia') return 'asia'
    if (r === 'africa') return 'africa'
    if (r === 'oceania') return 'oceania'
    if (r === 'americas') return 'americas'

    return null
}

const getContinentForCountryName = async (countryName) => {
    const resp = await fetchFn(
        `https://restcountries.com/v5/name/${encodeURIComponent(countryName)}?fields=region`
    )

    if (!resp.ok) return null

    const data = await resp.json()
    const first = Array.isArray(data) ? data[0] : data
    return continentFromRestCountries(first?.region)
}

router.get('/', verifyToken, async (req, res) => {
    try {
        const quests = await Quest.find({ author: req.user._id })
            .populate('author').populate('country')
        res.status(200).json(quests)
    } catch (error) {
        console.log(error)
        res.status(500).json({ err: error.message });
    }
})

router.get('/:questId', verifyToken, async (req, res) => {
    try {
        const quest = await Quest.findById(req.params.questId)
            .populate('author').populate('country')
        res.status(200).json(quest)
    } catch (error) {
        console.log(error)
        res.status(500).json({ err: error.message });
    }
})

router.post('/', verifyToken, async (req, res) => {
    try {
        const questCountry = await Country.findById(req.body.country)
        if (!questCountry) {
            return res.status(400).json({ err: 'Country not found' });
        }
        const continent = await getContinentForCountryName(questCountry.name)

        if (!continent) return res.status(400).json({ err: 'Could not determine continent' })


        req.body.country = questCountry._id
        req.body.author = req.user._id
        req.body.continent = continent

        const quest = await Quest.create(req.body)

        questCountry.quests.push(quest._id)
        await questCountry.save();

        const populateQuest = await Quest.findById(quest._id).populate('author').populate('country')

        res.status(201).json(populateQuest)
    } catch (error) {
        res.status(400).json({ err: error.message });
    }
})

router.delete('/:questId', verifyToken, async (req, res) => {
    try {
        const quest = await Quest.findById(req.params.questId);
        if (!quest.author.equals(req.user._id)) {
            return res.status(403).send("You cannot delete this quest!")
        }
            await Country.findByIdAndUpdate(quest.country, {
                $pull: { quests: quest._id }
                });
            const deleteQuest = await quest.deleteOne();
            res.status(200).json(deleteQuest);
    } catch (error) {
        res.status(500).json({ err: error.message })
    };
});

router.put('/:questId', verifyToken, async (req, res) => {
    try {
        const quest = await Quest.findById(req.params.questId);
        if (!quest.author.equals(req.user._id)) {
            return res.status(403).send("You're cannot edit this quest!")
        }
        const updateQuest = await Quest.findByIdAndUpdate(
            req.params.questId, 
            req.body, 
            { new: true});
        updateQuest._doc.author = req.user;

        res.status(200).json(updateQuest);
    } catch (error) {
        res.status(500).json({ err: error.message })
    }
})

module.exports = router