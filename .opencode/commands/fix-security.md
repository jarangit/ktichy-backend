---
description: Scan and fix security issues in a module or the whole project
agent: nestjs-dev
---

Scan `$ARGUMENTS` for security issues and fix them. If no argument given, scan the entire `src/` directory.

## Scan Phase

Use the `security-audit` agent mindset. For each file, check:

1. Missing `@UseGuards(JwtAuthGuard)` on mutation endpoints
2. Missing ownership verification (`store.owner_id !== userId`)
3. Missing class-validator decorators on DTOs
4. Exposed sensitive fields in DTOs (`createdBy`, `status` that shouldn't be client-settable)
5. Hardcoded secrets or insecure defaults
6. `Object.assign(entity, dto)` without whitelisting

## Fix Phase

For each issue found:

1. Add `@UseGuards(JwtAuthGuard)` where missing
2. Add ownership checks in service methods
3. Add class-validator decorators to DTO fields
4. Remove sensitive fields from DTOs or make them non-writable
5. Use `pick()` or explicit assignment instead of `Object.assign`

## Verify

After fixes, run `npm run build` to ensure no compilation errors.

Report what was fixed with before/after for each change.
