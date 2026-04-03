---
description: Analyze a feature module for completeness (endpoints, auth, validation, entity relations, missing flows)
agent: nestjs-dev
---

Analyze the feature at `$ARGUMENTS` for completeness. Read ALL files in that module directory (entity, DTOs, service, controller, module).

Check and report:

## 1. Endpoints

- List all controller endpoints (method, route, auth guard status)
- Flag missing CRUD operations that would be expected
- Flag endpoints without `@UseGuards(JwtAuthGuard)`

## 2. Entity

- Load the `entity-review` skill and run the full checklist
- Check for duplicate FK columns, missing @JoinColumn, naming issues

## 3. DTOs

- Check if class-validator decorators are present
- Check if Update DTO extends `PartialType(CreateDto)`
- Flag any sensitive fields exposed (createdBy, etc.)

## 4. Service Logic

- Check for proper error handling (NotFoundException, BadRequestException)
- Check for ownership verification
- Check for race conditions in uniqueness checks
- Flag any `Object.assign` without field whitelisting

## 5. Business Flow

- Is the full business flow implemented end-to-end?
- Are there referenced modules/entities that don't exist yet?
- Are status transitions properly validated?

## 6. Module Registration

- Is the module registered in `src/app.module.ts`?
- Are all required TypeORM entities imported?

Output a clear summary with severity levels for each finding.
