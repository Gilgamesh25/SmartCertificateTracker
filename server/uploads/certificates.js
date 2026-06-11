const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/certificates'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Create Event + Upload Template
app.post('/api/admin/events', upload.single('template'), (req, res) => {
    const { name, unique_code } = req.body;
    const templatePath = req.file ? `uploads/certificates/${req.file.filename}` : null;

    const sql = 'INSERT INTO events (name, unique_code, certificate_template) VALUES (?, ?, ?)';
    db.query(sql, [name, unique_code, templatePath], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal simpan event' });
        res.json({ success: true, id: result.insertId });
    });
});