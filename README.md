# MediBook — Medical Clinic Booking System

A full-stack web application for booking medical appointments. Patients can browse doctors by specialty, use the AI symptom assistant, and manage their bookings. Doctors and admins have role-specific dashboards.

## Live Demo
- **Frontend:** `https://medibook.yourdomain.com` (Netlify)
- **Backend API:** `https://medibook-api.onrender.com` (Render)

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | Vanilla HTML, CSS, JavaScript |
| Backend   | Node.js, Express, TypeScript |
| Database & Auth | Supabase (PostgreSQL) |
| AI Feature | Google Gemini 2.0 Flash |
| Frontend Deployment | Netlify |
| Backend Deployment  | Render |

---

## Project Structure

```
medibook/
├── client/           # Vanilla HTML/CSS/JS frontend
│   ├── css/styles.css
│   ├── js/
│   │   ├── config.js       ← YOU EDIT THIS
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── navbar.js
│   ├── index.html
│   ├── doctors.html
│   ├── doctor.html
│   ├── auth/
│   │   ├── login.html
│   │   └── register.html
│   └── dashboard/
│       ├── patient.html
│       ├── doctor.html
│       └── admin.html
└── server/           # Express API
    └── src/
        ├── controllers/
        ├── routes/
        ├── middlewares/
        └── utils/
```

---

## Setup Instructions

### 1. Supabase Setup (Database & Auth)

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the **SQL Editor**, run the entire contents of `supabase_schema.sql`.
   - This creates all tables, enables Row Level Security, and seeds 10 specialties.
3. In **Authentication → Settings**, ensure **Email Auth** is enabled.
4. Note down:
   - **Project URL** (Settings → API → Project URL)
   - **Anon Key** (Settings → API → anon public)
   - **Service Role Key** (Settings → API → service_role — keep this secret!)

### 2. Backend Setup

```bash
cd server
npm install
```

Edit `.env`:
```
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

Run in development:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

### 3. Frontend Setup

Edit `client/js/config.js`:
```js
const CONFIG = {
  SUPABASE_URL: 'your_supabase_project_url',
  SUPABASE_ANON_KEY: 'your_supabase_anon_key',
  API_URL: 'http://localhost:5000',  // Change to deployed URL in production
};
```

Open `client/index.html` directly in a browser or serve with any static server:
```bash
npx serve client
```

---

## Deployment

### Frontend → Netlify

1. Drag and drop the `client/` folder into [app.netlify.com/drop](https://app.netlify.com/drop), or connect your GitHub repo.
2. Set the **Publish directory** to `client`.
3. After deploy, add a custom domain subdomain (e.g., `medibook.yourdomain.com`) in Netlify's domain settings.
4. Update `client/js/config.js` with the production API URL.

### Backend → Render

1. Push your code to GitHub.
2. Create a new **Web Service** on [render.com](https://render.com).
3. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, FRONTEND_URL).

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/specialties` | List specialties (supports `?search=`) |
| GET | `/api/doctors` | List doctors (supports `?search=`, `?specialty_id=`, `?sort=`) |
| GET | `/api/doctors/:id` | Get doctor profile |
| GET | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Get available time slots |
| POST | `/api/ai/symptom-check` | AI symptom matcher |

### Authenticated (Bearer token required)
| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/appointments` | All | Get own appointments |
| POST | `/api/appointments` | PATIENT | Book appointment |
| PATCH | `/api/appointments/:id/status` | All | Update status |
| DELETE | `/api/appointments/:id` | ADMIN | Delete appointment |
| POST | `/api/specialties` | ADMIN | Create specialty |
| PUT | `/api/specialties/:id` | ADMIN | Update specialty |
| DELETE | `/api/specialties/:id` | ADMIN | Delete specialty |
| POST | `/api/doctors` | ADMIN | Register a doctor |
| PUT | `/api/doctors/:id` | ADMIN/DOCTOR | Update doctor |
| DELETE | `/api/doctors/:id` | ADMIN | Remove doctor |

---

## Creating an Admin Account

1. Register normally via the UI (creates a PATIENT account).
2. In Supabase → Table Editor → `profiles`, find your user and change `role` to `ADMIN`.

---

## AI Feature

The **AI Symptom Assistant** on the homepage accepts a free-text description of symptoms and returns:
- An empathetic response
- The recommended specialty from the clinic's actual specialty list
- A direct link to browse doctors in that specialty

It uses **Gemini 2.0 Flash** and is constrained to only suggest specialties that exist in the database, keeping it grounded and useful.

---

## AI Usage Log

| Tool | How Used |
|------|----------|
| Kilo (Claude) | Scaffolding backend controllers, routes, and middleware; generating HTML/CSS/JS pages; writing the Supabase schema and SQL trigger |
| Accepted | Overall architecture, Supabase trigger for profile creation, API helper pattern in `api.js` |
| Modified | Styling choices, slot generation logic, validation messages |
| Rejected | Suggested using React — switched to vanilla JS for simplicity and demonstrability |
