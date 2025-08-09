
const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderUsername: { type: String, required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverUsername: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Friend', friendSchema);
