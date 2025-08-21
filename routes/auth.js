const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// In-memory (restart clears). For production, use Redis or a TTL collection.
const otpStore = {};   // phone -> '123456'
const tempUsers = {};  // phone -> { username }

// Util: sign JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id || user._id.toString(), phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

// ========== OTP ==========

// Send OTP (start signup)
router.post('/send-otp', (req, res) => {
  const { username, phone } = req.body;
  if (!username || !phone) {
    return res.status(400).json({ message: 'Username and phone required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[phone] = otp;
  tempUsers[phone] = { username };

  // TODO: integrate SMS provider (Twilio, Africa’s Talking, etc.)
  console.log(`OTP for ${phone}: ${otp}`);

  return res.json({ message: 'OTP sent' });
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, message: 'Phone and OTP required' });
  }
  if (otpStore[phone] !== code) {
    return res.json({ success: false, message: 'Invalid OTP' });
  }
  // mark verified (simple)
  delete otpStore[phone];
  return res.json({ success: true });
});

// ========== Auth ==========

// Signup (after OTP verified)
router.post('/signup', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password required' });
    }

    const pending = tempUsers[phone];
    if (!pending) {
      return res.status(400).json({ message: 'No signup info found or OTP not verified' });
    }

    const exists = await User.findOne({ phone });
    if (exists) return res.status(409).json({ message: 'Phone already registered' });

    const user = new User({ username: pending.username, phone, password });
    await user.save();

    delete tempUsers[phone];

    const token = signToken(user);
    return res.status(201).json({
      message: 'User registered',
      token,
      user: user.toSafeObject(),
    });
  } catch (e) {
    console.error('Signup error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required' });
    }

    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
