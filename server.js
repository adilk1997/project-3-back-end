const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();

const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

// Routes
const authRouter = require('./controllers/auth');
const usersRouter = require('./controllers/users');
const questsRouter = require('./controllers/quests');
const countriesRouter = require('./controllers/countries');

// Seed
const seedCountries = require('./seed/seedCountries');

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', async () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}`);
  await seedCountries();
});

app.use(express.json());

app.use(cors({
  origin: 'https://joyful-ganache-ae62a5.netlify.app',
  credentials: true
}));

app.use(logger('dev'));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/countries', countriesRouter);
app.use('/users/:userId/quests', questsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});