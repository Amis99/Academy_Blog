# replit.md

## Overview

This is a full-stack web application built with React (frontend) and Express.js (backend) that serves as a tutoring marketplace platform called "학원광장" (Academy Square). The application allows tutors to create posts advertising their services, with features for user authentication, admin approval, content filtering, anonymous commenting, and persistent like system.

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
- Multiple image upload support (up to 20 images per post)
- Image carousel navigation with modal view
- Filtering by region, subject, and target grade
- Persistent like system with IP-based tracking
- Admin can delete posts

### Admin Panel
- Approve/reject pending user registrations
- View and manage all posts
- Comprehensive user management with ban/unban functionality
- Delete posts and comments

### Database Schema
- **Users**: id, username, password, phone, status, isAdmin, bannedAt, bannedBy, banReason, createdAt
- **Posts**: id, title, content, region, subject, targetGrade, imageUrls (array), authorId, likesCount, createdAt
- **Comments**: id, content, postId, authorName, authorPassword, createdAt
- **Likes**: id, postId, userIp, createdAt
- Relationships: Posts belong to Users (one-to-many), Comments belong to Posts (one-to-many), Likes belong to Posts (one-to-many)

## Data Flow

1. **User Registration**: New users register → status set to "pending" → admin approval required
2. **Post Creation**: Authenticated users create posts → stored with author reference → immediately visible
3. **Filtering**: Frontend sends query parameters → backend filters posts → returns filtered results
4. **File Upload**: Multiple images uploaded to `/uploads` directory → file paths stored in database array
5. **Anonymous Comments**: Users can comment without registration using name and password
6. **Like System**: IP-based likes stored in database → persistent across sessions

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

## Recent Changes (Latest Updates)

- **July 2025**: Implemented automatic link detection in posts and comments - URLs are clickable and open in new tabs
- **July 2025**: Added automatic image cleanup when posts are deleted - prevents orphaned files
- **July 2025**: Implemented post number-based image naming system (post{ID}_{order}_{UUID}.ext)
- **July 2025**: Fixed image persistence issues by resolving database-filesystem path mismatches
- **July 2025**: Added comprehensive upload logging for debugging file storage problems
- **July 2025**: Verified image upload works for both admin and regular users
- **July 2025**: Fixed text formatting with proper line break support for posts and comments
- **July 2025**: Enhanced image upload system with UUID-based unique naming and comprehensive error handling
- **July 2025**: Added file validation (type, size) with user-friendly error messages
- **July 2025**: Implemented image error handling and lazy loading for better performance
- **July 2025**: Removed login requirement for viewing posts - now public access
- **July 2025**: Updated all regional data to include complete district lists (부산 수영구, 중구, 동구 등 추가)
- **July 2025**: Synchronized regional data between filter sidebar and post creation modal
- **July 2025**: Login now only required for post creation, not viewing
- **December 2024**: Added persistent like system with IP-based tracking
- **December 2024**: Implemented anonymous comment system with name/password authentication
- **December 2024**: Added multiple image upload support (up to 20 images per post)
- **December 2024**: Enhanced admin panel with comprehensive user management and ban/unban functionality
- **December 2024**: Fixed React runtime errors and hook ordering issues
- **December 2024**: Removed view count display as requested
- **December 2024**: Added image carousel navigation with modal view

The application follows a monorepo structure with shared TypeScript types between frontend and backend, enabling type safety across the full stack. The authentication system requires admin approval for new users, making it suitable for a curated tutoring marketplace with anonymous interaction capabilities.