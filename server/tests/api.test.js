const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const seedDemo = require('../src/demo/seed');

const PASSWORD = 'SteamBlast@2026';

async function login(email, password = PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await seedDemo();
});

afterAll(() => sequelize.close());

describe('demo config', () => {
  it('lists the demo accounts and says payments are off', async () => {
    const res = await request(app).get('/api/config');
    expect(res.body.demoMode).toBe(true);
    expect(res.body.paymentsEnabled).toBe(false);
    expect(res.body.demoAccounts.map((a) => a.role)).toEqual(['student', 'teacher', 'admin']);
  });

  it('asks search engines to stay away', async () => {
    const res = await request(app).get('/robots.txt');
    expect(res.text).toContain('Disallow: /');
  });
});

describe('accounts', () => {
  it('signs in the premium student', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'mia@demo.steamblast.app', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.isPremium).toBe(true);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'mia@demo.steamblast.app', password: 'nope-nope' });
    expect(res.status).toBe(401);
  });

  it('validates sign-ups', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: '1', displayName: 'X' });
    expect(res.status).toBe(422);
  });

  it('creates a guest', async () => {
    const res = await request(app).post('/api/auth/guest');
    expect(res.status).toBe(201);
    expect(res.body.user.isGuest).toBe(true);
  });

  it("won't change a demo account's password", async () => {
    const token = await login('mia@demo.steamblast.app');
    const res = await request(app).post('/api/auth/change-password').set(auth(token))
      .send({ currentPassword: PASSWORD, newPassword: 'hijacked1' });
    expect(res.status).toBe(403);
    expect(await login('mia@demo.steamblast.app')).toBeTruthy();
  });
});

describe('leaderboard and stats', () => {
  it('ranks seeded players by score', async () => {
    const res = await request(app).get('/api/leaderboard/global');
    const scores = res.body.leaderboard.map((p) => p.totalScore);
    expect(scores.length).toBeGreaterThanOrEqual(15);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("shows a parent their child's activity", async () => {
    const token = await login('mia@demo.steamblast.app');
    const res = await request(app).get('/api/users/stats').set(auth(token));
    expect(res.body.totalGames).toBe(24);
    expect(res.body.accuracy).toBeGreaterThan(50);
    expect(res.body.minutesToday).toBeGreaterThanOrEqual(0);
  });

  it('keeps time limits fixed on shared demo accounts, but not on your own', async () => {
    const mia = await login('mia@demo.steamblast.app');
    const blocked = await request(app).patch('/api/users/profile').set(auth(mia)).send({ dailyTimeLimit: 1 });
    expect(blocked.status).toBe(403);

    const reg = await request(app).post('/api/auth/register')
      .send({ email: 'parent.test@example.com', password: 'secret123', displayName: 'Sam' });
    const own = await request(app).patch('/api/users/profile').set(auth(reg.body.token)).send({ dailyTimeLimit: 30 });
    expect(own.status).toBe(200);
    expect(own.body.user.dailyTimeLimit).toBe(30);
  });
});

describe('teachers', () => {
  it('see their classes and class analytics', async () => {
    const token = await login('teacher@demo.steamblast.app');
    const list = await request(app).get('/api/teacher/classrooms').set(auth(token));
    const dolphins = list.body.classrooms.find((c) => c.joinCode === 'DOLPHINS');
    expect(dolphins.students).toHaveLength(9);

    const detail = await request(app).get(`/api/teacher/classrooms/${dolphins.id}`).set(auth(token));
    expect(detail.body.analytics.students).toHaveLength(9);
    expect(detail.body.analytics.totalGamesPlayed).toBeGreaterThan(100);
  });

  it('are the only ones (with admins) who can open the dashboard', async () => {
    const token = await login('mia@demo.steamblast.app');
    const res = await request(app).get('/api/teacher/classrooms').set(auth(token));
    expect(res.status).toBe(403);
  });

  it('let a student join with a class code', async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ email: 'new.kid@example.com', password: 'secret123', displayName: 'Noah' });
    const res = await request(app).post('/api/teacher/join').set(auth(reg.body.token)).send({ joinCode: 'otters22' });
    expect(res.status).toBe(200);
    expect(res.body.classroom.name).toBe('Year 2 Otters');
  });
});

describe('question bank', () => {
  it('is hidden from players, because it holds the answers', async () => {
    const token = await login('mia@demo.steamblast.app');
    const res = await request(app).get('/api/questions').set(auth(token));
    expect(res.status).toBe(403);
  });

  it('lists questions for the admin', async () => {
    const token = await login('admin@demo.steamblast.app');
    const res = await request(app).get('/api/questions?limit=200').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.questions.length).toBe(102);
  });

  it("can't be emptied by the demo admin", async () => {
    const token = await login('admin@demo.steamblast.app');
    const { body } = await request(app).get('/api/questions?limit=1').set(auth(token));
    const id = body.questions[0].id;
    expect((await request(app).delete(`/api/questions/${id}`).set(auth(token))).status).toBe(403);
    expect((await request(app).patch(`/api/questions/${id}`).set(auth(token)).send({ isActive: false })).status).toBe(403);
    expect((await request(app).post('/api/questions/bulk-import').set(auth(token)).send({ questions: [] })).status).toBe(403);
  });

  it('accepts a new question from the admin', async () => {
    const token = await login('admin@demo.steamblast.app');
    const res = await request(app).post('/api/questions').set(auth(token)).send({
      subject: 'maths', topic: 'addition', difficulty: 1, questionText: 'What is 2 + 2?',
      options: [{ text: '3', isCorrect: false }, { text: '4', isCorrect: true }],
    });
    expect(res.status).toBe(201);
  });
});

describe('admin user list', () => {
  it("masks addresses that visitors typed in", async () => {
    const token = await login('admin@demo.steamblast.app');
    const res = await request(app).get('/api/users?limit=100').set(auth(token));
    const emails = res.body.rows.map((u) => u.email).filter(Boolean);
    expect(emails).toContain('mia@demo.steamblast.app');
    expect(emails).toContain('p***@example.com');
    expect(emails).not.toContain('parent.test@example.com');
  });
});

describe('payments', () => {
  it('explain they are off in the demo', async () => {
    const token = await login('mia@demo.steamblast.app');
    const res = await request(app).post('/api/payments/create-checkout-session').set(auth(token));
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/switched off in this demo/);
  });
});
