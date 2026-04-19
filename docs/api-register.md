# Register API (Users)

เอกสารนี้สำหรับฝั่ง FE เพื่อเรียก API สมัครสมาชิก

## Endpoint

- Method: `POST`
- URL: `/api/v1/users/register`
- Auth: `none`
- Content-Type: `application/json`

Base URL ตัวอย่าง

- Local: `http://localhost:8080`
- Full URL: `http://localhost:8080/api/v1/users/register`

## Request Body

ต้องส่ง `password` และต้องมีอย่างน้อย 1 ค่าใน `email` หรือ `phoneNumber`

```json
{
  "email": "user@example.com",
  "password": "12345678"
}
```

หรือ

```json
{
  "phoneNumber": "+66812345678",
  "password": "12345678"
}
```

หรือส่งทั้งสองค่า

```json
{
  "email": "user@example.com",
  "phoneNumber": "+66812345678",
  "password": "12345678"
}
```

### Field Rules

- `password`:
  - type: `string`
  - minimum length: `8`
- `email`:
  - type: `string`
  - format: email
  - optional
- `phoneNumber`:
  - type: `string`
  - format: E.164 (regex: `^\\+?[1-9]\\d{1,14}$`)
  - optional

Business rule สำคัญ

- ถ้าไม่ส่งทั้ง `email` และ `phoneNumber` จะ error
- ถ้า `email` ซ้ำ จะ error
- ถ้า `phoneNumber` ซ้ำ จะ error

## Success Response

API นี้ถูกครอบด้วย global response interceptor รูปแบบ success จะเป็นดังนี้

Status: `201 Created`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "access_token": "<JWT_TOKEN>"
  }
}
```

## Error Response

Error จะออกจาก global exception filter

### 400 - ไม่มี email และ phoneNumber

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Email or phone number is required",
  "timestamp": "2026-04-19T10:00:00.000Z",
  "path": "/api/v1/users/register"
}
```

### 400 - email ซ้ำ

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Email already registered",
  "timestamp": "2026-04-19T10:00:00.000Z",
  "path": "/api/v1/users/register"
}
```

### 400 - phoneNumber ซ้ำ

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Phone number already registered",
  "timestamp": "2026-04-19T10:00:00.000Z",
  "path": "/api/v1/users/register"
}
```

### 500 - Internal server error

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Internal server error",
  "timestamp": "2026-04-19T10:00:00.000Z",
  "path": "/api/v1/users/register"
}
```

## FE Integration Example (fetch)

```ts
type RegisterPayload = {
  email?: string;
  phoneNumber?: string;
  password: string;
};

type RegisterSuccessResponse = {
  success: true;
  message: string;
  data: {
    access_token: string;
  };
};

type RegisterErrorResponse = {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
};

export async function register(payload: RegisterPayload) {
  const res = await fetch('http://localhost:8080/api/v1/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = (await res.json()) as RegisterErrorResponse;
    throw err;
  }

  return (await res.json()) as RegisterSuccessResponse;
}
```

## FE Checklist

- ส่ง `password` ทุกครั้ง
- ต้องมี `email` หรือ `phoneNumber` อย่างน้อย 1 ค่า
- เก็บ `data.access_token` หลังสมัครสำเร็จ
- แสดงข้อความจาก `message` เมื่อ API ตอบ error
