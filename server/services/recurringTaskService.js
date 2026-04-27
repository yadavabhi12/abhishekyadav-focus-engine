const cron = require('node-cron');
const Task = require('../models/Task');

const generateRecurringTasks = async () => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const recurringTasks = await Task.find({
      'recurring.rule': { $exists: true, $ne: null },
      $or: [
        { 'recurring.until': { $gte: today } },
        { 'recurring.until': { $exists: false } }
      ]
    });

    for (const task of recurringTasks) {
      const { rule, until } = task.recurring;
      let shouldGenerate = false;
      
      if (rule === 'daily') {
        shouldGenerate = true;
      } else if (rule === 'weekly') {
        const taskDate = new Date(task.date);
        shouldGenerate = today.getDay() === taskDate.getDay();
      } else if (rule === 'monthly') {
        const taskDate = new Date(task.date);
        shouldGenerate = today.getDate() === taskDate.getDate();
      }

      if (shouldGenerate && (!until || today <= new Date(until))) {
        const existingTask = await Task.findOne({
          'recurring.seriesId': task.recurring.seriesId,
          date: todayStr,
          ownerId: task.ownerId
        });

        if (!existingTask) {
          const newTask = new Task({
            ...task.toObject(),
            _id: undefined,
            date: todayStr,
            completed: false,
            completedAt: null,
            actualMinutes: 0,
            pomodoroSessions: [],
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await newTask.save();
        }
      }
    }
  } catch (error) {
    console.error('Error generating recurring tasks:', error);
  }
};

cron.schedule('0 0 * * *', generateRecurringTasks);

module.exports = { generateRecurringTasks };

