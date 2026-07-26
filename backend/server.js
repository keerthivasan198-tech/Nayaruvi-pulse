require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

// Import Models
const Workspace = require('./models/Workspace');
const Project = require('./models/Project');
const Activity = require('./models/Activity');

const app = express();

// Allow all origins (Netlify, local, etc)
app.use(cors());
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB Nayaruvi Pulse'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// =======================
// EMAIL CONFIG
// =======================
const transporter = nodemailer.createTransport({
  service: 'gmail', // Standard configuration for Gmail
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// =======================
// ROUTES
// =======================

// --- Invitations ---
app.post('/api/invite', async (req, res) => {
  try {
    const { email, name, role, workspaceId, projectId } = req.body;

    if (!email || !workspaceId || !projectId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${projectId}?workspaceId=${workspaceId}`;

    const mailOptions = {
      from: `"Nayaruvi Pulse" <${process.env.SMTP_USER || 'noreply@nayaruvi.com'}>`,
      to: email,
      subject: `You have been invited to join ${project.title} on Nayaruvi Pulse`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #274245; background-color: #FAF7EC; max-width: 600px; margin: 0 auto; border-radius: 8px;">
          <h2 style="color: #274245; margin-bottom: 20px;">Nayaruvi Pulse Invitation</h2>
          <p>Hello ${name},</p>
          <p>You have been formally invited to join the project <strong>"${project.title}"</strong> as a <strong>${role}</strong>.</p>
          <p>Click the button below to accept your invitation, sign in, and start collaborating with your team.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #274245; color: #DFD6AE; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
          </div>
          <p style="font-size: 12px; color: #5C6E6F;">If the button above does not work, copy and paste this link into your browser: <br/>${inviteLink}</p>
        </div>
      `
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Invite email sent to ${email}`);
    } else {
      console.warn(`⚠️ SMTP not configured! Mocking invite to ${email}. Link: ${inviteLink}`);
    }

    res.status(200).json({ success: true, message: 'Invitation sent' });
  } catch (err) {
    console.error('❌ Invite error:', err);
    res.status(500).json({ error: 'Failed to send invite email' });
  }
});

// Health check - keeps Render awake
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/workspaces/ping', (req, res) => res.json({ status: 'awake' }));

// --- Workspaces ---

// Create Workspace
app.post('/api/workspaces', async (req, res) => {
  try {
    const { name, uid, email, displayName } = req.body;
    if (!name || !uid) {
      return res.status(400).json({ error: 'name and uid are required' });
    }
    const workspace = new Workspace({
      name,
      members: [{ uid, email, name: displayName || email, role: 'Founder' }]
    });
    await workspace.save();
    console.log('✅ Workspace created:', workspace._id);
    res.status(201).json(workspace);
  } catch (err) {
    console.error('❌ Create workspace error:', err.message);
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
