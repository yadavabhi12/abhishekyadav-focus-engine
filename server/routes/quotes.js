const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.quotes.length === 0) {
      const defaultQuotes = [
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" }
      ];

      user.quotes = defaultQuotes.map(quote => ({
        ...quote,
        createdAt: new Date()
      }));

      await user.save();
    }

    res.json({ quotes: user.quotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { text, author } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Quote text is required' });
    }

    const user = await User.findById(req.user._id);
    user.quotes.push({
      text: text.trim(),
      author: author?.trim() || 'Unknown',
      createdAt: new Date()
    });

    await user.save();
    res.status(201).json({ quotes: user.quotes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { text, author } = req.body;

    const user = await User.findById(req.user._id);
    const quote = user.quotes.id(req.params.id);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (text) quote.text = text.trim();
    if (author !== undefined) quote.author = author.trim() || 'Unknown';

    await user.save();
    res.json({ quotes: user.quotes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// routes/quotes.js (backend)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Find the quote index
    const quoteIndex = user.quotes.findIndex(quote => 
      quote._id.toString() === req.params.id
    );
    
    if (quoteIndex === -1) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Remove the quote
    user.quotes.splice(quoteIndex, 1);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Quote deleted successfully',
      quotes: user.quotes 
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete quote' 
    });
  }
});
module.exports = router;

