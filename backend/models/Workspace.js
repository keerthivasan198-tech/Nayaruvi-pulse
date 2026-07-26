const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: String,
  email: String,
  role: { type: String, enum: ['Founder', 'Co-Founder', 'Member'], default: 'Member' }
});

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  members: [memberSchema]
});

module.exports = mongoose.model('Workspace', workspaceSchema);
