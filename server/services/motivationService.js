const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const { sendNotification } = require('./notificationService');

const motivationalQuotes = [
  // "The only way to do great work is to love what you do. - Steve Jobs",
  // "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  // "Believe you can and you're halfway there. - Theodore Roosevelt",
  // "Everything you've ever wanted is on the other side of fear. - George Addair",
  // "It always seems impossible until it's done. - Nelson Mandela",
  // "Your time is limited, so don't waste it living someone else's life. - Steve Jobs",
  // "I can't change the direction of the wind, but I can adjust my sails to always reach my destination. - Jimmy Dean",
  // "The best way to predict the future is to create it. - Abraham Lincoln",
  // "The secret of getting ahead is getting started. - Mark Twain",
  "It's not whether you get knocked down, it's whether you get up. - Vince Lombardi"
];

const getRandomQuote = () => {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
};

const sendDailyMotivation = async (wss) => {
  try {
    const users = await User.find({ 'settings.notifications': true });
    const today = new Date().toDateString();
    
    for (const user of users) {
      const quote = getRandomQuote();
      
      await sendNotification({
        userId: user._id,
        title: 'Daily Motivation',
        message: quote,
        type: 'motivation'
      }, wss);

      if (wss) {
        wss.to(user._id.toString()).emit('motivation', {
          type: 'MOTIVATION',
          message: quote,
          date: today
        });
      }
    }
    
    console.log(`Sent daily motivation to ${users.length} users`);
  } catch (error) {
    console.error('Error sending daily motivation:', error);
  }
};

const checkAchievementMotivation = async (userId, wss = null) => {
  try {
    const user = await User.findById(userId);
    const today = new Date().toISOString().split('T')[0];
    
    const completedToday = await Task.countDocuments({
      ownerId: userId,
      completed: true,
      date: today
    });
    
    let motivationMessage = '';
    
    if (completedToday === 0) {
      motivationMessage = "Every journey begins with a single step. Start with one task today!";
    } else if (completedToday === 1) {
      motivationMessage = "Great start! One task down, keep that momentum going!";
    } else if (completedToday >= 3) {
      motivationMessage = `Amazing! You've completed ${completedToday} tasks today. You're on fire!`;
    }
    
    if (motivationMessage) {
      await sendNotification({
        userId,
        title: 'Progress Update',
        message: motivationMessage,
        type: 'motivation'
      }, wss);
    }
    
    return motivationMessage;
  } catch (error) {
    console.error('Error checking achievement motivation:', error);
    return '';
  }
};

const startMotivationScheduler = (wss) => {
  cron.schedule('0 9 * * *', () => sendDailyMotivation(wss));
  console.log('Motivation scheduler started');
};

module.exports = {
  getRandomQuote,
  sendDailyMotivation,
  checkAchievementMotivation,
  startMotivationScheduler,
  motivationalQuotes
};



