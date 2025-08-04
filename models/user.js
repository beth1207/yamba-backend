const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: String
});

module.exports = mongoose.model('User', userSchema);
