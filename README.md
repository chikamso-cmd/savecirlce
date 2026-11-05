# SaveCircle

SaveCircle is a web app for organisations that run group savings (ajo, esusu, thrift and rotating contribution circles). Administrators can manage groups and members, record payments and cash collected by treasurers, process withdrawals, reconcile unmatched transactions, and view reports, all from one dashboard.

The app includes sign-up and login (email/password with OTP verification, Google sign-in and Cloudflare Turnstile), a short organisation onboarding flow, a custom brand colour, light/dark themes, an in-app help bot, and Progressive Web App support.

> **Status:** Most screens still run on sample data from `src/lib/DashboardData.ts`, and groups and organisation details are kept in `localStorage`. Route protection is turned off for now (see `ProtectedRoute` in `src/App.tsx`), so every screen can be opened without signing in.

## Getting Started

Requirements: Node.js 20 or later.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Vite prints the local URL in the terminal, usually `http://localhost:5173`.

### Environment Variables

| Variable                  | Description                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL`       | Base URL of the SaveCircle Node API. Defaults to `http://localhost:4000/api`.                                                        |
| `VITE_GOOGLE_CLIENT_ID`   | OAuth client ID (Web application) from Google Cloud Console. Add `http://localhost:5173` to the authorised JavaScript origins.      |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key for the bot check on the auth screens.                                                                 |

## Available Scripts

| Command           | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Start the Vite development server                       |
| `npm run build`   | Run the TypeScript build and create a production bundle |
| `npm run preview` | Serve the production bundle locally                     |
| `npm run lint`    | Run ESLint across the project                           |

## Routes

**Public**

| Path             | Screen                     |
| ---------------- | -------------------------- |
| `/`              | Splash screen              |
| `/login`         | Login                      |
| `/signup`        | Sign up                    |
| `/signup/verify` | Sign-up OTP verification   |
| `/verify`        | Password-reset OTP         |
| `/onboarding`    | Organisation onboarding    |

**Dashboard** (inside the app layout with sidebar, header and mobile footer)

| Path                                    | Screen                                 |
| --------------------------------------- | -------------------------------------- |
| `/dashboard`                            | Overview, stats and collections chart  |
| `/groups`, `/groups/new`, `/groups/:id` | Groups list, create group, group details |
| `/members`                              | Members                                |
| `/payments`, `/payments/:id`            | Payments and payment details           |
| `/unmatched`, `/unmatched/:id`          | Unmatched transactions                 |
| `/withdrawals`, `/withdrawals/:id`      | Withdrawals                            |
| `/cash`, `/cash/:id`                    | Cash collected by treasurers           |
| `/reconciliation`                       | Reconciliation                         |
| `/reports`                              | Reports and exports                    |
| `/team`                                 | Team members                           |
| `/settings`                             | Settings, brand colour, payment rails  |
| `/profile`                              | Profile and KYB documents              |

Any other path redirects to `/dashboard`.

## Tech Stack

- React 19 and TypeScript
- Vite for development and builds
- React Router 7 for routing
- Tailwind CSS 4 for styling
- Axios for API calls (`src/services/Axios.ts` handles auth headers and token refresh)
- Chart.js with `react-chartjs-2` for charts
- React Toastify for notifications
- Cloudflare Turnstile (`@marsidev/react-turnstile`) and Google Identity Services for auth
- Lucide React and React Icons for icons
- `vite-plugin-pwa` for installable PWA support
- Zustand and TanStack Query are installed for upcoming state management and data fetching, but are not used yet

## Project Structure

```text
public/                     Static assets, PWA icons and _redirects
src/
  assets/images/            Bundled images and logos
  components/
    auth/                   Login, sign-up, OTP and protected route
    landing/                Splash and loading screens
    layout/                 Dashboard layout, header, sidebar, mobile footer
    modals/                 Add member, add payment and withdrawal modals
    onboarding/             Organisation onboarding steps
    support/                In-app help bot
    widgets/                Dashboard widgets, charts and export button
  contexts/                 Theme, brand colour and help bot providers
  lib/                      Sample data, group/organisation stores, brand palette, help bot content
  pages/                    One file per route (plus forgotpassword/ for password reset)
  services/                 Axios instance and API modules (auth, payments, cash, withdrawals)
  types/                    Shared TypeScript types
  App.tsx                   Route definitions
  main.tsx                  App entry point and providers
  index.css                 Global styles and Tailwind entry
vite.config.ts              Vite, Tailwind and PWA configuration
```

## Deployment

`npm run build` outputs a static site to `dist/`. Because the app uses client-side routing, the host must serve `index.html` for unknown paths. `public/_redirects` already does this for Netlify-style hosts. The app is built for the root path (`base: "/"` in `vite.config.ts`); change `base` if you deploy under a sub-path.
