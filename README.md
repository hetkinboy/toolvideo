# AI Video Studio

Ứng dụng quản lý quy trình sản xuất video AI: Project Bible, nhân vật, địa điểm, tập phim, cảnh quay, continuity, storyboard, shot và tài nguyên hình ảnh.

Repository này hiện lưu cả mã nguồn lẫn dữ liệu làm việc để có thể chuyển sang máy khác và tiếp tục đúng trạng thái hiện tại.

## Yêu cầu

- Git
- Node.js `20.19.0` trở lên hoặc `22.12.0` trở lên
- npm
- Khuyến nghị sử dụng Windows và Node.js 22 LTS

Kiểm tra phiên bản:

```powershell
git --version
node --version
npm --version
```

## Lấy project về máy

Mở PowerShell tại thư mục muốn lưu project:

```powershell
git clone https://github.com/hetkinboy/toolvideo.git
cd toolvideo
```

## Cài đặt

Cài thư viện frontend:

```powershell
npm install
```

Cài thư viện backend:

```powershell
cd server
npm install
cd ..
```

Chỉ cần cài đặt lại khi mới clone project, xóa `node_modules`, hoặc file `package.json` có thay đổi.

## Khởi động ứng dụng

### 1. Mở backend

Mở terminal thứ nhất:

```powershell
cd toolvideo\server
npm start
```

Backend chạy tại:

```text
http://localhost:3001/api
```

### 2. Mở frontend

Mở terminal thứ hai:

```powershell
cd toolvideo
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5173
```

Nếu terminal đã đứng sẵn trong thư mục `toolvideo`, không cần chạy lại lệnh `cd toolvideo`.

## Dữ liệu được lưu ở đâu?

- Database SQLite: `server/data/ai-video-studio.db`
- Hình ảnh đã upload: `server/uploads/`

Hai phần này đã được đưa vào Git. Sau khi clone và mở đúng backend cổng `3001`, dữ liệu dự án và hình ảnh sẽ xuất hiện lại.

Các file SQLite tạm thời như `*.db-wal` và `*.db-shm` không được đưa lên Git.

## Đồng bộ công việc giữa hai máy

SQLite là file nhị phân và không thể merge an toàn. Chỉ nên chỉnh sửa dữ liệu trên một máy tại một thời điểm.

### Trước khi rời máy đang làm việc

1. Dừng frontend và backend bằng `Ctrl+C`.
2. Tại thư mục gốc `toolvideo`, checkpoint database:

```powershell
node -e "const {getDb,closeDb}=require('./server/database/db'); const db=getDb(); db.pragma('wal_checkpoint(TRUNCATE)'); closeDb();"
```

3. Commit và push:

```powershell
git add .
git commit -m "Cập nhật dữ liệu và tiến độ"
git push
```

### Khi chuyển sang máy còn lại

Đảm bảo ứng dụng trên máy đó đang tắt, sau đó chạy:

```powershell
git pull
npm install
cd server
npm install
cd ..
```

Sau đó mở backend và frontend theo hướng dẫn phía trên.

> Không nhập dữ liệu đồng thời trên hai máy. Nếu cả hai máy cùng thay đổi file database, Git sẽ không thể tự gộp dữ liệu.

## Kiểm tra bản build

```powershell
npm run build
```

Thư mục build `dist/` được tạo tự động và không được đưa lên Git.

## Xử lý lỗi thường gặp

### Cổng 3001 hoặc 5173 đang được sử dụng

Kiểm tra tiến trình:

```powershell
Get-NetTCPConnection -LocalPort 3001,5173 -State Listen | Select-Object LocalPort,OwningProcess
```

Dừng đúng tiến trình nếu cần:

```powershell
Stop-Process -Id MA_PID
```

### Không hiển thị hình ảnh

- Kiểm tra backend có đang chạy ở cổng `3001` không.
- Kiểm tra file ảnh có tồn tại trong `server/uploads/` không.
- Không đổi cổng backend nếu chưa cập nhật lại đường dẫn ảnh đã lưu.

### Lỗi khi cài `better-sqlite3`

- Kiểm tra đang dùng phiên bản Node.js được hỗ trợ.
- Chạy lại `npm install` bên trong thư mục `server`.
- Trên Windows, có thể cần cài Visual Studio Build Tools nếu npm không tìm được binary dựng sẵn.

## Cấu trúc chính

```text
toolvideo/
├── src/                    # Frontend React
├── public/                 # Tài nguyên tĩnh
├── server/
│   ├── database/           # Schema, kết nối và seed SQLite
│   ├── data/               # Database hiện tại
│   ├── uploads/            # Hình ảnh đã upload
│   └── index.js            # Express API
├── package.json            # Cấu hình frontend
└── README.md
```

## Bảo mật dữ liệu

Repository chứa nội dung dự án, database và hình ảnh nhân vật. Nên đặt repository ở chế độ **Private** nếu không muốn công khai dữ liệu.
