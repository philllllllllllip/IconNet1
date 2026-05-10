const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}));

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in .env file');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not set in .env file');
  process.exit(1);
}

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

// Debug credentials - bypass everything
const DEBUG_USERNAME = 'admin';
const DEBUG_PASSWORD = '28452';

const createDebugResponse = () => ({
  token: jwt.sign({ userId: 'debug', username: 'admin', role: 'Admin' }, JWT_SECRET, { expiresIn: '7d' }),
  username: 'admin',
  role: 'Admin',
  stats: {
    tokens: 9999,
    iconsUnlocked: 417,
    iconsTotal: 417,
    packsOpened: 100,
    messagesSent: 50
  },
  friends: []
});

const isDebugCredentials = (username, password) => {
  return username === DEBUG_USERNAME && password === DEBUG_PASSWORD;
};

// db connection - connect asynchronously without blocking server startup
let mongoConnected = false;
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✓ MongoDB connected');
    mongoConnected = true;
    
    // Seed admin account for debugging
    try {
      const adminExists = await User.findOne({ username: 'admin' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('28452', 10);
        await User.create({
          username: 'admin',
          password: hashedPassword,
          role: 'Admin',
          tokens: 9999,
          iconsUnlocked: 417,
          iconsTotal: 417,
          packsOpened: 100,
          messagesSent: 50,
          friends: []
        });
        console.log('✓ Debug admin account created (admin / 28452)');
      } else {
        console.log('✓ Admin account already exists');
      }
    } catch (err) {
      console.error('⚠️  Could not create admin account:', err.message);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    console.log('⚠️  Server will continue running, but database features are unavailable');
  });

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Debug credentials bypass - skip database entirely
    if (isDebugCredentials(username, password)) {
      console.log('✓ Debug admin bypassed signup validation');
      return res.json(createDebugResponse());
    }
    
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database connection unavailable. Please try again later.' });
    }
    
    // Username validation
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and dashes' });
    }
    
    // Password validation
    if (password.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters' });
    }
    
    if (password.includes(' ')) {
      return res.status(400).json({ error: 'Password cannot contain spaces' });
    }
    
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 number' });
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 special character' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
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
      friends: []
    });
    await user.save();
    
    console.log(`✓ User ${username} signed up`);
    
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
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[LOGIN] Attempting login for: ${username}`);
    
    // Debug credentials bypass - skip database entirely
    if (isDebugCredentials(username, password)) {
      console.log('✓ DEBUG BYPASS ACTIVATED - admin/28452 detected');
      const response = createDebugResponse();
      console.log('✓ Returning debug response:', response.username, response.role);
      return res.json(response);
    }
    
    console.log('[LOGIN] Not debug credentials, checking database...');
    
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database connection unavailable. Please try again later.' });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    console.log(`✓ User ${username} logged in`);
    
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
    console.error('❌ Login error:', err.message);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.userId === 'debug' && decoded.username === 'admin') {
      return res.json(createDebugResponse());
    }

    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database connection unavailable. Please try again later.' });
    }

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
    console.error('❌ Auth check error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 5000;

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
