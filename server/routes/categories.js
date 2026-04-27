const express = require('express');
const Category = require('../models/Category');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let categories = await Category.find({ ownerId: req.user._id });
    
    if (categories.length === 0) {
      const defaultCategories = [
        { name: 'Work', color: '#3B82F6', icon: '💼' },
        { name: 'Study', color: '#10B981', icon: '📚' },
        { name: 'Health', color: '#EF4444', icon: '❤️' },
        { name: 'Sleep', color: '#8B5CF6', icon: '😴' },
        { name: 'Break', color: '#F59E0B', icon: '☕' },
        { name: 'Personal', color: '#EC4899', icon: '👤' }
      ];

      for (const categoryData of defaultCategories) {
        const category = new Category({
          ...categoryData,
          ownerId: req.user._id
        });
        await category.save();
        categories.push(category);
      }
    }

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = new Category({
      name,
      color: color || '#3B82F6',
      icon: icon || '📝',
      ownerId: req.user._id
    });

    await category.save();
    res.status(201).json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if category is being used by any tasks
    const tasksUsingCategory = await Task.countDocuments({
      category: req.params.id,
      ownerId: req.user._id
    });

    if (tasksUsingCategory > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category that is being used by tasks. Please reassign or delete those tasks first.' 
      });
    }

    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ 
      message: 'Category deleted successfully',
      deletedCategory: category 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



