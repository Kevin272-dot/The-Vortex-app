# 🌀 V-Vortex Hackathon

> A comprehensive hackathon management platform for VIT Chennai

[![Live Demo](https://img.shields.io/badge/Live-v--vortex.in-blue?style=for-the-badge)](https://v-vortex.in)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

## 📖 Overview

V-Vortex is a full-featured web application designed to handle all aspects of hackathon management, including:

- 👥 **Attendee Registration** - Seamless participant sign-up flow
- 🏗️ **Team Formation** - Build and manage hackathon teams
- 📝 **Problem staement selector 
- 📊 **Real-time Scorekeeping** - Live leaderboard and scoring system
- 🔧 **Administrative Tools** - Comprehensive admin dashboard

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | Frontend UI library |
| **Vite 7** | Build tool & dev server |
| **React Router 7** | Client-side routing |
| **Supabase** | Backend, Auth & Database |
| **Vercel** | Deployment & hosting |

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/V-Vortex-VIT/V-Vortex-Hackathon.git
   cd V-Vortex-Hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:5173](http://localhost:5173)

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint checks |

## 📁 Project Structure

```
V-Vortex-Hackathon/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route pages
│   ├── styles/          # CSS stylesheets
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
└── package.json
```

## 🔗 Links

- 🌐 **Live Site**: [v-vortex.in](https://v-vortex.in)
- 🐛 **Issues**: [GitHub Issues](https://github.com/V-Vortex-VIT/V-Vortex-Hackathon/issues)

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made by the V-Vortex web dev team
Lead - L.Kevin Daniel
Members - Ibhan Mukerjee,Devangshu Pandey and srijan Guchhait
at VIT Chennai</p>
