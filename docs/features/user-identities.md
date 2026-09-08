# user-identities — stub ยังไม่ใช้
- controller/service: `src/user_identities/` base `user-identities` (CRUD เปล่า)
- entity: `UserIdentity` ยังเป็น class เปล่า ไม่มี `@Entity()`

## Rule
- เจตนา: ผูก `User` กับ provider ภายนอก + unique `(provider, provider_user_id)`
- ห้ามใช้ใน logic จนกว่าจะ implement entity + migration จริง
