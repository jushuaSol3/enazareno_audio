let bookData = [];
try {
    bookData = require('../openBook.json');
    console.log(`✅ openBook.json loaded — ${bookData.length} books found`);
} catch (err) {
    console.error('❌ Failed to load openBook.json:', err.message);
    console.error('   Make sure openBook.json is in the same folder as server.js');
}

module.exports = bookData;