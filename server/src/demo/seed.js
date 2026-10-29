// Fills the demo database: the question bank, the shop, a premium student, a teacher with two
// classes, an admin and three weeks of match history so the dashboards have something to show.
// Deterministic, so every restart looks the same.
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const {
  User, Question, ShopItem, UserShopItem, ClassRoom, ClassRoomStudent, GameSession, GameSessionPlayer,
} = require('../models');
const questions = require('../../seeders/data/questions');
const shopItems = require('../../seeders/data/shop-items');
const { DEMO_DOMAIN, DEMO_PASSWORD } = require('./accounts');

function mulberry32(seed) {
  return function random() {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BOT_NAMES = ['Bubbles', 'Splash', 'Drizzle', 'Puddle', 'Misty', 'Nimbus', 'Squirt'];

// [display name, email name, class, answer accuracy, games played, premium]
const STUDENTS = [
  ['Mia W.', 'mia', 'dolphins', 0.86, 24, true],
  ['Ethan L.', 'ethan', 'dolphins', 0.78, 31, true],
  ['Chloe T.', 'chloe', 'dolphins', 0.91, 27, true],
  ['Lucas H.', 'lucas', 'dolphins', 0.64, 18, false],
  ['Hana K.', 'hana', 'dolphins', 0.82, 22, false],
  ['Jayden C.', 'jayden', 'dolphins', 0.58, 15, false],
  ['Sophie N.', 'sophie', 'dolphins', 0.88, 20, false],
  ['Ryan P.', 'ryan', 'dolphins', 0.71, 12, false],
  ['Zoe M.', 'zoe', 'dolphins', 0.69, 9, false],
  ['Kai Y.', 'kai', 'otters', 0.74, 14, false],
  ['Isla F.', 'isla', 'otters', 0.92, 19, false],
  ['Marcus O.', 'marcus', 'otters', 0.6, 11, false],
  ['Ava S.', 'ava', 'otters', 0.8, 16, false],
  ['Leo B.', 'leo', 'otters', 0.67, 8, false],
  ['Yuki A.', 'yuki', null, 0.84, 26, true],
];

const CLASSES = {
  dolphins: { name: 'Year 4 Dolphins', joinCode: 'DOLPHINS', difficulty: 2, activeMode: 'maths' },
  otters: { name: 'Year 2 Otters', joinCode: 'OTTERS22', difficulty: 1, activeMode: 'mixed' },
};

const MIA_AVATAR = {
  headShape: 'Round', hairStyle: 'Ponytail', hairColor: 'Black', skinTone: 'Light',
  eyes: 'Sparkling', outfit: 'Superhero', outfitColor: 'Teal',
};

async function seedDemo() {
  const random = mulberry32(20261025);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const between = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));
  const now = Date.now();

  await Question.bulkCreate(questions.map((q) => ({ ...q, isCustom: false })));
  const items = await ShopItem.bulkCreate(shopItems);

  // One hash for every shared login: bulkCreate skips the per-user hashing hook.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const teacher = await User.create({ email: `teacher${DEMO_DOMAIN}`, displayName: 'Ms Chan', role: 'teacher', isGuest: false });
  const admin = await User.create({ email: `admin${DEMO_DOMAIN}`, displayName: 'Admin', role: 'admin', isGuest: false });
  await User.update({ passwordHash }, { where: { id: [teacher.id, admin.id] }, hooks: false });

  const classrooms = {};
  for (const [key, c] of Object.entries(CLASSES)) {
    classrooms[key] = await ClassRoom.create({ ...c, teacherId: teacher.id });
  }

  await Question.bulkCreate([
    {
      subject: 'maths', topic: 'word_problems', difficulty: 2,
      questionText: 'An octopus has 8 legs. How many legs do 3 octopuses have?',
      options: [{ text: '11', isCorrect: false }, { text: '24', isCorrect: true }, { text: '16', isCorrect: false }, { text: '38', isCorrect: false }],
      isCustom: true, createdByTeacherId: teacher.id, classRoomId: classrooms.dolphins.id,
    },
    {
      subject: 'maths', topic: 'measurement', difficulty: 2,
      questionText: 'The Star Ferry ride takes 9 minutes. How long do 4 rides take?',
      options: [{ text: '13 minutes', isCorrect: false }, { text: '32 minutes', isCorrect: false }, { text: '36 minutes', isCorrect: true }, { text: '45 minutes', isCorrect: false }],
      isCustom: true, createdByTeacherId: teacher.id, classRoomId: classrooms.dolphins.id,
    },
  ]);

  const sessions = [];
  const sessionPlayers = [];
  const students = [];

  for (const [displayName, emailName, classKey, accuracy, games, isPremium] of STUDENTS) {
    const id = uuidv4();
    const classroom = classKey ? CLASSES[classKey] : { difficulty: 2, activeMode: 'literacy' };
    let totalScore = 0;
    let coins = 0;

    for (let g = 0; g < games; g++) {
      // Spread over the last three weeks, most recent first, in after-school hours.
      const daysAgo = Math.floor((g / games) * 21);
      const startedAt = new Date(now - daysAgo * 86400000 - between(1, 5) * 3600000 - between(0, 59) * 60000);
      const answered = between(1, 6);
      let correct = 0;
      for (let a = 0; a < answered; a++) if (random() < accuracy) correct++;
      const steamCount = between(0, 4);
      const survived = random() < 0.45;
      const score = Math.round((steamCount + correct * 0.5 + between(2, 9) * 0.1 + (survived ? 2 : 0)) * 100) / 100;

      const sessionId = uuidv4();
      const bots = [...BOT_NAMES].sort(() => random() - 0.5).slice(0, between(2, 3));
      const botScores = bots.map(() => Math.round(random() * 6 * 100) / 100);
      const ranking = [score, ...botScores].sort((x, y) => y - x);

      sessions.push({
        id: sessionId,
        roomId: `room_${sessionId.slice(0, 8)}`,
        mode: classroom.activeMode,
        difficulty: classroom.difficulty,
        playerCount: bots.length + 1,
        durationSeconds: 120,
        startedAt,
        endedAt: new Date(startedAt.getTime() + 120000),
        winnerId: ranking[0] === score ? id : null,
      });
      sessionPlayers.push({
        gameSessionId: sessionId,
        userId: id,
        displayName,
        finalScore: score,
        steamCount,
        steamed: between(Math.min(1, answered), answered),
        questionsAnswered: answered,
        questionsCorrect: correct,
        avgAnswerTimeMs: correct ? Math.round(9000 - accuracy * 6000 + random() * 1500) : null,
        placement: ranking.indexOf(score) + 1,
      });
      bots.forEach((name, i) => sessionPlayers.push({
        gameSessionId: sessionId,
        guestId: 'bot',
        displayName: name,
        finalScore: botScores[i],
        steamCount: between(0, 3),
        steamed: between(0, 3),
        questionsAnswered: between(0, 4),
        questionsCorrect: between(0, 2),
        placement: ranking.indexOf(botScores[i]) + 1,
      }));

      totalScore += score;
      coins += Math.floor(score * 5);
    }

    students.push({
      id,
      email: `${emailName}${DEMO_DOMAIN}`,
      passwordHash,
      displayName,
      role: 'student',
      isPremium,
      totalScore: Math.round(totalScore * 10) / 10,
      gamesPlayed: games,
      coins: emailName === 'mia' ? 1240 : coins,
      level: 1 + Math.floor(totalScore / 25),
      xp: Math.round(totalScore * 10),
      preferredDifficulty: classroom.difficulty,
      preferredMode: classroom.activeMode,
      avatar: emailName === 'mia' ? MIA_AVATAR : {},
      lastLoginAt: new Date(now - between(1, 72) * 3600000),
      classKey,
    });
  }

  await User.bulkCreate(students.map(({ classKey, ...s }) => s));
  await ClassRoomStudent.bulkCreate(students.filter((s) => s.classKey).map((s) => ({
    classRoomId: classrooms[s.classKey].id,
    studentId: s.id,
    joinedAt: new Date(now - 30 * 86400000),
  })));
  await GameSession.bulkCreate(sessions);
  await GameSessionPlayer.bulkCreate(sessionPlayers);

  const mia = students[0];
  const owned = ['Crown', 'Rainbow Water', 'Sparkle Steam'];
  await UserShopItem.bulkCreate(items.filter((i) => owned.includes(i.name)).map((i) => ({ userId: mia.id, shopItemId: i.id })));

  return { users: students.length + 2, sessions: sessions.length, questions: questions.length + 2 };
}

module.exports = seedDemo;
