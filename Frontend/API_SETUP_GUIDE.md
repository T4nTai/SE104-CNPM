# API Integration Setup Guide

This guide explains how to set up and run the application with the new API integration.

## Installation

### 1. Install Dependencies

Run the following command to install all required packages including axios:

```bash
npm install
```

This will install axios and all other dependencies listed in `package.json`.

## Configuration

### 2. Environment Variables

The application uses environment variables to configure the API base URL.

**For Development:**
Create or edit `.env.development`:
```
VITE_API_BASE_URL=http://localhost:4000/api
```

**For Production:**
Create or edit `.env.production`:
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

If no environment variable is set, the app defaults to `http://localhost:4000/api`.

## Running the Application

### 3. Start Development Server

```bash
npm run dev
```

The app will start and be accessible at `http://localhost:5173` (or another port shown in console).

## API Integration Details

### Components Integrated

1. **GradeSearch** (`src/components/shared/GradeSearch.tsx`)
   - For students: Fetches own grades via `api.getMyScores()` and `api.getMyClasses()`
   - For teachers: Fetches class grades via `api.getTeacherClasses()`

2. **ClassListManagement** (`src/components/teacher/ClassListManagement.tsx`)
   - Fetches teacher's classes via `api.getTeacherClasses()`
   - Add student: `api.addStudentToClass(MaLop, MaHocKy, studentData)`
   - Update student: `api.updateStudent(MaHocSinh, updates)`
   - Delete student: `api.deleteStudent(MaHocSinh)`

3. **StudentSearch** (`src/components/teacher/StudentSearch.tsx`)
   - Real-time search via `api.searchStudents(query)`
   - Displays student details (MaHocSinh, HoTen, GioiTinh, NgaySinh, Email, SoDienThoai, DiaChi)

4. **GradeEntry** (`src/components/teacher/GradeEntry.tsx`)
   - Fetches classes via `api.getTeacherClasses()`
   - Populates students from selected class
   - Submit grades via `api.enterGradebook(data)`

### API Client

The API client is defined in `src/api/client.ts` and uses Axios for HTTP requests.

**Authentication:**
- Tokens are stored in localStorage
- Set token via: `setAuthToken(token)` after login
- Token is automatically included in all requests as `Authorization: Bearer <token>` header

**Available Methods:**
- `api.login(TenDangNhap, MatKhau)` - Authenticate user
- `api.getMyClasses(MaHocKy?)` - Get student's classes
- `api.getMyScores(MaHocKy)` - Get student's grades
- `api.getTeacherClasses()` - Get teacher's classes
- `api.addStudentToClass(MaLop, MaHocKy, student)` - Add student to class
- `api.updateStudent(MaHocSinh, data)` - Update student info
- `api.deleteStudent(MaHocSinh)` - Remove student
- `api.searchStudents(q)` - Search students by name/code
- `api.enterGradebook(data)` - Submit grades

### Data Types

All data types are defined in `src/api/types.ts` and match the backend schema:

- `AuthResponse` - Login response with token
- `ClassInfo` - Class information (MaLop, TenLop, MaKhoiLop, DanhSachHocSinh[])
- `StudentInClass` - Student details (MaHocSinh, HoTen, GioiTinh, NgaySinh, etc.)
- `StudentSearchResult` - Search result (MaHocSinh, HoTen, GioiTinh, NgaySinh, Email, etc.)
- `GradeRecord` - Grade information (MaMon, TenMon, DiemGiuaKy, DiemCuoiKy, DiemTBMon, XepLoai)
- `SemesterAverage` - Class semester average
- `StudentScore` - Individual student scores

## Backend Requirements

Ensure your backend API is running at the configured URL and implements the following endpoints:

- `POST /auth/login` - User authentication
- `GET /auth/me` - Get current user
- `GET /students/me/classes` - Student's classes
- `GET /students/me/scores?MaHocKy=HK1` - Student's grades
- `GET /teacher/classes` - Teacher's classes
- `POST /teacher/classes/:MaLop/semesters/:MaHocKy/students` - Add student
- `PUT /teacher/students/:MaHocSinh` - Update student
- `DELETE /teacher/students/:MaHocSinh` - Delete student
- `GET /teacher/students/search?q=...` - Search students
- `POST /teacher/gradebooks/enter` - Submit grades

See the `API_INTEGRATION_GUIDE.md` file in the `src/` directory for detailed API specifications.

## Troubleshooting

### "Cannot find module 'axios'"
Run `npm install` again to install dependencies.

### "API request fails with 404"
- Ensure the backend is running at the correct URL
- Check the `VITE_API_BASE_URL` environment variable
- Verify the endpoint paths match your backend

### "Unauthorized (401)"
- Ensure a valid JWT token is set via `setAuthToken()`
- Check token storage in browser's localStorage
- Verify token hasn't expired on the backend

### "CORS errors"
- Configure CORS on your backend to allow requests from your frontend URL
- For development, typically allow `http://localhost:5173`

## Development Notes

### Adding a New API Method

1. Add the method signature to `src/api/types.ts` if needed
2. Implement the method in the `api` object in `src/api/client.ts`:

```typescript
export const api = {
  async newMethod(param1: string, param2: number): Promise<ResponseType> {
    const response = await apiClient.post('/endpoint', { param1, param2 });
    return response.data;
  }
};
```

3. Use in components:

```typescript
useEffect(() => {
  api.newMethod('value', 123)
    .then(data => setData(data))
    .catch(err => setError(err.message));
}, []);
```

### Using the useAsync Hook

For simplified async state management, use the `useAsync` hook:

```typescript
const { data, loading, error, reload } = useAsync(
  () => api.getTeacherClasses(),
  []
);
```

This automatically handles data, loading, and error states.
