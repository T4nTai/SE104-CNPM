# Quick Start Guide

## Prerequisites
- Node.js installed
- Backend API running at `http://localhost:4000/api`

## Setup (One-time)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The app will open at `http://localhost:5173`

## What's Integrated?

All four dashboard screens now connect to real API:

### ✅ Student Dashboard - Grade Search
- View own grades
- Filter by semester/class
- Real-time data from backend

### ✅ Teacher Dashboard - Grade Search
- View class grades
- Browse all students in selected class
- See individual subject scores

### ✅ Teacher - Class Management
- Add/edit/delete students
- Manage class roster
- All changes sync to backend

### ✅ Teacher - Student Search
- Search students by name/ID
- View full student details
- Real-time filtering

### ✅ Teacher - Grade Entry
- Select class and subject
- Enter multiple grades per student
- Auto-calculate semester averages
- Submit to backend

## API Configuration

| Environment | URL | File |
|-------------|-----|------|
| Development | `http://localhost:4000/api` | `.env.development` |
| Production | Update as needed | `.env.production` |

## Key Files

- **API Client:** `src/api/client.ts` - All HTTP methods
- **Type Definitions:** `src/api/types.ts` - TypeScript interfaces
- **Setup Guide:** `API_SETUP_GUIDE.md` - Full documentation
- **Completion Report:** `API_INTEGRATION_COMPLETE.md` - Implementation details

## Troubleshooting

**Error: Cannot find module 'axios'**
```bash
npm install
```

**Error: API 404 Not Found**
- Check backend is running
- Verify `.env.development` URL matches backend
- Check endpoint names in `src/api/client.ts`

**Error: Unauthorized (401)**
- Login first to get token
- Token should appear in browser's localStorage

## Next: Add Login Integration

To complete the authentication flow, integrate login screen:

```typescript
// In LoginScreen.tsx
import { api, setAuthToken } from '../api/client';

const handleLogin = async (username: string, password: string) => {
  const response = await api.login(username, password);
  setAuthToken(response.token);
  // Redirect to dashboard
};
```

That's it! All components are ready to use.
