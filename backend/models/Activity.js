const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  type: { type: String, default: 'general' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
