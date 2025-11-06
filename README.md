# 🧩 🏠 BIF-AuctionHouse: A Fullstack Auction Platform  
**Next.js (Frontend) + Express.js (Backend) + MongoDB (Database)**  
Server-Side Rendered (SSR) Web Application

---

## 🚀 Project Overview
This project is a full-featured online auction platform built with a **Next.js** frontend (SSR enabled), an **Express.js** backend API, and a **MongoDB** database.  
It supports multiple user roles (Guest, Bidder, Seller, Administrator) and implements a live auction system with bidding, product management, account upgrades, and more.

---

## 🏗️ Tech Stack

| Layer | Framework / Library | Description |
|-------|----------------------|-------------|
| **Frontend** | Next.js (React + TypeScript) | SSR web app, modular routing using `/app` directory |
| **Backend** | Express.js | REST API service and authentication |
| **Database** | MongoDB | Stores users, products, bids, and system data |
| **Containerization** | Docker + Docker Compose | Isolated environments for backend, frontend, and MongoDB |
| **Auth & Security** | Passport.js + bcrypt | Handles login, registration, and role-based access |
| **Styling** | Tailwind CSS | Clean and scalable component styling |

---

## ⚙️ Installation & Setup Guide

### 1️⃣ Install Dependencies
Before running the project, install dependencies for both frontend and backend.

### Frontend
```bash
cd src/frontend
npm install
``` 

#### Backend
```bash
cd src/backend
npm install
```

### 2️⃣ Run with Docker (Recommended)
The Docker setup will build and run the full system (frontend, backend, and MongoDB).

#### First-time setup or after adding new packages:
```bash
docker-compose up -d --build
```

#### For subsequent runs:
```bash
docker-compose up -d
```

#### This builds and starts all services:
- Frontend: http://localhost:3000
- Backend (Express API): http://localhost:3001
- MongoDB: mongodb://localhost:27017

#### To stop the services:
```bash
docker-compose down
```

### 3️⃣ Run without Docker (Development Only)
You can also run the frontend and backend separately for development purposes.

#### Start MongoDB
Make sure you have MongoDB installed and running on your machine.

#### Start Backend
In one terminal:
```bash
cd src/backend
npm run dev
```

#### Start Frontend
In a new terminal:
```bash
cd src/frontend
npm run dev
```

### 4️⃣ Environment Variables
Create a `.env` file at the project root with the following variables:

```bash
# MongoDB
MONGO_URI=mongodb://mongo:27017/auction_db

# Server
PORT=3001
JWT_SECRET=supersecretkey

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5️⃣ Project Directory Structure

```bash
/
├─ root/
│  ├─ backend/                     # Express.js backend service
│  │  ├─ src/
│  │  │  ├─ api/                   # API routes (controllers)
│  │  │  ├─ config/                # Environment, DB connection, etc.
│  │  │  ├─ middlewares/           # Custom middlewares
│  │  │  ├─ models/                # Mongoose models (User, Product, Bid, etc.)
│  │  │  ├─ routes/                # Express routers
│  │  │  └─ utils/                 # Helper functions
│  │  ├─ tests/                    # Unit & integration tests
│  │  ├─ swagger.yaml              # API documentation
│  │  └─ server.ts                 # Entry point
│  │
│  └─ frontend/                    # Next.js frontend (SSR)
│     ├─ src/
│     │  ├─ app/                   # App router pages
│     │  │  ├─ (guest)/            # Guest routes
│     │  │  ├─ (bidder)/           # Bidder routes
│     │  │  ├─ (seller)/           # Seller routes
│     │  │  ├─ (admin)/            # Admin routes
│     │  │  └─ layout.tsx          # Root layout (Navbar, Footer, etc.)
│     │  ├─ components/            # Reusable React components
│     │  ├─ hooks/                 # Custom React hooks
│     │  ├─ lib/                   # Utility functions (formatters, helpers)
│     │  ├─ styles/                # Global & modular styles
│     │  └─ types/                 # TypeScript type definitions
│     ├─ public/                   # Static files (images, icons, etc.)
│     ├─ next.config.js
│     └─ tsconfig.json
│
├─ .env                            # Environment variables (excluded from Git)
├─ docker-compose.yml              # Docker configuration
├─ .gitignore
└─ README.md
```

### 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/KwanTheAsian">
        <img src="https://avatars.githubusercontent.com/KwanTheAsian" width="100px;" alt="KwanTheAsian"/><br />
        <sub><b>23127020 - Biện Xuân An</b></sub>
      </a><br />
      ⚙️ Tester / Developer
    </td>
    <td align="center">
      <a href="https://github.com/PaoPao1406">
        <img src="https://avatars.githubusercontent.com/PaoPao1406" width="100px;" alt="PaoPao1406"/><br />
        <sub><b>23127025 - Đoàn Lê Gia Bảo</b></sub>
      </a><br />
      🎨 Designer / Developer
    </td>
    <td align="center">
      <a href="https://github.com/VNQuy94">
        <img src="https://avatars.githubusercontent.com/VNQuy94" width="100px;" alt="VNQuy94"/><br />
        <sub><b>23127114 - Văn Ngọc Quý</b></sub>
      </a><br />
      ⚙️ Tester / Developer
    </td>
    <td align="center">
      <a href="https://github.com/Schooleo">
        <img src="https://avatars.githubusercontent.com/Schooleo" width="100px;" alt="Schooleo"/><br />
        <sub><b>23127136 - Lê Nguyễn Nhật Trường</b></sub>
      </a><br />
      💻 Project Manager / Developer
    </td>
  </tr>
</table>

### 📜 License
This project is for educational purposes only and not intended for commercial use.