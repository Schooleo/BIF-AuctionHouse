# 🧩 🏠 BIF-AuctionHouse: A Fullstack Auction Platform

**React (Frontend) + Express.js (Backend) + MongoDB (Database)**  
Client-Side Rendered (CSR) Web Application

---

## 🚀 Project Overview

**BIF-AuctionHouse** is a full-featured online auction platform built with a **React** frontend, an **Express.js** backend API, and a **MongoDB** database.  
It supports multiple user roles (Guest, Bidder, Seller, Administrator) and provides features such as:

- 🛒 Product listings and live bidding
- 💰 Seller and bidder role upgrades
- 🔐 Secure authentication and authorization
- ⚙️ Account management and admin control
- 🖥️ Responsive and modern UI built with TailwindCSS

---

## 🏗️ Tech Stack

| Layer                | Framework / Library        | Description                                              |
| -------------------- | -------------------------- | -------------------------------------------------------- |
| **Frontend**         | React + Vite + TailwindCSS | Responsive client-side application                       |
| **Backend**          | Express.js + TypeScript    | REST API service and authentication                      |
| **Database**         | MongoDB (Mongoose)         | Stores users, products, bids, and system data            |
| **Containerization** | Docker + Docker Compose    | Isolated environments for backend, frontend, and MongoDB |
| **Auth & Security**  | Passport.js + bcrypt       | Handles login, registration, and role-based access       |

---

## ⚙️ Installation & Setup Guide

### 0️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/BIF-AuctionHouse.git
cd BIF-AuctionHouse
```

## ⚙️ Installation & Setup Guide

### 1️⃣ Install Dependencies

Before running the project, install dependencies for both frontend and backend.

### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd server
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
cd server
npm run dev
```

#### Start Frontend

In a new terminal:

```bash
cd client
npm run dev
```

### 4️⃣ Environment Variables

Create a .env file inside the /server directory with the following variables:

```bash
# MongoDB
MONGO_URI=mongodb://mongo:27017/auction_db

# Server
PORT=3001
JWT_SECRET=supersecretkey

# Frontend (used for CORS)
CLIENT_URL=http://localhost:3000
```

### 5️⃣ Project Directory Structure

```bash
BIF-AuctionHouse/
│
├── .gitignore
├── docker-compose.yml
├── LICENSE
├── README.md
│
├── client/                      # Frontend (React + Vite)
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.css            # Tailwind directives
│       ├── main.tsx             # React entry point
│       ├── App.tsx              # Root component
│       ├── components/          # Reusable UI components
│       │   ├── forms/           # Form/Input components
│       │   ├── navbar/          # Navbar components
│       │   ├── product/         # Product-related components
│       │   └── ui/              # UI components (Footer, Spinner, etc.)
│       ├── containers/          # Container components (Login, Register, etc.)
│       ├── interfaces/          # TypeScript interfaces/types
│       ├── layouts/             # Layout components (MainLayout, AuthLayout)
│       ├── pages/               # Page components
│       │   ├── admin/           # Admin dashboard pages
│       │   ├── auth/            # Auth pages (Login, Register, Reset Password)
│       │   ├── shared/          # Shared pages (NotFound)
│       │   └── user/            # User account pages (HomePage)
│       ├── services/            # API services (auth.api.ts, product.api.ts)
│       ├── stores/              # State management (e.g., useAuthStore)
│       └── utils/               # Helper functions
│
└── server/                      # Backend (Express + MongoDB)
    ├── .env
    ├── .env.example
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── app.ts               # Express app initialization
        ├── server.ts            # Entry point
        ├── config/              # Config files (db.ts, passport.ts, env.ts)
        ├── constants/           # Global constants (e.g., messages.ts)
        ├── controllers/         # Request handlers
        ├── middleware/          # Custom middleware (auth, validation, etc.)
        ├── models/              # Mongoose models
        ├── routes/              # Express routes
        ├── schemas/             # Validation schemas (e.g., auth.schema.ts)
        ├── services/            # Service layer logic (e.g., auth.service.ts)
        ├── types/               # TypeScript types/declarations
        └── utils/               # Helper functions (jwt.util.ts, email.util.ts)
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

---

### 📸 Image Credits

Product images used in the seed data are sourced from [Unsplash](https://unsplash.com/), a platform for freely-usable images. We extend our gratitude to the following photographers and contributors:

**Special thanks to all Unsplash photographers whose work enriches this project**, including but not limited to:

- Howard Bouchevereau
- Hakim Menikh
- Thai Nguyen
- Lumi W
- Its me Pravin
- amjed omaf
- And many other talented photographers

All images are used in accordance with the [Unsplash License](https://unsplash.com/license), which allows free use for commercial and non-commercial purposes without requiring permission.

---

### 📜 License

This project is for educational purposes only and not intended for commercial use.
