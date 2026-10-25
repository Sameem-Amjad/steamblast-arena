

# Project Development: SteamBlast Arena

## 📋 Executive Summary

**SteamBlast Arena** is a web-based multiplayer game for primary school children (ages 5-12), inspired by Bomberman mechanics but re-themed around water spraying. Players navigate mazes, spray opponents with water (turning them into steam), and must answer educational questions (maths or literacy) to respawn. The game combines fun, competitive gameplay with genuine educational reinforcement.

**Target Markets:** Hong Kong & Mainland China
**Monetization:** Freemium model — 20 HKD/month (~$2.50 USD) for premium features
**Platform:** Web app (mobile-responsive, playable on tablets/phones/desktops)

---

## 🎮 Game Design Document

### Core Gameplay Loop

```
ENTER MATCH (2-min round)
    → Navigate maze
    → Collect water power-ups
    → Spray opponents → They turn to STEAM (you earn 1 point)
    → GET SPRAYED → Sent to THE CHAMBER
        → Answer a maths OR literacy question correctly
        → Return to the maze
    → Round ends after 2 minutes
    → Scoreboard shown
    → Play again
```

### Game Modes

| Mode | Chamber Questions | Target Skills |
|------|------------------|---------------|
| **Maths Blast** | Addition, subtraction, multiplication, division, fractions, word problems | KS1/KS2 Maths |
| **Literacy Blast** | Spelling, grammar, reading comprehension, vocabulary, sentence correction | KS1/KS2 Literacy |
| **Mixed Mode** | Random mix of both | General revision |

### Difficulty Scaling

- **Level 1 (Ages 5-7):** Simple addition/subtraction, basic sight words, CVC spelling
- **Level 2 (Ages 7-9):** Multiplication, division, sentence structure, synonyms/antonyms
- **Level 3 (Ages 9-12):** Fractions, word problems, grammar rules, comprehension passages

*Difficulty auto-adjusts based on player performance OR can be set by a teacher/parent.*

### The Chamber Mechanic (Key Educational Hook)

When a player is "steamed," they enter a full-screen popup:

```
┌─────────────────────────────────────────┐
│           ☁️ THE CHAMBER ☁️              │
│                                         │
│   You've been steamed!                  │
│   Answer correctly to jump back in!     │
│                                         │
│   What is 7 × 8?                        │
│                                         │
│   [48]  [54]  [56]  [64]               │
│                                         │
│   ⏱️ 15 seconds remaining              │
│                                         │
│   Streak: 🔥🔥🔥 (3 correct in a row)  │
└─────────────────────────────────────────┘
```

- **Correct answer:** Respawn immediately with a 2-second shield
- **Wrong answer:** Wait 5 seconds, get a new question, try again
- **Speed bonus:** Answer in under 5 seconds = respawn with a temporary speed boost
- **Streak tracking:** Consecutive correct answers earn cosmetic rewards

---

## 💰 Monetization Model

### Free Tier (No Account Required)

- Play as a **random blind avatar** (e.g., "Player_3847")
- Basic water spray (standard range and reload speed)
- Access to all game modes and educational content
- Standard maze skins
- Full gameplay — **no content is locked**

### Premium Tier — 20 HKD/month (~$2.50 USD)

| Feature | Details |
|---------|---------|
| **Custom Name** | Choose your own display name (filtered for safety) |
| **Avatar Creator** | Design your own character (hair, skin, outfit, accessories) |
| **Extra Water** | +25% water capacity, slightly faster reload |
| **Weekly Shop Access** | Buy cosmetic items with earned in-game coins |
| **Cool Hats & Fashion** | Rotating weekly collection of hats, outfits, effects |
| **Steam Effects** | Custom steam animations when you blast someone |
| **Profile Page** | Stats, achievements, question accuracy tracked |
| **Leaderboard Name** | Appear on class/school/global leaderboards with your name |

### Weekly Cosmetic Shop (Premium Only)

Every Monday, a new rotation of 6-8 items appears:

- 🎩 Hats (top hats, animal ears, crowns, helmets)
- 👕 Outfits (superhero capes, school uniforms, seasonal costumes)
- 💦 Water skins (rainbow water, glitter spray, ice beam visual)
- ☁️ Steam effects (coloured steam, sparkle steam, funny shapes)
- 🏃 Victory dances (end-of-round celebration animations)

*Items are earned through in-game coins (earned by playing and answering questions correctly). No additional real-money purchases beyond the subscription.*

### Revenue Projections

```
Conservative Estimate (Year 1):
- Teacher's own class: 25 students × 20 HKD = 500 HKD/month
- Word of mouth (5 classes): 125 students × 20 HKD = 2,500 HKD/month
- School-wide adoption (1 school): 500 students × 20 HKD = 10,000 HKD/month
- Multiple schools (10): 5,000 students × 20 HKD = 100,000 HKD/month

Aggressive Estimate (Year 2-3, HK + China expansion):
- 50,000 paying users × 20 HKD = 1,000,000 HKD/month ($128,000 USD/month)
```

---

## 🏗️ Technical Architecture

### Tech Stack

```
Frontend:
├── React.js (UI framework)
├── Phaser.js or PixiJS (2D game engine — handles sprites, tilemaps, animations)
├── WebSocket client (Socket.IO) for real-time multiplayer
└── PWA support (installable on tablets/phones)

Backend:
├── Node.js + Express (API server)
├── Socket.IO (real-time game state sync)
├── PostgreSQL (user accounts, stats, purchases, question banks)
├── Redis (session management, matchmaking, leaderboard caching)
└── Stripe / local HK payment gateway (subscription billing)

Infrastructure:
├── Docker containers
├── AWS / Alibaba Cloud (for China region latency)
├── CDN for assets (CloudFlare or Alibaba CDN)
├── CI/CD pipeline (GitHub Actions)
└── SSL/TLS throughout

Content Management:
├── Admin panel for adding/editing questions
├── Teacher dashboard (track student performance)
└── Question bank API (categorized by subject, difficulty, topic)
```

### System Architecture Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Player 1   │     │   Player 2   │     │   Player N   │
│   (Browser)  │     │   (Browser)  │     │   (Browser)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────┬───────┴────────────────────┘
                    │ WebSocket (Socket.IO)
                    ▼
          ┌─────────────────┐
          │   Game Server   │
          │   (Node.js)     │
          │                 │
          │ • Matchmaking   │
          │ • Game state    │
          │ • Collision     │
          │ • Scoring       │
          │ • Chamber logic │
          └────────┬────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
  ┌──────────┐ ┌───────┐ ┌────────────┐
  │PostgreSQL│ │ Redis │ │  CDN/Assets│
  │          │ │       │ │            │
  │• Users   │ │• State│ │• Sprites   │
  │• Scores  │ │• Match│ │• Maps      │
  │• Questions││• Cache│ │• Audio     │
  │• Payments│ │       │ │• Effects   │
  └──────────┘ └───────┘ └────────────┘
```

### Game State Management

```javascript
// Server-side game state (simplified)
const gameState = {
  roomId: "room_abc123",
  timeRemaining: 120, // seconds
  mode: "maths", // or "literacy" or "mixed"
  difficulty: 2,
  maze: {
    width: 15,
    height: 13,
    walls: [[1,0,1,1,...], ...],
    destructibleWalls: [[0,1,0,...], ...],
    powerUps: [
      { x: 3, y: 5, type: "extra_water" },
      { x: 10, y: 2, type: "speed_boost" },
      { x: 7, y: 8, type: "range_up" }
    ]
  },
  players: {
    "player_1": {
      x: 1, y: 1,
      direction: "down",
      waterCapacity: 3,
      waterRange: 2,
      speed: 1.0,
      score: 0,
      alive: true,
      isPremium: true,
      avatar: { hat: "crown", outfit: "superhero", steamEffect: "rainbow" },
      displayName: "WaterKing"
    },
    "player_2": {
      x: 13, y: 11,
      direction: "up",
      waterCapacity: 2,
      waterRange: 2,
      speed: 1.0,
      score: 0,
      alive: true,
      isPremium: false,
      avatar: { hat: null, outfit: "default_blue", steamEffect: "default" },
      displayName: "Player_7291"
    }
  },
  waterSprays: [
    // Active water spray projectiles/zones
    { playerId: "player_1", x: 1, y: 3, direction: "down", range: 2, ttl: 500 }
  ]
};
```

---

## 📐 Game Mechanics — Detailed

### Maze Generation

- Procedurally generated each round (ensures replayability)
- Classic Bomberman grid-based layout
- **Indestructible walls** (permanent maze structure)
- **Destructible walls** (can be broken with water spray — may contain power-ups)
- **Open paths** (movement corridors)
- Maze size scales with player count:
  - 2-4 players: 11×11 grid
  - 5-8 players: 15×13 grid

### Water Spray Mechanics

```
Free Player:
- Water capacity: 2 (can place 2 sprays at a time)
- Spray range: 2 tiles in each direction
- Reload time: 1.5 seconds after a spray dissipates

Premium Player:
- Water capacity: 3 (+1 bonus)
- Spray range: 2 tiles (same — we don't want pay-to-win on range)
- Reload time: 1.2 seconds (slightly faster)
```

**How spraying works:**
1. Player presses SPACE / taps spray button
2. A water zone appears at their position
3. After 0.8 seconds, it explodes outward in 4 directions (up/down/left/right)
4. The water stream extends up to the player's range
5. Any player caught in the stream is "STEAMED"
6. Destructible walls hit by water are broken (may reveal power-ups)

### Power-Ups (Found in Destructible Walls)

| Power-Up | Effect | Icon |
|----------|--------|------|
| 💧 Extra Water | +1 water capacity (max 5) | Water droplet |
| 🔥 Range Up | +1 spray range (max 5) | Flame icon |
| 👟 Speed Boost | +15% movement speed (max 3 stacks) | Running shoe |
| 🛡️ Shield | Survive one hit (consumed on use) | Shield icon |
| ⭐ Super Spray | Next spray covers entire row AND column | Star icon |

### Scoring System

| Action | Points |
|--------|--------|
| Steam an opponent | +1 |
| Answer Chamber question correctly | +0.5 |
| Answer in under 5 seconds | +0.25 bonus |
| Break a destructible wall | +0.1 |
| Survive entire round without being steamed | +2 bonus |
| 3-answer streak in Chamber | +0.5 bonus |

### Controls

```
Desktop:
- Arrow keys / WASD: Move
- Spacebar: Spray water
- ESC: Pause/Menu

Mobile/Tablet:
- Virtual D-pad (left side): Move
- Spray button (right side): Spray water
- Responsive touch controls optimized for iPad
```

---

## 📚 Educational Content — Question Bank

### Maths Questions (Organized by Level)

**Level 1 (Ages 5-7):**
```
- What is 3 + 4? → [5] [6] [7] [8]
- What is 10 - 3? → [5] [6] [7] [8]
- Count the objects: 🍎🍎🍎🍎🍎 → [3] [4] [5] [6]
- Which number comes after 15? → [14] [15] [16] [17]
- What shape has 3 sides? → [Square] [Triangle] [Circle] [Rectangle]
```

**Level 2 (Ages 7-9):**
```
- What is 6 × 7? → [36] [42] [48] [54]
- What is 56 ÷ 8? → [6] [7] [8] [9]
- What is 1/4 of 20? → [4] [5] [10] [15]
- Round 347 to the nearest 10 → [340] [345] [350] [400]
- What is the perimeter of a rectangle 5cm × 3cm? → [8] [15] [16] [30]
```

**Level 3 (Ages 9-12):**
```
- What is 15% of 200? → [15] [20] [25] [30]
- Solve: 3x + 5 = 20, x = ? → [3] [4] [5] [6]
- What is 2/3 + 1/4? → [3/7] [8/12] [11/12] [3/4]
- A triangle has angles 60° and 80°. What is the third? → [30°] [40°] [50°] [60°]
```

### Literacy Questions (Organized by Level)

**Level 1 (Ages 5-7):**
```
- Which word rhymes with "cat"? → [dog] [hat] [cup] [red]
- Spell the word: 🐶 → [dg] [dog] [bog] [dig]
- Which is a noun? → [run] [happy] [book] [quickly]
- Fill in: "The cat ___ on the mat." → [sit] [sat] [set] [sit]
```

**Level 2 (Ages 7-9):**
```
- Which word is an adjective? → [running] [beautiful] [quickly] [under]
- Choose the correct spelling: → [becuase] [because] [becuse] [becaues]
- What is the past tense of "run"? → [runned] [ran] [running] [runs]
- Which sentence is correct? → [Their going home.] [They're going home.]
```

**Level 3 (Ages 9-12):**
```
- What is a synonym for "enormous"? → [tiny] [huge] [fast] [angry]
- Identify the subordinate clause: "When the rain stopped, we went outside."
- Which sentence uses a semicolon correctly?
- What does the prefix "un-" mean? → [again] [not] [before] [after]
```

### Question Bank Management
- Admin panel to add/edit/delete questions
- Import from CSV/Excel for bulk upload
- Tag questions by: subject, topic, difficulty, curriculum standard
- **Teacher Dashboard:** Teachers can add custom questions for their class
- Analytics: Track which questions students struggle with most

---

## 🎨 Art & Visual Design

### Art Style
- **Bright, colourful, cartoony** (think Fall Guys meets Bomberman)
- **2D top-down perspective** (classic Bomberman view)
- Clean vector-style sprites with smooth animations
- Vibrant water effects (splashing, spraying, dripping)
- Satisfying steam effects (poof clouds when a player is hit)
- Child-safe: No violence, just fun water play

### Avatar Design System (Premium)

```
Customizable Parts:
├── Head shape (5 options)
├── Hair style (15 options)
├── Hair colour (12 options)
├── Skin tone (8 options)
├── Eyes (10 options)
├── Mouth (8 options)
├── Outfit base (10 options)
├── Outfit colour (12 options)
├── Hat slot (weekly rotating shop)
├── Accessory slot (glasses, masks, etc.)
├── Water gun skin (changes spray appearance)
└── Steam effect (changes what happens when you blast someone)
```

### Default Avatars (Free Players)
- 8 preset characters with distinct colour schemes
- Randomly assigned each match
- Still visually appealing — just not customizable

### UI Mockup — Main Menu

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              💦 STEAMBLAST ARENA 💦                     │
│              ~~~~~~~~~~~~~~~~~~~~~~~~                   │
│                                                         │
│         [AVATAR]  WaterKing  ⭐ Level 12                │
│                   Score: 847                             │
│                                                         │
│     ┌──────────────┐    ┌──────────────┐               │
│     │              │    │              │               │
│     │  🔢 MATHS    │    │  📖 LITERACY │               │
│     │   BLAST      │    │    BLAST     │               │
│     │              │    │              │               │
│     └──────────────┘    └──────────────┘               │
│                                                         │
│              ┌──────────────┐                           │
│              │  🎲 MIXED    │                           │
│              │   MODE       │                           │
│              └──────────────┘                           │
│                                                         │
│     [🛍️ SHOP]  [👤 AVATAR]  [📊 STATS]  [⚙️ SETTINGS] │
│                                                         │
│     [🏆 LEADERBOARD]           [👨‍🏫 TEACHER DASHBOARD]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 👨‍🏫 Teacher Dashboard (Value-Add for Schools)

This is a **critical feature** for selling to schools and parents. It transforms the game from "just a game" to "an educational tool."

### Features

```
Teacher Dashboard:
├── Class Management
│   ├── Create class codes (students join with a code)
│   ├── View all students in class
│   ├── Set difficulty level per student
│   └── Set which topics are active (e.g., "This week: multiplication only")
│
├── Performance Analytics
│   ├── Per-student accuracy rates (maths & literacy)
│   ├── Time-to-answer trends
│   ├── Weakest topics per student
│   ├── Class-wide performance heatmap
│   ├── Improvement over time graphs
│   └── Exportable reports (PDF/CSV)
│
├── Custom Questions
│   ├── Add custom questions for your class
│   ├── Align with current curriculum/unit
│   ├── Set question rotation schedules
│   └── Import from spreadsheet
│
├── Game Controls
│   ├── Schedule "class game sessions"
│   ├── Enable/disable premium features during class time
│   ├── Private rooms (only class members can join)
│   └── Spectator mode (watch games live)
│
└── Parent Reports
    ├── Auto-generated weekly email to parents
    ├── "Your child answered 47 maths questions this week, 89% accuracy"
    ├── Areas for improvement highlighted
    └── Positive reinforcement messaging
```

### School/Institutional Licensing (Future Revenue Stream)

```
Individual: 20 HKD/month per student
Class License: 400 HKD/month (up to 30 students) — ~13 HKD each
School License: 3,000 HKD/month (unlimited students) — includes teacher dashboard
District License: Custom pricing
```

---

## 🔒 Safety & Compliance

### Child Safety (Critical for HK/China Market)

- **No open chat.** Players can only use pre-set emojis/phrases:
  - "Good game!" / "Nice shot!" / "Well played!" / "Let's go!" / "GG!"
- **Name filtering:** Premium names run through profanity filter (multi-language)
- **Play time limits:** Parents can set daily time limits via parent portal
- **No external links** anywhere in the game
- **COPPA/GDPR-K compliant** data handling
- **PIPL (China)** compliance for mainland expansion
- **Parental consent** required for account creation (under 13)
- **No social features** beyond in-game play (no friend lists, messaging, etc. in V1)

### Data Privacy
- Minimal data collection (email, display name, game stats)
- All data encrypted at rest and in transit
- Data stored in-region (HK servers for HK users, China servers for China users)
- Clear, simple privacy policy in English and Chinese
- Parental controls portal

---

## 🗺️ Development Roadmap

### Phase 1: MVP (Months 1-3)

**Goal:** Playable game that can be tested with one class

```
Week 1-2: Project Setup
├── Repository setup, CI/CD pipeline
├── Tech stack initialization (React + Phaser + Node + Socket.IO)
├── Basic authentication system
└── Database schema design

Week 3-5: Core Game Engine
├── Maze generation algorithm
├── Player movement and collision
├── Water spray mechanic (place, timer, explode)
├── Hit detection (player caught in spray)
├── Basic 2-4 player multiplayer via WebSocket
└── 2-minute round timer

Week 6-7: The Chamber
├── Chamber popup UI
├── Question bank (50 maths, 50 literacy to start)
├── Correct/incorrect logic
├── Respawn mechanic
└── Basic scoring

Week 8-9: Game Polish
├── Power-up system (3 types minimum)
├── End-of-round scoreboard
├── Basic sound effects
├── Placeholder art (functional but not final)
└── Mobile-responsive controls

Week 10-12: Infrastructure & Testing
├── Deployment to cloud
├── Load testing (20+ concurrent players)
├── Bug fixing
├── Basic teacher view (class code, student list)
└── Internal playtesting
```

**MVP Deliverable:** A working multiplayer web game with maths/literacy questions, playable on desktop and tablet. Enough to test with one class of ~25 students.

### Phase 2: Polish & Soft Launch (Months 4-6)

```
├── Professional art assets (character sprites, maze tiles, effects)
├── Avatar creator (premium feature)
├── Weekly shop system
├── Premium subscription (Stripe integration)
├── 200+ question bank per subject
├── Teacher dashboard V1 (basic analytics)
├── Parent portal (time limits, reports)
├── Leaderboard system
├── Sound design & music
├── Mobile optimization
├── Soft launch with 3-5 classes
└── Feedback collection and iteration
```

### Phase 3: Growth & Features (Months 7-12)

```
├── Chinese language support (UI + questions)
├── China server deployment (Alibaba Cloud)
├── 500+ questions per subject
├── School licensing model
├── Advanced teacher analytics
├── Seasonal events (Chinese New Year, Christmas, etc.)
├── Tournament mode
├── AI bots (for when not enough players online)
├── Achievement/badge system
├── Social features V1 (friend codes, private matches)
├── Marketing website
├── App store submission (PWA or native wrapper)
└── Partnership outreach to HK education bodies
```

### Phase 4: Scale (Year 2+)

```
├── Curriculum-aligned question packs (HK, UK, US, IB)
├── Additional subjects (Science, Chinese literacy)
├── UGC: Teachers create and share question packs
├── API for school management systems
├── Esports/tournament platform for schools
├── Franchise/white-label for tutorial centres
├── Southeast Asia expansion
└── Series A fundraising (if metrics support it)
```

---

## 💼 Business Model & Partnership Structure

### Honest Assessment

**Strengths of this idea:**
- ✅ Proven gameplay mechanic (Bomberman is timeless and simple)
- ✅ Strong educational hook (parents and schools will approve)
- ✅ Low price point (20 HKD is impulse-buy territory for HK parents)
- ✅ Built-in test market (your own class = instant user base)
- ✅ HK/China ed-tech market is massive and growing
- ✅ Recurring revenue model (subscriptions > one-time purchases)
- ✅ Teacher dashboard creates institutional stickiness
- ✅ The "Chamber" mechanic is genuinely clever — makes failure a learning moment

**Risks & Challenges:**
- ⚠️ Multiplayer games are technically complex (real-time sync, latency, scaling)
- ⚠️ Art and visual polish is expensive and time-consuming
- ⚠️ China market requires ICP license, specific compliance, and local partnerships
- ⚠️ Player retention requires constant content updates (new questions, events, items)
- ⚠️ Competing with established ed-tech (Kahoot, Prodigy, Mathletics)
- ⚠️ Scaling servers costs money as user base grows
- ⚠️ App store policies on children's apps are strict

### What's Needed to Build This

```
Development Effort Estimate:
├── MVP (Phase 1): ~300-400 hours of development
├── Phase 2 (Polish): ~200-300 hours
├── Phase 3 (Growth): ~300-400 hours
├── Ongoing maintenance: ~20-40 hours/month
│
├── Art/Design: ~100-150 hours for professional assets
├── Sound/Music: ~20-30 hours
└── Question content creation: ~40-60 hours

Estimated Cost at Market Rate:
├── Full-stack developer: $50-100/hr → $15,000-40,000 for MVP
├── Game artist: $30-60/hr → $3,000-9,000
├── Sound design: $1,000-3,000
├── Infrastructure (Year 1): $100-500/month
├── Payment processing: ~3-5% of revenue
└── Total MVP budget at market rate: ~$20,000-50,000 USD
```

### Proposed Partnership Models

**Option A: Revenue Share (No Upfront Cost)**
```
- Developer builds it in exchange for equity/revenue share
- Split: e.g., 50/50 or 60/40 (negotiable)
- Developer retains IP co-ownership
- Both parties contribute: Developer = technical build, Partner = market access + content + testing
- Risk: Developer takes on most financial risk
```

**Option B: Reduced Rate + Revenue Share**
```
- Small upfront payment: e.g., $3,000-5,000 USD for MVP
- Revenue share: e.g., 30-40% to developer
- Developer retains partial IP ownership
- More sustainable for developer
- Shows financial commitment from business partner
```

**Option C: Milestone-Based Hybrid**
```
- Phase 1 (MVP): $2,000 upfront + 40% revenue share
- Phase 2 (Launch): $2,000 + revenue share continues
- Phase 3 (Scale): Renegotiate based on traction
- Revenue share reduces as product becomes profitable
- Clear milestones protect both parties
```

---

## 📊 Key Metrics to Track

### Product Metrics
```
├── DAU / MAU (Daily/Monthly Active Users)
├── Average session length
├── Games played per session
├── Questions answered per session
├── Question accuracy rate (per student, per topic)
├── Retention: Day 1, Day 7, Day 30
├── Conversion rate: Free → Premium
├── Churn rate (premium cancellations)
└── NPS (Net Promoter Score) from parents/teachers
```

### Revenue Metrics
```
├── MRR (Monthly Recurring Revenue)
├── ARPU (Average Revenue Per User)
├── LTV (Lifetime Value)
├── CAC (Customer Acquisition Cost)
├── LTV:CAC ratio (target: >3:1)
└── Revenue by channel (direct, school, referral)
```

---

## 🌏 Localization Plan

### Language Support Priority
1. **English** (HK international schools, expat families)
2. **Traditional Chinese** (HK local schools)
3. **Simplified Chinese** (Mainland China)
4. **Future:** Japanese, Korean, Thai, Vietnamese

### Curriculum Alignment
- **Hong Kong:** DSE curriculum alignment for primary maths & English
- **UK:** National Curriculum KS1/KS2 (for British international schools in HK)
- **IB:** PYP framework (for IB schools)
- **China:** 人教版 (PEP) curriculum alignment

---

## 🚀 Go-To-Market Strategy

### Phase 1: Proof of Concept (Month 1-3)
```
1. Build MVP
2. Deploy to your own class (25 students)
3. Collect data: engagement, learning outcomes, parent feedback
4. Iterate based on real usage
```

### Phase 2: Organic Growth (Month 4-6)
```
1. Word of mouth within your school
2. Approach other teachers at your school
3. Present data to school administration
4. Parent WhatsApp groups (HK parents LOVE sharing ed-tech)
5. Social media: short gameplay clips on Instagram/Facebook/小紅書
```

### Phase 3: Strategic Growth (Month 7-12)
```
1. Approach HK education conferences (EdTech events)
2. Partner with tutorial centres (補習社)
3. Education influencer outreach (HK parent KOLs)
4. Press coverage in HK education media
5. Free trial program for schools
6. Referral program (refer a friend, get a free month)
```

### Phase 4: China Expansion (Year 2)
```
1. Obtain ICP license
2. Deploy on Alibaba Cloud (China region)
3. Partner with Chinese education companies
4. Localize all content to Simplified Chinese
5. Align with Chinese primary curriculum
6. WeChat Mini Program version (huge distribution channel)
```

---

## 📁 Project File Structure

```
steamblast-arena/
├── client/                     # Frontend (React + Phaser)
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── assets/
│   │       ├── sprites/        # Character sprites, tiles, effects
│   │       ├── audio/          # Sound effects, music
│   │       ├── maps/           # Tilemap data
│   │       └── ui/             # UI elements, icons, buttons
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   ├── game/               # Phaser game scenes
│   │   │   ├── BootScene.js
│   │   │   ├── MenuScene.js
│   │   │   ├── GameScene.js    # Main gameplay
│   │   │   ├── ChamberScene.js # Question popup
│   │   │   ├── ResultScene.js  # End of round
│   │   │   └── config.js       # Phaser config
│   │   ├── components/         # React UI components
│   │   │   ├── MainMenu.jsx
│   │   │   ├── AvatarCreator.jsx
│   │   │   ├── Shop.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── ParentPortal.jsx
│   │   │   └── Settings.jsx
│   │   ├── networking/         # Socket.IO client
│   │   │   ├── socket.js
│   │   │   └── gameSync.js
│   │   ├── stores/             # State management (Zustand/Redux)
│   │   │   ├── userStore.js
│   │   │   ├── gameStore.js
│   │   │   └── shopStore.js
│   │   └── utils/
│   │       ├── auth.js
│   │       └── api.js
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.js            # Entry point
│   │   ├── app.js              # Express app setup
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── redis.js
│   │   │   └── env.js
│   │   ├── game/               # Game logic (server-authoritative)
│   │   │   ├── GameRoom.js     # Individual game room logic
│   │   │   ├── Matchmaker.js   # Matchmaking system
│   │   │   ├── MazeGenerator.js
│   │   │   ├── Physics.js      # Movement, collision
│   │   │   ├── WaterSpray.js   # Spray mechanics
│   │   │   └── PowerUp.js
│   │   ├── sockets/            # Socket.IO event handlers
│   │   │   ├── gameEvents.js
│   │   │   ├── chatEvents.js
│   │   │   └── roomEvents.js
│   │   ├── routes/             # REST API routes
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── questions.js
│   │   │   ├── shop.js
│   │   │   ├── leaderboard.js
│   │   │   ├── teacher.js
│   │   │   └── payments.js
│   │   ├── models/             # Database models (Sequelize/Prisma)
│   │   │   ├── User.js
│   │   │   ├── Question.js
│   │   │   ├── GameSession.js
│   │   │   ├── Purchase.js
│   │   │   ├── Subscription.js
│   │   │   ├── ShopItem.js
│   │   │   └── ClassRoom.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── rateLimit.js
│   │   │   └── validation.js
│   │   └── services/
│   │       ├── questionService.js
│   │       ├── paymentService.js
│   │       ├── analyticsService.js
│   │       └── emailService.js
│   ├── migrations/
│   ├── seeders/                # Seed question bank, shop items
│   ├── package.json
│   └── Dockerfile
│
├── shared/                     # Shared constants/types
│   ├── gameConstants.js
│   ├── questionTypes.js
│   └── events.js
│
├── admin/                      # Admin panel (question management)
│   └── ... (simple React app)
│
├── docs/
│   ├── DEVELOPMENT.md          # This file
│   ├── API.md                  # API documentation
│   ├── GAME_DESIGN.md          # Detailed game design doc
│   └── DEPLOYMENT.md           # Deployment guide
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── README.md
└── LICENSE
```

---

## ✅ Next Steps (Immediate Actions)

1. **Align on partnership terms** — Agree on a structure before any code is written
2. **Legal:** Simple partnership agreement / co-founder agreement (even informal, get it in writing)
3. **Define MVP scope** — Lock down exactly what "Phase 1" includes and doesn't include
4. **Set up project infrastructure** — Repo, CI/CD, cloud accounts
5. **Begin Sprint 1** — Maze generation + player movement + basic multiplayer
6. **Create initial question bank** — 50 maths + 50 literacy questions (teacher provides these)
7. **Identify 3-5 beta test families** — For early feedback before class-wide launch

---

## 📝 Final Notes

This document is a living document and should be updated as the project evolves. All estimates are approximate and will be refined during development. The key to success is **shipping the MVP fast**, getting it in front of real kids, and iterating based on real data.

**The educational angle is the moat.** Many games exist. Many educational apps exist. Very few combine genuinely fun, competitive multiplayer gameplay with curriculum-aligned learning — especially in the HK/China market. The "Chamber" mechanic (turning death into a learning moment) is the core innovation and should be protected and polished above all else.

---

*Document Version: 1.0*
*Created: Project Inception*
*Last Updated: Project Inception*
*Status: Awaiting Partnership Alignment & Development Kickoff*