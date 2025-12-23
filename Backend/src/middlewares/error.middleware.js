// Centralized error handler with clearer default messages
export function errorMiddleware(err, req, res, next) {
  const status = err?.status || 500;

  // Map common status codes to user-friendly defaults
  const defaultMessages = {
    400: "Yêu cầu không hợp lệ",
    401: "Chưa đăng nhập hoặc phiên đã hết hạn",
    403: "Bạn không có quyền thực hiện hành động này",
    404: "Không tìm thấy tài nguyên",
    409: "Xung đột dữ liệu",
    422: "Dữ liệu không hợp lệ",
    429: "Vượt quá giới hạn truy cập",
    500: "Lỗi hệ thống, vui lòng thử lại sau",
    502: "Dịch vụ tạm thời gián đoạn",
    503: "Dịch vụ đang bận, vui lòng thử lại",
  };

  const message = err?.message || defaultMessages[status] || defaultMessages[500];

  res.status(status).json({
    message,
    ...(err?.details ? { details: err.details } : {}),
  });
}
