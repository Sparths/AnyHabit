# AnyHabit Frontend

The frontend is a Vite + React application for the authenticated AnyHabit workspace. It supports private and shared group trackers, persists per-user dashboard layout state, and uses URL-based routing with React Router.

Authentication uses secure HttpOnly cookies from the backend. API requests are sent with `credentials: "include"`; no access token is stored in `localStorage`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Local Development

Set `VITE_API_URL` only if you want to point the frontend at a different backend origin. When running through Docker or the same host, the app uses the current origin and sends cookie credentials automatically.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
