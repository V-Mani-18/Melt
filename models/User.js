const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  govidproof: { type: String },
  profileImage: { type: String, default: '' },
  friendRequests: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderUsername: String,
    senderProfilePic: String
  }],
  friends: [{
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    profilePic: String
  }],
  blockedUsers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    profilePic: String
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
