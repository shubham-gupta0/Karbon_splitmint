# 🌟 SplitMint

A breathtakingly beautiful, production-ready expense-splitting web application built with React and modern web technologies.

## ✨ Features

- 🔐 Secure authentication system
- 👥 Group management (up to 4 participants per group)
- 💰 Smart expense splitting (equal, custom, percentage)
- 📊 Beautiful data visualizations
- 🎨 Stunning UI with dark mode
- 📱 Fully responsive design
- ⚡ Lightning-fast performance

## 🛠️ Tech Stack

### Frontend

- React 18+ with Vite
- Tailwind CSS + shadcn/ui components
- Zustand for state management
- TanStack Query for server state
- Framer Motion for animations
- Recharts for visualizations

### Backend

- Express.js with Vercel serverless support
- Prisma ORM with SQLite
- JWT authentication
- RESTful API design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd karbon_assignment
```

2. Install dependencies

```bash
npm run install:all
```

3. Set up environment variables

**Frontend (.env)**

```
VITE_API_URL=http://localhost:3000/api
```

**Backend (.env)**

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
```

4. Initialize database

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

5. Run development servers

**Terminal 1 - Backend:**

```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**

```bash
npm run dev:frontend
```

The app will be available at `http://localhost:5173`

## 📦 Project Structure

```
splitmint/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and helpers
│   │   ├── store/       # Zustand state stores
│   │   └── styles/      # Global styles
│   └── ...
├── backend/           # Express backend API
│   ├── api/           # API route handlers
│   ├── prisma/        # Database schema and migrations
│   ├── src/           # Source code
│   │   ├── lib/         # Core libraries
│   │   ├── middleware/  # Express middleware
│   │   └── utils/       # Utility functions
│   └── ...
└── README.md
```

## 🚀 Deployment

### Vercel Deployment

1. Install Vercel CLI

```bash
npm i -g vercel
```

2. Deploy backend

```bash
cd backend
vercel --prod
```

3. Deploy frontend

```bash
cd frontend
vercel --prod
```

4. Set environment variables in Vercel dashboard

## 📖 API Documentation

See [API.md](./API.md) for detailed API documentation.

## 🎨 Design System

See [DESIGN.md](./DESIGN.md) for design system documentation.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Credits

Built with ❤️ using modern web technologies.
