// server/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const PDFDocument = require('pdfkit');
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

    if (!email || !eventCode) {
        return res.status(400).json({ error: 'Email dan Kode Wajib Diisi' });
    }

    console.log(`🔍 Proses check-in: ${email} | Kode: ${eventCode}`);

    // Cek apakah peserta sudah ada di database
    const checkSql = `
        SELECT p.id, p.name, p.email, p.has_evaluated 
        FROM participants p 
        JOIN events e ON p.event_id = e.id 
        WHERE p.email = ? AND e.unique_code = ?
    `;

    db.query(checkSql, [email, eventCode], (err, results) => {
        if (err) {
            console.error('❌ Error Checkin SELECT:', err);
            return res.status(500).json({ error: 'Server Error' });
        }

        if (results.length > 0) {
            // Peserta sudah pernah daftar
            console.log('✅ User lama login:', results[0].id);
            return res.json({ 
                success: true, 
                message: 'Login berhasil', 
                participant: { 
                    id: results[0].id, 
                    name: results[0].name, 
                    hasEvaluated: Boolean(results[0].has_evaluated) 
                } 
            });
        }

        // Kalau belum ada, cari IDEvent dulu
        db.query('SELECT id FROM events WHERE unique_code = ?', [eventCode], (err, events) => {
            if (err) {
                console.error('❌ Error cari Event:', err);
                return res.status(500).json({ error: 'Server Error' });
            }

            if (events.length === 0) {
                console.log('⚠️ Event tidak ketemu:', eventCode);
                return res.status(404).json({ error: 'Kode event tidak valid / tidak ditemukan' });
            }

            const eventId = events[0].id;
            console.log(`📌 Event ID: ${eventId}`);

            // Insert peserta baru
            const insertSql = 'INSERT INTO participants (event_id, name, email) VALUES (?, ?, ?)';
            db.query(insertSql, [eventId, email, email], (err, result) => {
                if (err) {
                    console.error('❌ Error Insert Peserta:', err);
                    return res.status(500).json({ error: 'Gagal menyimpan peserta baru' });
                }

                console.log('✅ Peserta baru dibuat, ID:', result.insertId);
                res.json({ 
                    success: true, 
                    message: 'Check-in berhasil', 
                    participant: { 
                        id: result.insertId, 
                        name: email, 
                        hasEvaluated: false 
                    } 
                });
            });
        });
    });
});

// 2. Submit Evaluasi
app.post('/api/evaluation', (req, res) => {
    const { participantId, rating, feedback } = req.body;

    console.log('📥 Receive Eval:', { participantId, rating });

    if (!participantId || !rating) {
        return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const pid = parseInt(participantId);
    const ratingNum = parseInt(rating);

    if (isNaN(pid)) {
        return res.status(400).json({ error: 'ID Peserta tidak valid' });
    }

    // Insert evaluasi
    const insertEval = 'INSERT INTO evaluations (participant_id, rating, feedback) VALUES (?, ?, ?)';
    db.query(insertEval, [pid, ratingNum, feedback || ''], (err) => {
        if (err) {
            console.error('❌ Error Insert Eval:', err);
            return res.status(500).json({ error: 'Gagal simpan evaluasi' });
        }

        // Update status peserta
        db.query('UPDATE participants SET has_evaluated = TRUE WHERE id = ?', [pid], (err) => {
            if (err) {
                console.error('❌ Error Update Status:', err);
                return res.status(500).json({ error: 'Gagal update status' });
            }

            console.log('✅ Evaluasi sukses!');
            res.json({ success: true, message: 'Evaluasi dikirim! Sertifikat aktif.' });
        });
    });
});

// 3. Download Sertifikat (PDF)
app.get('/api/certificate/:participantId', (req, res) => {
    const pid = parseInt(req.params.participantId);

    const sql = `
        SELECT p.name, e.certificate_template, e.text_x, e.text_y, p.has_evaluated 
        FROM participants p 
        JOIN events e ON p.event_id = e.id 
        WHERE p.id = ?
    `;

    db.query(sql, [pid], (err, results) => {
        if (err || results.length === 0) {
            console.error('❌ Data peserta tidak ketemu');
            return res.status(404).json({ error: 'Peserta tidak ditemukan' });
        }

        const data = results[0];
        
        // GATEKEEPER: Cek sudah evaluasi belum
        if (!data.has_evaluated) {
            return res.status(403).json({ error: 'Anda HARUS mengisi evaluasi terlebih dahulu!' });
        }

        // Bangun PDF
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Sertifikat-${data.name}.pdf`);

        doc.pipe(res);

        // Background Color (Biru Navy)
        doc.rect(0, 0, 842, 595).fill('#1e3a8a');
        
        // Border Dalam
        doc.rect(30, 30, 782, 535).stroke('#ffffff');
        
        // Judul
        doc.fontSize(30).fillColor('#ffffff').text('SERTIFIKAT', 0, 120, { align: 'center' });
        doc.fontSize(15).fillColor('#cbd5e1').text('Penghargaan ini diberikan kepada', 0, 170, { align: 'center' });
        
        // Nama Peserta
        doc.fontSize(40).fillColor('#ffffff').text(data.name, 0, 220, { align: 'center' });
        
        // Teks Tambahan
        doc.fontSize(12).fillColor('#cbd5e1').text('Atas partisipasi dalam pelatihan', 0, 280, { align: 'center' });

        doc.end();
    });
});

// 4. Dashboard Admin
app.get('/api/admin/dashboard', (req, res) => {
    const sql = `
        SELECT e.name as event_name, 
               COUNT(p.id) as total_peserta, 
               (SELECT AVG(rating) FROM evaluations WHERE participant_id IN (SELECT id FROM participants WHERE event_id = e.id)) as avg_rating
        FROM events e
        LEFT JOIN participants p ON e.id = p.event_id
        GROUP BY e.id
    `;
    db.query(sql, (err, results) => res.json(results));
});

app.listen(5000, () => {
    console.log('🚀 Server running on http://localhost:5000');
});

// ... (bagian koneksi db dan app.use sama)

// ROUTES ADMIN

// 1. Get All Events
app.get('/api/admin/events', (req, res) => {
    const sql = `
        SELECT e.*, 
               COUNT(p.id) as total_peserta, 
               (SELECT AVG(rating) FROM evaluations WHERE participant_id IN (SELECT id FROM participants WHERE event_id = e.id)) as avg_rating
        FROM events e
        LEFT JOIN participants p ON e.id = p.event_id
        GROUP BY e.id
        ORDER BY e.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Create Event
app.post('/api/admin/events', (req, res) => {
    const { name, unique_code } = req.body;
    if (!name || !unique_code) return res.status(400).json({ error: 'Data kurang lengkap' });

    const sql = 'INSERT INTO events (name, unique_code) VALUES (?, ?)';
    db.query(sql, [name, unique_code], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal simpan event' });
        res.json({ success: true, id: result.insertId });
    });
});

// 3. Delete Event
app.delete('/api/admin/events/:id', (req, res) => {
    const id = parseInt(req.params.id);
    // Hapus evaluasi связанной participant dulu
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
    const sql = 'SELECT * FROM participants WHERE event_id = ? ORDER BY created_at DESC';
    db.query(sql, [eventId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});