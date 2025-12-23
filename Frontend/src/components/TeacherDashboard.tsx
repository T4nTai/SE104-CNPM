import { useState } from 'react';
import { User } from '../App';
import { 
  LogOut, 
  GraduationCap, 
  Users, 
  ClipboardList,
  Search,
  Home
} from 'lucide-react';
import { ClassListManagement } from './teacher/ClassListManagement';
import { GradeEntry } from './teacher/GradeEntry';
import { GradeSearch } from './shared/GradeSearch';
import { StudentSearch } from './teacher/StudentSearch';
import { Assignments } from './teacher/Assignments';
import { UserProfile } from './shared/UserProfile';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

type TeacherScreen = 
  | 'home'
  | 'assignments'
  | 'class-list'
  | 'grade-entry'
  | 'grade-search'
  | 'student-search'
  | 'profile';

export function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [currentScreen, setCurrentScreen] = useState<TeacherScreen>('home');

  const menuItems = [
    { id: 'home' as TeacherScreen, label: 'Trang chủ', icon: Home },
    { id: 'profile' as TeacherScreen, label: 'Chỉnh sửa tài khoản', icon: Users },
    { id: 'assignments' as TeacherScreen, label: 'Phân công của tôi', icon: ClipboardList },
    { id: 'class-list' as TeacherScreen, label: 'Danh sách lớp', icon: Users },
    { id: 'grade-entry' as TeacherScreen, label: 'Nhập bảng điểm', icon: ClipboardList },
    { id: 'grade-search' as TeacherScreen, label: 'Tra cứu điểm', icon: Search },
    { id: 'student-search' as TeacherScreen, label: 'Tra cứu học sinh', icon: Search },
  ];

  // Extract MaGV from user context; user.id should contain the teacher's id
  // If user.id is not numeric, try to get it from API after login
  const teacherId = Number(user.id) || null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-green-900 text-white flex flex-col">
        <div className="p-6 border-b border-green-800">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <div>
              <h2>Giáo viên</h2>
              <p className="text-green-300">{user.name}</p>
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
                      ? 'bg-green-800 text-white'
                      : 'text-green-200 hover:bg-green-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-green-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-green-200 hover:bg-green-800 transition-colors"
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
              <h1 className="text-green-900 mb-8">Trang chủ - Giáo viên</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.slice(1).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentScreen(item.id)}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
                  >
                    <item.icon className="w-10 h-10 text-green-600 mb-4" />
                    <h3 className="text-gray-900 mb-2">{item.label}</h3>
                    <p className="text-gray-600">Quản lý và tra cứu thông tin</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {currentScreen === 'class-list' && <ClassListManagement teacherId={teacherId} />}
          {currentScreen === 'assignments' && <Assignments user={user} />}
          {currentScreen === 'grade-entry' && <GradeEntry teacherId={teacherId} />}
          {currentScreen === 'grade-search' && <GradeSearch userRole="teacher" teacherId={teacherId} />}
          {currentScreen === 'student-search' && <StudentSearch />}
          {currentScreen === 'profile' && <UserProfile user={user} />}
        </div>
      </div>
    </div>
  );
}
