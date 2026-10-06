# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt. Bài tập lớn môn Công nghệ Phần mềm, theo quy trình Agile Scrum.

## Công nghệ

- Frontend: Next.js (TypeScript, TailwindCSS)
- Backend: NestJS (TypeScript)
- CSDL: PostgreSQL + Prisma (thêm ở các task sau)

## Cấu trúc

```
brewlite/
├── frontend/   # Next.js, cổng 3000
├── backend/    # NestJS, cổng 3001
└── .env.example
```

## Yêu cầu

- Node.js 20 trở lên
- Git
- Docker Desktop (dùng từ Task 2 trở đi)

## Cách chạy (môi trường phát triển)

1. Sao chép `.env.example` thành `.env` và chỉnh giá trị nếu cần.
2. Chạy backend:

```
cd backend
npm install
npm run start:dev
```

Mở http://localhost:3001, thấy "Hello World!" là backend chạy đúng.

3. Chạy frontend (cửa sổ terminal khác):

```
cd frontend
npm install
npm run dev
```

Mở http://localhost:3000, thấy trang chào của Next.js là frontend chạy đúng.

## Chạy CSDL (từ Task 2)

```
docker compose up -d
cd backend
npx prisma migrate dev --name init
node --env-file=.env prisma/seed.js
```

CSDL chạy ở cổng 5433. Kiểm tra API: http://localhost:3001/products