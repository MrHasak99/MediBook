// ============================================================
// Auth Utilities
// ============================================================

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', userId)
    .single();
  return data;
}

// Require auth — redirect to login if not signed in
async function requireAuth(redirectTo = '/auth/login') {
  const session = await getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

// Require a specific role
async function requireRole(roles, redirectTo = '/') {
  const session = await requireAuth();
  if (!session) return null;

  const profile = await getProfile(session.user.id);
  if (!profile || !roles.includes(profile.role)) {
    window.location.href = redirectTo;
    return null;
  }
  return { session, profile };
}

// Redirect already-logged-in users away from auth pages
async function redirectIfAuthed(redirectTo = '/dashboard/patient') {
  const session = await getSession();
  if (!session) return;

  const profile = await getProfile(session.user.id);
  if (!profile) return;

  const routes = {
    PATIENT: '/dashboard/patient',
    DOCTOR: '/dashboard/doctor',
    ADMIN: '/dashboard/admin',
  };
  window.location.href = routes[profile.role] || redirectTo;
}

// Format date: "2025-06-12" → "Thursday, June 12, 2025"
function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Format time: "09:00:00" → "9:00 AM"
function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

var STATUS_BADGE = {
  PENDING:   'badge-warning',
  CONFIRMED: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
};
