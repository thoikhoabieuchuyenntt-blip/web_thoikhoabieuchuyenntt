/* ===== CẤU HÌNH — chỉ cần sửa file này ===== */
window.TKB_CONFIG = {
  schoolName: "TRƯỜNG THPT CHUYÊN NGUYỄN THIỆN THÀNH",
  subtitle: "Tra cứu thời khóa biểu",
  location: "Phường Long Đức, tỉnh Vĩnh Long",
  // Nút liên kết tới trang Quản trị hiển thị ngay trên trang tra cứu (đặt show: false để ẩn)
  adminButton: { show: true, text: "Quản trị / Tải Excel TKB" },
  // Đặt logo trường vào assets/logo.png (ảnh vuông, nền trong suốt). Nếu chưa có, web dùng logo tạm logo.svg
  logo: "assets/logo.png",
  logoFallback: "assets/logo.svg",
  dataPath: "data/",
  contactNote: "Dữ liệu tổng hợp từ file thời khóa biểu của trường. Nếu có sai sót, xin liên hệ văn phòng nhà trường.",
  // Bộ đếm lượt truy cập dùng dịch vụ miễn phí counterapi.dev. Đặt enabled: false để tắt.
  counter: { enabled: true, namespace: "thpt-chuyen-nguyen-thien-thanh", key: "tra-cuu-tkb" },
  // Tên đầy đủ hiển thị thay cho tên viết tắt trong file Excel (để trống nếu muốn giữ nguyên). Ví dụ:
  subjectNames: {
    "CL": "Cầu lông",
    "BC": "Bóng chuyền",
    "BĐ": "Bóng đá",
    "BR": "Bóng rổ"
    // Thêm tên khác nếu cần, ví dụ: "TA": "Tiếng Anh"
  },
  // Kho GitHub chứa web (dùng cho trang Quản trị). Để trống: tự nhận từ địa chỉ <tài khoản>.github.io/<kho>
  github: { owner: "", repo: "", branch: "main" }
};
