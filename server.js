const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// db connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));
  
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3 },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, default: 'Player' },
  tokens: { type: Number, default: 0 },
iconsUnlocked: { type: Number, default: 0 },
  iconsTotal: { type: Number, default: 417 },
  packsOpened: { type: Number, default: 0 },
  messagesSent: { type: Number, default: 0 },
  friends: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  ips: [{ type: String }],
  lastLoginIp: { type: String }
});

const User = mongoose.model('User', userSchema);

const getIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = getIp(req);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // alt check system
    const existingUsersWithIp = await User.find({ ips: clientIp });
    if (existingUsersWithIp.length > 0) {
      console.log(`Signup blocked: IP ${clientIp} already used by ${existingUsersWithIp.map(u => u.username).join(', ')}`);
      return res.status(400).json({ error: 'No alts allowed. This IP is already registered.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      password: hashedPassword,
      role: 'Player',
      tokens: 0,
      iconsUnlocked: 0,
      iconsTotal: 417,
      packsOpened: 0,
      messagesSent: 0,
      friends: [],
      ips: [clientIp],
      lastLoginIp: clientIp
    });
    await user.save();
    
    console.log(`User ${username} signed up from IP: ${clientIp}`);
    
    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      username: user.username,
      role: user.role,
      stats: {
        tokens: user.tokens,
        iconsUnlocked: user.iconsUnlocked,
        iconsTotal: user.iconsTotal,
        packsOpened: user.packsOpened,
        messagesSent: user.messagesSent
      },
      friends: user.friends
    });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = getIp(req);
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // ip logging to prevent alt accounts and track user logins
    const userIps = user.ips || [];
    if (!userIps.includes(clientIp)) {
      userIps.push(clientIp);
      await User.updateOne({ _id: user._id }, { ips: userIps, lastLoginIp: clientIp });
      console.log(`User ${username} new login IP logged: ${clientIp}`);
    } else {
      await User.updateOne({ _id: user._id }, { lastLoginIp: clientIp });
    }
    
    console.log(`User ${username} logged in from IP: ${clientIp}`);
    
    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      username: user.username,
      role: user.role,
      stats: {
        tokens: user.tokens,
        iconsUnlocked: user.iconsUnlocked,
        iconsTotal: user.iconsTotal,
        packsOpened: user.packsOpened,
        messagesSent: user.messagesSent
      },
      friends: user.friends
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.username,
      role: user.role || 'Player',
      stats: {
        tokens: user.tokens ?? 0,
        iconsUnlocked: user.iconsUnlocked ?? 0,
        iconsTotal: user.iconsTotal ?? 417,
        packsOpened: user.packsOpened ?? 0,
        messagesSent: user.messagesSent ?? 0
      },
      friends: user.friends || []
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
