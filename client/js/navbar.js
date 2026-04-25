// ============================================================
// Navbar — injected into every page
// ============================================================

async function renderNavbar(activePage = '') {
  const session = await getSession();
  let profile = null;
  if (session) profile = await getProfile(session.user.id);

  const dashboardLinks = {
    PATIENT: '/dashboard/patient.html',
    DOCTOR: '/dashboard/doctor.html',
    ADMIN: '/dashboard/admin.html',
  };
  const dashboardHref = profile ? dashboardLinks[profile.role] : null;

  const authHTML = profile
    ? `<span class="nav-greeting">Hi, <strong>${profile.name.split(' ')[0]}</strong></span>
       <button class="btn btn-outline btn-sm" id="signout-btn">Sign Out</button>`
    : `<a href="/auth/login.html" class="btn btn-ghost btn-sm">Log In</a>
       <a href="/auth/register.html" class="btn btn-primary btn-sm">Sign Up</a>`;

  const isPatientOrGuest = !profile || profile.role === 'PATIENT';

  const patientLinks = isPatientOrGuest
    ? `<a href="/doctors.html" class="nav-link ${activePage === 'doctors' ? 'active' : ''}">Find Doctors</a>
          <a href="/ai.html" class="nav-link ${activePage === 'ai' ? 'active' : ''}">AI Assistant</a>`
    : '';

  const patientLinksMobile = isPatientOrGuest
    ? `<a href="/doctors.html" class="nav-link">Find Doctors</a>
        <a href="/ai.html" class="nav-link">AI Assistant</a>`
    : '';

  const html = `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="/index.html" class="navbar-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>
          </svg>
          MediBook
        </a>
        <div class="navbar-links">
          ${patientLinks}
          ${dashboardHref ? `<a href="${dashboardHref}" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>` : ''}
        </div>
        <div class="navbar-auth">${authHTML}</div>
        <button class="nav-hamburger" id="hamburger" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav-mobile" id="nav-mobile">
        ${patientLinksMobile}
        ${dashboardHref ? `<a href="${dashboardHref}" class="nav-link">Dashboard</a>` : ''}
        <div class="nav-mobile-auth">${authHTML}</div>
      </div>
    </nav>`;

  const target = document.getElementById('navbar');
  if (target) target.innerHTML = html;

  // Hamburger toggle
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('nav-mobile')?.classList.toggle('open');
  });

  // Sign out
  document.getElementById('signout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/index.html';
  });
}
