---
name: backend
description: ใช้สำหรับงานพัฒนา/แก้ไข backend บน NestJS + TypeORM โดยเน้นโค้ดอ่านง่าย แยก layer ชัดเจน รองรับการ scale และคง backward compatibility (restaurant/store)
---

# Backend Skill

สกิลนี้ใช้เมื่อมีงานเกี่ยวกับ API, business logic, database mapping, authentication หรือการ refactor โครงสร้าง backend ในโปรเจกต์นี้

## Goals

- โค้ดต้องอ่านง่ายและ maintain ได้
- แยกความรับผิดชอบแต่ละ layer ชัดเจน
- ออกแบบเผื่อ scale (ทั้ง traffic และ complexity)
- ไม่ทำลาย backward compatibility ที่มีอยู่ (เช่น `restaurantId`/`storeId`)

## When To Use

ใช้ skill นี้เมื่อทำงานประเภท:

- เพิ่ม/แก้ endpoint ใน NestJS module
- แก้ business logic ใน service
- แก้ DTO validation และ response shape
- แก้ relation/query ใน TypeORM
- ปรับปรุง auth/ownership ด้วย `JwtAuthGuard`
- refactor โค้ดให้ชัดเจนขึ้นโดยไม่เปลี่ยน behavior เดิม

## Architecture Rules (Must Follow)

1. **Controller = transport only**
   - รับ request, validate input, ส่งต่อให้ service
   - ไม่ใส่ business logic หนักใน controller

2. **Service = business logic**
   - รวมกฎทางธุรกิจไว้ใน service
   - แยกเมธอดย่อยเมื่อ logic เริ่มยาว
   - ใช้ Nest exceptions (`BadRequestException`, `NotFoundException`, ...)

3. **Repository/ORM = data access**
   - query และ mapping ข้อมูลผ่าน TypeORM repository pattern
   - ลด query ซ้ำซ้อน และหลีกเลี่ยง N+1

4. **DTO = contract ที่ชัดเจน**
   - input/output ต้องคาดเดาได้
   - required/optional fields ต้องสอดคล้องกับการใช้งานจริง

5. **Backward compatibility**
   - ฟีเจอร์ที่เกี่ยว store/restaurant ต้องรองรับทั้ง `storeId` และ `restaurantId` ถ้ายังมีการใช้งานเดิม

## Coding Style

- ตั้งชื่อสื่อความหมาย (`createDevice`, `validateOwnership`, `mapToResponse`)
- ฟังก์ชันสั้น กระชับ ทำหน้าที่เดียว
- ลด nested conditions โดย early return
- เพิ่ม comment เฉพาะจุดที่ logic ซับซ้อนหรือมีข้อจำกัดทางธุรกิจ
- หลีกเลี่ยง magic values ให้ประกาศเป็น constant/enum

## Scalability Guidelines

- ออกแบบ service method ให้รองรับการขยายเงื่อนไขในอนาคต
- แยก reusable logic เป็น private methods/helpers
- รองรับ pagination/filter/sort ใน list endpoints
- เลือก relation loading อย่างระวัง (โหลดเท่าที่จำเป็น)
- ระวัง transaction boundary เมื่อมีหลายขั้นตอนที่ต้องสำเร็จพร้อมกัน

## Error Handling

- API layer ใช้ Nest exceptions เท่านั้น
- ข้อความ error ต้องสั้น ชัดเจน actionable
- ไม่โยน `Error` ตรง ๆ ใน flow ปกติของ API
- คงการทำงานร่วมกับ global filters/interceptors ของโปรเจกต์

## Security Checklist

- endpoint ข้อมูลส่วนตัว/ownership ต้องใช้ `JwtAuthGuard`
- ตรวจสิทธิ์ก่อนอ่าน/แก้ไขข้อมูล
- ไม่ trust client input โดยไม่ validate
- ไม่ส่งข้อมูล sensitive เกินจำเป็นใน response

## Response & API Consistency

- คงรูปแบบ response ให้สอดคล้องระบบ global response wrapper
- หลีกเลี่ยง breaking changes ในชื่อ field โดยไม่จำเป็น
- ถ้าต้องเปลี่ยน field ให้ทำแบบ compatible (รองรับของเก่า + ใหม่ช่วง transition)

## Definition of Done

งานถือว่าเสร็จเมื่อ:

- โค้ดผ่าน build/lint/test
- controller/service/dto/entity สอดคล้องกัน
- backward compatibility ไม่พัง
- อ่านแล้วเข้าใจ intent ได้เร็ว
- ไม่มี side effects ที่กระทบ module อื่นโดยไม่ตั้งใจ

## Example Prompts

- "เพิ่ม endpoint list devices พร้อม pagination และ filter status"
- "refactor service ให้แยก validation/business/data access ให้ชัด"
- "แก้ type mismatch ระหว่าง Entity กับ Response DTO โดยไม่ลด type safety"
- "เพิ่ม ownership check ใน endpoint update order"