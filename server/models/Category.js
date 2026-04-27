const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: '📝'
  }
}, {
  timestamps: true
});

categorySchema.index({ ownerId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);




