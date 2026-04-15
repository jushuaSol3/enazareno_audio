const express = require('express');
const cors = require('cors');
require('dotenv').config();

const audioRoutes = require('./audioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/finalizedvoice-over', express.static('finalizedvoice-over'));

app.use('/api', audioRoutes);

app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`🔍 Test it: http://localhost:${PORT}/api/test`);
    console.log(`🔍 Book 1 preface audio: http://localhost:${PORT}/api/audio/1`);
    console.log(`🔍 Book 1 story audio: http://localhost:${PORT}/api/audio/1/story\n`);
});