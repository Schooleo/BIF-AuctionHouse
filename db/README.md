# Hướng dẫn Khởi tạo Database cho BIF Auction House

Đây là file hướng dẫn khởi tạo database MongoDB cho web app BIF Auction House với các dữ liệu mẫu (seed data) đã được chuẩn bị sẵn, với mọi thứ chạy hoàn toàn trên Docker.

## 🚀 Khởi chạy (Một Dòng Lệnh)

Để khởi tạo database và nạp dữ liệu mẫu, chỉ cần chạy một lệnh duy nhất sau tại thư mục `db`:

```bash
docker-compose up --build
```

**Quá trình diễn ra:**

1.  Docker sẽ tải và khởi chạy **MongoDB** container (`bif_db`).
2.  Sau đó sẽ build và chạy **Seeder** container (`bif_seeder`).
3.  Script `seed.ts` sẽ chạy để nạp dữ liệu vào database.
4.  Khi nạp xong, container `bif_seeder` sẽ tự động dừng và thông báo `✅ Seeding Complete!`.
5.  Database **MongoDB** vẫn tiếp tục chạy để ứng dụng backend kết nối.

## 🔌 Kết nối từ máy tính khác

Database MongoDB được map ra cổng `27017` của máy host. Để kết nối từ một máy tính khác trong cùng mạng LAN:

1.  **Lấy địa chỉ IP** của máy đang chạy Docker này (ví dụ: `192.168.1.100`).
2.  Sử dụng Connection String sau để kết nối, copy trực tiếp từ đây và thay thế `<HOST_IP_ADDRESS>` bằng địa chỉ IP của máy host:

```
mongodb://root:example@<HOST_IP_ADDRESS>:27017/bif-auction-db?authSource=admin
```

**Ví dụ:** Nếu IP máy host là `192.168.1.50`:
`mongodb://root:example@192.168.1.50:27017/bif-auction-db?authSource=admin`

## 📁 Cấu trúc thư mục

- `src/models`: Chứa các Schema của Mongoose được dùng để seed data.
- `src/seed.ts`: Script chính để khởi tạo dữ liệu.
- `docker-compose.yml`: Cấu hình Docker services.
- `Dockerfile`: Cấu hình build cho Seeder service.
- `.env`: File cấu hình biến môi trường (Database URI).
