const Joi = require('joi');

// Task validation schema
const taskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).allow(''),
  category: Joi.string().hex().length(24).allow(null, ''),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('', null),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  estimatedMinutes: Joi.number().integer().min(0).max(1440).default(0),
  tags: Joi.array().items(Joi.string().trim().max(50)).default([]),
  alarm: Joi.object({
    enabled: Joi.boolean().default(false),
    time: Joi.when('enabled', {
      is: true,
      then: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      otherwise: Joi.string().optional().allow('', null)
    }),
    sound: Joi.string().valid('default', 'gentle', 'urgent', 'melodic', 'none').default('default'),
    vibration: Joi.boolean().default(true),
    repeat: Joi.object({
      enabled: Joi.boolean().default(false),
      days: Joi.array().items(Joi.number().min(0).max(6)).default([])
    }).default({
      enabled: false,
      days: []
    })
  }).default({
    enabled: false,
    time: null,
    sound: 'default',
    vibration: true,
    repeat: {
      enabled: false,
      days: []
    }
  }),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#3B82F6'),
  assignedTo: Joi.string().hex().length(24).allow(null, ''),
  sharedWith: Joi.array().items(Joi.object({
    userId: Joi.string().hex().length(24).required(),
    permission: Joi.string().valid('viewer', 'commenter', 'editor').default('viewer')
  })).default([])
});

// Alarm validation schema
const alarmSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  time: Joi.string()
    .when('enabled', {
      is: true,
      then: Joi.string().required().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$|^([0-9]{1,2}):([0-5][0-9])\s*(AM|PM)$/i)
        .message('Time must be in HH:MM or HH:MM AM/PM format'),
      otherwise: Joi.string().optional().allow('', null)
    }),
  sound: Joi.string().valid('default', 'gentle', 'urgent', 'melodic').default('default'),
  vibration: Joi.boolean().default(true),
  repeat: Joi.object({
    enabled: Joi.boolean().default(false),
    days: Joi.array().items(Joi.number().min(0).max(6)).default([])
  }).optional()
});

// Snooze schema
const snoozeSchema = Joi.object({
  minutes: Joi.number().min(1).max(60).default(5)
});

// Repeat alarm schema
const repeatAlarmSchema = Joi.object({
  enabled: Joi.boolean().default(false),
  days: Joi.array().items(Joi.number().min(0).max(6)).default([])
});

// User registration schema
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(100).required()
});

// User login schema
const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(100).required()
});

// Category validation schema
const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).required(),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#3B82F6'),
  icon: Joi.string().trim().max(50).allow('')
});

// Export all schemas
module.exports = {
  taskSchema,
  alarmSchema,
  snoozeSchema,
  repeatAlarmSchema,
  registerSchema,
  loginSchema,
  categorySchema
};



















// const Joi = require('joi');

// const registerSchema = Joi.object({
//   name: Joi.string().min(2).max(100).required(),
//   email: Joi.string().email().required(),
//   password: Joi.string().min(6).required()
// });

// const loginSchema = Joi.object({
//   email: Joi.string().email().required(),
//   password: Joi.string().required()
// });

// const taskSchema = Joi.object({
//   title: Joi.string().min(1).max(500).required(),
//   description: Joi.string().max(2000).allow(''),
//   category: Joi.string().allow(''),
//   tags: Joi.array().items(Joi.string()),
//   date: Joi.string().required(),
//   startTime: Joi.string().allow(''),
//   endTime: Joi.string().allow(''),
//   priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
//   estimatedMinutes: Joi.number().min(0).default(0),
//   completed: Joi.boolean().default(false)
// });

// const alarmSchema = Joi.object({
//   alarmTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
//   alarmEnabled: Joi.boolean().default(true)
// });

// const notificationSettingsSchema = Joi.object({
//   notifications: Joi.boolean(),
//   emailAlerts: Joi.boolean(),
//   sounds: Joi.boolean()
// });

// module.exports = {
//   registerSchema,
//   loginSchema,
//   taskSchema,
//   alarmSchema,
//   notificationSettingsSchema
// };



