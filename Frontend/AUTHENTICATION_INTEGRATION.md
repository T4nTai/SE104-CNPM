# Authentication Integration Complete

## Overview
LoginScreen and RegisterScreen have been fully integrated with the backend API authentication endpoints.

## Changes Made

### 1. LoginScreen (`src/components/LoginScreen.tsx`)
**Integrated:** ✅

**Features:**
- Calls `api.login(email, password)` on form submit
- Handles API response and extracts user information
- Maps backend response to `User` type with flexible field handling
- Sets Bearer token via `setAuthToken(response.token)`
- Shows loading state during submission
- Displays error messages on login failure

**How it works:**
```typescript
const response = await api.login(email, password);
setAuthToken(response.token); // Stores token and sets header
const user: User = {
  id: userInfo.MaNguoiDung || userInfo.id || email,
  name: userInfo.TenNguoiDung || userInfo.HoVaTen || email,
  email: userInfo.Email || email,
  role: userInfo.VaiTro || userInfo.role || 'student'
};
onLogin(user); // Navigate to dashboard
```

### 2. RegisterScreen (`src/components/RegisterScreen.tsx`)
**Integrated:** ✅

**Features:**
- Calls `api.register()` with user details
- Validates password match and minimum length
- Optionally auto-logs in user after registration via token
- Shows loading state during submission
- Displays error messages
- Redirects to login after successful registration

**How it works:**
```typescript
const response = await api.register({
  TenNguoiDung: formData.name,
  Email: formData.email,
  MatKhau: formData.password,
  VaiTro: formData.role
});
if (response.token) {
  setAuthToken(response.token); // Auto-login
}
```

### 3. API Client Updates (`src/api/client.ts`)
**Added:** `register()` method

```typescript
async register(payload: {
  TenNguoiDung: string;
  Email: string;
  MatKhau: string;
  VaiTro?: string;
}): Promise<AuthResponse>
```

### 4. Type Definition Updates (`src/api/types.ts`)
**Updated:** `AuthResponse` interface

Now supports flexible field names from different API implementations:
```typescript
export interface AuthResponse {
  token: string;
  user?: {
    MaNguoiDung?: string;
    id?: string;
    TenDangNhap?: string;
    TenNguoiDung?: string;
    HoVaTen?: string;
    Email?: string;
    role?: 'admin' | 'teacher' | 'student';
    VaiTro?: 'admin' | 'teacher' | 'student';
  };
}
```

## Authentication Flow

### Login Flow
1. User enters email and password
2. Frontend calls `api.login(email, password)`
3. Backend validates credentials and returns JWT token
4. Frontend:
   - Stores token in localStorage
   - Sets `Authorization: Bearer <token>` header for future requests
   - Maps user info to `User` type
   - Navigates to dashboard

### Register Flow
1. User fills registration form with name, email, password, and role
2. Frontend validates form (password match, min length)
3. Frontend calls `api.register(userData)`
4. Backend creates user account and returns JWT token
5. Frontend:
   - Optionally auto-logs in user with token
   - Stores token in localStorage
   - Shows success message
   - Redirects to login screen after 1.5 seconds

### Session Persistence
- Token is stored in localStorage automatically
- On app reload, token is restored and used for authenticated requests
- Token removed from localStorage on logout (when `setAuthToken()` is called without argument)

## Backend Endpoints

### POST /auth/login
**Request:**
```json
{
  "TenDangNhap": "user@example.com",
  "MatKhau": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "MaNguoiDung": "USR001",
    "TenNguoiDung": "Nguyễn Văn A",
    "Email": "user@example.com",
    "VaiTro": "student"
  }
}
```

### POST /auth/register
**Request:**
```json
{
  "TenNguoiDung": "Nguyễn Văn A",
  "Email": "user@example.com",
  "MatKhau": "password123",
  "VaiTro": "student"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "MaNguoiDung": "USR002",
    "TenNguoiDung": "Nguyễn Văn A",
    "Email": "user@example.com",
    "VaiTro": "student"
  }
}
```

## Testing

### Test Login
1. Start dev server: `npm run dev`
2. Open login screen
3. Enter credentials (e.g., `teacher@school.com` / `password123`)
4. Should navigate to teacher dashboard
5. Token should be in browser localStorage

### Test Register
1. Click "Đăng ký ngay" on login screen
2. Fill form with valid data
3. Click "Đăng ký"
4. Should show success message
5. Should redirect to login after 1.5 seconds

## Error Handling

**Login Errors:**
- Invalid credentials → "Đăng nhập thất bại..."
- Network error → "Đăng nhập thất bại..."
- Server error → Specific error message from backend

**Register Errors:**
- Password mismatch → "Mật khẩu xác nhận không khớp"
- Short password → "Mật khẩu phải có ít nhất 6 ký tự"
- Email exists → Backend error message
- Network error → "Đăng ký thất bại..."

## Field Mapping

The authentication flow flexibly handles different field names from the backend:

| Backend Field | Mapped To | Default |
|--------------|-----------|---------|
| MaNguoiDung / id | user.id | email |
| TenNguoiDung / HoVaTen / TenDangNhap | user.name | email |
| Email | user.email | email |
| VaiTro / role | user.role | 'student' |

This allows compatibility with different API implementations.

## Logout Implementation

To implement logout, call `setAuthToken()` without arguments:

```typescript
// In a logout handler
import { setAuthToken } from './api/client';

const handleLogout = () => {
  setAuthToken(); // Clears token and localStorage
  setCurrentUser(null);
  setCurrentScreen('login');
};
```

## Integration Status

| Component | Status | Details |
|-----------|--------|---------|
| LoginScreen | ✅ Complete | Login with email/password |
| RegisterScreen | ✅ Complete | Register with name/email/password/role |
| API Client | ✅ Updated | Added register() method |
| Token Persistence | ✅ Complete | localStorage + Bearer header |
| Error Handling | ✅ Complete | User-friendly error messages |
| User Mapping | ✅ Complete | Flexible field name handling |

All authentication features are now fully integrated with the backend API.
