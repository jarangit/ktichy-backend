# AI Agent Guide - ktichy-backend

เอกสารนี้สรุปบริบทของโปรเจกต์สำหรับ AI agent ที่เข้ามาช่วยแก้โค้ดใน repository นี้

## Project Snapshot

- Framework: NestJS 10 + TypeScript
- Database: MySQL + TypeORM (`@nestjs/typeorm`)
- Auth: JWT (`@nestjs/jwt`, `passport-jwt`)
- Monitoring: Sentry (`@sentry/nestjs`)
- Runtime: Node.js

Entry points หลัก:

- `src/main.ts`
- `src/app.module.ts`
- `src/data-source.ts`

## Key Modules

โมดูลหลักที่ใช้งานจริงใน `AppModule`:

- `users`
- `stores` (รองรับ route alias `restaurants`)
- `stations`
- `products`
- `orders`
- `order-station-item`
- `devices`
- `pairing-codes`
- `auth`

## Important Architecture Notes

- มี global response wrapper จาก `ResponseInterceptor` (`success`, `message`, `data`)
- มี global exception filter (`DatabaseExceptionFilter`) ที่ map DB errors และส่งเข้า Sentry
- มี logging interceptor เก็บ request/response log พร้อม `x-request-id`
- ระบบอยู่ช่วง transition จากคำว่า `restaurant` ไป `store`
  - API บางจุดยังรองรับทั้ง `restaurantId` และ `storeId`
  - route `stores` รองรับทั้ง `/stores` และ `/restaurants`

## Conventions To Follow When Editing

- รักษา backward compatibility ระหว่าง `restaurant` และ `store` ถ้าแก้ logic ที่เกี่ยวข้อง
- endpoint ที่เกี่ยว ownership/ข้อมูลส่วนตัวให้ใช้ `JwtAuthGuard`
- ใช้ TypeORM repository pattern ตามรูปแบบโมดูลเดิม
- ถ้าต้อง throw error ใน API layer ให้ใช้ Nest exceptions (`BadRequestException`, `NotFoundException`, ฯลฯ) มากกว่า `Error`
- อย่าเปลี่ยนชื่อไฟล์/พาธที่ใช้งานอยู่แม้มี typo เดิม เช่น:
  - `src/intrument.ts`
  - `src/midleware/logging.interceptor.ts`

## Entities and Imports

โปรเจกต์นี้มี entity ทั้งใน `src/entities` และบางส่วนอยู่ในโฟลเดอร์ feature (`src/*/entities`)

- ก่อนเพิ่ม entity ใหม่ ตรวจ import ใน module/service เดิมให้ตรง pattern ของไฟล์นั้น
- ใน `tsconfig.json` มี path alias `@entities/*` แต่ code ส่วนใหญ่ยังใช้ relative imports

## Environment Variables

ค่าที่ต้องใช้บ่อย:

- `PORT`
- `CLIENT_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_SECRET`
- `SENTRY_DSN`

## Useful Commands

```bash
npm install
npm run start:dev
npm run build
npm run test
npm run lint
npm run migration:run
```

## Quick Safety Checklist For Agent

- อ่านโค้ดใน module ที่จะแก้ให้ครบก่อนทำ diff
- เช็ค route/controller + service + dto + entity ให้สอดคล้องกัน
- ถ้าแตะ auth/ownership logic ให้ทดสอบเส้นทางที่ต้องใช้ token
- ถ้าแตะ schema/data mapping ให้ตรวจผลกระทบกับ migration และ query relations
