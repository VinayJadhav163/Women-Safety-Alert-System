const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize PostgreSQL database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

pool.connect((err) => {
    if (err) console.error("Database connection error. Ensure DATABASE_URL is set:", err.message);
    else console.log("Connected to PostgreSQL database.");
});

// Create tables
const initTables = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL
        )`);
        
        await pool.query(`CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            latitude REAL,
            longitude REAL,
            map_url TEXT,
            sent_count INTEGER
        )`);
        console.log("Database tables checked/created.");
    } catch (err) {
        console.error("Error creating tables:", err.message);
    }
};

initTables();

// --- Contact Routes ---
app.get('/api/contacts', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM contacts");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/contacts', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    
    try {
        const result = await pool.query("INSERT INTO contacts (name, email) VALUES ($1, $2) RETURNING id, name, email", [name, email]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/contacts/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query("DELETE FROM contacts WHERE id = $1", [id]);
        res.json({ deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Alert Routes ---
app.get('/api/alerts', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM alerts ORDER BY id DESC");
        res.json({
            count: result.rowCount,
            lastAlert: result.rowCount > 0 ? result.rows[0] : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/alerts', async (req, res) => {
    const { latitude, longitude, map_url, sent_count } = req.body;
    try {
        const result = await pool.query("INSERT INTO alerts (latitude, longitude, map_url, sent_count) VALUES ($1, $2, $3, $4) RETURNING id, latitude, longitude, map_url, sent_count", [latitude, longitude, map_url, sent_count]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
