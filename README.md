# OFI Mascot Contest

A full-stack web application built with React frontend and Node.js backend for a mascot contest with user authentication, image uploads, and voting system.

## Project Structure

```
ofi-mascot-contest/
├── frontend/          # React frontend application
├── backend/           # Node.js Express backend
├── package.json       # Root package.json with workspace configuration
└── README.md          # This file
```

## Features

- **User Authentication**:
  - User registration and login with JWT tokens
  - Secure password hashing with bcrypt
  - Protected routes and API endpoints

- **Mascot Submission**:
  - Image upload with validation (max 5MB, common image formats)
  - Name and description for each mascot
  - One submission per user limit
  - Real-time image preview

- **Voting System**:
  - Authenticated users can vote for mascots
  - One vote per mascot per user
  - Cannot vote for own mascot
  - Real-time vote count updates

- **Frontend (React)**:
  - Modern React 18 application with hooks
  - Context API for state management
  - Responsive design with CSS Grid and Flexbox
  - Modal-based authentication
  - Real-time server status indicator
  - Interactive voting interface
  - Image upload with preview

- **Backend (Node.js + Express)**:
  - RESTful API endpoints
  - JWT-based authentication
  - File upload handling with Multer
  - Input validation with express-validator
  - CORS enabled for frontend communication
  - Security middleware (Helmet)
  - Request logging (Morgan)
  - Environment variables support

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/me` - Get current user info
- `GET /api/user/votes` - Get user's voting history

### Mascots
- `GET /api/health` - Server health check
- `GET /api/mascots` - Get all mascots with creator info
- `POST /api/mascots` - Submit a new mascot (authenticated, with image upload)
- `POST /api/mascots/:id/vote` - Vote for a specific mascot (authenticated)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd ofi-mascot-contest
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

   This will install dependencies for the root, frontend, and backend.

### Development

1. **Start both frontend and backend simultaneously**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

2. **Or start them individually**:
   
   **Backend only**:
   ```bash
   npm run dev:backend
   ```
   
   **Frontend only**:
   ```bash
   npm run dev:frontend
   ```

### Building for Production

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Frontend Configuration

The frontend is configured to proxy API requests to the backend during development via the `proxy` field in `frontend/package.json`.

## Technology Stack

### Frontend
- **React 18** - UI library with hooks
- **React Context API** - State management for authentication
- **Axios** - HTTP client for API communication
- **CSS3** - Styling with Grid, Flexbox, and modern CSS features
- **Create React App** - Build tooling and development server

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **dotenv** - Environment variables
- **uuid** - Unique identifier generation

## Development Tools

- **Concurrently** - Run multiple npm scripts simultaneously
- **Nodemon** - Auto-restart backend on file changes
- **Create React App** - Frontend development server with hot reload

## Usage Guide

### For Users:

1. **Registration/Login**: 
   - Click "Register" to create a new account
   - Or "Login" if you already have an account

2. **Submit a Mascot**:
   - After logging in, click "Submit Mascot"
   - Enter mascot name and description
   - Optionally upload an image (max 5MB)
   - Click "Submit Mascot"

3. **Vote for Mascots**:
   - Browse all submitted mascots
   - Click "Vote" on your favorites
   - You can vote for multiple mascots but only once per mascot
   - You cannot vote for your own mascot

### For Developers:

#### Adding New Features

1. **Backend**: Add new routes in `backend/server.js`
2. **Frontend**: Create new components in `frontend/src/components/`
3. **Styling**: Update styles in `frontend/src/index.css`

#### Database Integration

Currently using in-memory storage. To integrate a real database:

1. Install database driver (e.g., `mongoose` for MongoDB)
2. Replace the in-memory arrays in `backend/server.js`
3. Add database connection configuration to `.env`

## File Structure Details

```
frontend/src/
├── components/
│   ├── AuthModal.js       # Login/Register modal
│   └── MascotUpload.js    # Mascot submission form
├── contexts/
│   └── AuthContext.js     # Authentication context
├── App.js                 # Main application component
├── index.js              # React entry point
├── index.css             # Global styles
└── App.css               # Component-specific styles

backend/
├── uploads/              # User-uploaded images (created automatically)
├── server.js             # Main server file with all routes
├── .env                  # Environment variables
└── package.json          # Backend dependencies
```

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt before storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: File type and size validation
- **CORS Configuration**: Controlled cross-origin access
- **Helmet Middleware**: Additional security headers

## Troubleshooting

### Common Issues

1. **Backend not starting**: Check if port 5000 is available or change PORT in .env
2. **Frontend can't connect to backend**: Ensure both servers are running
3. **File upload fails**: Check file size (max 5MB) and format (images only)
4. **Authentication issues**: Verify JWT_SECRET is set in backend/.env
5. **CORS errors**: Verify CORS configuration matches frontend URL

### Logs

- Backend logs are displayed in the terminal where you ran `npm run dev:backend`
- Frontend logs are available in browser console (F12)
- Check browser Network tab for API request details

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC
