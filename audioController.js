const path = require('path');
const fs = require('fs');
const bookData = require('./Bookdata');
const streamAudio = require('./streamAudio');

// ── Preface audio handler ─────────────────────────────────────
function getPrefaceAudio(req, res) {
    const bookId = parseInt(req.params.bookId);
    console.log(`\n📥 Request for bookId: ${bookId}`);

    const book = bookData.find(b => b.id === bookId);
    if (!book) {
        console.error(`❌ No book found with id ${bookId}`);
        return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const rawAudioPath = book.preface.audio;
    console.log(`📄 Raw path from JSON: "${rawAudioPath}"`);

    streamAudio(rawAudioPath, req, res);
}

// ── Story audio handler ───────────────────────────────────────
function getStoryAudio(req, res) {
    const bookId = parseInt(req.params.bookId);
    console.log(`\n📥 Request for story audio, bookId: ${bookId}`);

    const book = bookData.find(b => b.id === bookId);
    if (!book) {
        console.error(`❌ No book found with id ${bookId}`);
        return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const rawAudioPath = book.audio;
    console.log(`📄 Raw story path from JSON: "${rawAudioPath}"`);

    streamAudio(rawAudioPath, req, res);
}

// ── Test handler ──────────────────────────────────────────────
function getTest(req, res) {
    const voiceOverDir = path.join(__dirname, 'finalizedvoice-over');
    const exists = fs.existsSync(voiceOverDir);
    const files = exists ? fs.readdirSync(voiceOverDir) : [];
    res.json({
        serverRunning: true,
        booksLoaded: bookData.length,
        voiceOverFolderFound: exists,
        voiceOverContents: files,
        serverDir: path.join(__dirname, '..'),
    });
}

module.exports = { getPrefaceAudio, getStoryAudio, getTest };