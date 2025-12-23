import { useState } from 'react';
import { User } from '../App';
import { 
  LogOut, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Users, 
  Settings,
  BarChart3,
  Home,
  FileText,
  UserCog,
  Shield,
  UsersRound
} from 'lucide-react';
import { RegulationManagement } from './admin/RegulationManagement';
import { ParameterSettings } from './admin/ParameterSettings';
import { SubjectReport } from './admin/SubjectReport';
import { SemesterReport } from './admin/SemesterReport';
import { UserManagement } from './admin/UserManagement';
import { UserGroupManagement } from './admin/UserGroupManagement';
import { PermissionManagement } from './admin/PermissionManagement';
import { TeacherAssignmentManagement } from './admin/TeacherAssignmentManagement';
import { UserProfile } from './shared/UserProfile';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type AdminScreen = 
  | 'home'
  | 'regulations'
  | 'parameters'
  | 'semester-report'
  | 'subject-report'
  | 'user-management'
  | 'user-group-management'
  | 'permission-management'
  | 'teacher-assignment'
  | 'profile';

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [currentScreen, setCurrentScreen] = useState<AdminScreen>('home');

  const menuItems = [
    { id: 'home' as AdminScreen, label: 'Trang chủ', icon: Home },
    { id: 'profile' as AdminScreen, label: 'Chỉnh sửa tài khoản', icon: UserCog },
    { id: 'regulations' as AdminScreen, label: 'Thay đổi quy định', icon: BookOpen },
    { id: 'parameters' as AdminScreen, label: 'Thay đổi tham số', icon: Settings },
    { id: 'semester-report' as AdminScreen, label: 'Báo cáo học kỳ', icon: FileText },
    { id: 'subject-report' as AdminScreen, label: 'Báo cáo môn học', icon: BarChart3 },
    { id: 'teacher-assignment' as AdminScreen, label: 'Quản lý phân công GV', icon: Users },
    { id: 'user-management' as AdminScreen, label: 'Quản lý người dùng', icon: UserCog },
    { id: 'user-group-management' as AdminScreen, label: 'Quản lý nhóm người dùng', icon: UsersRound },
    { id: 'permission-management' as AdminScreen, label: 'Quản lý quyền truy cập', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <div>
              <h2>Quản lý</h2>
              <p className="text-indigo-300">{user.name}</p>
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
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-200 hover:bg-indigo-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:bg-indigo-800 transition-colors"
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
              <h1 className="text-indigo-900 mb-8">Trang chủ - Quản lý</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.slice(1).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentScreen(item.id)}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
                  >
                    <item.icon className="w-10 h-10 text-indigo-600 mb-4" />
                    <h3 className="text-gray-900 mb-2">{item.label}</h3>
                    <p className="text-gray-600">Quản lý và cập nhật thông tin</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {currentScreen === 'regulations' && <RegulationManagement />}
          {currentScreen === 'parameters' && <ParameterSettings />}
          {currentScreen === 'semester-report' && <SemesterReport />}
          {currentScreen === 'subject-report' && <SubjectReport />}
          {currentScreen === 'teacher-assignment' && <TeacherAssignmentManagement />}
          {currentScreen === 'user-management' && <UserManagement />}
          {currentScreen === 'user-group-management' && <UserGroupManagement />}
          {currentScreen === 'permission-management' && <PermissionManagement />}
          {currentScreen === 'profile' && <UserProfile user={user} />}
        </div>
      </div>
    </div>
  );
}