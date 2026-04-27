const express = require('express');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comments = await Comment.find({ taskId: req.params.taskId })
      .populate('authorId', 'name photoUrl')
      .populate('mentions', 'name')
      .populate('reactions.userId', 'name')
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/task/:taskId', auth, async (req, res) => {
  try {
    const { body, mentions } = req.body;

    const task = await Task.findOne({
      _id: req.params.taskId,
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith': { $elemMatch: { userId: req.user._id, permission: { $in: ['commenter', 'editor'] } } } }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or no permission to comment' });
    }

    const comment = new Comment({
      taskId: req.params.taskId,
      authorId: req.user._id,
      body,
      mentions: mentions || []
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('authorId', 'name photoUrl')
      .populate('mentions', 'name');

    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reactions', auth, async (req, res) => {
  try {
    const { emoji } = req.body;

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.reactions = comment.reactions.filter(
      reaction => reaction.userId.toString() !== req.user._id.toString()
    );

    if (emoji) {
      comment.reactions.push({
        userId: req.user._id,
        emoji
      });
    }

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('authorId', 'name photoUrl')
      .populate('reactions.userId', 'name');

    res.json({ comment: populatedComment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      authorId: req.user._id
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



