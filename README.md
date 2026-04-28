# FinSim — The Financial Metaverse

A 2D open-world RPG where you learn finance by living it. Built with Phaser 3, TypeScript, and Vite.

## What's in this alpha

- **Two playable districts:** Scam Slum (starting area) and Wall Street
- **Three working scammer NPCs** with full branching dialogue trees — learn to spot MLMs, "double your money" cons, and fake pre-IPO allocations
- **Live-simulated markets** using Geometric Brownian Motion — 20 stocks across US (Apple, Tesla, NVIDIA, etc.) and India (Reliance, TCS, HDFC Bank, etc.)
- **Full candlestick trading terminal** with buy/sell, real-time price updates, portfolio tracking, P&L
- **Behavioral Bias Coach** that detects FOMO, revenge trading, and overconfidence in real time and intervenes before you make the mistake
- **Echo Mode** — 5 historical scenarios (Soros 1992, Harshad Mehta 1992, Michael Burry 2005, Buffett Coca-Cola 1988, FTX 2022) where you make decisions blind, then the game reveals whose footsteps you walked in
- **Procedurally generated pixel art** — no art assets needed, everything is drawn in code
- **Full persistence** via localStorage — your progress survives refresh
- **Responsive UI** — works on desktop and mobile browsers

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and you're in the game.

## Firebase setup (Google sign-in + cloud save)

Firebase SDK integration is already wired in `src/systems/FirebaseAuth.ts` and `src/systems/PortfolioSystem.ts`.

1. Create your Firebase project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication -> Sign-in method -> Google**.
3. Create a **Firestore Database** (start in test mode for local development).
4. Add a **Web app** in Project settings and copy config values.
5. Copy `.env.example` to `.env` and fill:

```bash
cp .env.example .env
```

Required keys:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Then restart the dev server (`npm run dev`).

If keys are missing, FinSim falls back to offline/local mode automatically.

## Controls

- **WASD** or **Arrow keys** — Move
- **E** or **Space** — Interact with nearby NPC/building
- **P** — Open portfolio
- **Esc** — Close any modal

## What to try

1. **Watch the intro.** Your mom lost ₹2,00,000 to a WhatsApp scam. You have ₹10,000.
2. **Meet the scammers.** Walk around Scam Slum. There are three of them. Talk to each. Ask questions. Notice the red flags.
3. **Ride the train.** Go to the train station (east side). Choose Wall Street.
4. **Meet Warren-bot.** He's standing in front of the NYSE. Talk to him.
5. **Enter the brokerage.** Walk up to the big blue building and press E.
6. **Buy something.** Pick a stock. Buy 10 shares. Watch the chart.
7. **Try to trigger the bias coach.** Buy a stock that just pumped 5%+ in the last 10 minutes — FOMO alert fires.
8. **Try Echo Mode.** There's a purple "Time Machine" building in both districts. Make a blind decision on a historical trade. See whose footsteps you walked in.
9. **Check your portfolio.** Click the "Portfolio" button top-right or press P.

## Project structure

```
finsim/
├── src/
│   ├── main.ts                  # Entry — wires Phaser + DOM UI
│   ├── config/constants.ts      # All magic numbers live here
│   ├── types/index.ts           # Shared TypeScript types
│   ├── lib/math.ts              # GBM, Sharpe, Kelly, AMM, RSI, SMA
│   ├── systems/
│   │   ├── MarketEngine.ts      # Live price simulation + subscribe API
│   │   ├── PortfolioSystem.ts   # Cash, holdings, transactions (localStorage)
│   │   ├── BehaviorTracker.ts   # Cognitive bias detection + interventions
│   │   └── DialogueSystem.ts    # NPC conversations with branching
│   ├── data/
│   │   ├── stocks.ts            # Stock universe (US + India)
│   │   ├── dialogues.ts         # Scammer scripts, Warren-bot, etc.
│   │   └── echoScenarios.ts     # 5 seeded historical trades
│   ├── entities/
│   │   ├── Player.ts            # Top-down character w/ procedural sprite
│   │   ├── NPC.ts               # Archetype-based NPCs
│   │   └── Building.ts          # 7 building types, all drawn in code
│   ├── scenes/
│   │   ├── BootScene.ts         # Loading + texture generation
│   │   ├── ScamSlumScene.ts     # Starting district
│   │   └── WallStreetScene.ts   # Wall Street + Dalal Street (same scene, diff market)
│   └── ui/
│       ├── styles.css
│       ├── HUDManager.ts        # Top bar (cash, portfolio, district)
│       ├── TradingTerminal.ts   # Full trading modal w/ candlesticks
│       └── Modals.ts            # Portfolio, Bias Toast, Help, Echo Mode
├── index.html                   # Shell + all DOM overlays
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Dev console

Open devtools console, type `finsim.` and see the exposed API:

```js
finsim.portfolio.getCash()       // Current cash
finsim.portfolio.reset()         // Clear portfolio
finsim.behavior.getEvents()      // All logged player actions
finsim.openEcho()                // Force open Echo Mode
finsim.openTerminal()            // Force open trading terminal
finsim.reset()                   // Nuke localStorage + reload (new game)
```

## What to build next (in this order)

### 1. More Echo scenarios (fastest win)
Add to `src/data/echoScenarios.ts`. The schema is in `src/types/index.ts`. Each scenario takes about 15 min to write. Target 20 total for a real library.

### 2. Dalal Street as its own scene
Currently Dalal Street shares the Wall Street scene with a different `market` prop. Promote it to its own scene with BSE-themed visuals and a full Harshad Mehta boss fight.

### 3. Crypto Cove
New scene, neon palette. Build a DEX interface using the `ammSwap()` function already in `lib/math.ts`. Hide one rug pull token.

### 4. Real API data
Currently using GBM simulation. Swap `MarketEngine.tick()` with an Alpha Vantage / CoinGecko fetch. Cache in Supabase edge function to share across users.

### 5. AI mentor (Warren-bot dynamic dialogue)
Replace the hardcoded dialogue tree with a Claude API call. System prompt: "You are Warren Buffett. Answer this beginner's question in 2-3 sentences."

### 6. Multiplayer
Add Supabase auth + realtime. Global leaderboard by portfolio value.

### 7. Mobile touch controls
Add a virtual joystick (bottom-left) and tap-to-interact for mobile.

### 8. Real art
Current sprites are procedural. Commission pixel art from Fiverr (~$500) or use Kenney.nl asset packs to replace Player/NPC/Building draw methods.

## How the bias detector works

Every trade runs through `BehaviorTracker.checkPreTradeBias()` before execution:

- **FOMO** — Flags if the stock pumped more than 5% in the last 10 candles and you're buying
- **Revenge Trading** — Flags if you've had 2+ consecutive losses and you're now sizing up 1.5x+ from your average
- **Overconfidence** — Flags if you've had 3+ wins and you're doubling your usual size

If triggered, the trade is paused and the Bias Toast appears. You can proceed or take a break. Either way, the decision is logged to `behavior_events` for later ML training.

## How Echo Mode works

Open the purple Time Machine building. The game picks a random scenario from `echoScenarios.ts`, shows you a chart, news headlines, and four actions — stripped of identifying details. You pick one. The game then reveals which real trader/fraudster you matched and the outcome.

The file to expand: `src/data/echoScenarios.ts`. Each scenario has:
- `contextHidden` / `contextRevealed` — before/after identity
- `chartData` — price series (use `priceSeries()` helper)
- `actions` — 4 choices, each with its own outcome description
- `correctActionId` — the winning move
- `heroName`, `heroOutcome`, `lesson` — the reveal content
- `isFraud` — if true, the reveal shows in red

## Mira AI Coach (Gemini-powered, optional)

Mira replaces the canned bias-detection messages with personalized 1–2 sentence coaching pulled from a Cloud Function that calls Gemini 2.5 Flash. It's served by `functions/src/index.ts` (Firebase Functions v2) and consumed client-side by `src/systems/MiraCoach.ts`.

When the user is signed in and the function is reachable, the coach toast initially shows the canned `LESSONS` body (instant), then swaps to the Gemini response with a "Mira AI" chip the moment it arrives. If the call times out (4s) or the user is offline, the canned copy stays — gameplay never blocks on the LLM.

**Cost protection (4 layers):**
1. Auth gate — only signed-in users hit the function.
2. Per-UID rate limit (30 calls/min) on the function side.
3. SHA-256 cache on bucketized inputs — repeat triggers from the same player are free for 1h server-side and 30min client-side.
4. 240-char hard cap on output (≈ 60 tokens).

**Setup:**

```bash
# 1. Install function deps
cd functions && npm install && cd ..

# 2. Set the Gemini key (one time)
firebase functions:secrets:set GEMINI_API_KEY
# paste a key from https://aistudio.google.com/apikey

# 3. Deploy
firebase deploy --only functions
```

**Local development with the emulator:**

```bash
cd functions && npm run serve   # boots functions emulator on :5001
# In a second shell:
echo "VITE_FUNCTIONS_EMULATOR=true" >> .env
npm run dev
```

The free Gemini tier covers thousands of coach calls per day. To monitor usage: Cloud Console → Functions → `miraCoach` → Logs.

## Known limitations of this alpha

- No real API data yet — all prices are simulated client-side via GBM
- No multiplayer yet — authentication is Google/Firebase only
- Art is procedural — functional but not pretty
- Only 2 districts playable — Dalal Street routes through Wall Street scene
- Mobile controls are keyboard-only — needs virtual joystick
- No sound yet — add `Phaser.Sound` when you have audio assets

## Credits / inspiration

Built from the `FinSim_Ideation_Blueprint.docx` with design influence from Stardew Valley (movement feel), Bloomberg Terminal (chart density), and The Big Short (Echo Mode narrative structure).

## License

MIT License
Copyright (c) 2026 Charanjot Singh
