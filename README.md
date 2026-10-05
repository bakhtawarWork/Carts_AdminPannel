# Carts Admin

Next.js admin panel for carts, written in TypeScript (TSX) and rendered on the client.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

Client-side rendering is set up by:

1. A `ClientRoot` wrapper that mounts the admin UI in the browser
2. Pages and views marked with `"use client"`
3. Cart data loaded in `useEffect` hooks (ready to swap for a real API)

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard, then use **Carts** in the sidebar.
