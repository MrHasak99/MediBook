// ============================================================
// MediBook Client Configuration
// ============================================================
// SUPABASE_URL and SUPABASE_ANON_KEY: copy from Supabase → Settings → API
// API_URL: automatically uses localhost in dev and the Render URL in production.
//          Update PROD_API_URL below after deploying the backend to Render.
// ============================================================

var PROD_API_URL = "https://medibook-in5r.onrender.com";

// var (not const/let) so CONFIG and supabase are on window,
// accessible from every <script> tag on the page.
var CONFIG = {
  SUPABASE_URL: "https://wwkaljhoenczqiuberwq.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3a2FsamhvZW5jenFpdWJlcndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjg0MjQsImV4cCI6MjA5MjcwNDQyNH0.FfAzKl10P_9pguUhtsjP7BGjoTERSIqQJabGGAyawWw",
  API_URL: (function () {
    var h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1"
      ? "http://localhost:4000"
      : PROD_API_URL;
  })(),
};

// Initialize Supabase client (using CDN global)
var supabase = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY,
);
