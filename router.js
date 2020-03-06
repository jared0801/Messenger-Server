const express = require('express');
const { getRooms } = require('./users');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Server is up and running');
});

router.get('/activeRooms', (req, res) => {
    res.send(getRooms());
});

module.exports = router;