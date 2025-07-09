# replit.md

## Overview

This is a full-stack web application built with React (frontend) and Express.js (backend) that serves as a tutoring marketplace platform called "학원광장" (Academy Square). The application allows tutors to create posts advertising their services, with features for user authentication, admin approval, and content filtering.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and build processes
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL session store
- **File Uploads**: Multer for handling image uploads
- **Password Security**: Node.js crypto module with scrypt for hashing

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript types and schemas
├── uploads/         # File upload directory
└── migrations/      # Database migrations
```

## Key Components

### Authentication System
- User registration requires approval by admin
- Session-based authentication with PostgreSQL session store
- Password hashing using scrypt with salt
- Role-based access control (admin vs regular users)

### Post Management
- Users can create posts with title, content, region, subject, and target grade
- Image upload support for posts
- Filtering by region, subject, and target grade
- Admin can delete posts

### Admin Panel
- Approve/reject pending user registrations
- View and manage all posts
- User management capabilities

### Database Schema
- **Users**: id, username, password, phone, status, isAdmin, createdAt
- **Posts**: id, title, content, region, subject, targetGrade, imageUrl, authorId, createdAt
- Relationships: Posts belong to Users (one-to-many)

## Data Flow

1. **User Registration**: New users register → status set to "pending" → admin approval required
2. **Post Creation**: Authenticated users create posts → stored with author reference → immediately visible
3. **Filtering**: Frontend sends query parameters → backend filters posts → returns filtered results
4. **File Upload**: Images uploaded to `/uploads` directory → file path stored in database

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router via Wouter)
- UI components from Radix UI primitives
- TanStack Query for data fetching
- Tailwind CSS for styling
- React Hook Form + Zod for form handling

### Backend Dependencies
- Express.js for web server
- Drizzle ORM for database operations
- Passport.js for authentication
- Multer for file uploads
- Neon Database serverless client for PostgreSQL

### Database
- PostgreSQL (configured for Neon Database)
- Connection managed through connection pooling
- Migrations handled by Drizzle Kit

## Deployment Strategy

### Development
- Frontend: Vite dev server with HMR
- Backend: tsx for TypeScript execution
- Database: Environment variable `DATABASE_URL` for connection

### Production Build
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server code to `dist/`
- Static files served from built frontend
- File uploads stored in `uploads/` directory

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `NODE_ENV`: Environment setting (development/production)

### Database Setup
- Run `npm run db:push` to sync schema with database
- Migrations stored in `./migrations` directory
- Schema defined in `shared/schema.ts`

The application follows a monorepo structure with shared TypeScript types between frontend and backend, enabling type safety across the full stack. The authentication system requires admin approval for new users, making it suitable for a curated tutoring marketplace.