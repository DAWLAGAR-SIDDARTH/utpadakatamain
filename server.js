
/**
 * BACKEND SERVER (Node.js/Express + MongoDB)
 * 
 * To run this:
 * 1. Ensure package.json exists (see code below)
 * 2. Run: npm install
 * 3. Run: npm start
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------------------------------------------------------------
// PASTE YOUR MONGODB URL INSIDE THE QUOTES BELOW
// -------------------------------------------------------------------------
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/utpadakata';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schema Definitions
const ItemSchema = new mongoose.Schema({
  id: String,
  type: String,
  position: { x: Number, y: Number },
  size: { width: Number, height: Number },
  zIndex: Number,
  groupId: String,
  content: String,
  color: String,
  title: String,
  description: String,
  priority: String,
  completed: Boolean,
  deadline: String,
  expenses: Array
}, { _id: false });

const WorkspaceSchema = new mongoose.Schema({
  userId: String,
  items: [ItemSchema],
  lastUpdated: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  name: String,
  avatar: String,
  googleId: String,
  preferences: Object
});

// Models
const Workspace = mongoose.model('Workspace', WorkspaceSchema);
const User = mongoose.model('User', UserSchema);

// --- API ROUTES ---

// 1. Auth / Login
app.post('/api/login', async (req, res) => {
  const { email, name, avatar, googleId } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, avatar, googleId, preferences: { theme: 'light' } });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Workspace
app.get('/api/workspace/:userId', async (req, res) => {
  try {
    let workspace = await Workspace.findOne({ userId: req.params.userId });
    if (!workspace) {
      workspace = new Workspace({ userId: req.params.userId, items: [] });
      await workspace.save();
    }
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Workspace Items (Sync)
app.post('/api/workspace/:userId', async (req, res) => {
  try {
    const { items } = req.body;
    await Workspace.findOneAndUpdate(
      { userId: req.params.userId },
      { items, lastUpdated: new Date() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Share/Collaboration Endpoint (Stub)
app.get('/api/share/:workspaceId', (req, res) => {
  res.json({ message: "Share link valid" });
});

// --- SERVE FRONTEND (STATIC FILES) ---
// This allows the server to serve the React app if built into a 'dist' or 'build' folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Routing (return index.html for all non-API requests)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  // If dist/index.html doesn't exist (dev mode), send a basic message
  res.sendFile(indexPath, (err) => {
      if (err) {
          res.status(200).send('API Server is running. To view the app, please start the frontend development server (npm run dev).');
      }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
