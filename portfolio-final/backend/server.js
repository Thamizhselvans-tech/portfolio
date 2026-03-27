// ============================================================
//  server.js — Portfolio Backend (Node.js + Express + MongoDB)
// ============================================================
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const nodemailer = require('nodemailer');
const path       = require('path');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── MongoDB Connection ──────────────────────────────────────
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// ─── Contact Message Schema ───────────────────────────────────
const contactSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true },
  subject:   { type: String, trim: true, default: 'No Subject' },
  message:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read:      { type: Boolean, default: false },
});
const Contact = mongoose.model('Contact', contactSchema);

// ─── Nodemailer (optional — set env vars to enable) ──────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Routes ──────────────────────────────────────────────────

// POST /api/contact — Save message & (optionally) send email
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, and message are required.' });
    }

    // Save to DB
    const doc = await Contact.create({ name, email, subject, message });

    // Send email notification (optional)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from:    `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to:      's.thamizhselvan911@gmail.com',
        subject: `New message: ${subject || 'Portfolio Contact'}`,
        html: `
          <h3>New portfolio contact from ${name}</h3>
          <p><b>Email:</b> ${email}</p>
          <p><b>Subject:</b> ${subject}</p>
          <p><b>Message:</b><br>${message}</p>
        `,
      });
    }

    res.status(201).json({ success: true, id: doc._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/contact — Retrieve all messages (protected by secret header)
app.get('/api/contact', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const messages = await Contact.find().sort({ createdAt: -1 });
  res.json(messages);
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (_, res) =>
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'))
  );
}

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
