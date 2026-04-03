# Kitchy Backend

Kitchen Display System (KDS) backend for restaurant order management.

## Tech Stack

- **Framework**: NestJS 10 (TypeScript)
- **Database**: MySQL 8.0 via TypeORM 0.3
- **Auth**: JWT (passport-jwt), bcrypt for passwords
- **Real-time**: Socket.IO (@nestjs/websockets) - dependencies installed, no gateways yet
- **Scheduling**: @nestjs/schedule (registered, no cron jobs yet)
- **Monitoring**: Sentry (@sentry/nestjs + profiling)
- **IDs**: nanoid 10-char string PKs via `src/utils/nanoid.ts` (`nanoid10()`)
- **Validation**: class-validator + class-transformer installed (ValidationPipe NOT enabled in main.ts)
- **API prefix**: `/api/v1`
- **Default port**: 8080
- **Container**: Docker + docker-compose

## Project Structure

```
src/
  auth/               # JWT guard + auth module (JwtAuthGuard -> req.user.sub)
  users/              # User registration, login, GET /me
  stores/             # Store CRUD (store.owner_id -> user)
  stations/           # Kitchen station CRUD (station.storeId -> store)
  products/           # Menu product CRUD (product.stationId -> station)
  orders/             # Order CRUD (order.storeId -> store)
  order-station-item/ # Links order items to stations (pending/complete)
  devices/            # Physical display devices
  pairing-codes/      # Pairing code generation for device-to-station linking
  common/             # Filters, interceptors
  utils/              # nanoid helpers
  db/                 # Data source + migrations
```

## Key Conventions

### Entity Pattern

- All entities use `@PrimaryColumn({ type: 'varchar', length: 10 })` with `@BeforeInsert()` generating `nanoid10()`
- Column naming: `snake_case` for DB via `@Column({ name: 'col_name' })`
- Relations: TypeORM decorators (`@ManyToOne`, `@OneToMany`, `@OneToOne`)
- Always add `@JoinColumn` on the owning side of relations
- NEVER define both an explicit `@Column` and a `@ManyToOne` for the same FK (creates duplicate columns)

### Module Pattern

Each feature: `entity -> DTO -> service -> controller -> module -> register in app.module.ts`

### Auth Pattern

- `JwtAuthGuard` reads Bearer token, sets `req.user = { sub: userId }`
- Protected routes: `@UseGuards(JwtAuthGuard)`
- Owner ID: `req.user?.sub`

### DTO Pattern

- Create DTO: all fields for creation
- Update DTO: extend `PartialType(CreateDto)` from `@nestjs/mapped-types`
- Use class-validator decorators: `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsEnum()`, etc.

### Known Issues (Active)

1. `ValidationPipe` NOT enabled in `main.ts`
2. `synchronize: true` in TypeORM config (should use migrations in production)
3. `nanoid` uses `Math.random()` (not cryptographically secure)
4. Several endpoints missing auth guards and ownership checks
5. Pairing flow incomplete (pairing-requests module not yet created)

## Commands

```bash
npm run build              # Build
npm run start:dev          # Dev with watch
npm run lint               # Lint + fix
npm run test               # Unit tests (jest)
npm run test:e2e           # E2E tests
npm run migration:generate # Generate migration
npm run migration:run      # Run migrations
npm run db:reset           # Clear database
```

## Domain Model

```
User (owner)
 +-- 1:N --> Store
              +-- 1:N --> Station (grill, drinks, etc.)
              |            +-- 1:N --> Product (menu items)
              |            +-- 1:N --> OrderStationItem (work items)
              |            +-- 1:1 --> PairingCode
              +-- 1:N --> Order
              |            +-- 1:N --> OrderItem --> 1:N --> OrderStationItem
              +-- 1:N --> Device (display hardware)
```

Statuses:

- Order: `NEW -> PREPARING -> READY`
- OrderStationItem: `pending -> complete`
- Device: `PENDING -> PAIRED`
- PairingCode: `PENDING -> EXPIRED | CLOSED`
