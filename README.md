# 🚀 Productivity Pro — Smart Task Manager & Focus Tracker

<div align="center">

![Productivity Pro Banner](screenshots/dashboard.png)

**A full-stack productivity application built to help students and professionals manage tasks, track focus sessions, and build consistent study habits.**

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Live Demo](#) • [Features](#-features-overview) • [Screenshots](#-screenshots) • [Tech Stack](#-tech-stack) • [Installation](#-installation)

</div>

---

## 🎯 Why I Built This

As a student preparing for placements, I found myself constantly struggling with one core problem — **I had tasks everywhere but focus nowhere.**

I tried existing tools like Todoist, Notion, and Forest, but none of them combined task management, focus timing, productivity analytics, and team collaboration in a single unified experience built specifically for the student workflow.

So I built **Productivity Pro** — a full-stack web application that acts as your personal productivity command center. Since I started using it consistently, my daily study hours increased significantly, my task completion rate improved, and I developed a streak-based habit that kept me accountable every single day.

This project was also my way of pushing my own full-stack development skills to the limit — implementing real-time features, complex state management, data visualizations, alarm systems, and a LinkedIn-style social profile, all from scratch.

---

## ✨ Features Overview

| Module | Highlights |
|--------|-----------|
| 🏠 Dashboard | Daily motivation, live stats, today's tasks at a glance |
| ✅ Tasks | Full CRUD, alarms, sharing, categories, filters, tags |
| 📅 Calendar | Monthly task view, date-click task drill-down |
| ⏱️ Focus | Pomodoro timer with distraction-free mode, task linking |
| 📊 Analytics | 6 analytics tabs, charts, export to PDF/JSON/CSV |
| 💬 Chat | Real-time 1:1 messaging, group chats, image sharing |
| 👤 Profile | LinkedIn-style profile, achievements, settings |
| 🔔 Navbar | Smart notifications, alarm alerts, dark mode toggle |

---

## 📸 Screenshots

### 🏠 Dashboard
![Dashboard](screenshots/dashboard.png)
*Personalized welcome screen with daily motivation, completion rate, productive hours, focus score, and current streak.*

### ✅ Task Manager
![Tasks](screenshots/tasks.png)
*Comprehensive task management with filters, priority levels, alarm support, and sharing capabilities.*

### 📅 Calendar
![Calendar](screenshots/calendar.png)
*Monthly calendar view showing task distribution with day-level drill-down for detailed task inspection.*

### 📊 Analytics — Overview
![Analytics Overview](screenshots/analytics-overview.png)
*High-level productivity metrics with week-over-week trend indicators.*

### 📊 Analytics — Daily Chart
![Analytics Chart](screenshots/analytics-chart.png)
*Day-by-day productivity chart tracking tasks completed and completion rate percentage.*

### 👤 Profile
![Profile](screenshots/profile.png)
*LinkedIn-inspired profile page with custom banner, avatar, bio, statistics, and achievements.*

---

## 🧩 Detailed Feature Breakdown

---

### 1. 🔐 Authentication — Secure, Isolated Accounts

Every user creates their own account and sees **only their own data**. The application uses token-based authentication, ensuring complete data isolation between users.

- Secure **Signup / Login** flow with form validation
- Each user's tasks, focus sessions, analytics, and messages are fully private
- Session persistence across page reloads

---

### 2. 🏠 Dashboard

The dashboard is the first screen you see after login and gives you a real-time snapshot of your productivity health.

![Dashboard](screenshots/dashboard.png)

**Daily Motivation Section**
- Displays an inspirational quote to prime your mindset for the day
- You can **add your own custom motivational quotes** that resonate with your goals
- Each quote can be **edited or deleted**, keeping your motivation wall fresh and personal

**Live Stats Panel (4 Key Metrics)**
- **Completion Rate** — Percentage of tasks you've completed overall, shown with a progress indicator
- **Productive Hours** — Total focused work hours logged this week through the Focus timer
- **Focus Score** — A calculated concentration score out of 100, derived from your focus session quality
- **Current Streak** — Number of consecutive days you've maintained productive activity

**Today's Tasks Widget**
- Shows all tasks scheduled for today at a glance
- Toggle completion status directly from the dashboard without navigating away

**Task Completion Bar**
- Visual horizontal bar showing completed vs pending task split for the current day

**Quick Actions**
- Fast-access buttons to create new tasks or start a focus session without navigating to dedicated pages

---

### 3. ✅ Task Manager

The most feature-rich section of the app — a complete task lifecycle management system.

![Tasks](screenshots/tasks.png)

**Stats Bar**
Displays at-a-glance counts for: Total, Completed, Pending, High Priority, With Alarms, and Shared tasks.

**Smart Filter Tabs**
Quickly switch between views:
- **All Tasks** — Every task you've ever created
- **Today** — Tasks due today
- **This Week** — Tasks due within the current week
- **This Month** — Monthly task view
- **High Priority** — Urgent tasks that need attention
- **Completed** — Archive of finished work

**Search & Filter**
- Full-text search across task titles, descriptions, and tags
- Combine search with tab filters for precise task retrieval
- Grid and list view toggle

**Create New Task (Popup Form)**
When creating a task, a modal form captures:
- **Title** (required)
- **Description** — Detailed notes about the task
- **Date** — Due date with date picker
- **Estimated Minutes** — Time you expect to spend on the task
- **Start Time / End Time** — Schedule the task within your day
- **Category** — Assign to a pre-defined or custom category
- **Priority** — Low, Medium, or High
- **Tags** — Comma-separated labels for flexible grouping (e.g., `work, urgent, project`)
- **Set Alarm** — Enable a time-based alarm reminder

**Per-Task Actions (Inline Menu)**
Each task card has a right-side action menu with:
- ✅ **Toggle Complete** — Left-side checkbox to mark done/undone
- ✏️ **Edit** — Modify any field after creation; useful when plans change
- 🔔 **Set Alarm** — Add or update a reminder alarm for that specific task
- 🔗 **Share** — Share the task with any other registered user on the platform
- 🗑️ **Delete** — Remove the task permanently

**Category Management**
A dedicated "Manage Categories" panel lets you:
- Create categories with a custom name and color
- Delete or edit existing categories
- Default categories included: Study, Work, Health, Personal, Break, Sleep
- Custom categories you create persist and apply across the entire app

---

### 4. 📅 Calendar

A visual scheduling interface to understand how your tasks are distributed across time.

![Calendar](screenshots/calendar.png)

**Monthly Calendar Grid**
- Full month view (Sun–Sat) with task indicators on relevant dates
- Navigate between months using previous/next arrows
- "Today" button snaps back to the current date instantly

**Date Click — Task Drill-Down**
- Click any date to see all tasks scheduled for that day
- Tasks are shown with their title, priority badge, and completion status
- "Hide completed" toggle to declutter the view

**Quick Stats Row**
- Today, Pending, Completed, High Priority counts shown above the calendar for instant context

**New Task from Calendar**
- "+ New Task" button in the calendar header lets you create tasks with the selected date pre-filled

**Upcoming Tasks Panel**
Below the calendar, all upcoming tasks for the month are listed chronologically with their scheduled date, time, and priority level.

---

### 5. ⏱️ Focus Timer — Deep Work Zone

Designed to create a distraction-free work environment modeled on the Pomodoro Technique.

**Timer Modes**
- **Work** — Default 25-minute focused work session
- **Short Break** — 5-minute rest between sessions
- **Long Break** — 15-minute extended break after 4 sessions

**Session Controls**
- Start, Pause, and Reset the timer
- Timer continues running even if you navigate to other pages (background mode)
- Visual countdown display with large, readable numerals

**Task Linking**
- Select any pending task from a dropdown before starting a session
- The timer runs "for" that task — keeping you mentally anchored
- When the timer completes, the time spent is automatically added to that task's **category time log**, so your analytics accurately reflect where you spent your deep work time

**Session Stats**
Real-time display of:
- Total Focus Time accumulated across all sessions today
- Number of sessions completed
- Distractions count (manual self-reporting)
- Average time per session

**Custom Timer Settings**
Navigate to your Profile → Settings to customize:
- Work interval (minimum: 1 minute, up to your preference)
- Short break and long break durations
- Number of sessions before a long break
- Block distractions toggle
- Working hours (start time and end time per day)
- Working days of the week

**View Stats Button**
Navigates directly to the Analytics page filtered to focus session data.

---

### 6. 📊 Productivity Analytics

A comprehensive data dashboard that helps you understand your productivity patterns over time.

![Analytics Overview](screenshots/analytics-overview.png)

**Time Period Filter**
Analyze your data across selectable time windows:
- Last 7 days
- Last 30 days (default)
- Last 90 days
- Custom date range

**4 Core KPI Cards**
| Metric | Description |
|--------|-------------|
| Completion Rate | % of tasks completed (e.g., 100% = 1/1 tasks) with week-over-week delta |
| Productive Hours | Total focused work time logged through the timer |
| Focus Score | Concentration quality score out of 100 |
| Current Streak | Consecutive active days in a row |

**6 Analytics Tabs**

- **Overview** — Summary KPIs + Daily Productivity chart showing tasks completed (bars) and completion rate % (line) over time. Insight cards show Best Day, Peak Hours, and today's Focus Sessions.

- **Trends** — Week-over-week and month-over-month trend analysis to identify improving or declining productivity patterns.

- **Categories** — Pie/bar breakdown showing how much time and how many tasks belong to each category (Study, Work, Health, etc.), derived from focus session category linking.

- **Time Analysis** — Heatmap or bar charts showing which hours of the day you are most active and productive.

- **Performance** — Deeper dive into your task completion velocity, average task duration, and priority distribution.

- **Forecast** — Projected productivity trends based on historical data patterns.

**Export Options**
- **Export Report** — Downloads your analytics data as a JSON, CSV, or PDF file
- **Download PDF Report** — Generates a formatted PDF report for offline review or sharing with mentors/managers

**Refresh Button**
Forces a live data reload to reflect the latest completed tasks and sessions.

---

### 7. 💬 Real-Time Chat

A built-in messaging system so you can collaborate without leaving the app — especially useful for sharing study progress with peers.

**Direct Messaging**
- Find and message any user who has registered on the platform
- Conversation history is preserved with timestamps and sender information
- Read/unread status indicators

**Group Chat**
- Create named group conversations with multiple users
- Useful for study groups or project teams
- **Only the group admin can add or remove members**, maintaining order in collaborative groups

**Image Sharing**
- Attach and send images directly in chat
- Ideal for sharing LeetCode solutions, handwritten notes, whiteboard diagrams, or screenshots — without needing to leave the focus environment and open another app

**Use Case Example**
You solved a complex DSA problem and want to share your approach with your study group? Take a screenshot, open the group chat, and share it directly — no WhatsApp distractions required.

---

### 8. 👤 Profile — LinkedIn-Style Social Presence

A professional, portfolio-ready public profile within the app.

![Profile](screenshots/profile.png)

**Profile Customization**
- Upload a custom **profile picture** (circular avatar)
- Set a full-width **banner/cover image** — similar to LinkedIn
- Add your **name**, **position/title**, and **bio**

**Tabs**
- **Overview** — Bio, about section, recent activity feed (completed tasks today, focus hours this week, achievements earned total)
- **Statistics** — Detailed stats summary: tasks completed, tasks pending, focus hours, current streak, productivity score, weekly goal progress
- **Achievements** — Earned badges and milestones (e.g., "Completed 10 tasks", "5-day streak", "First focus session")
- **Settings** — Full app configuration panel

**Settings Panel**
Comprehensive settings available from the profile:

| Section | Options |
|---------|---------|
| Appearance | Dark Mode toggle |
| Notifications | Enable notifications, Email alerts, Notification sounds, Snooze minutes |
| Focus Mode | Work time, Break time, Long break time, Sessions count, Block distractions |
| Working Hours | Start time, End time, Working days (Sun–Sat checkboxes) |

**Focus Statistics Widget**
- Displays total focus hours, weekly goal (default: 20 hours), productivity score
- Bar chart showing daily focus hours for the current week (Mon–Sun)
- Work by Category breakdown showing where your focus time was spent

---

### 9. 🔔 Navbar — Smart Notification Center

The top navigation bar is more than just navigation — it's your real-time activity hub.

**Dark Mode Toggle**
Instantly switch between light and dark themes. Preference is saved and persists across sessions.

**Global Search**
Search bar in the navbar lets you search tasks and notes from anywhere in the app without navigating away.

**Notification Bell**
- Badge shows the total count of **unread notifications**
- Notifications are triggered by:
  - Task alarm reminders (when an alarm you set fires)
  - Task completion confirmations
  - Shared tasks received from other users
  - Group chat messages
- Click a notification to mark it as read — it disappears from the unread count
- "Mark all as read" button to clear all at once
- Once read, notifications are removed from the badge counter

**Alarm System**
- When a task alarm fires, a **ring/chime plays** at the scheduled time
- A popup appears with options to:
  - **Snooze** — Delay the alarm by a configurable number of minutes
  - **Stop** — Dismiss the alarm permanently
- Alarm works even if you're on a different page within the app

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18+** | Component-based UI architecture |
| **Vite** | Blazing-fast development server and build tool |
| **React Router v6** | Client-side routing and page navigation |
| **Recharts** | Animated, responsive analytics charts |
| **Tailwind CSS** | Utility-first styling with dark mode support |
| **React Context API** | Global state management for auth, theme, notifications |
| **date-fns** | Date parsing, formatting, and arithmetic |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | NoSQL database with schema validation |
| **Socket.IO** | Real-time bidirectional chat and notifications |
| **JWT (JSON Web Tokens)** | Stateless authentication |
| **bcryptjs** | Secure password hashing |
| **Multer** | File upload handling for profile images and chat attachments |
| **Nodemailer** | Email notification support |

---

## 📁 Project Structure

```
productivity-pro/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/            # Images, icons, static files
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar/
│   │   │   ├── Sidebar/
│   │   │   ├── TaskCard/
│   │   │   ├── Timer/
│   │   │   └── Charts/
│   │   ├── pages/             # Page-level components
│   │   │   ├── Dashboard/
│   │   │   ├── Tasks/
│   │   │   ├── Calendar/
│   │   │   ├── Focus/
│   │   │   ├── Analytics/
│   │   │   ├── Chat/
│   │   │   └── Profile/
│   │   ├── context/           # Auth, Theme, Notification contexts
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── backend/
│   ├── controllers/           # Business logic per module
│   ├── models/                # Mongoose schemas (User, Task, Chat, etc.)
│   ├── routes/                # Express route definitions
│   ├── middleware/             # Auth middleware, error handlers
│   ├── socket/                # Socket.IO event handlers
│   ├── utils/                 # Alarm scheduler, email sender
│   └── server.js
│
├── screenshots/               # README screenshots
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/abhishekyadav/productivity-pro.git
cd productivity-pro
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/productivity-pro
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

### 4. Open the App

Visit `http://localhost:5173` in your browser. Create an account and start tracking your productivity!

---

## 🧠 What I Learned Building This

This project was a complete end-to-end learning experience that leveled up my engineering skills significantly:

**Frontend Engineering**
- Building complex, stateful UIs with React — managing interdependent state across tasks, timers, and analytics
- Custom hook design patterns for reusable logic (useTimer, useNotifications, useAlarm)
- Implementing chart visualizations with Recharts and making them data-driven
- Dark mode theming with Tailwind CSS using CSS variables and context
- Responsive layouts that work across screen sizes

**Backend Engineering**
- Designing normalized MongoDB schemas for Users, Tasks, Categories, Chat Messages, and Sessions
- Building secure REST APIs with JWT authentication and route protection middleware
- Real-time event handling with Socket.IO for chat and live notifications
- Scheduling alarm events server-side using Node.js timers and cron-like logic
- File upload pipelines with Multer for profile images and chat attachments

**System Design Thinking**
- Data isolation — ensuring users only see their own data through middleware-level enforcement
- Category-linked focus sessions — when a timer completes for a task in "Study" category, that time is logged under Study analytics
- Notification lifecycle — creating, delivering, reading, and clearing notifications across a session
- Export pipeline — serializing user analytics data into PDF and CSV formats on demand

**Product Thinking**
- Understanding the user journey: from creating a task → scheduling it → setting an alarm → running a focus session → reviewing analytics
- Reducing friction at every step — one-click task creation from calendar, quick toggle on dashboard, etc.
- Building features that create habit loops: streaks, completion rates, and weekly goals that keep users engaged

**New Skills Acquired**
- Socket.IO real-time bidirectional communication
- Recharts for animated, responsive data visualization
- File handling and preview in React (profile images, chat image sharing)
- Complex form management with dynamic fields (category management, tag inputs)
- Browser Notifications API integration for alarm sounds and popup alerts

---

## 🏆 Key Achievements & Highlights

- 🔴 **Full-stack solo project** — designed, built, and deployed end-to-end
- ⚡ **Real-time features** — live chat and notifications via Socket.IO
- 📊 **6 analytics dimensions** — more than most commercial productivity apps offer
- 🔔 **Custom alarm system** — task-level alarms with snooze functionality
- 🤝 **Social features** — task sharing, group chats, image sharing among users
- 🌙 **Full dark mode** — persisted across sessions
- 📤 **Data export** — PDF, JSON, CSV report generation
- 🎯 **Category-linked focus tracking** — time automatically attributed to correct category

---

## 🗺️ Future Roadmap

- [ ] Mobile app (React Native)
- [ ] Google Calendar sync
- [ ] AI-powered task suggestions based on productivity patterns
- [ ] Habit tracker module
- [ ] Public profile pages (shareable links)
- [ ] Collaborative task boards (Kanban view)
- [ ] Browser extension for quick task capture

---

## 🤝 Contact

**Abhishek Yadav**

📧 yadabhishek62@gmail.com  
🔗 [LinkedIn](https://linkedin.com/in/abhishekyadav)  
💻 [GitHub](https://github.com/abhishekyadav)  

---

> *"Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort."*
> 
> — Built with ❤️ and a lot of focus sessions by Abhishek Yadav

---

<div align="center">

⭐ **If this project impressed you, drop a star on GitHub!** ⭐

</div>
