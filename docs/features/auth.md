# auth — JWT guard
- ไฟล์: `src/auth/jwt-auth-guard.ts`, `jwt.strategy.ts`, `auth.module.ts`
- pattern: Bearer JWT -> `req.user = { sub: userId }`

## Rule
- route ป้องกันใช้ `@UseGuards(JwtAuthGuard)`
- ownerId = `req.user?.sub`
- ปัจจุบัน: users/me, stores, category, products(บางเส้น), quick-note, uploads, promptpay-qr, pairing-requests approve มี guard; transactions/reports/orders บางเส้นยังไม่มี
