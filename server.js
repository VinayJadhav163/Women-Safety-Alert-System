const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database error:", err.message);
    else console.log("Connected to SQLite database.");
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        latitude REAL,
        longitude REAL,
        map_url TEXT,
        sent_count INTEGER
    )`);
});

// --- Contact Routes ---
app.get('/api/contacts', (req, res) => {
    db.all("SELECT * FROM contacts", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/contacts', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    
    const stmt = db.prepare("INSERT INTO contacts (name, email) VALUES (?, ?)");
    stmt.run([name, email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, email });
    });
    stmt.finalize();
});

app.delete('/api/contacts/:id', (req, res) => {
    const id = req.params.id;
    const stmt = db.prepare("DELETE FROM contacts WHERE id = ?");
    stmt.run(id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
    stmt.finalize();
});

// --- Alert Routes ---
app.get('/api/alerts', (req, res) => {
    db.all("SELECT * FROM alerts ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            count: rows.length,
            lastAlert: rows.length > 0 ? rows[0] : null
        });
    });
});

app.post('/api/alerts', (req, res) => {
    const { latitude, longitude, map_url, sent_count } = req.body;
    const stmt = db.prepare("INSERT INTO alerts (latitude, longitude, map_url, sent_count) VALUES (?, ?, ?, ?)");
    stmt.run([latitude, longitude, map_url, sent_count], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, latitude, longitude, map_url, sent_count });
    });
    stmt.finalize();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`You can now open 'index.html' locally to use the backend.`);
});
