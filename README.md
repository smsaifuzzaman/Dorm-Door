# DormDoor Platform (Unified MERN)

DormDoor is a MERN-stack web platform that connects students with dorm administrators to simplify accommodation management.

The project has been unified into a single React frontend plus a complete Node.js + Express + MongoDB backend. Students can browse and apply for dorm rooms, while admins can manage listings, availability, applications, and verification workflows from one system.

## Project Overview

Students often face challenges finding suitable dormitory options and communicating with dorm managers. DormDoor provides a centralized system where students can:

- Browse available dorms
- Filter by room type, budget, and amenities
- Submit accommodation requests
- Track request progress

Dorm administrators can:

- Manage dorm and room inventory
- Review applications and documents
- Update room status and seat availability
- Handle support and maintenance workflows

The goal is to make student housing more transparent, organized, and efficient.

## Key Features

### Student Features

- View available dormitories
- Search and filter dorm options
- View dorm facilities and details
- Send accommodation requests
- Track request status
- Submit maintenance and support requests
- Upload and monitor document verification

### Dorm Administrator Features

- Add and manage dorm listings
- Add and manage room inventory
- Update room availability and status
- Approve or reject accommodation requests
- Review and verify submitted documents
- Manage support and maintenance queues

### System Features

- Secure authentication system
- Role-based access control (`student` / `admin`)
- Responsive frontend UI
- RESTful API integration
- Notification support

## Project Structure

- `frontend/`: Single React app for:
  - Public pages (`Home`, `Browse Dorms`, `Dorm Details`, `Apply Now`, `Login`, `Signup`)
  - Student dashboard (`Overview`, `Applications`, `Maintenance`, `Documents`, `Reviews`, `Profile`, `Support`)
  - Admin dashboard (`Overview`, `Dorms`, `Add Dorm`, `Add Room`, `Applications`, `Documents`, `Availability`, `Support`, `Settings`)
- `backend/`: REST API with JWT auth, role-based access, and MongoDB models
- `database/`: Seed script (`seed.js`) to initialize sample data
- `docs/`: Project documentation artifacts

## Backend Modules

- Authentication (`/api/auth`): signup, login, current user
- Dorm management (`/api/dorms`)
- Room management (`/api/rooms`)
- Applications workflow (`/api/applications`)
- Documents verification (`/api/documents`)
- Maintenance tickets (`/api/maintenance`)
- Support tickets and messages (`/api/support`)
- Reviews (`/api/reviews`)
- Dashboards (`/api/dashboard/student`, `/api/dashboard/admin`)
- Profile/settings (`/api/profile`)
- Notifications (`/api/notifications`)

## MongoDB Models

- `User`
- `Dorm`
- `Room`
- `Application`
- `Document`
- `MaintenanceTicket`
- `SupportTicket`
- `Review`
- `Notification`

## Tech Stack

### Frontend

- React.js
- JavaScript (ES6+)
- HTML5 / CSS3
- Tailwind CSS

### Backend

- Node.js
- Express.js
- JWT authentication
- REST API

### Database

- MongoDB
- Mongoose

## Software Requirement Specification (SRS)

- SRS Document: <https://docs.google.com/document/d/1kyJ3a-__SnDEJlsWqzD_rssGZyYHQ51zwOtq3SbNtmA/edit?tab=t.0>

## Team Members

- MD Ratul Hasan Sarkar - `23201562`
- Aurora Bintay Mostafa - `23101491`
- S. M. Saifuzzaman - `23201243`
- Fuad Mohammed Jawad - `23201555`

## Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment

- Backend env file: `backend/.env`
- Template: `backend/.env.example`

Current setup includes:

- `PORT=5000`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `CLIENT_URL=http://localhost:5173`

### 3. Seed sample data

```bash
cd backend
npm run seed
```

Seeded login accounts:

- Admin: `admin@dormdoor.com` / `Admin123!`
- Student: `student@dormdoor.com` / `Student123!`

### 4. Run backend

```bash
cd backend
npm run dev
```

### 5. Run frontend

```bash
cd frontend
npm run dev
```

Defaults:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Frontend API Base URL

The frontend uses:

- `VITE_API_URL` (if provided)
- fallback: `http://localhost:5000/api`

Optional `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
```

## Notes

- Current document upload flow is metadata-based (file URL + filename). You can later connect real file storage (for example Cloudinary or S3).
- Application approval and room occupancy flows are linked so approved allocations can update occupied seats.
