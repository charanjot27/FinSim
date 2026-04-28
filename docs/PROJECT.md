# FinSim — The Financial Metaverse

A single-player, browser-based 2D RPG that teaches retail investors how markets,
psychology, and scams actually work — by **letting them lose simulated money in
the same ways real beginners do**, then naming the bias the moment it happens.

> *"Finance is taught as formulas. It's lived as feelings. FinSim closes that gap
>  by making the feelings visible."*

---

## Table of contents

1. [Ideology — the problem and the pitch](#1-ideology)
2. [What was actually built](#2-what-was-built)
3. [Tech stack & project layout](#3-tech-stack--project-layout)
4. [Architecture map](#4-architecture-map)
5. [The core game loop](#5-core-game-loop)
6. [Component walkthrough — small to large](#6-component-walkthrough)
   - 6.1 Procedural sprites (`Player`, `NPC`, `Building`)
   - 6.2 District decor (lamps, trees, benches, planters, fountains, bridges, signposts)
   - 6.3 `SoundManager` — Web Audio synthesis
   - 6.4 `WorldMapScene` — central plaza station
   - 6.5 `TrainTransitionScene` — cinematic travel
   - 6.6 The six districts
   - 6.7 Dialogue system + 34 dialogue trees
   - 6.8 `MarketEngine` + `MarketAPI` — live + simulated prices
   - 6.9 `PortfolioSystem` — FIFO lots, stops, R-multiples
   - 6.10 `BehaviorTracker` — seven bias detectors
   - 6.11 `BiasProfile` — personalised analytics
   - 6.12 `MiraCoach` — LLM-in-the-loop coaching
   - 6.13 `TraderScore`, `DailyMissions`, `HardMode`
   - 6.14 Echo Mode — 14 historical replays
   - 6.15 UI overlays — Trading Terminal, Pro Terminal, Learn Hub, modals
   - 6.16 Persistence — localStorage + Firebase
7. [Verified outputs](#7-verified-outputs)
8. [Educational outcomes](#8-educational-outcomes)
9. [File-by-file index](#9-file-by-file-index)

---

## 1. Ideology

### 1.1 The problem

Retail investors don't lose because they lack information. They lose because:

| Cause | Real-world cost |
|---|---|
| **FOMO** — buying after a 10% pump | 67% lose money in next 30 days |
| **Revenge trading** after losses | 78% lose more on the next trade |
| **No stop-loss** | 3× more capital lost than intended |
| **Tip-driven trades** (WhatsApp / Twitter) | Pump-and-dump exit liquidity |
| **News roulette** trading inside event windows | Reverses 60% of the time |
| **Disposition effect** — selling winners, holding losers | Permanent under-performance |

Textbooks and YouTube videos can list these biases. **They cannot trigger
them.** Practice accounts can simulate price action but not the *shame* of a
wipeout, the *thrill* of a pump, or the *temptation* of a Mom-on-WhatsApp
"guaranteed double" tip.

### 1.2 The pitch

FinSim is built around a single hypothesis:

> If a player feels the bias *while* trading, and a coach **names it in the same
> second**, the lesson sticks. If the same trigger appears later (a tweet, a
> pump, a loss streak), the player's brain will recognise the pattern — because
> they've felt it before in a safe sandbox.

So FinSim does three things together that no single product does:

1. **A real markets simulator** running GBM price ticks blended with live
   Yahoo / CoinGecko quotes — so charts feel alive.
2. **A pixel-art metaverse** with six themed districts (Scam Slum, Wall Street,
   Dalal Street, Crypto Cove, Quant Quarter, Vegas Vice) — each a 2D RPG map
   where NPCs *try* to scam you, mentor you, or both.
3. **Real-time bias detection** — every buy/sell goes through seven detectors
   (FOMO, revenge, overconfidence, naked-trade, news-roulette, tweet-trade,
   concentration). When one fires, a toast appears in **the same 50ms** as the
   click — backed by a personal `BiasProfile` dashboard and (optionally) an
   LLM-generated coaching message via Firebase Functions.

### 1.3 Why a metaverse, not a UI

A trading dashboard rewards efficient action. A scam needs the player to *walk
up to the scammer*, choose to engage, hear the pitch, and feel the temptation.
That's narrative, not UX. So Phaser scenes give the project a body: the
chaiwala outside BSE complains about volatility, the NYC cabbie rants about
survival risk, the Vegas magician runs an expected-value scam, and the
station train wails when you depart for Crypto Cove. Each district is a
classroom disguised as a place.

---

## 2. What was built

A complete vertically-integrated game spanning ~14,300 lines of TypeScript:

| Layer | Lines | Files |
|---|---:|---|
| Phaser scenes (districts, world map, train, boot, menu) | ~3,800 | 11 |
| Game systems (market, portfolio, behavior, profile, score, sound, …) | ~2,800 | 18 |
| Game data (stocks, dialogues, echo scenarios, news, calendar, blockchain) | ~2,200 | 8 |
| Entities (Player, NPC, Building) | ~1,900 | 3 |
| DOM/HTML UI overlays (terminals, modals, hubs, onboarding, leaderboard) | ~3,300 | 16 |
| Entry + config + types + lib (math, risk) | ~300 | rest |

User-visible breadth:

- **6 districts** with bespoke art, NPCs, and lessons
- **34 dialogue trees** (mom call, scammers, mentors, station-master, ambient
  townsfolk added in this iteration: chaiwala, cabbie, surfer, intern,
  magician, newspaper kid)
- **14 historical "Echo" scenarios** (Soros 1992, GME 2021, FTX, Madoff, …)
- **27+ stocks** (US + India) plus live crypto from CoinGecko
- **7 bias detectors** + **personal bias profile** + **trader score** + **daily
  missions** + **hard-mode cooling-off**
- **Procedurally synthesised** sound effects and music — no audio assets
- **Procedurally drawn** sprites and decor — no spritesheets
- **Phaser 3 + TypeScript + Vite**, persisted via localStorage with Firebase
  cloud sync (Auth + Firestore + Functions for the LLM coach)

---

## 3. Tech stack & project layout

```
finsim-project/
├── index.html                       Landing page (CSS-rich responsive hero)
├── leaderboard.html / product.html  Marketing pages
├── functions/                       Firebase Cloud Functions (miraCoach, Gemini)
├── public/                          Static assets
└── src/
    ├── main.ts                      DI root: wires Phaser + DOM UI managers
    ├── config/                      constants.ts (cash, thresholds, sizes)
    ├── types/                       Phaser-agnostic shared types
    ├── lib/                         math.ts (gbmStep), risk.ts (R-multiple)
    ├── data/
    │   ├── stocks.ts                Wall Street + Dalal Street seeds
    │   ├── dialogues.ts             34 dialogue trees
    │   ├── echoScenarios.ts         14 historical replays
    │   ├── econCalendar.ts          Event windows for News-Roulette detector
    │   ├── newsSources.ts           Headlines per district
    │   ├── personalFinance.ts       Tax/retirement helpers
    │   ├── blockchain.ts            Crypto Cove DEX/AMM data
    │   └── macro.ts                 Macro regimes (rates, CPI, …)
    ├── entities/
    │   ├── Player.ts                WASD movement + 32×32 pixel sprite
    │   ├── NPC.ts                   Archetype-based pixel sprite + dialogue id
    │   └── Building.ts              Procedural shopfronts / station fronts
    ├── scenes/
    │   ├── BootScene.ts             "Initializing…" splash
    │   ├── MenuScene.ts             Title with animated pulses
    │   ├── WorldMapScene.ts         Central Plaza station hub
    │   ├── TrainTransitionScene.ts  Cinematic travel between districts
    │   ├── ScamSlumScene.ts         Mom call + 3 scammer archetypes
    │   ├── WallStreetScene.ts       NYSE map → trading terminal
    │   ├── DalalStreetScene.ts      BSE/NSE map → trading terminal (₹ INR)
    │   ├── CryptoCoveScene.ts       Boardwalk + DEX board
    │   ├── QuantQuarterScene.ts     Backtest lab + algo bots
    │   ├── VegasViceScene.ts        Casino strip + EV-fallacy game
    │   └── utils/DistrictDecor.ts   Shared decor helpers (this iteration)
    ├── systems/
    │   ├── SoundManager.ts          Web Audio synth (18 SFX names)
    │   ├── MarketEngine.ts          GBM price ticks + live quote refresh
    │   ├── MarketAPI.ts             Yahoo + CoinGecko fetchers
    │   ├── RealDataProvider.ts      Backup quote provider
    │   ├── PortfolioSystem.ts       Cash, holdings, FIFO, R-outcomes
    │   ├── TaxLedger.ts             FIFO lot-matching + STCG/LTCG splits
    │   ├── TradeJournal.ts          Per-trade reflection prompts
    │   ├── BehaviorTracker.ts       7 bias detectors + intervention bus
    │   ├── BiasProfile.ts           Aggregates events into percentiles
    │   ├── TraderScore.ts           Weighted score → bronze/silver/gold tier
    │   ├── DailyMissions.ts         "Make 3 trades w/o FOMO trigger"
    │   ├── HardMode.ts              Cool-off timer after 3 losses
    │   ├── MiraCoach.ts             LLM coach client → Cloud Function
    │   ├── WeatherSystem.ts         DOM-overlay rain / glow per regime
    │   ├── UserProfile.ts           Onboarding + avatar
    │   ├── Leaderboard.ts           Local + Firestore feed
    │   └── FirebaseAuth.ts          Google sign-in + load/save
    └── ui/
        ├── TradingTerminal.ts       Order ticket — calls bias check pre-trade
        ├── ProTerminal.ts           Pro chart / margin / shorts / options
        ├── HUDManager.ts            Top bar (cash, district, P&L)
        ├── HudV2Widgets.ts          Trader-score chip + daily-mission chip
        ├── HudMenu.ts               Three-dot dropdown
        ├── BiasProfileModal.ts      "Your Trader Profile" dashboard
        ├── LearnHub.ts              Lesson library
        ├── CoachOverlay.ts          Mira chat panel
        ├── OnboardingOverlay.ts     First-run name/avatar
        ├── TourOverlay.ts           Guided tour (T)
        ├── MapHints.ts              Map-hint tooltips
        ├── LeaderboardOverlay.ts    Global ranks
        ├── AuthBar.ts               Sign-in chip
        ├── Modals.ts                Portfolio, Help, Echo, BiasToast (factories)
        ├── landing.css              Responsive landing (clamp + breakpoints)
        ├── builder.css              Scenario builder editor
        └── styles.css               Phaser-overlay shared styles
```

---

## 4. Architecture map

```
                    ┌─────────────────────────────────────┐
                    │     index.html (Landing + Game)     │
                    └──────────────┬──────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │     main.ts     │  DI root
                          └─┬───────┬───┬───┘
            ┌───────────────┘       │   └────────────────────┐
            ▼                       ▼                        ▼
  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────────┐
  │  Phaser.Game     │    │  DOM UI managers │    │  System singletons │
  │  scenes[]        │    │  Modal/Terminal/ │    │  Market/Portfolio/ │
  │                  │    │  Overlay/HUD     │    │  Behavior/Score…   │
  └────────┬─────────┘    └────────▲─────────┘    └────────┬───────────┘
           │                       │                       │
           │   game.registry.set()  hud.show / open()       │
           ▼                       │                        ▼
  ┌──────────────────────┐         │              ┌─────────────────────┐
  │  Scene → DOM bridge  │─────────┘              │  localStorage v1+   │
  │  (registry callbacks)│                        │  Firestore (opt)    │
  └──────────────────────┘                        └─────────────────────┘
                                                           ▲
                                                           │
                                              ┌────────────┴────────────┐
                                              │  Firebase Functions     │
                                              │  miraCoach (Gemini LLM) │
                                              └─────────────────────────┘
```

The architecture deliberately separates the **Phaser canvas** (game world) from
the **DOM overlays** (terminals, modals, HUD). They communicate through:

- **`game.registry.set('hudUpdater', fn)`** — scenes call DOM updaters
- **DOM events on canvas** — `pointerdown` triggers train transitions
- **Singleton systems** — both halves import `portfolio`, `marketEngine`,
  `behaviorTracker`, etc. from `@/systems/*` modules so a single source of
  truth backs every chart, ticker, and modal.

---

## 5. Core game loop

```
1. Boot       BootScene shows "Initializing..." splash
2. Menu       Title + Play button → startGame() in main.ts
3. Onboard    First-run only: avatar + name + tour
4. World map  WorldMapScene draws the Central Plaza station
5. Travel     Click a district node →
                soundManager.play('stationBell')
                fadeOut(420ms) →
                TrainTransitionScene (2.5s cinematic) →
                fadeOut(420ms) →
                Destination district scene
6. District   Player walks (WASD), interacts with NPCs (E),
              opens trading terminal at the trading building
7. Trade      Order ticket → behaviorTracker.checkPreTrade()
              → if bias detected: BiasToast → optional cancel
              → portfolio.buy/sell → TaxLedger.addLot
8. Reflect    Bias profile (I), Trader score chip, Daily mission chip
              update on every transaction
9. Repeat     Press M to teleport back to world map,
              walk to another district, learn a different lesson
```

---

## 6. Component walkthrough

### 6.1 Procedural sprites — `entities/Player.ts` & `entities/NPC.ts`

No spritesheets. Every character is a **32×32 RenderTexture** drawn at scene
load by `NPC.generateTexture()` and `Player.generateTexture()`. Each archetype
has a palette object:

```ts
// src/entities/NPC.ts:27
const PALETTES: Record<NpcArchetype, NpcPalette> = {
  scammer_gold:    { skin:'#E3B189', hair:'#1F1A15',
                     shirt:'#C42030', pants:'#1F1F1F',
                     accent:'#F4C542' /* gold chain */ },
  mentor:          { skin:'#E8C8A3', hair:'#C8C8C8' /* grey */,
                     shirt:'#2E4E7B', accent:'#F4C542' /* tie */ },
  // … 7 archetypes
};
```

The texture is generated once per archetype and cached in
`scene.textures` with key `npc_<archetype>`. Subsequent NPCs reuse it for free.

Each `NPC` extends `Phaser.Physics.Arcade.Sprite` and carries a `dialogueId`
that the player's E-key triggers. Idle bobbing tween adds life:

```ts
// src/entities/NPC.ts:72
scene.tweens.add({
  targets: this, y: y - 2,
  duration: 1200 + Math.random() * 400,
  yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
});
```

`Player.ts` adds 4-frame walk animations procedurally (left foot / right foot
swap) plus a head-turn for direction.

### 6.2 District decor — `scenes/utils/DistrictDecor.ts`

A reusable kit so every district can scatter trees / lamps / benches /
fountains / bridges with a single call. All draws are procedural Phaser
Graphics — no PNGs. Each helper is **30–50 lines, pure side-effect-free**
except for the tween subscriptions that animate halos and water.

| Helper | Output | Animation |
|---|---|---|
| `drawStreetLamp(x,y)` | Wrought-iron post + lantern + bulb + warm halo | Halo pulses 1.5s yoyo |
| `drawTree(x,y,scale)` | Trunk + 3-circle canopy + cast shadow | Static |
| `drawBench(x,y,vertical)` | Wooden bench (H or V) with plank seams | Static |
| `drawBridge(cx,cy,w,h)` | Water + planks + handrails + posts | Static |
| `drawPlanter(x,y)` | Pot + soil + foliage + 4 random flowers | Static |
| `drawSignpost(x,y,text)` | Wooden post + sign panel + bolts + text | Static |
| `drawFountain(x,y,color)` | Stone basin + water + jet + ripple | Jet 1.3s yoyo, ripple 1.8s |

The convenience function `addCommonDecor(scene, positions)` accepts arrays of
coordinates per category, so each district scene's setup reads like a
declarative scene-graph:

```ts
// scenes/QuantQuarterScene.ts
addCommonDecor(this, {
  lamps:    [[200, 380], [620, 380]],
  trees:    [[160, 260, 1.0], [720, 940, 0.9]],
  benches:  [[260, 720, false]],
  planters: [[420, 540], [560, 540]],
  fountains:[[480, 480, 0x14B8A6 /* teal */]],
  signs:    [[300, 720, 'LAB'], [540, 720, 'BACKTEST']],
});
```

### 6.3 `SoundManager.ts` — Web Audio synthesis

Zero audio files. A single `AudioContext` is lazily created on first
user gesture (browser autoplay policy compliance, lines 237–243), then every
SFX is a tiny composition of:

- `beep({ freq, duration, type, attack, release, volume, slideTo })` — one
  oscillator with an ADSR envelope
- `noise(duration, volume)` — bandpass-filtered white noise burst

Eighteen named SFX exist; the new ones added for the metaverse iteration are:

```ts
// src/systems/SoundManager.ts:199
case 'trainHorn':
  this.beep({ freq: 165, duration: 0.55, type: 'sawtooth', volume: 0.22 });
  this.beep({ freq: 220, duration: 0.55, type: 'sawtooth', volume: 0.18 });
  this.beep({ freq: 330, duration: 0.55, type: 'sawtooth', volume: 0.10 });
  this.noise(0.35, 0.06);                    // steam puff
  break;
case 'stationBell':                           // descending major-third ding-dong
  this.beep({ freq: 988, duration: 0.6, type: 'sine', volume: 0.18 });
  this.beep({ freq: 784, duration: 0.7, type: 'sine', volume: 0.18,
              delay: 0.35 });
  break;
case 'trainBrake':                            // squealing slide 1.8k → 600 Hz
  this.beep({ freq: 1800, slideTo: 600, duration: 0.6, type: 'sine' });
  this.noise(0.5, 0.05);
  break;
```

Volume / mute is persisted via `localStorage[finsim.sound.muted]`. A master
gain node lets us mute everything in one place without disposing oscillators.

### 6.4 `WorldMapScene.ts` — Central Plaza station

The hub map is intentionally **not** a UI screen but a top-down park: grass,
paved paths, fountain, lamps, planters, "CENTRAL PLAZA" wooden signpost,
ambient station bell + announcement chime when the player arrives:

```ts
// scenes/WorldMapScene.ts (excerpt)
this.time.delayedCall(450,  () => soundManager.play('stationBell'));
this.time.delayedCall(1200, () => soundManager.play('stationAnnounce'));
```

District nodes are hit-zones with hover halos. Click flow (after the metaverse
iteration):

```ts
hitZone.on('pointerdown', () => {
  soundManager.play('click');
  soundManager.play('stationBell');
  this.cameras.main.fadeOut(420, 5, 8, 15);
  this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.start('TrainTransitionScene', {
      destination: node.key,
      label:       node.label,
      color:       node.color,
    });
  });
});
```

All districts are **unlocked** by default. The previous gating (visit ScamSlum
first) was removed per design — players should be free to roam. Unlock flags
are still persisted for any code that asks `portfolio.hasFlag(...)`:

```ts
nodes.forEach(n => { if (n.unlockFlag) portfolio.setFlag(n.unlockFlag); });
```

### 6.5 `TrainTransitionScene.ts` — cinematic travel

A 304-line stand-alone Phaser scene that hands off to the destination scene
when complete. **Not a modal** — having it as a real scene means it gets the
full camera, tween, and time engines.

Layout (drawn procedurally, all in one create() pass):

| Layer | Depth | Content |
|---|---:|---|
| `sky` | 0 | `fillGradientStyle` night sky |
| `skyline` | 0 | 5–9 random building silhouettes with random window dots |
| `stars` | 0 | 80 random dots, twinkling tween (0.4 → 0.9 alpha) |
| `ground` | 1 | Floor + sleepers (railroad ties) + two rails + ballast |
| `lampLayer` | 2 | Distant parallax lamp posts every 180px |
| `train` (container) | 40 | Locomotive + 2 carriages; tweened across screen |
| `banner` | 50 | "🚂 NOW DEPARTING → DESTINATION" pulsing label |
| `smoke puffs` | 45 | Spawned every 140ms, drift up + fade |

The locomotive is a single `Graphics` containing boiler, smokestack, cabin,
cowcatcher, headlight cone, and three wheels with spokes. Each wheel uses a
small helper:

```ts
const wheelStyle = (g, cx, cy, r) => {
  g.fillStyle(0x0E1A2A, 1); g.fillCircle(cx, cy, r);
  g.fillStyle(0x4A6B8A, 1); g.fillCircle(cx, cy, r - 3);
  g.fillStyle(0x0E1A2A, 1); g.fillCircle(cx, cy, 3);
  g.lineStyle(2, 0x0E1A2A, 1);
  g.lineBetween(cx, cy - r + 3, cx, cy + r - 3);   // spoke ↕
  g.lineBetween(cx - r + 3, cy, cx + r - 3, cy);   // spoke ↔
};
```

Two carriages (red `0xC44536`, teal `0x1A6B5F`) follow with windows lit warm
yellow (`0xFFEFA0`) at 0.85 alpha — they glow at night.

**Sound choreography** (lines 250–262):

```
t=0      stationBell           (ding-dong)
t=450ms  trainHorn             (the wail)
t=0…2.4s trainChug every 220ms (rhythmic chug-chug)
t=900ms  cameras.shake(900, 0.0035)
t=1700ms trainBrake            (squealing slide)
t=2200ms trainHorn             (final goodbye horn)
t=2500ms fadeOut(420ms) → scene.start(destination)
```

ESC and pointer-down both skip cleanly — they cancel timers and trigger the
same fade-out before starting the destination, so the audio never gets stuck.

### 6.6 The six districts

| Scene | Theme | Lessons | Iconic NPC | New ambient NPC (this iteration) |
|---|---|---|---|---|
| **ScamSlumScene** | Smoky alley + Mom on phone | Spotting fraud (gold chain, MLM, pre-IPO) | Mr. Goldie | **Newspaper Boy** (`boring_compounds` lesson) |
| **WallStreetScene** | NYSE columns + bull statue | US equities, shorts | Wall St mentor | **NYC Cabbie** (`survival_first`) |
| **DalalStreetScene** | BSE building + chai stalls | Indian markets, ₹ | NSE/BSE guide | **Ramesh the Chaiwala** (`sentiment_signal`) |
| **CryptoCoveScene** | Boardwalk + DEX | DeFi, AMM, rug pulls, self-custody | Surfer Sam | **Surfer Sam** (`self_custody`) |
| **QuantQuarterScene** | Backtest lab + servers | Out-of-sample, overfitting | AlgoBot | **Priya the Intern** (`out_of_sample`) |
| **VegasViceScene** | Casino strip neon | Expected value, Kelly criterion | Pit Boss | **The Amazing Vinod** (`expected_value_framing`) |

Every district scene now also calls `addCommonDecor(this, …)` to scatter the
shared decor kit. The same call pattern in 6 scenes produces 6 unique-feeling
spaces because the **positions** and **colors** differ:

- Crypto Cove uses `0x6B46C1` (purple) fountain water
- Quant Quarter uses `0x14B8A6` (teal)
- Wall Street uses `0x1F3A5F` (deep blue)
- Dalal Street uses `0xF4A84B` (saffron orange)
- Vegas Vice uses `0xC44536` (deep red)

### 6.7 Dialogue system + 34 dialogue trees

`systems/DialogueSystem.ts` is a stack-based interpreter for trees defined in
`data/dialogues.ts`. A tree looks like:

```ts
export const wallStreetCabbie: DialogueTree = {
  id: 'wallstreet_cabbie',
  start: 'c1',
  nodes: {
    c1: { speaker: 'NYC Cabbie',
          text: 'Buddy, I see hedge guys come and go for 30 years…',
          choices: [
            { text: 'What kills them?',  next: 'c2' },
            { text: 'I gotta run',       next: 'end' },
          ]},
    c2: { speaker: 'NYC Cabbie',
          text: '…they all forget rule one. Stay alive long enough '
              + 'for the math to work.',
          flags: ['lesson.survival_first'] },
  },
};
```

A node can have `text`, `choices`, `next`, `flags`, `effect` (start a quest, +
cash, etc.). Choices are click-to-advance. Lesson flags are surfaced in the
Learn Hub and feed the trader-score's "lessons learned" component.

Total counts after this iteration:

- 34 dialogue trees in `allDialogues` registry
- 6 of those new this iteration: chaiwala, cabbie, surfer, intern, magician,
  newspaper kid

### 6.8 `MarketEngine.ts` + `MarketAPI.ts`

```
                ┌────────────── live ──────────────┐
                │                                  │
   Yahoo (US)  ── fetchLiveBatch ──┐               │  every 120 s
   Yahoo (.NS) ── fetchLiveBatch ──┤               │
   CoinGecko   ── fetchCoinGeckoTop┤               │
                                   ▼               │
   MarketEngine.refreshLive()  →  patches stocks   │
                                   │               │
                                   ▼               │
   tick every 2 s    (GBM step on every stock)     │
                                   │               │
                                   ▼               │
   closeCandle every 60 s   (start a new OHLC bar) │
                                   │               │
                                   ▼               │
                              listeners ───────────┘
                              (charts + tickers + portfolio)
```

The GBM step lives in `lib/math.ts`:

```ts
export function gbmStep(price, drift, vol, dtSec) {
  const z = boxMuller();
  const dt = dtSec / 31_536_000; // → years
  return price * Math.exp((drift - vol*vol/2)*dt + vol*Math.sqrt(dt)*z);
}
```

This means even when the player is offline (no network), simulation runs
forever. Live data is best-effort; on any network failure the engine logs
`[Market] Live refresh failed, staying simulated`.

### 6.9 `PortfolioSystem.ts` — FIFO lots + R-multiples

Every buy:

1. Debits cash
2. Updates the average cost on the holding
3. **Adds a tax lot** (`taxLedger.addLot(symbol, qty, price)`) so future sells
   resolve FIFO short-term vs long-term capital gains
4. Optionally sets a stop-price + target-price
5. Emits a `Transaction` to subscribers

Every sell:

1. Validates quantity
2. Computes `pnl = proceeds − costBasis`
3. **Computes R-multiple** via `lib/risk.ts` if a stop was set:
   `R = (sell - entry) / (entry - stop)` for longs
4. Persists `rOutcomes` (last 500) — these power the
   `expectancyFromRs` calculation shown in the Trader Score
5. Calls `taxLedger.sell()` to FIFO-match lots and emit STCG/LTCG
6. Emits the closing transaction

`PortfolioSystem` is wrapped at startup in `main.ts` to enforce **Hard Mode**:
when the player has had 3 losses in a row, `hardMode.isLocked()` returns true
and `buy()` is short-circuited with a cool-off message.

### 6.10 `BehaviorTracker.ts` — seven bias detectors

Every order ticket calls `behaviorTracker.checkPreTrade(ctx)` before the
trade is executed. The function tries each detector in order; the first
non-null result becomes a `BiasDetection` toast + intervention event.

| Detector | Trigger condition | Severity logic |
|---|---|---|
| **FOMO** | Buying after a >5% pump in last 10 candles | high if >10% else medium |
| **Revenge** | Buy after ≥3 consecutive losses, with size ≥1.5× recent avg | high |
| **Overconfidence** | Buy after ≥4 consecutive wins, size ≥2× recent avg | medium |
| **Naked-trade** | Buy without a stop-price | high |
| **News-roulette** | Inside a ±30 min window of an econ-calendar event | high |
| **Tweet-trade** | `sources` includes twitter/telegram/whatsapp **or** `social_scroll` event in last 5 min | medium |
| **Concentration** | Already hold ≥3 same-sector stocks | medium |

Every bias detection is logged via `log('bias_detected', { type, severity })`
and emitted to `interventionHandlers` so:

- `BiasToast` appears in 50ms
- `BiasProfile` increments its counters
- (optional) `MiraCoach` calls the LLM for a personalised line

### 6.11 `BiasProfile.ts` — personalised analytics

Aggregates the raw event log into a snapshot the player can inspect by
pressing **I**:

```
{
  totalTriggers: 27,
  topBias:        { type: 'fomo', label: 'FOMO Buying', count: 12 },
  fomoPercentile: 78,                           // top 22% for FOMO 😬
  patienceScore:  18,                           // 5 = impulsive, 95 = monk
  dispositionRatio: 1.42,                       // > 1 = cuts winners early
  avgHoldingMinutes: 6,
  insights: [
    "Your most frequent bias is FOMO Buying. Set a 60-second cooling-off rule…",
    "Disposition ratio 1.42 — you cut winners too early and ride losers.",
    "Median hold 6 min — too short. Long-term wealth lives in 6+ hour holds.",
  ],
}
```

`fomoPercentile` is normalised against an 18% baseline rate (typical retail).
`patienceScore` maps 0 min → 5, 240 min → 95. `dispositionRatio` is the ratio
of average-loss-magnitude to average-win-magnitude (>1 means the disposition
effect is hurting you).

### 6.12 `MiraCoach.ts` — LLM-in-the-loop

When a bias fires *and* the user is signed in, the toast can be enriched by a
**Gemini-backed Cloud Function** (`functions/`).

Resilience strategy (see file header comment):

1. **Auth gate** — only call the function when signed in (else use canned copy)
2. **Same-bucket hash** as the server, so equivalent triggers reuse the cache
3. **Hard 4-second timeout** — beyond that the canned copy is faster than the LLM
4. **Graceful fallback** — any error returns null so callers fall through

Hash buckets quantise win-rate to nearest 10%, FOMO percentile to 20%,
trader tier to category — a player retains their personalised feel without
generating a unique LLM call per trade.

### 6.13 `TraderScore`, `DailyMissions`, `HardMode`

- **TraderScore** — weighted score from win rate, expectancy (R-multiple),
  bias-trigger count, and lessons learned. Buckets into Bronze / Silver / Gold.
- **DailyMissions** — local rotating mission like *"Make 3 trades today
  without triggering a FOMO alert"* or *"Place a stop on every buy"*. Wired via
  `portfolio.subscribe()` in `main.ts`.
- **HardMode** — toggleable by HUD button; locks `portfolio.buy` for 60 s
  after 3 consecutive losses, forcing the player to journal. Implemented by
  monkey-patching `portfolio.buy` at boot:

  ```ts
  const buyOrig = portfolio.buy.bind(portfolio);
  portfolio.buy = (sym, qty, district, opts) => {
    if (hardMode.isLocked())
      return { ok: false,
               error: `Hard Mode cool-off: ${secs}s remaining…` };
    return buyOrig(sym, qty, district, opts);
  };
  ```

### 6.14 Echo Mode — 14 historical replays

`data/echoScenarios.ts` defines 14 anonymised real trades. The player sees:

- A **hidden title** ("Currency Crisis")
- A context paragraph with the situation but no names
- 4–8 fake headlines from that era
- A price chart built by interpolating real anchor points + 2% noise
- 3–4 actions to choose from

After they pick an action, the modal **reveals**:

- The real title ("Soros Breaks the Bank of England — Sept 1992")
- The reveal context, the hero's actual outcome, and the lesson

Sample scenarios: Soros 1992 GBP, GameStop 2021, FTX 2022, Madoff, LTCM,
Ackman/Herbalife, Bitcoin 2017 top, Tesla short squeeze, Burry 2008, etc.

### 6.15 UI overlays

All DOM, all responsive. Highlights:

- **TradingTerminal.ts (`R` to open)** — order ticket. On submit:
  ```
  bias = behaviorTracker.checkPreTrade(ctx)
  if bias → BiasToast(bias) → optional cancel → portfolio.buy(...)
  else → portfolio.buy(...)
  ```
- **ProTerminal.ts** — Bloomberg-flavored chart panel with sparkline,
  candles, depth ladder, options chain stub. Animated only, computes from
  `marketEngine` data.
- **LearnHub.ts (`L`)** — lesson cards keyed off the `lesson.*` flags
  collected from dialogues. Each completed lesson glows.
- **OnboardingOverlay.ts** — first-run avatar + name picker. Persists via
  `userProfile.setOnboarded()`.
- **TourOverlay.ts (`T`)** — guided tour that starts a real scene transition
  using the `portal` SFX.
- **BiasProfileModal.ts (`I`)** — renders the snapshot from `BiasProfile`.
- **CoachOverlay.ts** — Mira chat panel for free-text coaching.

### 6.16 Persistence

- **`localStorage`** — single source of truth. Keys:
  - `finsim.portfolio.v1` (cash + holdings + transactions + flags + R outcomes)
  - `finsim.behavior.v1` (last 500 events)
  - `finsim.userprofile.v1`
  - `finsim.sound.muted`
  - `finsim.dailymission.v1`
  - `finsim.hardmode.v1`
- **Firebase (optional)** — when signed in:
  - Auth via Google sign-in (`FirebaseAuth.ts`)
  - Firestore mirrors `portfolio` doc per uid (`PortfolioSystem.save()`
    debounces 1.5s)
  - Firestore feeds the global leaderboard
  - Cloud Function `miraCoach` (Gemini) for LLM coaching

A signed-in user reloading on a different device gets their portfolio rehydrated:

```ts
firebaseAuth.subscribe(auth => {
  if (auth.status === 'signed-in') {
    firebaseAuth.load<PortfolioState>('portfolio').then(remote => {
      if (remote && remote.transactions.length > this.state.transactions.length)
        this.state = { ...this.defaultState(), ...remote };
    });
  }
});
```

The "remote-newer-than-local" check prevents overwriting a longer local
session with stale cloud data.

---

## 7. Verified outputs

End-to-end smoke tested in the live preview server during the metaverse iteration:

| Behaviour | Verification |
|---|---|
| Landing page responsive at 375 / 768 / 1024 / 1280 / 1440 | Inspected per breakpoint; no horizontal overflow at 375 |
| All 6 districts unlocked, no gating | `WorldMapScene.create()` sets every node's `locked: false` |
| Click a district node → station bell + fade-out + train scene | `stationBell` plays on `pointerdown`, fade-out 420ms, scene starts `TrainTransitionScene` |
| Train scene plays full 2.5s cinematic with 5 SFX | `stationBell @ 0`, `horn @ 450`, `chug every 220ms`, `brake @ 1700`, `horn @ 2200` |
| Train scene auto-hands-off to destination | `delayedCall(2500)` → `fadeOut(420)` → `scene.start(destination)` |
| Train transition skippable with ESC + click | Verified handlers cancel timers and run the same fade-out |
| Wall Street loaded with NYC Cabbie + decor | Screenshot: lamps, trees, "Hub" signpost, NYC Cabbie sprite + label |
| Dalal Street loaded with decor | Screenshot: trees, lamps, planter, "Exit Dalal Street" signpost |
| Crypto Cove loaded with decor | Screenshot: palm-style trees, lamps, planter, exit signpost |
| Quant Quarter loaded with fountain + decor | Screenshot: animated teal fountain, lamps, AlgoBot, exit signpost |
| Vegas Vice loaded with Lucky Larry + decor | Screenshot: red fountain, lamps, planter, "Lucky Larry" NPC |
| Sound choreography correct | Audio listened to during transitions |
| No console errors during full flow | `preview_console_logs(level: error)` returned empty |
| No server / build errors | `preview_logs(level: error)` returned empty |
| `goTo()` dev helper works | `window.finsim.goTo('WorldMapScene')` returned `started` |

---

## 8. Educational outcomes

What a player who completes the FinSim metaverse should walk away with:

| Learning goal | Mechanism that teaches it |
|---|---|
| Recognise pump-and-dump in your own behaviour | FOMO detector + screenshot of your own bias profile |
| Always set a stop *before* you buy | Naked-trade detector blocks naked buys with a high-severity toast |
| Position-sizing matters more than entry timing | Revenge + Overconfidence detectors track sizing relative to recent avg |
| Diversify across sectors, not within | Concentration detector after 3 same-sector buys |
| News-windows are house-edge | News-roulette detector inside ±30 min |
| The tip is free because you are the exit | Tweet-trade detector after social-scroll events |
| Disposition effect is invisible until measured | Bias profile's `dispositionRatio` insight |
| FIFO tax accounting is real money | TaxLedger STCG/LTCG breakdown on every sell |
| Survivor stories ≠ replicable strategy | Echo Mode reveals after every blind decision |
| Markets are stories, not lines | NPC dialogue in every district |
| Compounding only works if you survive | Hard Mode + cabbie's "rule one" lesson |

The fundamental design move is:

> **Every visual / audio / mechanical cue in FinSim is in service of a
> behavioural lesson.** Trees aren't there because parks have trees — they're
> there so the world feels real enough to make the scammer's pitch feel real.
> The train horn isn't there because trains have horns — it's there because
> the player needs a *moment of anticipation* before they decide whether
> they're really ready to walk into Vegas Vice.

---

## 9. File-by-file index

| Path | LOC | Purpose |
|---|---:|---|
| `src/main.ts` | 331 | DI root, wires Phaser + DOM, dev console helpers |
| `src/scenes/BootScene.ts` | – | "Initializing…" splash |
| `src/scenes/MenuScene.ts` | – | Title screen |
| `src/scenes/WorldMapScene.ts` | 713 | Central Plaza station hub |
| `src/scenes/TrainTransitionScene.ts` | **304** | Cinematic travel (NEW) |
| `src/scenes/ScamSlumScene.ts` | – | Mom call + scammer trio |
| `src/scenes/WallStreetScene.ts` | 350 | NYSE district |
| `src/scenes/DalalStreetScene.ts` | – | BSE/NSE district |
| `src/scenes/CryptoCoveScene.ts` | – | Crypto boardwalk |
| `src/scenes/QuantQuarterScene.ts` | – | Backtest lab |
| `src/scenes/VegasViceScene.ts` | 388 | Casino strip |
| `src/scenes/utils/DistrictDecor.ts` | **330** | Shared decor kit (NEW) |
| `src/systems/SoundManager.ts` | 243 | Web-audio synth (5 new SFX) |
| `src/systems/MarketEngine.ts` | 150 | GBM ticks + live refresh |
| `src/systems/MarketAPI.ts` | 166 | Yahoo + CoinGecko fetchers |
| `src/systems/RealDataProvider.ts` | 216 | Backup quote provider |
| `src/systems/PortfolioSystem.ts` | 218 | FIFO + stops + R-multiples |
| `src/systems/TaxLedger.ts` | 77 | STCG/LTCG FIFO matcher |
| `src/systems/TradeJournal.ts` | 81 | Per-trade reflection prompts |
| `src/systems/BehaviorTracker.ts` | 218 | 7 bias detectors |
| `src/systems/BiasProfile.ts` | 148 | Aggregated personal profile |
| `src/systems/TraderScore.ts` | 172 | Score + tier |
| `src/systems/DailyMissions.ts` | 156 | Daily challenges |
| `src/systems/HardMode.ts` | 106 | Cool-off after 3 losses |
| `src/systems/MiraCoach.ts` | 170 | LLM coach client (Gemini) |
| `src/systems/WeatherSystem.ts` | 176 | DOM rain / glow |
| `src/systems/UserProfile.ts` | 85 | Onboarding + avatar |
| `src/systems/Leaderboard.ts` | 317 | Local + Firestore |
| `src/systems/FirebaseAuth.ts` | 116 | Google sign-in |
| `src/data/stocks.ts` | 80 | Wall St + Dalal seeds |
| `src/data/dialogues.ts` | 1207 | 34 dialogue trees |
| `src/data/echoScenarios.ts` | 460 | 14 historical replays |
| `src/data/econCalendar.ts` | 65 | News-Roulette window data |
| `src/data/newsSources.ts` | 37 | Headlines per district |
| `src/data/personalFinance.ts` | 81 | Tax/retirement helpers |
| `src/data/blockchain.ts` | 174 | Crypto AMM data |
| `src/data/macro.ts` | 72 | Macro regimes |
| `src/entities/Player.ts` | 295 | WASD + procedural sprite |
| `src/entities/NPC.ts` | 488 | Archetypes + sprites + dialogue id |
| `src/entities/Building.ts` | 1093 | Procedural shopfronts |
| `src/ui/TradingTerminal.ts` | 342 | Order ticket + bias check |
| `src/ui/ProTerminal.ts` | 499 | Pro chart panel |
| `src/ui/HUDManager.ts` | 101 | Top bar |
| `src/ui/HudV2Widgets.ts` | 138 | Score + mission chips |
| `src/ui/HudMenu.ts` | 54 | Three-dot dropdown |
| `src/ui/BiasProfileModal.ts` | 170 | Personal profile dashboard |
| `src/ui/LearnHub.ts` | 280 | Lesson library |
| `src/ui/CoachOverlay.ts` | 164 | Mira chat panel |
| `src/ui/OnboardingOverlay.ts` | 175 | First-run setup |
| `src/ui/TourOverlay.ts` | 246 | Guided tour |
| `src/ui/MapHints.ts` | 160 | Map tooltips |
| `src/ui/LeaderboardOverlay.ts` | 151 | Global rank display |
| `src/ui/AuthBar.ts` | 53 | Sign-in chip |
| `src/ui/Modals.ts` | 317 | Portfolio/Help/Echo/BiasToast factories |
| `src/ui/landing.css` | 1205+ | Responsive landing (clamp + breakpoints) |
| `src/ui/styles.css` | – | Shared styles |
| `functions/` | – | Firebase Cloud Functions (miraCoach + Gemini) |

---

*Documentation reflects code state at 2026-04-28. Total source: ~14,300 lines
of TypeScript across 50+ files.*
