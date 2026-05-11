const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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
const iconDataPath = path.join(__dirname, 'data', 'icon-rarities.json');

if (!JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in .env file');
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
  ownedIcons: [{ iconId: String, acquiredAt: Date }],
  selectedIconId: { type: String, default: 'icon-1' },
  friends: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  ips: [{ type: String }],
  lastLoginIp: { type: String }
});

const User = mongoose.model('User', userSchema);

const loadIconData = () => {
  try {
    const raw = fs.readFileSync(iconDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ Failed to load icon data:', err.message);
    return { icons: [] };
  }
};

const saveIconData = (data) => {
  try {
    fs.writeFileSync(iconDataPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Failed to save icon data:', err.message);
  }
};

const playerStatsPath = path.join(__dirname, 'data', 'player-stats.json');
const websiteStatsPath = path.join(__dirname, 'data', 'website-stats.json');

const savePlayerStatsFile = (data) => {
  try {
    fs.writeFileSync(playerStatsPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Failed to save player stats:', err.message);
  }
};

const loadWebsiteStatsFile = () => {
  try {
    const raw = fs.readFileSync(websiteStatsPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { globalPlayers: 0 };
  }
};

const saveWebsiteStatsFile = (data) => {
  try {
    fs.writeFileSync(websiteStatsPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Failed to save website stats:', err.message);
  }
};

const websiteStats = loadWebsiteStatsFile();

const syncWebsiteStatsFile = async () => {
  try {
    if (mongoConnected) {
      const count = await User.countDocuments({});
      websiteStats.globalPlayers = count;
      saveWebsiteStatsFile(websiteStats);
    }
  } catch (err) {
    console.error('❌ Failed to sync website stats:', err.message);
  }
};

const createAdminFallbackResponse = () => ({
  username: 'admin',
  role: 'Admin',
  selectedIconId: 'icon-1',
  stats: {
    tokens: 9999,
    iconsUnlocked: 417,
    iconsTotal: 417,
    packsOpened: 100,
    messagesSent: 50
  },
  friends: []
});

const syncPlayerStatsFile = async () => {
  if (!mongoConnected) return;
  try {
    const users = await User.find({}).lean();
    const summary = { users: {} };
    users.forEach((user) => {
      summary.users[user._id] = {
        username: user.username,
        tokens: user.tokens ?? 0,
        iconsUnlocked: user.iconsUnlocked ?? 0,
        iconsTotal: user.iconsTotal ?? 417,
        packsOpened: user.packsOpened ?? 0,
        messagesSent: user.messagesSent ?? 0,
        selectedIconId: user.selectedIconId || 'icon-1',
        ownedIcons: (user.ownedIcons || []).map((entry) => entry.iconId)
      };
    });
    savePlayerStatsFile(summary);
    await syncWebsiteStatsFile();
  } catch (err) {
    console.error('❌ Failed to sync player stats:', err.message);
  }
};

const ensureDefaultIcon = async (user) => {
  if (!user) return user;
  let changed = false;

  if (!user.selectedIconId) {
    user.selectedIconId = 'icon-1';
    changed = true;
  }

  if (!Array.isArray(user.ownedIcons)) {
    user.ownedIcons = [];
    changed = true;
  }

  if (!user.ownedIcons.some((entry) => entry.iconId === 'icon-1')) {
    user.ownedIcons.unshift({ iconId: 'icon-1', acquiredAt: new Date() });
    changed = true;
  }

  const ownedCount = (user.ownedIcons || []).length;
  if (user.iconsUnlocked == null || user.iconsUnlocked < ownedCount) {
    user.iconsUnlocked = ownedCount;
    changed = true;
  }

  if (changed) {
    await user.save();
    await syncPlayerStatsFile();
  }

  return user;
};

const iconData = loadIconData();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// db connection - connect asynchronously without blocking server startup
let mongoConnected = false;
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('✓ MongoDB connected');
      mongoConnected = true;

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
            selectedIconId: 'icon-1',
            ownedIcons: [{ iconId: 'icon-1', acquiredAt: new Date() }],
            friends: []
          });
          console.log('✓ Admin account created (admin / 28452)');
        } else {
          console.log('✓ Admin account already exists');
        }

        await syncPlayerStatsFile();
      } catch (err) {
        console.error('⚠️  Could not create admin account:', err.message);
      }
    })
    .catch(err => {
      console.error('❌ MongoDB error:', err.message);
      console.log('⚠️  Server will continue running, but database features are unavailable');
    });
} else {
  console.log('⚠️  MongoDB URI not configured. Server running in offline mode.');
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
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
      iconsUnlocked: 1,
      iconsTotal: 417,
      packsOpened: 0,
      messagesSent: 0,
      ownedIcons: [{ iconId: 'icon-1', acquiredAt: new Date() }],
      selectedIconId: 'icon-1',
      friends: []
    });
    await user.save();
    await syncPlayerStatsFile();
    
    const defaultIcon = iconData.icons.find((item) => item.id === 'icon-1');
    if (defaultIcon) {
      defaultIcon.circulation = (defaultIcon.circulation || 0) + 1;
      saveIconData(iconData);
    }

    console.log(`✓ User ${username} signed up`);
    
    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      username: user.username,
      role: user.role,
      selectedIconId: user.selectedIconId,
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
    
    console.log('[LOGIN] Checking database...');
    
    if (!mongoConnected) {
      if (username === 'admin' && password === '28452') {
        const token = jwt.sign({ userId: 'admin-fallback', username: 'admin', role: 'Admin', fallback: true }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          token,
          ...createAdminFallbackResponse()
        });
      }
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

    await ensureDefaultIcon(user);
    
    console.log(`✓ User ${username} logged in`);
    
    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      username: user.username,
      role: user.role,
      selectedIconId: user.selectedIconId || 'icon-1',
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

    if (!mongoConnected) {
      if (decoded.userId === 'admin-fallback' && decoded.username === 'admin') {
        return res.json(createAdminFallbackResponse());
      }
      return res.status(503).json({ error: 'Database connection unavailable. Please try again later.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await ensureDefaultIcon(user);

    res.json({
      username: user.username,
      role: user.role || 'Player',
      selectedIconId: user.selectedIconId || 'icon-1',
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

app.get('/api/market/icons', async (req, res) => {
  try {
    const defaultCount = mongoConnected ? await User.countDocuments({}) : websiteStats.globalPlayers || iconData.icons.find((icon) => icon.id === 'icon-1')?.circulation || 0;
    const icons = iconData.icons.map((icon) => {
      if (icon.id === 'icon-1') {
        return { ...icon, circulation: defaultCount };
      }
      return icon;
    });
    return res.json({ icons });
  } catch (error) {
    console.error('❌ Failed to fetch icons:', error.message);
    return res.json({ icons: iconData.icons });
  }
});

app.get('/api/market/owned', authenticate, async (req, res) => {
  try {
    if (!mongoConnected) {
      if (req.user.userId === 'admin-fallback' && req.user.username === 'admin') {
        return res.json({
          ownedIcons: [{ iconId: 'icon-1', acquiredAt: new Date().toISOString(), iconName: 'IconNet', rarity: 'default' }],
          selectedIconId: 'icon-1',
          stats: createAdminFallbackResponse().stats
        });
      }
      return res.status(503).json({ error: 'Database connection unavailable. Please try again later.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await ensureDefaultIcon(user);

    const owned = (user.ownedIcons || []).map((entry) => {
      const icon = iconData.icons.find((item) => item.id === entry.iconId);
      return {
        ...entry,
        iconName: icon?.name || entry.iconId,
        rarity: icon?.rarity || 'unknown'
      };
    });

    return res.json({
      ownedIcons: owned,
      selectedIconId: user.selectedIconId || 'icon-1',
      stats: {
        tokens: user.tokens ?? 0,
        iconsUnlocked: user.iconsUnlocked ?? 0,
        iconsTotal: user.iconsTotal ?? 417,
        packsOpened: user.packsOpened ?? 0,
        messagesSent: user.messagesSent ?? 0
      }
    });
  } catch (err) {
    console.error('❌ Owned icons fetch error:', err.message);
    res.status(500).json({ error: 'Could not fetch owned icons' });
  }
});

const crateCost = 100;
const chooseRandomIcon = () => {
  const available = iconData.icons.filter((icon) => icon.id !== 'icon-1' && (icon.maxSupply == null || icon.circulation < icon.maxSupply));
  const totalWeight = available.reduce((sum, icon) => sum + (icon.dropChance || 0), 0);
  if (available.length === 0 || totalWeight <= 0) return null;

  let roll = Math.random() * totalWeight;
  for (const icon of available) {
    roll -= icon.dropChance || 0;
    if (roll <= 0) {
      return icon;
    }
  }

  return available[available.length - 1];
};

app.post('/api/market/open-crate', authenticate, async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database connection unavailable. Please try again later.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.tokens < crateCost) {
      return res.status(400).json({ error: 'Not enough tokens to open a crate' });
    }

    const icon = chooseRandomIcon();
    if (!icon) {
      return res.status(409).json({ error: 'No icons available to mint right now' });
    }

    user.ownedIcons = user.ownedIcons || [];
    user.ownedIcons.push({ iconId: icon.id, acquiredAt: new Date() });
    user.tokens -= crateCost;
    user.iconsUnlocked = (user.ownedIcons || []).length;
    user.packsOpened += 1;
    await user.save();
    await syncPlayerStatsFile();

    icon.circulation = (icon.circulation || 0) + 1;
    saveIconData(iconData);

    return res.json({
      acquired: {
        id: icon.id,
        name: icon.name,
        rarity: icon.rarity,
        dropChance: icon.dropChance,
        circulation: icon.circulation
      },
      stats: {
        tokens: user.tokens,
        iconsUnlocked: user.iconsUnlocked,
        iconsTotal: user.iconsTotal,
        packsOpened: user.packsOpened,
        messagesSent: user.messagesSent
      }
    });
  } catch (err) {
    console.error('❌ Crate open error:', err.message);
    res.status(500).json({ error: 'Could not open crate' });
  }
});

app.post('/api/market/select-icon', authenticate, async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database connection unavailable. Please try again later.' });
    }

    const { iconId } = req.body;
    if (!iconId) {
      return res.status(400).json({ error: 'Icon id is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ownsIcon = (user.ownedIcons || []).some((entry) => entry.iconId === iconId);
    if (!ownsIcon) {
      return res.status(403).json({ error: 'You do not own that icon' });
    }

    const icon = iconData.icons.find((item) => item.id === iconId);
    if (!icon) {
      return res.status(404).json({ error: 'Icon not found' });
    }

    user.selectedIconId = iconId;
    await user.save();
    await syncPlayerStatsFile();

    return res.json({ selectedIconId: iconId });
  } catch (err) {
    console.error('❌ Select icon error:', err.message);
    res.status(500).json({ error: 'Could not select icon' });
  }
});

const PORT = process.env.PORT || 5000;

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
