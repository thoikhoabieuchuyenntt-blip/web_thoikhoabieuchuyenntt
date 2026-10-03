# Hướng dẫn đưa web TKB lên GitHub

Làm một lần duy nhất, khoảng 15–20 phút. Sau đó mỗi tuần chỉ cần vào trang Quản trị để đăng TKB mới.

---

## Phần A — Đưa web lên mạng

### Bước 1. Tạo tài khoản GitHub
1. Vào **github.com**, bấm **Sign up**.
2. Nhập email `thoikhoabieuchuyenntt@gmail.com`, đặt mật khẩu và **tên tài khoản** (username).
   - Tên tài khoản sẽ nằm trong địa chỉ web, nên viết gọn, không dấu, không khoảng trắng. Gợi ý: `chuyenntt` hoặc `tkbchuyenntt`.
3. Mở Gmail lấy mã xác nhận GitHub gửi tới, nhập vào để hoàn tất.

### Bước 2. Tạo kho chứa web
1. Đăng nhập xong, bấm dấu **+** góc trên bên phải → **New repository**.
2. **Repository name**: gõ `tkb`.
3. Chọn **Public** (bắt buộc, để web xem được miễn phí).
4. Bấm **Create repository**.

### Bước 3. Tải toàn bộ web lên
1. **Giải nén** file `tkb-nguyen-thien-thanh.zip` trên máy tính.
2. Mở thư mục vừa giải nén — bên trong có `index.html`, `quan-tri.html`, thư mục `assets`, `data`…
3. Trong trang kho `tkb` vừa tạo, bấm dòng chữ **uploading an existing file**.
4. **Chọn tất cả** các file và thư mục bên trong (index.html, quan-tri.html, assets, data, README.md…) rồi kéo thả vào khung.
   - Lưu ý: kéo *nội dung bên trong* thư mục, không kéo cả thư mục mẹ `tkb-nguyen-thien-thanh`. Trên trang kho phải thấy `index.html` nằm ngay ngoài cùng.
5. Chờ các file tải xong, bấm **Commit changes** (nút xanh phía dưới).

### Bước 4. Bật GitHub Pages
1. Trong kho, bấm tab **Settings** (phía trên).
2. Cột trái, bấm mục **Pages**.
3. Phần **Source**: chọn **Deploy from a branch**.
4. Phần **Branch**: chọn nhánh `main`, thư mục `/ (root)`, bấm **Save**.
5. Chờ 1–2 phút, tải lại trang Pages. GitHub sẽ hiện dòng "Your site is live at…".

### Địa chỉ web của bạn
```
https://<tên-tài-khoản>.github.io/tkb/
```
Ví dụ tên tài khoản là `chuyenntt`:
- Trang tra cứu (gửi học sinh, phụ huynh): `https://chuyenntt.github.io/tkb/`
- Trang quản trị (chỉ bạn dùng): `https://chuyenntt.github.io/tkb/quan-tri.html`

Lưu địa chỉ trang quản trị vào dấu trang. Trang tra cứu không có liên kết tới trang này.

---

## Phần B — Tạo mã truy cập cho trang Quản trị

Mã này cho phép trang Quản trị ghi dữ liệu lên kho. Không có mã thì không đăng TKB được.

1. GitHub → bấm ảnh đại diện góc phải → **Settings**.
2. Cột trái kéo xuống cuối, bấm **Developer settings**.
3. Bấm **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
4. Khai báo:
   - **Token name**: `quan-tri-tkb` (tên gì cũng được).
   - **Expiration**: chọn thời hạn, ví dụ 1 năm (hết hạn thì tạo lại mã mới).
   - **Repository access**: chọn **Only select repositories** → chọn kho `tkb`.
   - **Permissions** → **Repository permissions** → tìm dòng **Contents**, đổi sang **Read and write**.
5. Bấm **Generate token**. Chép ngay chuỗi `github_pat_…` (chỉ hiện một lần).
6. Mở trang `…/tkb/quan-tri.html` → mục **Cài đặt kết nối GitHub** → dán mã vào ô **Mã truy cập** → bấm **Kiểm tra kết nối**. Thấy báo xanh là xong.

> Đánh dấu "Ghi nhớ trên máy này" nếu dùng máy cá nhân. Không đánh dấu khi dùng máy chung.

---

## Phần C — Mỗi tuần đăng TKB mới

1. Mở `…/tkb/quan-tri.html`.
2. Kéo thả **nguyên file Excel** TKB tuần mới (không cần sửa gì).
3. Xem số lớp, ngày áp dụng và xem thử vài lớp cho chắc.
4. Bấm **Công bố**. Sau 1–2 phút, học sinh và phụ huynh thấy nút "TKB mới".

Phiên bản cũ vẫn được giữ lại; muốn bỏ khỏi trang thì bấm **Ẩn khỏi trang** ở mục danh sách phiên bản.

---

## Vài lưu ý

- **Dữ liệu mẫu đã có sẵn**: gói này đã kèm TKB tuần 1–4 (07/9 đến 28/9/2026) từ file thật của trường. Web chạy được ngay, không cần làm gì thêm. Tuần sau chỉ việc đăng file mới theo Phần C.
- **Đổi logo**: logo trường đã có sẵn. Muốn đổi, vào trang Quản trị → mục **Logo trường**.
- **Đổi tên môn viết tắt**: mở `assets/config.js`, thêm dòng vào mục `subjectNames`, ví dụ `"TA": "Tiếng Anh"`.
- **Điền sẵn tên kho**: nếu muốn trang Quản trị tự nhận kho (khỏi gõ tay), mở `assets/config.js`, điền `owner` và `repo` trong mục `github`. Hoặc gửi tôi tên tài khoản, tôi điền giúp.
- Toàn bộ file trong kho Public ai cũng tải được, nên không đưa thông tin nhạy cảm của học sinh lên.
