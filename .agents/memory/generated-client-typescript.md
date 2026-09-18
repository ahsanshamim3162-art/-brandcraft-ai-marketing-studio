---
name: Generated client TypeScript
description: Workspace compiler compatibility needed by Orval-generated fetch helpers.
---

The generated React API client uses `Headers.entries()`. Its TypeScript `lib` configuration must include both `dom` and `dom.iterable` or the workspace typecheck fails even when code generation succeeds.

**Why:** Orval can generate valid client code that references iterable DOM APIs not included by a minimal `dom` lib list.

**How to apply:** When adding or regenerating API hooks, keep `dom.iterable` enabled in the client library compiler settings and rerun the full workspace typecheck.