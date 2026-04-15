const fs = require('fs');
const path = require('path');

/**
 * Streams an audio file with Range support (required for browser seek).
 * @param {string} rawAudioPath - The raw path from JSON (e.g. "./finalizedvoice-over/file.wav")
 * @param {object} res - Express response object
 * @param {object} req - Express request object
 */
function streamAudio(rawAudioPath, req, res) {
    // Strip "./" prefix and build the absolute path
    const cleanedPath = rawAudioPath.replace(/^\.\//, '');
    const filePath = path.join(__dirname, '..', cleanedPath);
    console.log(`📂 Resolved absolute path: "${filePath}"`);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File NOT found at: "${filePath}"`);
        const voiceOverDir = path.join(__dirname, '..', 'finalized voice-over');
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
}

module.exports = streamAudio;