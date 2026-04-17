const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;


const audioPathCache = new Map();
const storyPathCache = new Map();


const statCache = new Map();




function getCachedStat(filePath) {
    const raw = fs.statSync(filePath);
    const cached = statCache.get(filePath);

    if (cached && cached.mtimeMs === raw.mtimeMs) {
        return cached;
    }

    const entry = { size: raw.size, mtimeMs: raw.mtimeMs };
    statCache.set(filePath, entry);
    return entry;
}


function resolveAudioPath(rawPath) {
    const cleanedPath = rawPath.replace(/^\.\//, '');
    const filePath = path.join(__dirname, cleanedPath);

    if (!fs.existsSync(filePath)) {
        return null;
    }
    return filePath;
}


function streamAudio(req, res, filePath) {
    let stat;
    try {
        stat = getCachedStat(filePath);
    } catch {
        return res.status(404).json({ success: false, message: 'Audio file no longer on disk.' });
    }

    const fileSize = stat.size;


    const etag = `"${stat.mtimeMs}-${fileSize}"`;
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('ETag', etag);
    res.setHeader('Accept-Ranges', 'bytes');

    if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
    }

    const range = req.headers.range;

    if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
            return res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
        }

        const chunkSize = end - start + 1;
        console.log(`[range] ${path.basename(filePath)} bytes ${start}-${end}/${fileSize}`);

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': chunkSize,
            'Content-Type': 'audio/wav',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        console.log(`[full] ${path.basename(filePath)} (${fileSize} bytes)`);

        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'audio/wav',
        });
        fs.createReadStream(filePath).pipe(res);
    }
}


let bookData = [];

const bookIndex = new Map();

try {
    bookData = require('./openBook.json');
    bookData.forEach(b => bookIndex.set(b.id, b));
    console.log(`openBook.json loaded — ${bookData.length} books indexed`);
} catch (err) {
    console.error('Failed to load openBook.json:', err.message);
}


app.use(cors());
app.use(express.json());


app.use('/finalizedvoice-over', express.static('finalizedvoice-over', {
    maxAge: '1d',
    etag: true,
    lastModified: true,
}));


app.get('/api/audio/:bookId', (req, res) => {
    const bookId = parseInt(req.params.bookId, 10);
    const book = bookIndex.get(bookId);

    if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found.' });
    }


    let entry = audioPathCache.get(bookId);

    if (entry === undefined) {

        const filePath = resolveAudioPath(book.preface.audio);
        entry = filePath ? { filePath } : null;
        audioPathCache.set(bookId, entry);

        if (!entry) {
            console.error(`Preface audio not found for book ${bookId}: "${book.preface.audio}"`);
        }
    }

    if (!entry) {
        return res.status(404).json({ success: false, message: 'Audio file not found on disk.' });
    }

    streamAudio(req, res, entry.filePath);
});


app.get('/api/audio/:bookId/story', (req, res) => {
    const bookId = parseInt(req.params.bookId, 10);
    const book = bookIndex.get(bookId);

    if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    let entry = storyPathCache.get(bookId);

    if (entry === undefined) {
        const filePath = resolveAudioPath(book.audio);
        entry = filePath ? { filePath } : null;
        storyPathCache.set(bookId, entry);

        if (!entry) {
            console.error(`Story audio not found for book ${bookId}: "${book.audio}"`);
        }
    }

    if (!entry) {
        return res.status(404).json({ success: false, message: 'Story audio file not found on disk.' });
    }

    streamAudio(req, res, entry.filePath);
});


app.get('/api/test', (req, res) => {
    const voiceOverDir = path.join(__dirname, 'finalized voice-over');
    const exists = fs.existsSync(voiceOverDir);
    const files = exists ? fs.readdirSync(voiceOverDir) : [];

    res.json({
        serverRunning: true,
        booksLoaded: bookData.length,
        voiceOverFolderFound: exists,
        voiceOverContents: files,
        serverDir: __dirname,
        cacheStats: {
            audioPaths: audioPathCache.size,
            storyPaths: storyPathCache.size,
            statEntries: statCache.size,
        },
    });
});


app.post('/api/cache/clear', (req, res) => {
    audioPathCache.clear();
    storyPathCache.clear();
    statCache.clear();
    console.log('All audio caches cleared.');
    res.json({ success: true, message: 'Audio path and stat caches cleared.' });
});



app.listen(PORT, () => {
    console.log(`\nServer running at http://localhost:${PORT}`);
});