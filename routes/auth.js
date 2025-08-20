const express = require('express');
const router = express.Router();
const User = require('../models/user'); 

// Temporary in-memory stores (reset on server restart)
const otpStore = {};     // phone -> OTP
const tempUsers = {};    // phone -> { username }

//
// Send OTP (for signup)
//
router.post('/send-otp', (req, res) => {
  const { username, phone } = req.body;
  if (!phone || !username) {
    return res.status(400).json({ message: 'Username and phone required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[phone] = otp;
  tempUsers[phone] = { username };

  // TODO: Integrate SMS API (e.g. Twilio) to actually send OTP
  console.log(`OTP for ${phone}: ${otp}`);

  res.json({ message: 'OTP sent' });
});

//
// Verify OTP
//
router.post('/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, message: 'Phone and OTP required' });
  }

  if (otpStore[phone] === code) {
    delete otpStore[phone]; // clear OTP once used
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid OTP' });
  }
});

//
// Signup (after OTP verified)
//
router.post('/signup', async (req, res) => {
  const { phone, password } = req.body;
  const username = tempUsers[phone]?.username;

  if (!username) {
    return res.status(400).json({ message: 'No signup info found. Start again.' });
  }

  const existing = await User.findOne({ phone });
  if (existing) {
    return res.status(400).json({ message: 'Phone already registered' });
  }

  const newUser = new User({ username, phone, password }); // ⚠️ will hash later
  await newUser.save();

  delete tempUsers[phone]; // cleanup

  res.status(201).json({ message: 'User registered' });
});

//
// Login
//
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone });

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ message: "Login successful", user });
});

module.exports = router;
