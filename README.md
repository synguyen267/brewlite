# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt. Bài tập lớn môn Công nghệ Phần mềm, theo quy trình Agile Scrum.

## Công nghệ

- Frontend: Next.js (TypeScript, TailwindCSS, Zustand)
- Backend: NestJS (TypeScript, JWT, class-validator)
- CSDL: PostgreSQL + Prisma
- Thanh toán: mock payment gateway
- DevOps: Docker Compose, Git

## Cấu trúc

```
brewlite/
├── frontend/            # Next.js, cổng 3000
├── backend/             # NestJS, cổng 3001
├── docker-compose.yml   # db + backend + frontend
└── .env.example
```

## Cách chạy bằng Docker (khuyên dùng)

Yêu cầu: Docker Desktop.

```
docker compose up --build -d
```

Đợi 1 đến 2 phút rồi mở http://localhost:3000.

Nếu menu trống (lần đầu chạy với CSDL mới), nạp dữ liệu mẫu một lần:

```
docker compose exec backend node prisma/seed.js
```

Dừng hệ thống: `docker compose down` (thêm `-v` nếu muốn xóa cả dữ liệu).

## Cách chạy môi trường phát triển

Yêu cầu: Node.js 20 trở lên, Git, Docker Desktop (cho CSDL).

1. Sao chép `.env.example` thành `.env` (trong `backend/`) và chỉnh nếu cần.
2. Chạy CSDL và backend:

```
docker compose up -d db
cd backend
npm install
npx prisma migrate dev
node --env-file=.env prisma/seed.js
npm run start:dev
```

3. Chạy frontend (terminal khác):

```
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000, backend: http://localhost:3001.

## API chính

| Endpoint | Chức năng |
|---|---|
| GET /products | Danh sách sản phẩm |
| GET /products/:id | Chi tiết sản phẩm |
| POST /auth/register | Đăng ký |
| POST /auth/login | Đăng nhập, trả JWT |
| POST /orders | Tạo đơn (PENDING) |
| GET /orders/me | Lịch sử đơn của user |
| GET /orders/:id | Chi tiết một đơn |
| POST /payments | Thanh toán |

## Luồng chính

Menu → chọn size/topping → giỏ hàng → đăng nhập → đặt hàng → thanh toán (Ví/Thẻ) → xác nhận → lịch sử đơn.
