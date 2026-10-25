'use strict';
const { v4: uuidv4 } = require('uuid');
const now = new Date();

function q(subject, topic, difficulty, questionText, options) {
  return {
    id: uuidv4(),
    subject,
    topic,
    difficulty,
    questionText,
    options: JSON.stringify(options),
    explanation: null,
    curriculumTag: null,
    isCustom: false,
    createdByTeacherId: null,
    classRoomId: null,
    timesAnswered: 0,
    timesCorrect: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

function opt(text, isCorrect) {
  return { text, isCorrect: !!isCorrect };
}

const questions = [
  // ── MATHS Level 1 (Ages 5-7) ──────────────────────────────────────────
  q('maths','addition',1,'What is 3 + 4?',[opt('5'),opt('6'),opt('7',true),opt('8')]),
  q('maths','addition',1,'What is 5 + 2?',[opt('6'),opt('7',true),opt('8'),opt('9')]),
  q('maths','addition',1,'What is 1 + 9?',[opt('9'),opt('10',true),opt('11'),opt('8')]),
  q('maths','subtraction',1,'What is 10 - 3?',[opt('5'),opt('6'),opt('7',true),opt('8')]),
  q('maths','subtraction',1,'What is 8 - 5?',[opt('2'),opt('3',true),opt('4'),opt('5')]),
  q('maths','subtraction',1,'What is 9 - 4?',[opt('4'),opt('5',true),opt('6'),opt('7')]),
  q('maths','addition',1,'What is 6 + 3?',[opt('8'),opt('9',true),opt('10'),opt('7')]),
  q('maths','addition',1,'What is 4 + 4?',[opt('6'),opt('7'),opt('8',true),opt('9')]),
  q('maths','subtraction',1,'What is 7 - 2?',[opt('3'),opt('4'),opt('5',true),opt('6')]),
  q('maths','addition',1,'Which number comes after 15?',[opt('14'),opt('15'),opt('16',true),opt('17')]),
  q('maths','geometry',1,'What shape has 3 sides?',[opt('Square'),opt('Triangle',true),opt('Circle'),opt('Rectangle')]),
  q('maths','geometry',1,'How many sides does a square have?',[opt('3'),opt('4',true),opt('5'),opt('6')]),
  q('maths','addition',1,'What is 2 + 7?',[opt('8'),opt('9',true),opt('10'),opt('11')]),
  q('maths','subtraction',1,'What is 12 - 6?',[opt('4'),opt('5'),opt('6',true),opt('7')]),
  q('maths','addition',1,'What is 0 + 8?',[opt('6'),opt('7'),opt('8',true),opt('9')]),

  // ── MATHS Level 2 (Ages 7-9) ──────────────────────────────────────────
  q('maths','multiplication',2,'What is 6 × 7?',[opt('36'),opt('42',true),opt('48'),opt('54')]),
  q('maths','multiplication',2,'What is 8 × 9?',[opt('63'),opt('64'),opt('72',true),opt('81')]),
  q('maths','division',2,'What is 56 ÷ 8?',[opt('6'),opt('7',true),opt('8'),opt('9')]),
  q('maths','division',2,'What is 45 ÷ 5?',[opt('7'),opt('8'),opt('9',true),opt('10')]),
  q('maths','fractions',2,'What is 1/4 of 20?',[opt('4'),opt('5',true),opt('10'),opt('15')]),
  q('maths','fractions',2,'What is 1/2 of 36?',[opt('12'),opt('18',true),opt('24'),opt('9')]),
  q('maths','measurement',2,'What is the perimeter of a rectangle 5cm × 3cm?',[opt('8'),opt('15'),opt('16',true),opt('30')]),
  q('maths','measurement',2,'Round 347 to the nearest 10.',[opt('340',true),opt('345'),opt('350'),opt('400')]),
  q('maths','multiplication',2,'What is 7 × 8?',[opt('48'),opt('54'),opt('56',true),opt('64')]),
  q('maths','division',2,'What is 63 ÷ 9?',[opt('6'),opt('7',true),opt('8'),opt('9')]),
  q('maths','multiplication',2,'What is 4 × 6?',[opt('20'),opt('22'),opt('24',true),opt('26')]),
  q('maths','fractions',2,'Which fraction is bigger: 1/2 or 1/4?',[opt('1/4'),opt('1/2',true),opt('They are equal'),opt('Cannot tell')]),
  q('maths','addition',2,'What is 135 + 47?',[opt('172'),opt('182',true),opt('192'),opt('202')]),
  q('maths','subtraction',2,'What is 200 - 75?',[opt('115'),opt('120'),opt('125',true),opt('130')]),
  q('maths','measurement',2,'How many centimetres are in 1 metre?',[opt('10'),opt('100',true),opt('1000'),opt('1')]),

  // ── MATHS Level 3 (Ages 9-12) ─────────────────────────────────────────
  q('maths','percentages',3,'What is 15% of 200?',[opt('15'),opt('20'),opt('25'),opt('30',true)]),
  q('maths','algebra',3,'Solve: 3x + 5 = 20. What is x?',[opt('3'),opt('4'),opt('5',true),opt('6')]),
  q('maths','fractions',3,'What is 2/3 + 1/4?',[opt('3/7'),opt('8/12'),opt('11/12',true),opt('3/4')]),
  q('maths','geometry',3,'A triangle has angles 60° and 80°. What is the third?',[opt('30°'),opt('40',true),opt('50°'),opt('60°')]),
  q('maths','percentages',3,'What is 25% of 80?',[opt('15'),opt('20',true),opt('25'),opt('30')]),
  q('maths','algebra',3,'If y = 2x and x = 6, what is y?',[opt('8'),opt('10'),opt('12',true),opt('14')]),
  q('maths','fractions',3,'What is 3/4 − 1/2?',[opt('1/8'),opt('1/4',true),opt('1/2'),opt('2/4')]),
  q('maths','geometry',3,'What is the area of a triangle with base 6cm and height 4cm?',[opt('10cm²'),opt('12cm²',true),opt('24cm²'),opt('8cm²')]),
  q('maths','multiplication',3,'What is 23 × 15?',[opt('325'),opt('345',true),opt('365'),opt('385')]),
  q('maths','percentages',3,'A shirt costs $120. It is reduced by 10%. What is the new price?',[opt('$108',true),opt('$110'),opt('$112'),opt('$118')]),
  q('maths','fractions',3,'What is 5/6 of 42?',[opt('30'),opt('35',true),opt('40'),opt('45')]),
  q('maths','algebra',3,'What is the value of 4² + 3²?',[opt('14'),opt('25',true),opt('28'),opt('49')]),
  q('maths','measurement',3,'Convert 2.5 km to metres.',[opt('250m'),opt('2500m',true),opt('25000m'),opt('25m')]),
  q('maths','geometry',3,'How many degrees are in a right angle?',[opt('45°'),opt('90°',true),opt('180°'),opt('360°')]),
  q('maths','division',3,'What is 144 ÷ 12?',[opt('10'),opt('11'),opt('12',true),opt('13')]),

  // ── MATHS Bonus (mixed levels) ────────────────────────────────────────
  q('maths','multiplication',2,'What is 3 × 9?',[opt('24'),opt('27',true),opt('30'),opt('33')]),
  q('maths','addition',1,'What is 11 + 8?',[opt('17'),opt('18'),opt('19',true),opt('20')]),
  q('maths','division',2,'What is 36 ÷ 4?',[opt('7'),opt('8'),opt('9',true),opt('10')]),
  q('maths','subtraction',1,'What is 15 - 9?',[opt('4'),opt('5'),opt('6',true),opt('7')]),
  q('maths','fractions',3,'Which is equivalent to 2/4?',[opt('1/4'),opt('1/2',true),opt('3/4'),opt('2/3')]),

  // ── LITERACY Level 1 (Ages 5-7) ──────────────────────────────────────
  q('literacy','rhyming',1,'Which word rhymes with "cat"?',[opt('dog'),opt('hat',true),opt('cup'),opt('red')]),
  q('literacy','rhyming',1,'Which word rhymes with "sun"?',[opt('moon'),opt('fun',true),opt('star'),opt('sky')]),
  q('literacy','spelling',1,'Which is the correct spelling of the dog animal?',[opt('dg'),opt('dog',true),opt('bog'),opt('dig')]),
  q('literacy','parts_of_speech',1,'Which is a noun?',[opt('run'),opt('happy'),opt('book',true),opt('quickly')]),
  q('literacy','grammar',1,'Fill in: "The cat ___ on the mat."',[opt('sit'),opt('sat',true),opt('set'),opt('sets')]),
  q('literacy','spelling',1,'How do you spell the number after 2?',[opt('thee'),opt('thre'),opt('three',true),opt('threa')]),
  q('literacy','rhyming',1,'Which word rhymes with "big"?',[opt('bat'),opt('pig',true),opt('cap'),opt('tap')]),
  q('literacy','parts_of_speech',1,'Which word is a colour?',[opt('jump'),opt('red',true),opt('fast'),opt('loud')]),
  q('literacy','grammar',1,'Which is correct: "I ___ happy."',[opt('are'),opt('am',true),opt('is'),opt('be')]),
  q('literacy','spelling',1,'Spell the animal that says "moo".',[opt('cuw'),opt('cow',true),opt('kow'),opt('cou')]),
  q('literacy','vocabulary',1,'What is the opposite of "hot"?',[opt('warm'),opt('cold',true),opt('fast'),opt('bright')]),
  q('literacy','vocabulary',1,'What is the opposite of "big"?',[opt('tall'),opt('wide'),opt('small',true),opt('long')]),
  q('literacy','rhyming',1,'Which rhymes with "tree"?',[opt('blue'),opt('free',true),opt('tap'),opt('red')]),
  q('literacy','spelling',1,'Spell the colour of the sky.',[opt('blew'),opt('blue',true),opt('bloo'),opt('bloe')]),
  q('literacy','grammar',1,'Which is correct?',[opt('She runned fast.'),opt('She runs fast.',true),opt('She run fast.'),opt('She runing fast.')]),

  // ── LITERACY Level 2 (Ages 7-9) ──────────────────────────────────────
  q('literacy','parts_of_speech',2,'Which word is an adjective?',[opt('running'),opt('beautiful',true),opt('quickly'),opt('under')]),
  q('literacy','spelling',2,'Choose the correct spelling.',[opt('becuase'),opt('because',true),opt('becuse'),opt('becaues')]),
  q('literacy','grammar',2,'What is the past tense of "run"?',[opt('runned'),opt('ran',true),opt('running'),opt('runs')]),
  q('literacy','grammar',2,'Which sentence is correct?',[opt('Their going home.'),opt("They're going home.",true),opt('There going home.'),opt('Theyre going home.')]),
  q('literacy','vocabulary',2,'What is a synonym for "happy"?',[opt('sad'),opt('angry'),opt('joyful',true),opt('tired')]),
  q('literacy','parts_of_speech',2,'Which word is a verb?',[opt('quickly'),opt('orange'),opt('tall'),opt('sprint',true)]),
  q('literacy','spelling',2,'Which is spelled correctly?',[opt('recieve'),opt('recive'),opt('receive',true),opt('receve')]),
  q('literacy','grammar',2,'Add the correct punctuation: "What time is it___"',[opt('.'),opt(','),opt('?',true),opt('!')]),
  q('literacy','vocabulary',2,'What is an antonym for "ancient"?',[opt('old'),opt('modern',true),opt('large'),opt('bright')]),
  q('literacy','parts_of_speech',2,'What part of speech is "quickly"?',[opt('noun'),opt('verb'),opt('adjective'),opt('adverb',true)]),
  q('literacy','grammar',2,'Which uses the correct apostrophe?',[opt("the dog's bone",true),opt('the dogs bone'),opt('the dogs\' bone'),opt('the dog bone')]),
  q('literacy','spelling',2,'Correct spelling: "across the ___"',[opt('brige'),opt('bridg'),opt('bridge',true),opt('brigde')]),
  q('literacy','vocabulary',2,'What does "enormous" mean?',[opt('tiny'),opt('very large',true),opt('very fast'),opt('very quiet')]),
  q('literacy','grammar',2,'Which is the plural of "child"?',[opt('childs'),opt('childen'),opt('children',true),opt('childer')]),
  q('literacy','parts_of_speech',2,'Identify the noun: "The friendly dog barked loudly."',[opt('friendly'),opt('dog',true),opt('barked'),opt('loudly')]),

  // ── LITERACY Level 3 (Ages 9-12) ─────────────────────────────────────
  q('literacy','vocabulary',3,'What is a synonym for "enormous"?',[opt('tiny'),opt('huge',true),opt('fast'),opt('angry')]),
  q('literacy','vocabulary',3,'What does the prefix "un-" mean?',[opt('again'),opt('not',true),opt('before'),opt('after')]),
  q('literacy','grammar',3,'What is the subjunctive mood used for?',[opt('Facts and certainties'),opt('Wishes and hypotheticals',true),opt('Commands only'),opt('Questions only')]),
  q('literacy','parts_of_speech',3,'What is the function of a subordinating conjunction?',[opt('Joins equal clauses'),opt('Introduces a subordinate clause',true),opt('Shows possession'),opt('Replaces a noun')]),
  q('literacy','vocabulary',3,'What does "benevolent" mean?',[opt('Angry and strict'),opt('Kind and generous',true),opt('Shy and quiet'),opt('Clever and fast')]),
  q('literacy','grammar',3,'Which sentence uses a semicolon correctly?',[opt('I love reading; but not maths.'),opt('I love reading; I enjoy maths too.',true),opt('I love; reading and maths.'),opt('I; love reading and maths.')]),
  q('literacy','vocabulary',3,'What is an antonym for "transparent"?',[opt('clear'),opt('opaque',true),opt('bright'),opt('shiny')]),
  q('literacy','parts_of_speech',3,'Identify the subordinate clause: "When the rain stopped, we went outside."',[opt('"we went outside"'),opt('"When the rain stopped"',true),opt('Both are subordinate'),opt('Neither is subordinate')]),
  q('literacy','grammar',3,'Which word correctly completes: "Neither the students nor the teacher ___ ready."',[opt('were'),opt('was',true),opt('are'),opt('have been')]),
  q('literacy','spelling',3,'Which is spelled correctly?',[opt('accomodation'),opt('acommodation'),opt('accommodation',true),opt('acomodation')]),
  q('literacy','vocabulary',3,'What does the root word "port" mean?',[opt('fire'),opt('carry',true),opt('water'),opt('speak')]),
  q('literacy','grammar',3,'What is the passive voice of "The dog chased the cat"?',[opt('The cat was chased by the dog.',true),opt('The cat chased the dog.'),opt('The dog was chasing.'),opt('Chasing the cat, the dog ran.')]),
  q('literacy','vocabulary',3,'What is a "metaphor"?',[opt('A word that sounds like its meaning'),opt('A direct comparison without "like" or "as"',true),opt('A comparison using "like" or "as"'),opt('An exaggeration for effect')]),
  q('literacy','punctuation',3,'What is the purpose of a colon?',[opt('To show a pause'),opt('To introduce a list or explanation',true),opt('To show ownership'),opt('To end a sentence')]),
  q('literacy','grammar',3,'Which is grammatically correct?',[opt('Between you and I'),opt('Between you and me',true),opt('Between I and you'),opt('Between me and I')]),

  // ── LITERACY Bonus ────────────────────────────────────────────────────
  q('literacy','vocabulary',2,'What is a synonym for "fast"?',[opt('slow'),opt('quick',true),opt('quiet'),opt('big')]),
  q('literacy','spelling',1,'Spell the fruit that is red and round.',[opt('aple'),opt('apple',true),opt('apel'),opt('appel')]),
  q('literacy','grammar',1,'Which is correct: "___ is a cat."',[opt('This',true),opt('These'),opt('Those'),opt('They')]),
  q('literacy','parts_of_speech',1,'Which word is a verb?',[opt('cat'),opt('run',true),opt('happy'),opt('blue')]),
  q('literacy','vocabulary',1,'What is the opposite of "day"?',[opt('morning'),opt('night',true),opt('evening'),opt('afternoon')]),
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('questions', questions);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('questions', { isCustom: false });
  },
};
