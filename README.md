# Task Buddy — Neumorphic To-Do Web Application

**Task Buddy** is a production-ready, mobile-first, full-stack To-Do web application built with a modern Neumorphic design system, Supabase Auth & PostgreSQL, jsPDF printable exports, `@dnd-kit` drag-and-drop task reordering, and hotkey shortcuts.

---

## 🌐 Live Repository & Deployment

- **GitHub Repository:** [https://github.com/Bhuvan3sh/Todo-Webapp.git](https://github.com/Bhuvan3sh/Todo-Webapp.git)
- **Deployment Platform:** Vercel (pre-configured with `vercel.json` for SPA routing)

---

## 🎨 Neumorphic Design Tokens

- **Background:** `#E0E5EC` (Light), `#1E2130` (Dark)
- **Primary Accent:** `#6C63FF`
- **Raised Box Shadow (Light):** `6px 6px 12px #A3B1C6, -6px -6px 12px #FFFFFF`
- **Sunken / Inset Box Shadow (Light):** `inset 4px 4px 8px #A3B1C6, inset -4px -4px 8px #FFFFFF`
- **Raised Box Shadow (Dark):** `6px 6px 12px #151821, -6px -6px 12px #2A2F45`
- **Sunken / Inset Box Shadow (Dark):** `inset 4px 4px 8px #151821, inset -4px -4px 8px #2A2F45`
- **Border Radius:** `16px` (Cards), `12px` (Buttons), `50%` (Icon Buttons)

---

## 🚀 Key Features

1. **Supabase Auth & PostgreSQL Integration**: Email + Password auth with user profiles, protected routes, and Row Level Security (RLS) policies.
2. **Local Demo Mode**: Works out of the box on `localhost` even before connecting live Supabase credentials!
3. **Mobile-First Design**: Slide-over list drawer, fixed mobile bottom navigation bar, floating action button (`+`), touch-optimized drag-and-drop (`TouchSensor` delay: 200ms), and bottom-sheet form modals.
4. **List Management**: Create, edit, delete, deadline countdowns, completion progress bar, 6 preset colors.
5. **Task Management**: Drag & drop reordering (`@dnd-kit`), priority color stripes, checkbox completion strikethrough, accordion description, inline editing, 3-second undo toast deletion.
6. **Printable PDF Export**: Download list summary as PDF with printable checkbox squares `□`, status, priority badges, header stats, and page numbers via `jsPDF` + `jspdf-autotable`.
7. **Dark / Light Theme Toggle**: Persistent neumorphic theme stored in `localStorage`.
8. **Keyboard Shortcuts**:
   - `N`: Create new task
   - `L`: Create new list
   - `/`: Focus top search bar
   - `Esc`: Close open modal dialogs
9. **Dashboard Overview Stat Cards**: Real-time counter for Total Lists, Total Tasks, Completed Today, and Overdue Tasks.

---

## 🛠️ Local Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (For Live Supabase)
Copy `.env.example` to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*Note: If left blank, Task Buddy will automatically use local storage demo mode so you can test all features on localhost immediately.*

### 3. Run Database Migrations (For Supabase)
Execute the SQL script located in `supabase/migrations/01_initial_schema.sql` in your Supabase SQL Editor.

### 4. Start Local Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

---

## 📦 Deployment to GitHub & Vercel

```bash
git init
git add .
git commit -m "Task Buddy - Production Ready Neumorphic Web Application"
git branch -M main
git remote add origin https://github.com/Bhuvan3sh/Todo-Webapp.git
git push -u origin main
```
