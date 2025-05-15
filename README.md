# ShortCat Platform

This repository contains the ShortCat Platform, a comprehensive marketplace solution for the construction and hardware industry. The platform includes both a PostgreSQL database schema for traditional data storage and a modern web application built with Next.js and Firebase.

## Platform Overview

The platform is designed to support all the requirements specified in the project documentation, including:

- User management with support for up to 100 simultaneous users
- Two-factor authentication (2FA)
- Customizable roles (buyer, supplier, administrator)
- Purchase order management (up to 750 orders daily)
- Supplier invitation without registration
- Comparative price analysis
- Dashboard with user and management time tracking
- Order approval workflow
- Price comparison alerts (historical and web scraping)
- Purchase modality alerts (reverse auction or individual purchase)
- Order consolidation (up to 50 joint orders daily)
- Encrypted cost optimization algorithm
- Real-time order consolidation visibility
- Supplier management with risk verification
- Client-supplier evaluation based on multiple criteria
- Reverse auction management (up to 250 auctions daily)
- Help desk with chatbot, ticketing system, and integrations
- Complete order traceability from request to result
- Split purchase functionality with partial acceptance
- Inventory and stock management system
- Support for companies with dual roles (buyer and seller)

## Web Application Architecture MVP

The ShortCat Platform web application is built using modern technologies to provide a scalable, secure, and responsive user experience.

### Technology Stack MVP

- **Frontend:**
  - Next.js for server-side rendering and routing
  - React for UI components
  - Tailwind CSS for styling
  - Zustand for state management

- **Backend:**
  - Firebase Authentication for user management and 2FA
  - Firestore for real-time data storage
  - Firebase Cloud Functions for serverless API endpoints
  - Firebase Storage for file uploads

### Key Features

- **User Management:**
  - Registration and login with email/password
  - Two-factor authentication (2FA)
  - Role-based access control (buyer, supplier, administrator)
  - User profile management

- **Requirements Module:**
  - Create, edit, and manage requirements
  - Multi-step approval workflow
  - Item management within requirements
  - File attachments and documentation

- **Dashboard:**
  - Overview of requirements status
  - Activity tracking
  - Notifications and alerts

### Project Structure

```
shortcatplatform/
├── web/                      # Web application (Next.js)
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utility functions and libraries
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/         # Authentication module
│   │   │   ├── requirements/ # Requirements module
│   │   │   └── users/        # User management module
│   │   └── styles/           # Global styles
│   ├── public/               # Static assets
│   ├── package.json          # Dependencies and scripts
│   └── next.config.js        # Next.js configuration
│
├── functions/                # Firebase Cloud Functions
│   ├── src/
│   │   ├── auth/             # Authentication functions
│   │   ├── requirements/     # Requirements functions
│   │   ├── users/            # User management functions
│   │   └── common/           # Shared utilities and types
│   ├── package.json          # Dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
│
├── database/                 # PostgreSQL database schema
│   ├── database_schema_*.sql # Database schema files
│   └── initialize_database.sh # Database initialization script
│
├── firebase.json             # Firebase configuration
├── firestore.rules           # Firestore security rules
├── storage.rules             # Firebase Storage security rules
└── firestore.indexes.json    # Firestore indexes configuration
```

### API Endpoints

The platform provides a comprehensive set of API endpoints through Firebase Cloud Functions:

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `POST /auth/setup-2fa` - Set up two-factor authentication
- `POST /auth/verify-2fa` - Verify two-factor authentication code
- `POST /auth/reset-password` - Request password reset

#### Users
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user (admin only)
- `PUT /users/:id/role` - Update user role (admin only)

#### Requirements
- `GET /requirements` - Get all requirements
- `GET /requirements/:id` - Get requirement by ID
- `POST /requirements` - Create a new requirement
- `PUT /requirements/:id` - Update a requirement
- `DELETE /requirements/:id` - Delete a requirement
- `GET /requirements/:id/items` - Get requirement items
- `POST /requirements/:id/items` - Add requirement item
- `PUT /requirements/:id/items/:itemId` - Update requirement item
- `DELETE /requirements/:id/items/:itemId` - Delete requirement item
- `PUT /requirements/:id/submit` - Submit requirement for approval
- `PUT /requirements/:id/approve` - Approve requirement
- `PUT /requirements/:id/reject` - Reject requirement

### Getting Started

#### Prerequisites
- Node.js 18 or higher
- Firebase CLI
- PostgreSQL 13 or higher (for database features)

#### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/shortcatplatform.git
cd shortcatplatform
```

2. Install dependencies for the web application
```bash
cd web
npm install
```

3. Install dependencies for Firebase functions
```bash
cd ../functions
npm install
```

4. Set up environment variables
```bash
cp web/.env.local.example web/.env.local
# Edit .env.local with your Firebase configuration
```

5. Start the development server
```bash
cd ../web
npm run dev
```

7. Access the application at http://localhost:3000
