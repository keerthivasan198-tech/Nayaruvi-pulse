const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: String,
  email: String,
  role: { type: String, enum: ['Founder', 'Co-Founder', 'Member'], default: 'Member' }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, default: 'Active' },
  category: { type: String, default: 'General Project' },
  createdAt: { type: Date, default: Date.now },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  members: [memberSchema],
  stats: {
    tasks: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    members: { type: Number, default: 1 }
  }
});

module.exports = mongoose.model('Project', projectSchema);
