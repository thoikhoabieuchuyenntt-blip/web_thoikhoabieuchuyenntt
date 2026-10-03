# Tra cứu thời khóa biểu – Trường THPT Chuyên Nguyễn Thiện Thành

Web tĩnh chạy trên **GitHub Pages**. Không cần máy chủ, không cần cơ sở dữ liệu. Dữ liệu lấy từ file TKB Excel của trường, được chuyển thành JSON trong thư mục `data/`.

## Cấu trúc

```
index.html          Trang tra cứu (theo lớp / học sinh / giáo viên, in lịch, chia sẻ link)
quan-tri.html       Trang quản trị (không có liên kết trên trang tra cứu): tải file Excel, công bố TKB, đổi logo
assets/config.js    CẤU HÌNH: tên trường, logo, bộ đếm, kho GitHub
assets/logo.png     Logo trường (đổi được từ trang Quản trị)
assets/parser.js    Bộ đọc file Excel
assets/grid.js      Vẽ bảng TKB
assets/app.js/.css  Logic và giao diện trang tra cứu
data/versions.json  Danh sách các phiên bản TKB
data/tkb-N.json     Dữ liệu từng phiên bản (đã có sẵn TKB 1–4 từ file thật của trường)
data/goc/           File Excel gốc của từng phiên bản
```

## Đưa web lên GitHub (làm 1 lần)

1. Tạo kho mới trên GitHub, ví dụ `tkb` (chọn **Public**).
2. Tải toàn bộ các file trong thư mục này lên kho (Add file → Upload files).
3. Logo trường đã có sẵn (`assets/logo.png`). Muốn đổi logo: trang Quản trị → mục **Logo trường**.
4. Vào **Settings → Pages**, mục *Source* chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)` → Save.
5. Sau 1–2 phút web chạy tại `https://<tài-khoản>.github.io/tkb/`.

## Phân quyền

- **Học sinh, phụ huynh, giáo viên**: chỉ xem. Trang tra cứu không có nút sửa, không có liên kết tới trang Quản trị.
- **Quản trị**: mở trực tiếp `https://<tài-khoản>.github.io/tkb/quan-tri.html` (lưu vào dấu trang). Mọi thao tác ghi đều cần mã truy cập GitHub, nên người khác có mở được trang này cũng không sửa được gì.

## Tạo mã truy cập cho trang Quản trị

1. GitHub → ảnh đại diện → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Repository access*: **Only select repositories** → chọn kho `tkb`.
3. *Permissions → Repository permissions → Contents*: **Read and write**.
4. Đặt thời hạn (ví dụ 1 năm), tạo và chép mã `github_pat_…`.
5. Mở `…/tkb/quan-tri.html`, dán mã vào ô *Mã truy cập*, bấm **Kiểm tra kết nối**.

Trang quản trị để công khai nhưng không làm gì được nếu không có mã. Không dán mã trên máy dùng chung; không đánh dấu "Ghi nhớ" trên máy phòng máy.

## Công bố TKB mới hằng tuần

1. Mở `quan-tri.html` → kéo thả file Excel TKB.
2. Xem số lớp, giáo viên, tiết và ngày áp dụng; xem thử vài lớp.
3. Ngày áp dụng tự lấy từ dòng "Áp dụng từ: …" trong file → **Công bố TKB N**.
4. Trang tra cứu hiện nút "TKB N - Mới" sau khoảng 1–2 phút.

Nếu không dùng mã truy cập: bấm **Tải file JSON về máy**, rồi tải 2 file nhận được lên thư mục `data/` của kho (ghi đè `versions.json`).

## Định dạng file Excel

Web đọc đúng dạng file TKB hiện tại của trường:

- Mỗi sheet một buổi; tên sheet có chữ "sáng" hoặc "chiều" (ví dụ `TKB- Buổi sáng`, `TKB Lớp ĐT-Buổi chiều`).
- Dòng "Áp dụng từ: 28/9/2026" ở đầu sheet → ngày áp dụng.
- Dòng tiêu đề `Thứ | Tiết | 10A1 | 10A2 | …`; ô Thứ có thể gộp.
- Ô tiết: `Môn - Giáo viên`. Nhiều nhóm học cùng lúc thì mỗi nhóm một dòng trong ô (Alt+Enter).
- Môn tổ hợp: `Lý-CNTT-KTPL - Nhung - Đạt - Cine` được tách thành Lý–Nhung, CNTT–Đạt, KTPL–Cine.
- Dòng `Chủ nhiệm` cuối bảng (`T - Uẩn`, `C - Loan`) → hiện "GVCN: Thầy Uẩn / Cô Loan".

Web giữ nguyên tên giáo viên như trong file: `Kiệt` và `T.Kiệt` là hai giáo viên khác nhau. Các tiết môn tự chọn buổi chiều (một giáo viên dạy nhiều lớp cùng lúc, hoặc một lớp có nhiều nhóm cùng lúc) được hiển thị đúng như file, không bị coi là trùng tiết.

Tùy chọn: thêm sheet học sinh (`Mã HS | Họ tên | Lớp | Nhóm`) thì tab **Theo học sinh** tự hiện ra; không có thì tab này ẩn.

## Lưu ý

- **Quyền riêng tư:** kho Public nên mọi file trong kho (kể cả file Excel gốc trong `data/goc/`) ai cũng tải được. Nếu thêm danh sách học sinh, chỉ đưa họ tên, mã và lớp.
- **Tên môn viết tắt** (TA, CL, BC…) có thể đổi thành tên đầy đủ trong `subjectNames` của `assets/config.js`.
- **Bộ đếm lượt truy cập** dùng dịch vụ miễn phí counterapi.dev; nếu dịch vụ lỗi, bộ đếm tự ẩn. Tắt trong `config.js`.
- **Chia sẻ link:** mỗi lựa chọn có đường dẫn riêng, ví dụ `…/tkb/?tkb=4&lop=10A1`, tiện gửi qua Zalo.
- Mở thử trên máy: chạy `python -m http.server` trong thư mục này rồi vào `http://localhost:8000` (mở trực tiếp file index.html sẽ không tải được dữ liệu).
