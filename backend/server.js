require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Models
const Workspace = require('./models/Workspace');
const Project = require('./models/Project');
const Activity = require('./models/Activity');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB Nayaruvi Pulse'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// =======================
// ROUTES
// =======================

// --- Workspaces ---

// Create Workspace
app.post('/api/workspaces', async (req, res) => {
  try {
    const { name, uid, email, displayName } = req.body;
    const workspace = new Workspace({
      name,
      members: [{ uid, email, name: displayName, role: 'Founder' }]
    });
    await workspace.save();
    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User's Workspaces
app.get('/api/workspaces/:uid', async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.uid': req.params.uid });
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Workspace by ID
app.get('/api/workspace/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ error: 'Not found' });
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member to workspace
app.post('/api/workspaces/:id/members', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ error: 'Not found' });

    // Check if member already exists
    if (!workspace.members.some(m => m.uid === req.body.uid)) {
      workspace.members.push({
        uid: req.body.uid,
        name: req.body.name,
        email: req.body.email,
        role: req.body.role || 'Member'
      });
      await workspace.save();
    }
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update workspace member role
app.put('/api/workspaces/:id/members/:uid', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    const member = workspace.members.find(m => m.uid === req.params.uid);
    if (member) {
      member.role = req.body.role;
      await workspace.save();
    }
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Projects ---

// Create Project
app.post('/api/projects', async (req, res) => {
  try {
    const { title, status, workspaceId, uid, email, displayName } = req.body;
    const project = new Project({
      title,
      status,
      workspaceId,
      members: [{ uid, email, name: displayName, role: 'Founder' }]
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Projects for Workspace restricted to User
app.get('/api/projects/workspace/:workspaceId/user/:uid', async (req, res) => {
  try {
    const projects = await Project.find({ 
      workspaceId: req.params.workspaceId,
      'members.uid': req.params.uid 
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project member role
app.put('/api/projects/:id/members/:uid', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const member = project.members.find(m => m.uid === req.params.uid);
    if (member) {
      member.role = req.body.role;
      await project.save();
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member to project
app.post('/api/projects/:id/members', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project.members.some(m => m.uid === req.body.uid)) {
      project.members.push({
        uid: req.body.uid,
        name: req.body.name,
        email: req.body.email,
        role: req.body.role || 'Member'
      });
      project.stats.members = project.members.length;
      await project.save();
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Activity ---
app.post('/api/activity', async (req, res) => {
  try {
    const activity = new Activity(req.body);
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/activity/:workspaceId', async (req, res) => {
  try {
    const activities = await Activity.find({ workspaceId: req.params.workspaceId }).sort({ timestamp: -1 }).limit(50);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend server running on port ${PORT}`));
