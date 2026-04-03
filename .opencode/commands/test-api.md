---
description: Generate curl test commands for an API feature or endpoint
agent: api-tester
---

Generate a complete curl test flow for `$ARGUMENTS`.

Read the relevant controller, service, DTOs, and entity files first, then produce:

1. **Prerequisites** - What the tester needs (JWT token, existing IDs, running server)
2. **Setup variables** - Shell variables for reuse (`TOKEN`, `STORE_ID`, etc.)
3. **Happy path** - Numbered curl commands for the full successful flow
4. **Negative cases** - curl commands testing each error scenario:
   - Missing/invalid auth (401)
   - Missing required fields (400)
   - Non-existent resource (404)
   - Wrong ownership (403)
   - Invalid state transitions
   - Duplicate/conflict scenarios
5. **Cleanup** - Commands to reset test data if needed

Use realistic data, `jq .` for output, and shell variables for IDs.
