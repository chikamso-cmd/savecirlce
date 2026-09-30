
# SaveCircle

SaveCircle is a group-savings frontend for organizing shared contributions. It provides a dashboard for reviewing savings activity and upcoming payouts, alongside a groups view for browsing contribution circles, member counts, schedules, and payment progress. The interface also includes login and sign-up screens, a responsive navigation layout, light/dark theme support, and Progressive Web App configuration.

The dashboard and groups currently use sample data defined in the page components. No backend or persistent account integration is configured in this repository yet.

## Routes

| Path         | Screen                   |
| ------------ | ------------------------ |
| `/`          | SaveCircle splash screen |
| `/login`     | Login                    |
| `/signup`    | Sign up                  |
| `/dashboard` | Savings dashboard        |
| `/groups`    | Savings groups           |

## Getting Started

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Vite prints the local URL in the terminal, typically `http://localhost:5173`.

## Available Scripts

| Command           | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Start the Vite development server                       |
| `npm run build`   | Run the TypeScript build and create a production bundle |
| `npm run preview` | Serve the production bundle locally                     |
| `npm run lint`    | Run ESLint across the project                           |

## Tech Stack

- React 19 and TypeScript
- Vite for development and production builds
- React Router for client-side navigation
- Tailwind CSS 4 for styling
- Lucide React and React Icons for icons
- `vite-plugin-pwa` for installable PWA support and asset caching

## Project Structure

```text
public/
  images/                 Public image assets
src/
  assets/
    images/               Bundled image assets
  components/
    auth/                 Login and sign-up screens
    landing/              Splash and loading screens
    layout/               App shell, navbar, sidebar, and mobile footer
    modals/                Modal components
    views/                 Reusable page-view components
  contexts/
    ThemeContext.ts        Theme context and types
    ThemeProvider.tsx      Theme state and local storage persistence
    useTheme.ts            Theme context hook
  pages/
    Dashboard.tsx          Savings overview and activity
    Groups.tsx             Group list, filters, and search
  App.tsx                  Routes and screen composition
  index.css                Global styles and Tailwind entry point
  main.tsx                 React app entry point
index.html                 HTML document shell
vite.config.ts             Vite, Tailwind, and PWA configuration
```
