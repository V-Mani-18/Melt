const express = require('express');
const router = express.Router();
const User = require('../models/User');

const multer = require('multer');
const path = require('path');
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const passport = require('passport');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Temporary OTP storage (in-memory)
const otpStorage = {};

// ================= Signup =================
router.post('/signup', upload.single('idProof'), async (req, res) => {
  try {
    const { name, username, email, phone, password, gender } = req.body;
    // Check required fields for social login
    if (!name || !username || !email) {
      return res.status(400).json({ message: 'Name, username, and email are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists.' });
    }

    // Handle file upload
    let govidproof = '';
    if (req.file) {
      govidproof = req.file.filename;
    }

    // For social login, password/phone/gender may be empty
    const user = new User({
      name,
      username,
      email,
      phone: phone || '',
      password: password || '', // You may want to generate a random string or leave blank
      gender: gender || '',
      govidproof,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ================= Login =================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Print user ID to console
    console.log('User logged in:', user._id);

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Send OTP =================
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = 5 * 60 * 1000; // 5 minutes

    otpStorage[phone] = { otp, expires: Date.now() + ttl };

    await twilio.messages.create({
      body: `Your verification code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// ================= Verify OTP =================
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const storedOtp = otpStorage[phone];
    if (!storedOtp) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (Date.now() > storedOtp.expires) {
      delete otpStorage[phone];
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    delete otpStorage[phone];
    res.status(200).json({ message: 'Phone number verified' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// ================= Search Users =================
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json([]); // Return empty array if no query
    }
    const users = await User.find({
      username: { $regex: q, $options: 'i' } // match anywhere, case-insensitive
    }).select('username profileImage _id');
    // Optional: log for debugging
    console.log('Search query:', q, 'Results:', users);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// ================= Last Registered Users (limit param) =================
router.get('/last-logins', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // Sort by _id descending (MongoDB ObjectId contains creation time)
    const users = await User.find({})
      .sort({ _id: -1 })
      .limit(limit)
      .select('username profileImage _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user by ID
router.delete('/user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile image
router.put('/user/:id/profile-image', async (req, res) => {
  try {
    const { profileImage } = req.body;
    await User.findByIdAndUpdate(req.params.id, { profileImage });
    res.json({ message: 'Profile image updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update About field
router.put('/user/:id/about', async (req, res) => {
  try {
    const { about } = req.body;
    // Limit to 60 words
    if (about && about.split(/\s+/).length > 60) {
      return res.status(400).json({ message: 'About section must be 60 words or less.' });
    }
    await User.findByIdAndUpdate(req.params.id, { about });
    res.json({ message: 'About updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add friend to user's friend list (bi-directional)
router.post('/user/:id/add-friend', async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.params.id);
    const friend = await User.findById(friendId);
    if (!user || !friend) return res.status(404).json({ message: 'User not found' });
    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
      await user.save();
    }
    if (!friend.friends.includes(user._id)) {
      friend.friends.push(user._id);
      await friend.save();
    }
    res.json({ message: 'Friend added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friendRequests
router.post('/friendRequests', async (req, res) => {
  try {
    const { senderId, senderUsername, senderProfilePic, receiverId } = req.body;
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    if (!sender || !receiver) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicate requests
    if (receiver.friendRequests.some(r => r.senderId.equals(senderId))) {
      return res.status(409).json({ message: 'Request already sent' });
    }

    // Add request to receiver
    receiver.friendRequests.push({
      senderId,
      senderUsername: senderUsername || sender.username,
      senderProfilePic: senderProfilePic || sender.profileImage || '',
    });
    await receiver.save();

    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all friend requests for a user (received)
router.get('/user/:id/friendRequests', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user.friendRequests || []);
});

// Accept a friend request
router.post('/friendRequests/:senderId/accept', async (req, res) => {
  try {
    const receiverId = req.body.receiverId;
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(req.params.senderId);
    if (!receiver || !sender) return res.status(404).json({ message: 'User not found' });

    // Remove request from receiver
    receiver.friendRequests = receiver.friendRequests.filter(r => !r.senderId.equals(sender._id));

    // Add each other to friends
    if (!receiver.friends.some(f => f.friendId.equals(sender._id))) {
      receiver.friends.push({
        friendId: sender._id,
        username: sender.username,
        profilePic: sender.profileImage || ''
      });
    }
    if (!sender.friends.some(f => f.friendId.equals(receiver._id))) {
      sender.friends.push({
        friendId: receiver._id,
        username: receiver.username,
        profilePic: receiver.profileImage || ''
      });
    }
    await receiver.save();
    await sender.save();

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject/remove a friend request
router.post('/friendRequests/:senderId/reject', async (req, res) => {
  try {
    const receiverId = req.body.receiverId;
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(req.params.senderId);
    if (!receiver || !sender) return res.status(404).json({ message: 'User not found' });

    // Remove from receiver's friendRequests
    receiver.friendRequests = receiver.friendRequests.filter(
      r => !r.senderId.equals(req.params.senderId)
    );
    await receiver.save();

    // Remove from sender's friendRequests (sent requests)
    sender.friendRequests = sender.friendRequests.filter(
      r => !r.receiverId.equals(receiverId)
    );
    await sender.save();

    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's friends list
router.get('/user/:id/friends', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // If friends are stored as objects with friendId, populate them:
    const friends = await Promise.all(
      user.friends.map(async (f) => {
        const friend = await User.findById(f.friendId);
        return {
          _id: friend._id,
          username: friend.username,
          profilePic: friend.profileImage || '',
        };
      })
    );
    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend from user's friend list
router.post('/user/:id/remove-friend', async (req, res) => {
  try {
    const userId = req.params.id;
    const { friendId } = req.body;
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) return res.status(404).json({ message: 'User not found' });

    // Remove friend from user's friends array
    user.friends = user.friends.filter(f => !f.friendId.equals(friendId));
    await user.save();

    // Remove user from friend's friends array
    friend.friends = friend.friends.filter(f => !f.friendId.equals(userId));
    await friend.save();

    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/user/:id', async (req, res) => {
  try {
    const updateFields = req.body;
    await User.findByIdAndUpdate(req.params.id, updateFields);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Block a user
router.post('/user/:id/block', async (req, res) => {
  try {
    const userId = req.params.id;
    const { blockUserId } = req.body;
    const user = await User.findById(userId);
    const blockUser = await User.findById(blockUserId);
    if (!user || !blockUser) return res.status(404).json({ message: 'User not found' });

    // Remove from friends list for both users
    user.friends = user.friends.filter(f => !f.friendId.equals(blockUserId));
    blockUser.friends = blockUser.friends.filter(f => !f.friendId.equals(userId));
    await user.save();
    await blockUser.save();

    // Prevent duplicate blocks
    if (!user.blockedUsers.some(b => b.userId.equals(blockUserId))) {
      user.blockedUsers.push({
        userId: blockUser._id,
        username: blockUser.username,
        profilePic: blockUser.profileImage || ''
      });
      await user.save();
    }
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock a user
router.post('/user/:id/unblock', async (req, res) => {
  try {
    const userId = req.params.id;
    const { unblockUserId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.blockedUsers = user.blockedUsers.filter(b => !b.userId.equals(unblockUserId));
    await user.save();
    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blocked users
router.get('/user/:id/blocked', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.blockedUsers || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users who blocked me
router.get('/user/:id/blocked-by', async (req, res) => {
  try {
    const userId = req.params.id;
    const users = await User.find({ 'blockedUsers.userId': userId }).select('_id');
    res.json(users.map(u => ({ userId: u._id })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Search Users (Enhanced) =================
router.get('/users/search', async (req, res) => {
  const { q, userId } = req.query;
  const searchRegex = new RegExp(q, 'i');
  const me = await User.findById(userId);

  // Find users who have blocked me
  const blockedMe = await User.find({ 'blockedUsers.userId': me._id }).select('_id');
  const blockedMeIds = blockedMe.map(u => u._id.toString());

  // Find users matching search, excluding blocked
  const users = await User.find({
    $and: [
      { _id: { $ne: me._id } },
      { username: searchRegex },
      { _id: { $nin: me.blockedUsers.map(b => b.userId.toString()) } },
      { _id: { $nin: blockedMeIds } }
    ]
  });
  res.json(users);
});

// ================= Enhanced Last Registered Users =================
router.get('/last-logins/enhanced', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.userId;

    // Find the logged-in user's friends and blocked users
    const me = await User.findById(userId).select('friends blockedUsers');
    const friendIds = me.friends.map(f => f.friendId);
    const blockedUserIds = me.blockedUsers.map(b => b.userId);

    // Find users who have blocked me
    const blockedMe = await User.find({ 'blockedUsers.userId': me._id }).select('_id');
    const blockedMeIds = blockedMe.map(u => u._id.toString());

    // Find last registered users, excluding the logged-in user, their friends, blocked users, and users who have blocked me
    const lastLoginUsers = await User.find({
      _id: { $ne: userId, $nin: [...friendIds, ...blockedUserIds, ...blockedMeIds] }
    })
      .sort({ _id: -1 })
      .limit(limit)
      .select('username profileImage _id');

    res.json(lastLoginUsers);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// ================= Forgot Password - Request OTP =================
router.post('/forgot-password/request', async (req, res) => {
  const { email, phone } = req.body;
  const user = await User.findOne({ email, phone });
  if (!user) {
    return res.status(404).json({ message: 'Email and phone do not match.' });
  }
  // Generate OTP and store it (reuse your send-otp logic)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const ttl = 5 * 60 * 1000;
  otpStorage[phone] = { otp, expires: Date.now() + ttl, email };
  await twilio.messages.create({
    body: `Your password reset code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
  res.json({ message: 'OTP sent to registered mobile.' });
});

// ================= Forgot Password - Verify OTP =================
router.post('/forgot-password/verify-otp', async (req, res) => {
  const { email, phone, otp } = req.body;
  const stored = otpStorage[phone];
  if (!stored || stored.email !== email) {
    return res.status(400).json({ message: 'OTP not found or expired.' });
  }
  if (Date.now() > stored.expires) {
    delete otpStorage[phone];
    return res.status(400).json({ message: 'OTP expired.' });
  }
  if (stored.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP.' });
  }
  delete otpStorage[phone];
  res.json({ message: 'OTP verified.' });
});

// ================= Forgot Password - Reset Password =================
router.post('/forgot-password/reset', async (req, res) => {
  const { email, phone, newPassword } = req.body;
  const user = await User.findOne({ email, phone });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password reset successful.' });
});

module.exports = router;
