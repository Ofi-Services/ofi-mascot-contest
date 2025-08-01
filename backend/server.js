const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-memory storage (replace with a real database in production)
let users = [
  {
    id: 1,
    username: 'demo',
    email: 'demo@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // 'password'
  }
];

let mascots = [];

let votes = []; // Track user votes to prevent duplicate voting

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  
  // Check if build directory exists before serving
  if (fs.existsSync(frontendBuildPath)) {
    app.use(express.static(frontendBuildPath));
    console.log(`📁 Serving React build from: ${frontendBuildPath}`);
  } else {
    console.warn('⚠️  Frontend build directory not found. Run "npm run build:frontend" first.');
  }
}

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.post('/api/auth/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  // Check if email is from @ofiservices.com domain
  if (!email.endsWith('@ofiservices.com')) {
    return res.status(400).json({ error: 'Registration is only allowed for @ofiservices.com email addresses' });
  }

  // Check if user already exists
  const existingUserByEmail = users.find(u => u.email === email);
  const existingUserByUsername = users.find(u => u.username === username);
  
  if (existingUserByEmail) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }
  
  if (existingUserByUsername) {
    return res.status(400).json({ error: 'This username is already taken' });
  }

  try {
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mascot routes
app.get('/api/mascots', (req, res) => {
  const mascotsWithUserInfo = mascots.map(mascot => {
    const user = users.find(u => u.id === mascot.userId);
    return {
      ...mascot,
      creator: user ? user.username : 'Unknown',
      imageUrl: mascot.imageUrl ? `${req.protocol}://${req.get('host')}${mascot.imageUrl}` : null
    };
  });
  
  res.json(mascotsWithUserInfo);
});

app.post('/api/mascots', authenticateToken, upload.single('image'), [
  body('name').isLength({ min: 1 }).withMessage('Mascot name is required'),
  body('description').isLength({ min: 1 }).withMessage('Description is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  
  // Check if user already has a mascot
  const existingMascot = mascots.find(m => m.userId === req.user.id);
  if (existingMascot) {
    return res.status(400).json({ error: 'You can only submit one mascot per user' });
  }

  const newMascot = {
    id: mascots.length + 1,
    name,
    description,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    votes: 0,
    userId: req.user.id,
    createdAt: new Date().toISOString()
  };

  mascots.push(newMascot);

  res.status(201).json({
    message: 'Mascot created successfully',
    mascot: {
      ...newMascot,
      imageUrl: newMascot.imageUrl ? `${req.protocol}://${req.get('host')}${newMascot.imageUrl}` : null
    }
  });
});

app.post('/api/mascots/:id/vote', authenticateToken, (req, res) => {
  const mascotId = parseInt(req.params.id);
  const userId = req.user.id;

  // Check if mascot exists
  const mascot = mascots.find(m => m.id === mascotId);
  if (!mascot) {
    return res.status(404).json({ error: 'Mascot not found' });
  }

  // Check if user is trying to vote for their own mascot
  if (mascot.userId === userId) {
    return res.status(400).json({ error: 'You cannot vote for your own mascot' });
  }

  // Check if user has already voted for this mascot
  const existingVote = votes.find(v => v.userId === userId && v.mascotId === mascotId);
  if (existingVote) {
    return res.status(400).json({ error: 'You have already voted for this mascot' });
  }

  // Record the vote
  votes.push({
    id: votes.length + 1,
    userId,
    mascotId,
    createdAt: new Date().toISOString()
  });

  // Update mascot vote count
  mascot.votes += 1;

  res.json({ 
    success: true, 
    message: `Vote recorded for ${mascot.name}`,
    mascotId,
    newVoteCount: mascot.votes
  });
});

// Get user's voting history
app.get('/api/user/votes', authenticateToken, (req, res) => {
  const userVotes = votes.filter(v => v.userId === req.user.id);
  res.json(userVotes);
});

// Get current user info
app.get('/api/user/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userMascot = mascots.find(m => m.userId === req.user.id);
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    hasMascot: !!userMascot,
    mascot: userMascot ? {
      ...userMascot,
      imageUrl: userMascot.imageUrl ? `${req.protocol}://${req.get('host')}${userMascot.imageUrl}` : null
    } : null
  });
});

// Admin endpoints to clear databases (for development/testing)
app.delete('/api/admin/clear/mascots', (req, res) => {
  mascots.length = 0; // Clear mascots array
  res.json({ message: 'All mascots cleared successfully' });
});

app.delete('/api/admin/clear/votes', (req, res) => {
  votes.length = 0; // Clear votes array
  res.json({ message: 'All votes cleared successfully' });
});

app.delete('/api/admin/clear/all', (req, res) => {
  mascots.length = 0; // Clear mascots array
  votes.length = 0;   // Clear votes array
  res.json({ message: 'All mascots and votes cleared successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Serve React app for all non-API routes (only in production)
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  app.get('*', (req, res, next) => {
    // Skip API routes and uploads
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    
    // Check if build directory exists
    if (fs.existsSync(frontendBuildPath)) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    } else {
      res.status(503).json({ 
        error: 'Frontend not built', 
        message: 'Run "npm run build:frontend" to build the React app first.' 
      });
    }
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend server is running on http://${HOST}:${PORT}`);
  console.log(`📡 API endpoints available at http://${HOST}:${PORT}/api`);
  console.log(`📁 File uploads will be stored in: ${uploadsDir}`);
});
