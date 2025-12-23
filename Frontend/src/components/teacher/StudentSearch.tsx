import { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import { api } from '../../api/client';
import { StudentSearchResult } from '../../api/types';

export function StudentSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search students when term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      setLoading(true);
      setError(null);
      api
        .searchStudents(searchTerm)
        .then((data) => setStudents(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setStudents([]);
    }
  }, [searchTerm]);

  const filteredStudents = students;

  return (
    <div>
      <h1 className="text-green-900 mb-6">Tra cứu học sinh</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {loading && <div className="text-green-600 mb-4">Đang tìm kiếm...</div>}
      {error && <div className="text-red-600 mb-4">Lỗi: {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-gray-900">Kết quả tìm kiếm ({filteredStudents.length})</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredStudents.map((student) => (
              <button
                key={student.MaHocSinh}
                onClick={() => setSelectedStudent(student)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedStudent?.MaHocSinh === student.MaHocSinh ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">{student.HoTen}</p>
                    <p className="text-gray-600">{student.MaHocSinh}</p>
                  </div>
                </div>
              </button>
            ))}
            {filteredStudents.length === 0 && searchTerm && (
              <div className="p-8 text-center text-gray-500">
                Không tìm thấy học sinh nào
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          {selectedStudent ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-lg">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-gray-900">Thông tin chi tiết</h2>
                  <p className="text-gray-600">Mã: {selectedStudent.MaHocSinh}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Họ và tên</p>
                  <p className="text-gray-900">{selectedStudent.HoTen}</p>
                </div>

                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Giới tính</p>
                  <p className="text-gray-900">{selectedStudent.GioiTinh}</p>
                </div>

                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Ngày sinh</p>
                  <p className="text-gray-900">
                    {new Date(selectedStudent.NgaySinh).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Email</p>
                  <p className="text-gray-900">{selectedStudent.Email || '-'}</p>
                </div>

                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Số điện thoại</p>
                  <p className="text-gray-900">{selectedStudent.SDT || selectedStudent.SoDienThoai || '-'}</p>
                </div>

                <div>
                  <p className="text-gray-600 mb-1">Địa chỉ</p>
                  <p className="text-gray-900">{selectedStudent.DiaChi || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chọn một học sinh để xem thông tin chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
