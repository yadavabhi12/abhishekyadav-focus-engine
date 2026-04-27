

// routes/analytics.js (Simplified without external dependencies)
const express = require('express');
const Task = require('../models/Task');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');
const router = express.Router();

// Helper function to format date
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Get analytics summary

// Get trends data
router.get('/trends', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const trends = [];
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);

      const dayTasks = await Task.find({
        ownerId: req.user._id,
        date: dateStr
      });

      const completed = dayTasks.filter(t => t.completed);
      const productiveMinutes = completed.reduce((sum, task) => {
        return sum + (task.actualMinutes || task.estimatedMinutes || 0);
      }, 0);

      trends.push({
        date: dateStr,
        completed: completed.length,
        total: dayTasks.length,
        productiveHours: Math.round(productiveMinutes / 60 * 10) / 10,
        completionRate: dayTasks.length > 0 ? Math.round((completed.length / dayTasks.length) * 100) : 0
      });
    }

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category distribution
router.get('/categories', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr },
      completed: true
    }).populate('category');

    const categoryStats = {};
    
    tasks.forEach(task => {
      const categoryName = task.category ? task.category.name : 'Uncategorized';
      const categoryColor = task.category ? task.category.color : '#6B7280';
      
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          name: categoryName,
          color: categoryColor,
          count: 0,
          minutes: 0
        };
      }
      
      categoryStats[categoryName].count++;
      categoryStats[categoryName].minutes += (task.actualMinutes || task.estimatedMinutes || 0);
    });

    const distribution = Object.values(categoryStats).map(stat => ({
      ...stat,
      hours: Math.round(stat.minutes / 60 * 10) / 10
    }));

    res.json({ distribution });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get time analysis
router.get('/time-analysis', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr },
      completed: true,
      estimatedMinutes: { $gt: 0 }
    });

    const analysis = tasks.map(task => ({
      title: task.title,
      category: task.category ? task.category.name : 'Uncategorized',
      estimated: Math.round(task.estimatedMinutes / 60 * 10) / 10,
      actual: Math.round((task.actualMinutes || 0) / 60 * 10) / 10,
      variance: task.estimatedMinutes > 0 ? 
        Math.round(((task.actualMinutes - task.estimatedMinutes) / task.estimatedMinutes) * 100) : 0
    }));

    const summary = {
      totalEstimated: Math.round(tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60 * 10) / 10,
      totalActual: Math.round(tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0) / 60 * 10) / 10,
      averageVariance: tasks.length > 0 ? Math.round(
        tasks.reduce((sum, t) => {
          if (t.estimatedMinutes > 0) {
            return sum + ((t.actualMinutes - t.estimatedMinutes) / t.estimatedMinutes) * 100;
          }
          return sum;
        }, 0) / tasks.length
      ) : 0
    };

    res.json({ analysis, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Add these new routes to your existing analytics.js

// Enhanced summary with more metrics
router.get('/summary', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).populate('category');

    const completedTasks = tasks.filter(t => t.completed);
    const totalTasks = tasks.length;
    
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    // Calculate total productive time
    const totalProductiveMinutes = completedTasks.reduce((sum, task) => {
      const focusTime = task.focusSessions?.reduce((sessionSum, session) => 
        sessionSum + (session.duration || 0), 0) || 0;
      
      let manualTime = 0;
      if (task.startTime && task.endTime) {
        const start = new Date(`1970-01-01T${task.startTime}:00`);
        const end = new Date(`1970-01-01T${task.endTime}:00`);
        
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        
        manualTime = Math.round((end - start) / 60000);
      }
      
      return sum + focusTime + manualTime;
    }, 0);

    // Calculate focus score based on completed focus sessions
    const focusSessions = completedTasks.reduce((sum, task) => 
      sum + (task.focusSessions?.filter(s => s.completed).length || 0), 0);
    
    const focusScore = Math.min(focusSessions * 10, 100);

    // Calculate streak
    let streak = 0;
    const checkDate = new Date();
    
    while (streak < 365) { // Max streak check for 1 year
      const dateStr = formatDate(checkDate);
      const dayTasks = await Task.find({
        ownerId: req.user._id,
        date: dateStr,
        completed: true
      });

      if (dayTasks.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate average daily productivity
    const productiveDays = new Set(completedTasks.map(t => t.date)).size;
    const averageDailyProductivity = productiveDays > 0 ? totalProductiveMinutes / productiveDays : 0;

    res.json({
      summary: {
        completionRate: Math.round(completionRate),
        productiveHours: Math.round(totalProductiveMinutes / 60 * 10) / 10,
        focusScore: Math.round(focusScore),
        streak,
        totalTasks,
        completedTasks: completedTasks.length,
        averageDailyMinutes: Math.round(averageDailyProductivity),
        productiveDays,
        efficiency: Math.round((completedTasks.length / totalTasks) * 100) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced forecast with better algorithms
router.get('/forecast', auth, async (req, res) => {
  try {
    const { metric = 'productiveHours', period = '7' } = req.query;
    const forecastDays = parseInt(period);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60); // Use 60 days for better forecasting

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const historicalData = [];
    
    // Get historical data
    for (let i = 59; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);

      const dayTasks = await Task.find({
        ownerId: req.user._id,
        date: dateStr,
        completed: true
      });

      let value = 0;
      
      if (metric === 'productiveHours') {
        value = dayTasks.reduce((sum, task) => {
          const focusTime = task.focusSessions?.reduce((sessionSum, session) => 
            sessionSum + (session.duration || 0), 0) || 0;
          
          let manualTime = 0;
          if (task.startTime && task.endTime) {
            const start = new Date(`1970-01-01T${task.startTime}:00`);
            const end = new Date(`1970-01-01T${task.endTime}:00`);
            
            if (end < start) {
              end.setDate(end.getDate() + 1);
            }
            
            manualTime = Math.round((end - start) / 60000);
          }
          
          return sum + focusTime + manualTime;
        }, 0) / 60;
      } else if (metric === 'completedTasks') {
        value = dayTasks.length;
      }

      historicalData.push({ 
        date: dateStr, 
        value: Math.round(value * 10) / 10,
        dayOfWeek: date.getDay()
      });
    }

    // Simple forecasting algorithm using weighted moving average
    const forecast = [];
    const recentData = historicalData.slice(-14); // Last 2 weeks
    
    // Calculate weights (more recent data has higher weight)
    const weights = recentData.map((_, index) => (index + 1) / recentData.length);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    const weightedAverage = recentData.reduce((sum, data, index) => 
      sum + (data.value * weights[index]), 0) / totalWeight;

    // Add some seasonality based on day of week
    const weeklyPattern = [0.9, 1.1, 1.0, 1.05, 1.2, 0.7, 0.6]; // Sunday to Saturday multipliers

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(endDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const dayOfWeek = forecastDate.getDay();
      const seasonalMultiplier = weeklyPattern[dayOfWeek];
      
      const predictedValue = weightedAverage * seasonalMultiplier;
      const confidence = Math.max(0.7, 1 - (i * 0.05)); // Confidence decreases for further forecasts

      forecast.push({
        date: formatDate(forecastDate),
        predicted: Math.round(predictedValue * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]
      });
    }

    res.json({ 
      historical: historicalData,
      forecast,
      metrics: {
        average: Math.round(weightedAverage * 10) / 10,
        trend: weightedAverage > historicalData[0]?.value ? 'up' : 'down',
        confidence: 'medium'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category time data
router.get('/category-time', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr },
      completed: true
    }).populate('category');

    const categoryTime = {};
    
    tasks.forEach(task => {
      if (task.category) {
        const categoryId = task.category._id.toString();
        const categoryName = task.category.name;
        
        if (!categoryTime[categoryId]) {
          categoryTime[categoryId] = {
            id: categoryId,
            name: categoryName,
            totalMinutes: 0,
            tasksCompleted: 0
          };
        }
        
        // Calculate time from focus sessions
        const focusTime = task.focusSessions?.reduce((sum, session) => 
          sum + (session.duration || 0), 0) || 0;
        
        // Calculate time from manual time entries
        let manualTime = 0;
        if (task.startTime && task.endTime) {
          const start = new Date(`1970-01-01T${task.startTime}:00`);
          const end = new Date(`1970-01-01T${task.endTime}:00`);
          
          if (end < start) {
            end.setDate(end.getDate() + 1);
          }
          
          manualTime = Math.round((end - start) / 60000);
        }
        
        categoryTime[categoryId].totalMinutes += focusTime + manualTime;
        categoryTime[categoryId].tasksCompleted += 1;
      }
    });

    // Also include uncategorized tasks
    const uncategorizedTasks = tasks.filter(task => !task.category);
    if (uncategorizedTasks.length > 0) {
      categoryTime.uncategorized = {
        id: 'uncategorized',
        name: 'Uncategorized',
        totalMinutes: uncategorizedTasks.reduce((sum, task) => {
          const focusTime = task.focusSessions?.reduce((sessionSum, session) => 
            sessionSum + (session.duration || 0), 0) || 0;
          
          let manualTime = 0;
          if (task.startTime && task.endTime) {
            const start = new Date(`1970-01-01T${task.startTime}:00`);
            const end = new Date(`1970-01-01T${task.endTime}:00`);
            
            if (end < start) {
              end.setDate(end.getDate() + 1);
            }
            
            manualTime = Math.round((end - start) / 60000);
          }
          
          return sum + focusTime + manualTime;
        }, 0),
        tasksCompleted: uncategorizedTasks.length
      };
    }

    res.json({ categoryTime: Object.values(categoryTime) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get productivity data for charts
router.get('/productivity', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const productivityData = [];
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);

      const dayTasks = await Task.find({
        ownerId: req.user._id,
        date: dateStr,
        completed: true
      });

      // Calculate total productive minutes for the day
      const totalMinutes = dayTasks.reduce((sum, task) => {
        const focusTime = task.focusSessions?.reduce((sessionSum, session) => 
          sessionSum + (session.duration || 0), 0) || 0;
        
        let manualTime = 0;
        if (task.startTime && task.endTime) {
          const start = new Date(`1970-01-01T${task.startTime}:00`);
          const end = new Date(`1970-01-01T${task.endTime}:00`);
          
          if (end < start) {
            end.setDate(end.getDate() + 1);
          }
          
          manualTime = Math.round((end - start) / 60000);
        }
        
        return sum + focusTime + manualTime;
      }, 0);

      productivityData.push({
        date: dateStr,
        productiveHours: Math.round(totalMinutes / 60 * 10) / 10,
        tasksCompleted: dayTasks.length,
        focusSessions: dayTasks.reduce((sum, task) => 
          sum + (task.focusSessions?.filter(s => s.completed).length || 0), 0)
      });
    }

    res.json({ data: productivityData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export data endpoint
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'csv', range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).populate('category');

    if (format === 'csv') {
      const csvHeader = 'Date,Title,Category,Priority,Estimated Hours,Actual Hours,Completed,Time Spent (min),Focus Sessions\n';
      const csvRows = tasks.map(task => {
        const estimatedHours = task.estimatedMinutes ? (task.estimatedMinutes / 60).toFixed(2) : '0';
        
        // Calculate actual time from both focus sessions and manual time
        const focusTime = task.focusSessions?.reduce((sum, session) => 
          sum + (session.duration || 0), 0) || 0;
        
        let manualTime = 0;
        if (task.startTime && task.endTime) {
          const start = new Date(`1970-01-01T${task.startTime}:00`);
          const end = new Date(`1970-01-01T${task.endTime}:00`);
          
          if (end < start) {
            end.setDate(end.getDate() + 1);
          }
          
          manualTime = Math.round((end - start) / 60000);
        }
        
        const totalMinutes = focusTime + manualTime;
        const actualHours = (totalMinutes / 60).toFixed(2);
        const focusSessions = task.focusSessions?.length || 0;
        
        return `${task.date},"${task.title}","${task.category ? task.category.name : 'Uncategorized'}",${task.priority},${estimatedHours},${actualHours},${task.completed},${totalMinutes},${focusSessions}`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-export-${endDateStr}.csv`);
      res.send(csvContent);
    } else if (format === 'pdf') {
      // Simple text-based PDF alternative
      let pdfContent = `Productivity Report\n`;
      pdfContent += `Period: ${startDateStr} to ${endDateStr}\n`;
      pdfContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;
      
      pdfContent += 'Tasks:\n';
      tasks.forEach(task => {
        pdfContent += `${task.date} - ${task.title} - ${task.completed ? 'Completed' : 'Pending'}\n`;
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=productivity-report-${endDateStr}.txt`);
      res.send(pdfContent);
    } else {
      // JSON format
      const exportData = {
        exportDate: new Date().toISOString(),
        dateRange: { start: startDateStr, end: endDateStr },
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        tasks: tasks.map(task => ({
          title: task.title,
          category: task.category ? task.category.name : 'Uncategorized',
          date: task.date,
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          actualMinutes: task.actualMinutes,
          completed: task.completed,
          focusSessions: task.focusSessions?.length || 0
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-export-${endDateStr}.json`);
      res.json(exportData);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/export/csv', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).populate('category').sort({ date: 1 });

    // Prepare data for CSV
    const csvData = tasks.map(task => {
      // Calculate total time from focus sessions and manual time
      const focusTime = task.focusSessions?.reduce((sum, session) => 
        sum + (session.duration || 0), 0) || 0;
      
      let manualTime = 0;
      if (task.startTime && task.endTime) {
        const [startHours, startMinutes] = task.startTime.split(':').map(Number);
        const [endHours, endMinutes] = task.endTime.split(':').map(Number);
        
        let totalStartMinutes = startHours * 60 + startMinutes;
        let totalEndMinutes = endHours * 60 + endMinutes;
        
        if (totalEndMinutes < totalStartMinutes) {
          totalEndMinutes += 24 * 60;
        }
        
        manualTime = totalEndMinutes - totalStartMinutes;
      }
      
      const totalMinutes = focusTime + manualTime;
      
      return {
        Date: task.date,
        Title: task.title,
        Category: task.category ? task.category.name : 'Uncategorized',
        Priority: task.priority,
        Completed: task.completed ? 'Yes' : 'No',
        'Estimated Minutes': task.estimatedMinutes || 0,
        'Actual Minutes': totalMinutes,
        'Focus Sessions': task.focusSessions?.length || 0,
        'Start Time': task.startTime || '',
        'End Time': task.endTime || '',
        Tags: task.tags?.join(', ') || ''
      };
    });

    // Create CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-export-${startDateStr}-to-${endDateStr}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// JSON Export
router.get('/export/json', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).populate('category').sort({ date: 1 });

    const exportData = {
      exportDate: new Date().toISOString(),
      dateRange: { start: startDateStr, end: endDateStr },
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      tasks: tasks.map(task => {
        // Calculate total time
        const focusTime = task.focusSessions?.reduce((sum, session) => 
          sum + (session.duration || 0), 0) || 0;
        
        let manualTime = 0;
        if (task.startTime && task.endTime) {
          const [startHours, startMinutes] = task.startTime.split(':').map(Number);
          const [endHours, endMinutes] = task.endTime.split(':').map(Number);
          
          let totalStartMinutes = startHours * 60 + startMinutes;
          let totalEndMinutes = endHours * 60 + endMinutes;
          
          if (totalEndMinutes < totalStartMinutes) {
            totalEndMinutes += 24 * 60;
          }
          
          manualTime = totalEndMinutes - totalStartMinutes;
        }
        
        const totalMinutes = focusTime + manualTime;
        
        return {
          id: task._id,
          title: task.title,
          description: task.description,
          category: task.category ? task.category.name : 'Uncategorized',
          date: task.date,
          startTime: task.startTime,
          endTime: task.endTime,
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          actualMinutes: totalMinutes,
          completed: task.completed,
          completedAt: task.completedAt,
          tags: task.tags,
          focusSessions: task.focusSessions?.length || 0,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        };
      })
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-export-${startDateStr}-to-${endDateStr}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('JSON Export Error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Simple Text Export (instead of PDF)
router.get('/export/text', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).populate('category');

    const completedTasks = tasks.filter(t => t.completed);
    const totalTasks = tasks.length;
    
    // Calculate total productive time
    const totalProductiveMinutes = completedTasks.reduce((sum, task) => {
      const focusTime = task.focusSessions?.reduce((sessionSum, session) => 
        sessionSum + (session.duration || 0), 0) || 0;
      
      let manualTime = 0;
      if (task.startTime && task.endTime) {
        const [startHours, startMinutes] = task.startTime.split(':').map(Number);
        const [endHours, endMinutes] = task.endTime.split(':').map(Number);
        
        let totalStartMinutes = startHours * 60 + startMinutes;
        let totalEndMinutes = endHours * 60 + endMinutes;
        
        if (totalEndMinutes < totalStartMinutes) {
          totalEndMinutes += 24 * 60;
        }
        
        manualTime = totalEndMinutes - totalStartMinutes;
      }
      
      return sum + focusTime + manualTime;
    }, 0);

    // Create text report
    let reportContent = `PRODUCTIVITY ANALYTICS REPORT\n`;
    reportContent += `================================\n\n`;
    reportContent += `Date Range: ${startDateStr} to ${endDateStr}\n`;
    reportContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    reportContent += `SUMMARY:\n`;
    reportContent += `--------\n`;
    reportContent += `Total Tasks: ${totalTasks}\n`;
    reportContent += `Completed Tasks: ${completedTasks.length}\n`;
    reportContent += `Completion Rate: ${totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0}%\n`;
    reportContent += `Total Productive Hours: ${Math.round(totalProductiveMinutes / 60 * 10) / 10}\n\n`;
    
    reportContent += `TASK DETAILS:\n`;
    reportContent += `-------------\n`;
    
    tasks.forEach((task, index) => {
      const focusTime = task.focusSessions?.reduce((sum, session) => 
        sum + (session.duration || 0), 0) || 0;
      
      let manualTime = 0;
      if (task.startTime && task.endTime) {
        const [startHours, startMinutes] = task.startTime.split(':').map(Number);
        const [endHours, endMinutes] = task.endTime.split(':').map(Number);
        
        let totalStartMinutes = startHours * 60 + startMinutes;
        let totalEndMinutes = endHours * 60 + endMinutes;
        
        if (totalEndMinutes < totalStartMinutes) {
          totalEndMinutes += 24 * 60;
        }
        
        manualTime = totalEndMinutes - totalStartMinutes;
      }
      
      const totalMinutes = focusTime + manualTime;
      
      reportContent += `${index + 1}. ${task.date} - ${task.title}\n`;
      reportContent += `   Category: ${task.category ? task.category.name : 'Uncategorized'}\n`;
      reportContent += `   Status: ${task.completed ? 'Completed' : 'Pending'}\n`;
      reportContent += `   Time Spent: ${Math.round(totalMinutes / 60 * 10) / 10}h\n`;
      reportContent += `   Priority: ${task.priority}\n\n`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${startDateStr}-to-${endDateStr}.txt`);
    res.send(reportContent);
  } catch (error) {
    console.error('Text Export Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;





















