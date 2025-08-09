const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
  roomId: String,
  delivered: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);