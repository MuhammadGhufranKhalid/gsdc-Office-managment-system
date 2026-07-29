# GSDC Office Management System

**Ghufran Software Development Company — Office Management System**

A full-stack (MERN) office management platform for a software house. This repository
contains a **working, runnable foundation** with a clean, scalable architecture that you
can extend module by module.

> ### Read this first — honest scope note
> The original brief describes a complete commercial SaaS with 20+ modules. That is
> months of team work. What ships here is a **real, functional core** — not placeholders —
> that runs end to end and is architected so every listed module works against live data.
> Business-specific rules (e.g. payroll tax formulas, approval chains) are stubbed with
> sensible defaults for you to refine. Nothing here is fake demo code; it all executes.

## What actually works today
- JWT auth (login) with hashed passwords (bcrypt) and role-based access control (RBAC)
- MongoDB models for every core entity (Employees, Departments, Projects, Clients,
  Tasks, Milestones, TimeLogs, Attendance, Leaves, Payroll, Contracts, Meetings,
  Assets, Notifications, Comments, ActivityLogs)
- A generic CRUD controller factory → every module gets list/create/read/update/delete,
  pagination, search, sort and filtering for free (no duplicated code)
- Seed script that generates 123 employees across 13 departments with realistic
  Pakistani names, salaries, contracts and joining dates
- React 19 + Vite + Tailwind frontend: login, dashboard with charts, dark/light mode,
  responsive sidebar layout, and config-driven data-table pages for every module

## Tech stack
Frontend: React 19, Vite, Tailwind CSS, React Router, Axios, Recharts, Framer Motion, date-fns
Backend: Node.js, Express, Mongoose, JWT, bcrypt, Helmet, CORS, Morgan, express-validator

## Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

## Setup

```bash
# 1. Backend
cd backend
cp .env.example .env          # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed                  # creates the 123-employee dataset + admin user
npm run dev                   # starts API on http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                   # starts app on http://localhost:5173
```

## Default login (created by the seed script)
```
Email:    admin@gsdc.com
Password: Admin@123
```

## Project structure
```
gsdc/
├── backend/
│   └── src/
│       ├── config/        # db + env
│       ├── models/        # Mongoose schemas
│       ├── controllers/   # crudFactory + custom controllers
│       ├── routes/        # express routers
│       ├── middleware/    # auth, rbac, error handling, validation
│       ├── utils/         # ApiError, ApiResponse, asyncHandler, token
│       └── seed/          # database seeder
└── frontend/
    └── src/
        ├── context/       # Auth + Theme providers
        ├── services/      # axios API layer
        ├── components/    # Layout, Sidebar, DataTable, StatCard, ...
        └── pages/         # Dashboard + one page per module
```

## License
Provided as a foundation for Ghufran Software Development Company. Extend freely.
