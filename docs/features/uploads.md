# uploads — อัปโหลดรูปสินค้า
- controller: `src/uploads/uploads.controller.ts` base `uploads` (JWT)

## Endpoints
- `POST /uploads/product-image` — multipart `file` ได้ URL กลับไปใส่ `Product.imageUrl`

## Rule
- ต้อง login, ไฟล์เก็บฝั่ง server (ดู `uploads.service.ts` เรื่อง path/limit)
