import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';

export type UserRole = 'admin' | 'student' | 'teacher' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'teacher';
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  if (currentScreen === 'login') {
    return (
      <LoginScreen 
        onLogin={handleLogin}
      />
    );
  }

  if (currentScreen === 'dashboard' && currentUser) {
    if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    } else if (currentUser.role === 'student') {
      return <StudentDashboard user={currentUser} onLogout={handleLogout} />;
    } else if (currentUser.role === 'teacher') {
      return <TeacherDashboard user={currentUser} onLogout={handleLogout} />;
    }
  }

  return null;
}
