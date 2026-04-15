const express = require('express');
const router = express.Router();
const { getPrefaceAudio, getStoryAudio, getTest } = require('./audioController');

router.get('/audio/:bookId', getPrefaceAudio);
router.get('/audio/:bookId/story', getStoryAudio);
router.get('/test', getTest);

module.exports = router;