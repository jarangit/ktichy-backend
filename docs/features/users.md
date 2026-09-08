# users — account เจ้าของร้าน
- entity: `User` (`src/users/entities/user.entity.ts`)
- controller: `src/users/users.controller.ts`

## Endpoints
- `POST /users/register` — สมัคร (public) body `password` + (`email`|`phoneNumber`), ได้ `access_token`
- `POST /users/login` — login
- `POST /users/google-login` — login ด้วย Google
- `GET /users/me` — ข้อมูลตัวเอง (JWT)
- `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`

## Rule
- `email/phoneNumber` unique, อย่างน้อย 1 ค่า
- `password>=8`, เก็บ `passwordHash` ไม่ส่งออก
- `status: ACTIVE|BLOCKED`
- detail register ดู `../api-register.md`
