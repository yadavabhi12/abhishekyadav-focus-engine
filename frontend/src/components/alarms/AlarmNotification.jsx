import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, X, Volume2, VolumeX, RotateCcw, CheckCircle } from 'lucide-react';
import { alarmService } from '../../services/alarms';
import { taskService } from '../../services/tasks';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';

const AlarmNotification = ({ alarm, onDismiss, onSnooze }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const audioRef = useRef(null);
  const countdownRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);

  useEffect(() => {
    // Show with animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Start countdown
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Play sound if enabled
    if (alarm.sound && alarm.sound !== 'none' && !isMuted) {
      playSound();
    }
    
    // Vibrate if enabled
    if (alarm.vibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    return () => {
      stopSound();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [alarm, isMuted]);

  const playSound = () => {
    try {
      // Use Web Audio API for continuous sound
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      oscillatorRef.current = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillatorRef.current.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Different sounds based on type
      switch(alarm.sound) {
        case 'gentle':
          oscillatorRef.current.type = 'sine';
          oscillatorRef.current.frequency.value = 800;
          break;
        case 'urgent':
          oscillatorRef.current.type = 'square';
          oscillatorRef.current.frequency.value = 1200;
          break;
        case 'melodic':
          oscillatorRef.current.type = 'sine';
          oscillatorRef.current.frequency.value = 1000;
          break;
        default:
          oscillatorRef.current.type = 'triangle';
          oscillatorRef.current.frequency.value = 1000;
      }
      
      gainNode.gain.value = 0.3;
      oscillatorRef.current.start();
      
      // Set up continuous playback
      oscillatorRef.current.onended = () => {
        if (isPlaying && !isMuted) {
          playSound(); // Restart the sound when it ends
        }
      };
      
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Fallback to HTML5 audio
      playFallbackSound();
    }
  };

  const playFallbackSound = () => {
    try {
      // Use a fallback sound if Web Audio API fails
      const soundFile = alarm.sound || 'default';
      const audio = new Audio(`/sounds/${soundFile}.mp3`);
      
      // Handle case where sound file might not exist
      audio.onerror = () => {
        console.warn(`Sound file /sounds/${soundFile}.mp3 not found, using default`);
        const fallbackAudio = new Audio('/sounds/default.mp3');
        fallbackAudio.loop = true;
        fallbackAudio.volume = 0.7;
        audioRef.current = fallbackAudio;
        
        const playPromise = fallbackAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(error => {
              console.error('Error playing fallback sound:', error);
              setIsPlaying(false);
            });
        }
      };
      
      audio.loop = true;
      audio.volume = 0.7;
      audioRef.current = audio;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('Error playing alarm sound:', error);
            setIsPlaying(false);
          });
      }
    } catch (error) {
      console.error('Error playing fallback sound:', error);
    }
  };

  const stopSound = () => {
    // Stop Web Audio API sound
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (error) {
        console.error('Error stopping oscillator:', error);
      }
      oscillatorRef.current = null;
    }
    
    // Stop HTML5 audio sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsPlaying(false);
    
    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Unmute
      setIsMuted(false);
      if (!isPlaying) {
        playSound();
      } else {
        // Adjust volume for Web Audio API
        if (audioContextRef.current && oscillatorRef.current) {
          const gainNode = audioContextRef.current.createGain();
          oscillatorRef.current.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          gainNode.gain.value = 0.3;
        }
        // Adjust volume for HTML5 audio
        if (audioRef.current) {
          audioRef.current.volume = 0.7;
        }
      }
    } else {
      // Mute
      setIsMuted(true);
      // Mute Web Audio API
      if (audioContextRef.current && oscillatorRef.current) {
        const gainNode = audioContextRef.current.createGain();
        oscillatorRef.current.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        gainNode.gain.value = 0;
      }
      // Mute HTML5 audio
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  const handleDismiss = async () => {
    stopSound();
    if (countdownRef.current) clearInterval(countRef.current);
    setIsVisible(false);
    
    setTimeout(async () => {
      try {
        if (alarm.taskId) {
          await alarmService.dismissAlarm(alarm.taskId);
        }
        onDismiss();
        toast.success('Alarm dismissed');
      } catch (error) {
        console.error('Error dismissing alarm:', error);
        toast.error('Failed to dismiss alarm');
      }
    }, 300);
  };

  const handleSnooze = async (minutes = 5) => {
    stopSound();
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsVisible(false);
    
    setTimeout(async () => {
      try {
        if (alarm.taskId) {
          await alarmService.snoozeAlarm(alarm.taskId, minutes);
        }
        onSnooze(minutes);
        toast.success(`Alarm snoozed for ${minutes} minutes`);
      } catch (error) {
        console.error('Error snoozing alarm:', error);
        toast.error('Failed to snooze alarm');
      }
    }, 300);
  };

  const handleCompleteTask = async () => {
    try {
      if (alarm.taskId) {
        await taskService.toggleComplete(alarm.taskId);
        toast.success('Task marked as complete');
      }
      await handleDismiss();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  if (!alarm) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-purple-900/70 backdrop-blur-sm" onClick={handleDismiss} />
      
      <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 transform transition-transform duration-300 scale-100 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Bell className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              Task Reminder
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={toggleMute} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button onClick={handleDismiss} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-2">Time for your task:</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {alarm.title}
          </h2>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Clock className="h-4 w-4 mr-1" />
            Scheduled for {alarm.time}
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Auto-dismiss in {timeLeft}s
          </p>
        </div>

        <div className="flex space-x-3">
          <Button onClick={handleDismiss} variant="secondary" className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
            Dismiss
          </Button>
          <Button onClick={() => handleSnooze(5)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <RotateCcw className="h-4 w-4 mr-2" />
            Snooze 5min
          </Button>
        </div>

        <div className="mt-4">
          <Button onClick={handleCompleteTask} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </div>

        <div className="mt-4 flex justify-center space-x-2">
          {[10, 15, 30].map(minutes => (
            <button key={minutes} onClick={() => handleSnooze(minutes)} className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
              {minutes}min
            </button>
          ))}
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  );
};

export default AlarmNotification;









