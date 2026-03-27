// ============================================================
//  server.js — Portfolio Backend (Node.js + Express + MongoDB)
// ============================================================
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Contact API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const doc = await Contact.create({ name, email, subject, message });

    res.json({ success: true, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Test route
app.get('/', (req, res) => {
  res.send("🚀 Backend running successfully");
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));