import { useState } from 'react';
import { User } from '../App';
import { 
  LogOut, 
  GraduationCap, 
  Search,
  BookOpen,
  Home
} from 'lucide-react';
import { GradeSearch } from './shared/GradeSearch';
import { ClassSearch } from './shared/ClassSearch';
import { UserProfile } from './shared/UserProfile';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

type StudentScreen = 
  | 'home'
  | 'grade-search'
  | 'class-search'
  | 'profile';

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [currentScreen, setCurrentScreen] = useState<StudentScreen>('home');

  const menuItems = [
    { id: 'home' as StudentScreen, label: 'Trang chủ', icon: Home },
    { id: 'profile' as StudentScreen, label: 'Chỉnh sửa tài khoản', icon: Search },
    { id: 'grade-search' as StudentScreen, label: 'Tra cứu điểm', icon: Search },
    { id: 'class-search' as StudentScreen, label: 'Tra cứu lớp học', icon: BookOpen },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <div>
              <h2>Học sinh</h2>
              <p className="text-blue-300">{user.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentScreen(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentScreen === item.id
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-200 hover:bg-blue-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-200 hover:bg-blue-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentScreen === 'home' && (
            <div>
              <h1 className="text-blue-900 mb-8">Trang chủ - Học sinh</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menuItems.slice(1).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentScreen(item.id)}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
                  >
                    <item.icon className="w-10 h-10 text-blue-600 mb-4" />
                    <h3 className="text-gray-900 mb-2">{item.label}</h3>
                    <p className="text-gray-600">Xem thông tin cá nhân</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-gray-900 mb-4">Thông tin học sinh</h2>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-gray-600 w-32">Họ và tên:</span>
                    <span className="text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">Email:</span>
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">Lớp:</span>
                    <span className="text-gray-900">10A1</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">Khối:</span>
                    <span className="text-gray-900">Khối 10</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentScreen === 'grade-search' && <GradeSearch userRole="student" />}
          {currentScreen === 'class-search' && <ClassSearch userRole="student" />}
          {currentScreen === 'profile' && <UserProfile user={user} />}
        </div>
      </div>
    </div>
  );
}
