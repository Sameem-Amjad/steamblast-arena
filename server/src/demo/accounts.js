// Shared logins for the public demo. They are rebuilt on every start, and the guards below stop
// visitors from locking each other out of them.
const DEMO_DOMAIN = '@demo.steamblast.app';
const DEMO_PASSWORD = 'SteamBlast@2026';

const DEMO_ACCOUNTS = [
  { key: 'student', label: 'Premium student', name: 'Mia', email: `mia${DEMO_DOMAIN}`, password: DEMO_PASSWORD, role: 'student' },
  { key: 'teacher', label: 'Teacher', name: 'Ms Chan', email: `teacher${DEMO_DOMAIN}`, password: DEMO_PASSWORD, role: 'teacher' },
  { key: 'admin', label: 'Admin (read-only)', name: 'Admin', email: `admin${DEMO_DOMAIN}`, password: DEMO_PASSWORD, role: 'admin' },
];

function isDemoAccount(user) {
  return Boolean(user?.email && user.email.endsWith(DEMO_DOMAIN));
}

// Masks emails people typed in themselves, so a visitor signed in as the demo admin
// never sees another visitor's real address.
function maskEmail(email) {
  if (!email || email.endsWith(DEMO_DOMAIN)) return email;
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

module.exports = { DEMO_DOMAIN, DEMO_PASSWORD, DEMO_ACCOUNTS, isDemoAccount, maskEmail };
