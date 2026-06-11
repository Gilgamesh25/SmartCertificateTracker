// server/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const multer = require('multer');       // <-- TAMBAHKAN INI
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Koneksi Database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'smart_cert_db'
});

db.connect(err => {
    if (err) console.error('❌ DB Connection Error:', err);
    else console.log('✅ Connected to MySQL');
});

// ==========================================
// ROUTES
// ==========================================

// 1. Check-in / Login
app.post('/api/checkin', (req, res) => {
    const { email, eventCode } = req.body;
    if (!email || !eventCode) return res.status(400).json({ error: 'Email dan Kode Wajib Diisi' });

    const checkSql = `SELECT p.id, p.name, p.email, p.has_evaluated FROM participants p JOIN events e ON p.event_id = e.id WHERE p.email = ? AND e.unique_code = ?`;
    db.query(checkSql, [email, eventCode], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server Error' });

        if (results.length > 0) {
            return res.json({ success: true, message: 'Login berhasil', participant: { id: results[0].id, name: results[0].name, hasEvaluated: Boolean(results[0].has_evaluated) } });
        }

        db.query('SELECT id FROM events WHERE unique_code = ?', [eventCode], (err, events) => {
            if (events.length === 0) return res.status(404).json({ error: 'Kode event tidak valid' });
            
            const insertSql = 'INSERT INTO participants (event_id, name, email) VALUES (?, ?, ?)';
            db.query(insertSql, [events[0].id, email, email], (err, result) => {
                if (err) return res.status(500).json({ error: 'Gagal simpan peserta' });
                res.json({ success: true, message: 'Check-in berhasil', participant: { id: result.insertId, name: email, hasEvaluated: false } });
            });
        });
    });
});

// 2. Submit Evaluasi
app.post('/api/evaluation', (req, res) => {
    const { participantId, rating, feedback } = req.body;
    if (!participantId || !rating) return res.status(400).json({ error: 'Data tidak lengkap' });

    const pid = parseInt(participantId);
    const ratingNum = parseInt(rating);

    db.query('INSERT INTO evaluations (participant_id, rating, feedback) VALUES (?, ?, ?)', [pid, ratingNum, feedback || ''], (err) => {
        if (err) return res.status(500).json({ error: 'Gagal simpan evaluasi' });
        
        db.query('UPDATE participants SET has_evaluated = TRUE WHERE id = ?', [pid], (err) => {
            if (err) return res.status(500).json({ error: 'Gagal update status' });
            res.json({ success: true, message: 'Evaluasi dikirim! Sertifikat aktif.' });
        });
    });
});

// 3. Download Sertifikat (PDF) - WITH TEMPLATE IMAGE
app.get('/api/certificate/:participantId', (req, res) => {
    const pid = parseInt(req.params.participantId);

    const sql = `
        SELECT p.name, e.certificate_template, e.text_x, e.text_y, p.has_evaluated 
        FROM participants p 
        JOIN events e ON p.event_id = e.id 
        WHERE p.id = ?
    `;

    db.query(sql, [pid], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Peserta tidak ditemukan' });

        const data = results[0];
        if (!data.has_evaluated) return res.status(403).json({ error: 'Anda HARUS mengisi evaluasi terlebih dahulu!' });

        // Setup PDF
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Sertifikat-${data.name}.pdf`);
        doc.pipe(res);

        // ==================
        // TEMPLATE HANDLER
        // ==================
        
        // Koordinat nama peserta (bisa disesuain sama template)
        const nameX = data.text_x || 350;  // Default tengah
        const nameY = data.text_y || 280;
        
        if (data.certificate_template && fs.existsSync(data.certificate_template)) {
            // Pake gambar background asli
            doc.image(data.certificate_template, 0, 0, { 
                width: 842, 
                height: 595 
            });
        } else {
            // Fallback: Background biru polos
            doc.rect(0, 0, 842, 595).fill('#1e3a8a');
            doc.rect(30, 30, 782, 535).stroke('#ffffff');
        }

        // Tulisan Nama (diatas gambar)
        doc.fontSize(40).fillColor('#000000').text(data.name, nameX, nameY, {
            align: 'center',
            width: 300
        });

        doc.end();
    });
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// 1. Get All Events
app.get('/api/admin/events', (req, res) => {
    const sql = `SELECT e.*, COUNT(p.id) as total_peserta, (SELECT AVG(rating) FROM evaluations WHERE participant_id IN (SELECT id FROM participants WHERE event_id = e.id)) as avg_rating FROM events e LEFT JOIN participants p ON e.id = p.event_id GROUP BY e.id ORDER BY e.created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Setup Multer Storage & Create Event
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.post('/api/admin/events', upload.single('template'), (req, res) => {
    const { name, unique_code } = req.body;
    if (!name || !unique_code) return res.status(400).json({ error: 'Nama dan Kode wajib diisi' });

    const templatePath = req.file ? `uploads/${req.file.filename}` : null;
    const sql = 'INSERT INTO events (name, unique_code, certificate_template) VALUES (?, ?, ?)';
    db.query(sql, [name, unique_code, templatePath], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal simpan event' });
        res.json({ success: true, id: result.insertId });
    });
});

// 3. Delete Event
app.delete('/api/admin/events/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.query('DELETE FROM evaluations WHERE participant_id IN (SELECT id FROM participants WHERE event_id = ?)', [id], (err) => {
        db.query('DELETE FROM participants WHERE event_id = ?', [id], (err) => {
            db.query('DELETE FROM events WHERE id = ?', [id], (err) => {
                if (err) return res.status(500).json({ error: 'Gagal hapus' });
                res.json({ success: true });
            });
        });
    });
});

// 4. Get Participants by Event
app.get('/api/admin/events/:eventId/participants', (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const sql = 'SELECT id, name, email, has_evaluated, created_at FROM participants WHERE event_id = ? ORDER BY created_at DESC';
    db.query(sql, [eventId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 5. Update Event
app.put('/api/admin/events/:id', verifyAdminToken, (req, res) => {
    const id = parseInt(req.params.id);
    const { name, unique_code, text_x, text_y } = req.body;

    if (!name || !unique_code) {
        return res.status(400).json({ error: 'Nama dan Kode wajib diisi' });
    }

    const sql = 'UPDATE events SET name = ?, unique_code = ?, text_x = ?, text_y = ? WHERE id = ?';
    db.query(sql, [name, unique_code, text_x || 200, text_y || 300, id], (err) => {
        if (err) return res.status(500).json({ error: 'Gagal update event' });
        res.json({ success: true, message: 'Event updated!' });
    });
});


// ==========================================
// START SERVER (DI TARUH PALING BAWAH!)
// ==========================================
app.listen(5000, () => {
    console.log('🚀 Server running on http://localhost:5000');
});

// ==========================================
// ADMIN AUTH ROUTES
// ==========================================

// Login Admin
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan Password wajib diisi' });
    }

    const sql = 'SELECT * FROM admins WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Username atau Password salah' });
        }

        const admin = results[0];
        
        // Simple password check (bisa换成 bcrypt nanti)
        if (password === admin.password) {
            // Generate token sederhana (bisa换成 JWT)
            const token = Buffer.from(`${admin.id}:${admin.username}`).toString('base64');
            
            res.json({ 
                success: true, 
                message: 'Login berhasil',
                token: token,
                admin: { id: admin.id, username: admin.username }
            });
        } else {
            res.status(401).json({ error: 'Username atau Password salah' });
        }
    });
});

// Middleware untuk protek route admin
const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [id, username] = decoded.split(':');
        
        if (!id || !username) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        req.adminId = id;
        req.adminUsername = username;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Protect Routes Admin (tambahkan verifyAdminToken)
app.get('/api/admin/events', verifyAdminToken, (req, res) => {
    // ... kode get events yang lama
});

app.post('/api/admin/events', verifyAdminToken, upload.single('template'), (req, res) => {
    // ... kode create event yang lama
});

// ...protect route lain juga

app.listen(5000, () => {
    console.log('🚀 Server running on http://localhost:5000');
});