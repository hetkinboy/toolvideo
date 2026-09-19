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

## Quy trình làm truyện dài

### 1. Lập dàn ý trước khi sản xuất

Không ép mọi Episode về 120 giây. Hãy chia theo ba tầng:

`text
Bộ truyện tổng
→ Story Arc
→ Episode có thời lượng linh hoạt
→ Scene
→ Shot
`

Trong **Master Outline**, chọn chiến lược thời lượng:

- **Linh hoạt 120–300 giây**: khuyến nghị cho truyện dài.
- **Ngắn 90–120 giây**: dùng cho hook, biến cố hoặc cliffhanger.
- **Chiều sâu 180–300 giây**: dùng cho phát triển nhân vật và thế giới.
- **Điện ảnh 240–480 giây**: dùng cho chiến đấu, tâm lý và nhiều phân đoạn.

Mỗi Episode nên có một mục tiêu chính, một xung đột, một bước ngoặt và một câu hỏi kéo sang tập sau.

### 2. Kiểm tra thời lượng Episode

Mở:

`Episodes → chọn Episode → Kế hoạch thời lượng`

Nhập:

- Thời lượng mục tiêu.
- Khoảng tối thiểu/tối đa.
- Mật độ nội dung.
- Ngân sách lời thoại.
- Ghi chú điểm nên tách tập.

Hệ thống tự đo từ:

- Tổng thời lượng Scene.
- Tổng thời lượng Shot.
- Số từ thoại.

Nếu nội dung vượt giới hạn, nên tách Episode thay vì cắt mất thông tin. Nếu quá ngắn, bổ sung diễn biến hoặc phát triển cảm xúc trước khi sản xuất hình/video.

### 3. Trang phục và Identity Lock

Quy trình khuyến nghị:

1. Tạo nhân vật trong `Characters`.
2. Upload ảnh nhận diện khuôn mặt.
3. Tạo các bộ trong `Kho trang phục`.
4. Đặt từ khóa bối cảnh cho từng bộ.
5. Trong Scene, để hệ thống tự nhận diện nhân vật và chọn trang phục.
6. Kiểm tra lại Scene Outfit trước khi sinh prompt.

Ảnh nhận diện chỉ khóa khuôn mặt, tóc, mắt, độ tuổi ngoại hình và vóc dáng. Trang phục của Scene Outfit có quyền ưu tiên cao hơn ảnh nhận diện.

### 4. Quy trình Google Flow: Start Frame → End Frame

Mở:

`Scenes → Mở Shot Editor`

Mỗi Shot có:

- **Start Frame**: một ảnh duy nhất tại giây 0.
- **End Frame**: một ảnh duy nhất ở khoảnh khắc cuối.
- **Flow Transition Prompt**: mô tả chuyển động giữa hai frame.
- **Copy Flow Prompt Pack**: copy toàn bộ prompt.

Quy trình:

1. Tạo ảnh Start Frame bằng Image Prompt.
2. Lưu/upload ảnh vào Asset Manager.
3. Tạo End Frame với cùng nhân vật, trang phục, bối cảnh và hướng máy quay.
4. Chọn hai ảnh trong Shot Editor.
5. Bấm `Tạo lại Flow Pack`, sau đó lưu Shot.
6. Trong Google Flow chọn `Video → Frames`.
7. Đưa ảnh Start vào Start Frame, ảnh End vào End Frame.
8. Dán Flow Transition Prompt.
9. Đưa ảnh nhân vật/bối cảnh riêng vào Ingredients nếu cần.

Không upload một bảng collage nhiều ô làm Start Frame hoặc End Frame. Collage chỉ dùng làm storyboard tham khảo; mỗi Shot phải dùng một ảnh riêng.

### 5. Import an toàn

Nếu chỉ muốn cập nhật kho trang phục mà không thay thế Scene cũ, chọn:

`Chỉ cập nhật kho trang phục, giữ nguyên Scene cũ`

Database SQLite và thư mục upload được lưu cùng repository để có thể tiếp tục dự án trên máy khác. Chỉ thao tác trên một máy tại một thời điểm vì SQLite không merge an toàn như mã nguồn.

`## Cấu trúc chính

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
