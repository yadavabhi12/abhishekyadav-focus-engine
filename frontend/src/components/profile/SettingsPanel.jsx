


// SettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/users';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';

// SettingsPanel.jsx - Fix NaN warnings

const SettingsPanel = ({ user }) => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    darkMode: user.settings?.darkMode || false,
    sounds: user.settings?.sounds || true,
    snoozeMinutes: user.settings?.snoozeMinutes || 5,
    notifications: user.settings?.notifications || true,
    emailAlerts: user.settings?.emailAlerts || false,
    focusMode: user.settings?.focusMode || {
      pomodoro: {
        workTime: 25,
        breakTime: 5,
        longBreakTime: 15,
        sessions: 4
      },
      blockDistractions: false
    },
    workingHours: user.settings?.workingHours || {
      start: '09:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5]
    }
  });

  // Ensure numeric values are properly handled
  useEffect(() => {
    if (user.settings) {
      setSettings(prev => ({
        ...prev,
        focusMode: {
          pomodoro: {
            workTime: user.settings.focusMode?.pomodoro?.workTime || 25,
            breakTime: user.settings.focusMode?.pomodoro?.breakTime || 5,
            longBreakTime: user.settings.focusMode?.pomodoro?.longBreakTime || 15,
            sessions: user.settings.focusMode?.pomodoro?.sessions || 4
          },
          blockDistractions: user.settings.focusMode?.blockDistractions || false
        },
        snoozeMinutes: user.settings.snoozeMinutes || 5
      }));
    }
  }, [user.settings]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedSettingChange = (parentKey, childKey, value) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  const handleFocusModeChange = (parentKey, childKey, value) => {
    // Ensure numeric values are converted to numbers
    const numericValue = ['workTime', 'breakTime', 'longBreakTime', 'sessions'].includes(childKey) 
      ? parseInt(value, 10) || 0 
      : value;
    
    setSettings(prev => ({
      ...prev,
      focusMode: {
        ...prev.focusMode,
        [parentKey]: {
          ...prev.focusMode[parentKey],
          [childKey]: numericValue
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await userService.updateSettings(settings);
      if (response.user) {
        updateUser(response.user);
        toast.success('Settings updated successfully');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  // Safely get numeric values with defaults
  const focusSettings = settings.focusMode?.pomodoro || {};
  const workTime = parseInt(focusSettings.workTime, 10) || 25;
  const breakTime = parseInt(focusSettings.breakTime, 10) || 5;
  const longBreakTime = parseInt(focusSettings.longBreakTime, 10) || 15;
  const sessions = parseInt(focusSettings.sessions, 10) || 4;
  const snoozeMinutes = parseInt(settings.snoozeMinutes, 10) || 5;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-lg font-semibold mb-6">Settings</h2>
      
      <div className="space-y-6">
        {/* Appearance */}
        <div>
          <h3 className="text-md font-medium mb-3">Appearance</h3>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span>Dark Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.darkMode} 
                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-md font-medium mb-3">Notifications</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Enable Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.notifications} 
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Email Alerts</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.emailAlerts} 
                  onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Notification Sounds</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.sounds} 
                  onChange={(e) => handleSettingChange('sounds', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Snooze Minutes</span>
              <Input
                type="number"
                min="1"
                max="30"
                value={snoozeMinutes}
                onChange={(e) => handleSettingChange('snoozeMinutes', parseInt(e.target.value, 10) || 5)}
                className="w-20"
              />
            </div>
          </div>
        </div>

        {/* Focus Mode */}
        <div>
          <h3 className="text-md font-medium mb-3">Focus Mode</h3>
          <div className="space-y-4 p-3 border rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work Time (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={workTime}
                  onChange={(e) => handleFocusModeChange('pomodoro', 'workTime', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Break Time (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={breakTime}
                  onChange={(e) => handleFocusModeChange('pomodoro', 'breakTime', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Long Break (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreakTime}
                  onChange={(e) => handleFocusModeChange('pomodoro', 'longBreakTime', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sessions</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={sessions}
                  onChange={(e) => handleFocusModeChange('pomodoro', 'sessions', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Block Distractions</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.focusMode?.blockDistractions || false} 
                  onChange={(e) => handleSettingChange('focusMode', {
                    ...settings.focusMode,
                    blockDistractions: e.target.checked
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div>
          <h3 className="text-md font-medium mb-3">Working Hours</h3>
          <div className="grid grid-cols-2 gap-4 p-3 border rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
              <Input
                type="time"
                value={settings.workingHours?.start || '09:00'}
                onChange={(e) => handleNestedSettingChange('workingHours', 'start', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
              <Input
                type="time"
                value={settings.workingHours?.end || '17:00'}
                onChange={(e) => handleNestedSettingChange('workingHours', 'end', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Working Days</label>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map(day => (
                  <label key={day.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(settings.workingHours?.days || [1, 2, 3, 4, 5]).includes(day.value)}
                      onChange={(e) => {
                        const currentDays = settings.workingHours?.days || [1, 2, 3, 4, 5];
                        const newDays = e.target.checked
                          ? [...currentDays, day.value]
                          : currentDays.filter(d => d !== day.value);
                        handleNestedSettingChange('workingHours', 'days', newDays);
                      }}
                      className="mr-1"
                    />
                    <span className="text-xs">{day.label.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSaveSettings} loading={loading} disabled={loading}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;










// import React, { useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { userService } from '../../services/users';
// import { toast } from 'react-hot-toast';
// import Button from '../ui/Button';
// import Input from '../ui/Input';

// const SettingsPanel = ({ user }) => {
//   const { updateUser } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const [settings, setSettings] = useState({
//     darkMode: user.settings?.darkMode || false,
//     sounds: user.settings?.sounds || true,
//     snoozeMinutes: user.settings?.snoozeMinutes || 5,
//     notifications: user.settings?.notifications || true,
//     emailAlerts: user.settings?.emailAlerts || false,
//     focusMode: user.settings?.focusMode || {
//       pomodoro: {
//         workTime: 25,
//         breakTime: 5,
//         longBreakTime: 15,
//         sessions: 4
//       },
//       blockDistractions: false
//     },
//     workingHours: user.settings?.workingHours || {
//       start: '09:00',
//       end: '17:00',
//       days: [1, 2, 3, 4, 5]
//     }
//   });

//   const handleSettingChange = (key, value) => {
//     setSettings(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   };

//   const handleNestedSettingChange = (parentKey, childKey, value) => {
//     setSettings(prev => ({
//       ...prev,
//       [parentKey]: {
//         ...prev[parentKey],
//         [childKey]: value
//       }
//     }));
//   };

//   const handleFocusModeChange = (parentKey, childKey, value) => {
//     setSettings(prev => ({
//       ...prev,
//       focusMode: {
//         ...prev.focusMode,
//         [parentKey]: {
//           ...prev.focusMode[parentKey],
//           [childKey]: value
//         }
//       }
//     }));
//   };

//   const handleSaveSettings = async () => {
//     setLoading(true);
//     try {
//       const response = await userService.updateSettings(settings);
//       if (response.user) {
//         updateUser(response.user);
//         toast.success('Settings updated successfully');
//       }
//     } catch (error) {
//       console.error('Settings update error:', error);
//       toast.error(error.response?.data?.error || 'Failed to update settings');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-xl p-6 shadow">
//       <h2 className="text-lg font-semibold mb-6">Settings</h2>
      
//       <div className="space-y-6">
//         {/* Appearance */}
//         <div>
//           <h3 className="text-md font-medium mb-3">Appearance</h3>
//           <div className="flex items-center justify-between p-3 border rounded-lg">
//             <span>Dark Mode</span>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input 
//                 type="checkbox" 
//                 checked={settings.darkMode} 
//                 onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
//                 className="sr-only peer" 
//               />
//               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
//             </label>
//           </div>
//         </div>

//         {/* Notifications */}
//         <div>
//           <h3 className="text-md font-medium mb-3">Notifications</h3>
//           <div className="space-y-2">
//             <div className="flex items-center justify-between p-3 border rounded-lg">
//               <span>Enable Notifications</span>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input 
//                   type="checkbox" 
//                   checked={settings.notifications} 
//                   onChange={(e) => handleSettingChange('notifications', e.target.checked)}
//                   className="sr-only peer" 
//                 />
//                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
//               </label>
//             </div>
//             <div className="flex items-center justify-between p-3 border rounded-lg">
//               <span>Email Alerts</span>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input 
//                   type="checkbox" 
//                   checked={settings.emailAlerts} 
//                   onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
//                   className="sr-only peer" 
//                 />
//                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
//               </label>
//             </div>
//             <div className="flex items-center justify-between p-3 border rounded-lg">
//               <span>Notification Sounds</span>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input 
//                   type="checkbox" 
//                   checked={settings.sounds} 
//                   onChange={(e) => handleSettingChange('sounds', e.target.checked)}
//                   className="sr-only peer" 
//                 />
//                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Focus Mode */}
//         <div>
//           <h3 className="text-md font-medium mb-3">Focus Mode</h3>
//           <div className="space-y-4 p-3 border rounded-lg">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Work Time (min)</label>
//                 <Input
//                   type="number"
//                   value={settings.focusMode.pomodoro.workTime}
//                   onChange={(e) => handleFocusModeChange('pomodoro', 'workTime', parseInt(e.target.value))}
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Break Time (min)</label>
//                 <Input
//                   type="number"
//                   value={settings.focusMode.pomodoro.breakTime}
//                   onChange={(e) => handleFocusModeChange('pomodoro', 'breakTime', parseInt(e.target.value))}
//                 />
//               </div>
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Long Break (min)</label>
//                 <Input
//                   type="number"
//                   value={settings.focusMode.pomodoro.longBreakTime}
//                   onChange={(e) => handleFocusModeChange('pomodoro', 'longBreakTime', parseInt(e.target.value))}
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Sessions</label>
//                 <Input
//                   type="number"
//                   value={settings.focusMode.pomodoro.sessions}
//                   onChange={(e) => handleFocusModeChange('pomodoro', 'sessions', parseInt(e.target.value))}
//                 />
//               </div>
//             </div>
//             <div className="flex items-center justify-between">
//               <span>Block Distractions</span>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input 
//                   type="checkbox" 
//                   checked={settings.focusMode.blockDistractions} 
//                   onChange={(e) => handleSettingChange('focusMode', {
//                     ...settings.focusMode,
//                     blockDistractions: e.target.checked
//                   })}
//                   className="sr-only peer" 
//                 />
//                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Working Hours */}
//         <div>
//           <h3 className="text-md font-medium mb-3">Working Hours</h3>
//           <div className="grid grid-cols-2 gap-4 p-3 border rounded-lg">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
//               <Input
//                 type="time"
//                 value={settings.workingHours.start}
//                 onChange={(e) => handleNestedSettingChange('workingHours', 'start', e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
//               <Input
//                 type="time"
//                 value={settings.workingHours.end}
//                 onChange={(e) => handleNestedSettingChange('workingHours', 'end', e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         <Button onClick={handleSaveSettings} loading={loading} disabled={loading}>
//           Save Settings
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default SettingsPanel;