---
applyTo: "**"
description: "Repository-wide coding conventions"
---

# Coding Conventions

- Never use conditional object spreads to add or omit properties.
- In particular, never spread a ternary expression such as `...(condition ? {} : { key: value })`.
- Build the object first, then add optional properties through explicit `if` branches.
- Do not describe existing RCW application data or answers as "legacy". Use "existing", "stored", or "available" as appropriate.
