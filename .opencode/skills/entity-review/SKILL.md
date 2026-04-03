---
name: entity-review
description: Checklist to review TypeORM entities in Kitchy project for relation bugs, duplicate columns, missing JoinColumn, naming issues, and security concerns
---

## When to use

Use this skill when reviewing or auditing a TypeORM entity file for correctness.

## Entity Review Checklist

### 1. Primary Key

- [ ] Uses `@PrimaryColumn({ type: 'varchar', length: 10 })` (NOT `@PrimaryGeneratedColumn`)
- [ ] Has `@BeforeInsert()` method that calls `nanoid10()`
- [ ] Guard: `if (!this.id) this.id = nanoid10()`

### 2. Relations - Duplicate Column Bug

This is the most common bug in this project. Check for:

**BAD (creates 2 DB columns):**

```typescript
@ManyToOne(() => Store)          // auto-generates FK column "storeId"
store: Store;

@Column({ name: 'store_id' })   // creates ANOTHER column "store_id"
storeId: string;
```

**GOOD (1 DB column):**

```typescript
@ManyToOne(() => Store, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'store_id' })  // explicitly names the FK column
store: Store;

@Column({ name: 'store_id', type: 'varchar', length: 10 })
storeId: string;  // maps to same "store_id" column
```

**Also GOOD (no explicit column, let TypeORM manage it):**

```typescript
@ManyToOne(() => Store, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'store_id' })
store: Store;
// No separate @Column for storeId - access via store.id
```

### 3. Relations - @JoinColumn

- [ ] Every `@ManyToOne` has `@JoinColumn` on the same property (owning side)
- [ ] Every `@OneToOne` has `@JoinColumn` on exactly ONE side (the owning side)
- [ ] `@OneToMany` does NOT have `@JoinColumn` (it's the inverse side)
- [ ] `@JoinColumn({ name: '...' })` uses `snake_case` for the DB column name

### 4. Relations - Cascade & Delete

- [ ] `onDelete: 'CASCADE'` is set where appropriate (child should be deleted with parent)
- [ ] `cascade: true` is used carefully (only on the parent side if auto-saving children is needed)
- [ ] No circular cascade that could cause infinite loops

### 5. Column Naming

- [ ] DB column names are `snake_case`: `@Column({ name: 'created_by' })`
- [ ] TypeScript property names are `camelCase`: `createdBy: string`
- [ ] Enum columns use `type: 'enum'` with `enum: EnumType` and a `default` value
- [ ] Nullable columns have `nullable: true` in both `@Column` and TypeScript type (`?`)

### 6. Timestamps

- [ ] Has `@CreateDateColumn({ name: 'created_at' })` for `createdAt`
- [ ] Has `@UpdateDateColumn({ name: 'updated_at' })` for `updatedAt`

### 7. Indexes

- [ ] Frequently queried FK columns have `@Index()` decorator
- [ ] Unique fields have `unique: true` in `@Column` options

### 8. Common Mistakes to Flag

| Mistake                                                         | Why It's Bad                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| `@ManyToOne` without `@JoinColumn`                              | TypeORM auto-names the FK column, may not match your `@Column` |
| `@OneToOne` without `@JoinColumn` on either side                | Relation has no FK in DB, cannot be persisted                  |
| Plural name on `@OneToOne` property (e.g., `pairingCodes`)      | Misleading, suggests OneToMany                                 |
| `@Column()` + `@ManyToOne()` for same FK without matching names | Creates 2 separate DB columns                                  |
| Missing `nullable: true` on optional relation                   | INSERT fails if relation is not provided                       |

### Output Format

For each issue found:

```
[ISSUE] file:line - Description
[FIX] What to change
```
