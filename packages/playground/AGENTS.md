# Playground

## UI Guidelines

- Always define a hover state for buttons and cards. Every interactive element must have visible hover feedback (e.g. `hover:bg-*`, `hover:border-*`, `hover:text-*`).
- All interactive elements (buttons, tabs, selects, collapsible triggers) must use `cursor-pointer`.
- Always use `next/link` `<Link>` for internal navigation — never use raw `<a>` tags for internal routes. This enables client-side transitions and prefetching.
- Prefer Server Components by default. Only add `"use client"` when the component needs interactivity (state, effects, event handlers).
- Never use `useRouter().push()` for navigation when a `<Link>` would suffice.
