# Service Subscription & Booking System

A full-stack service booking platform where customers can explore services, purchase subscription plans, manage bookings, and track payments. The system provides separate functionality for Admin, Staff, and Customer roles.

## Live Demo

- **Frontend:** [https://service-booking-system-ashy.vercel.app/](https://service-booking-system-ashy.vercel.app/)
- **Backend API:** [https://booking-system-h806.onrender.com](https://booking-system-h806.onrender.com)
- **Health Check:** [https://booking-system-h806.onrender.com/api/health](https://booking-system-h806.onrender.com/api/health)

## Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod Validation
- Helmet, CORS, and Morgan

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS v4
- Axios

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control for Admin, Staff, and Customer
- Protected routes and role-specific permissions

### Categories & Services
- Create, update, and manage categories and services
- Soft delete using active/inactive status
- Search, filtering, and pagination
- Service price filtering and sorting
- Customers can access only active categories and services

### Subscription Plans
- Create and update subscription plans
- Associate multiple services with a plan
- Configure plan prices, durations, and service credits
- Activate or deactivate plans
- Subscribe to plans with mock payment processing

### Booking Management
- Create one-time and subscription-based bookings
- Manage service slots and staff assignments
- Update booking status according to role permissions
- Cancel bookings
- Handle subscription credits and booking-related payment/refund records

### Staff Management
- Admin-managed staff accounts
- Staff-specific service slot management
- Staff access restricted to permitted booking operations

### Role-Based Dashboards

**Admin Dashboard**
- Business statistics
- Recent activity feed

**Staff Dashboard**
- Today's assigned bookings
- Upcoming services
- Completed services
- Recent activity feed

**Customer Dashboard**
- Current subscription information
- Remaining subscription credits
- Upcoming bookings
- Payment history
- Recent activity feed

### Additional Features
- API request validation using Zod
- Pagination and search
- Transaction-related utilities
- Centralized API client with authentication token handling
- Dashboard loading, error, and refresh states

## Project Structure

```text
booking-system/
├── backend/
│   └── src/
│       ├── config/
│       ├── middlewares/
│       ├── modules/
│       ├── routes/
│       ├── utils/
│       ├── app.ts
│       └── server.ts
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── utils/
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js
- npm
- PostgreSQL database

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Configure the environment variables with your own values.

Run the database migrations and generate the Prisma Client using the project's configured Prisma commands.

Start the development server:

```bash
npm run dev
```

Build and start the production server:

```bash
npm run build
npm start
```

Backend health endpoint:

```text
GET /api/health
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

## Deployment

- **Frontend:** Deployed on Vercel
- **Backend:** Deployed on Render

The frontend communicates with the backend through the configured API URL. Ensure the backend's CORS configuration allows requests from the frontend origin.

## Notes

- Payments use mock payment processing.
- Keep environment variables and secrets out of version control.
- Admin, Staff, and Customer have different permissions and dashboard views.
