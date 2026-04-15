const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors());
app.use(express.json());
app.use('/finalizedvoice-over', express.static('finalizedvoice-over'));


let bookData = [];
try {
    bookData = require('./openBook.json');
    console.log(`✅ openBook.json loaded — ${bookData.length} books found`);
} catch (err) {
    console.error('❌ Failed to load openBook.json:', err.message);
    console.error('   Make sure openBook.json is in the same folder as server.js');
}



app.get('/api/audio/:bookId', (req, res) => {
    const bookId = parseInt(req.params.bookId);
    console.log(`\n📥 Request for bookId: ${bookId}`);


    const book = bookData.find(b => b.id === bookId);
    if (!book) {
        console.error(`❌ No book found with id ${bookId}`);
        return res.status(404).json({ success: false, message: 'Book not found.' });
    }


    const rawAudioPath = book.preface.audio;
    console.log(`📄 Raw path from JSON: "${rawAudioPath}"`);


    const cleanedPath = rawAudioPath.replace(/^\.\//, '');
    const filePath = path.join(__dirname, cleanedPath);
    console.log(`📂 Resolved absolute path: "${filePath}"`);


    if (!fs.existsSync(filePath)) {
        console.error(`❌ File NOT found at: "${filePath}"`);

        const voiceOverDir = path.join(__dirname, 'finalized voice-over');
        if (fs.existsSync(voiceOverDir)) {
            console.log('📁 Contents of "finalized voice-over":');
            fs.readdirSync(voiceOverDir).forEach(f => console.log('   -', f));
        } else {
            console.error(`❌ "finalized voice-over" folder not found at: "${voiceOverDir}"`);
        }
        return res.status(404).json({
            success: false,
            message: 'Audio file not found on disk.',
            resolvedPath: filePath
        });
    }

    console.log(`✅ File found! Streaming...`);


    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        console.log(`📡 Streaming range: bytes ${start}-${end}/${fileSize}`);

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'audio/wav',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        console.log(`📡 Streaming full file (${fileSize} bytes)`);

        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'audio/wav',
            'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
    }
});


app.get('/api/audio/:bookId/story', (req, res) => {
    const bookId = parseInt(req.params.bookId);
    console.log(`\n📥 Request for story audio, bookId: ${bookId}`);


    const book = bookData.find(b => b.id === bookId);
    if (!book) {
        console.error(`❌ No book found with id ${bookId}`);
        return res.status(404).json({ success: false, message: 'Book not found.' });
    }


    const rawAudioPath = book.audio;
    console.log(`📄 Raw story path from JSON: "${rawAudioPath}"`);


    const cleanedPath = rawAudioPath.replace(/^\.\//, '');
    const filePath = path.join(__dirname, cleanedPath);
    console.log(`📂 Resolved absolute path: "${filePath}"`);


    if (!fs.existsSync(filePath)) {
        console.error(`❌ Story file NOT found at: "${filePath}"`);
        const voiceOverDir = path.join(__dirname, 'finalized voice-over');
        if (fs.existsSync(voiceOverDir)) {
            console.log('📁 Contents of "finalized voice-over":');
            fs.readdirSync(voiceOverDir).forEach(f => console.log('   -', f));
        } else {
            console.error(`❌ "finalized voice-over" folder not found at: "${voiceOverDir}"`);
        }
        return res.status(404).json({
            success: false,
            message: 'Story audio file not found on disk.',
            resolvedPath: filePath
        });
    }

    console.log(`✅ Story file found! Streaming...`);


    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        console.log(`📡 Streaming range: bytes ${start}-${end}/${fileSize}`);

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'audio/wav',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        console.log(`📡 Streaming full file (${fileSize} bytes)`);

        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'audio/wav',
            'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
    }
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
    });
});

app.listen(PORT, () => {
    console.log(`\n Server running at http://localhost:${PORT}`);
});