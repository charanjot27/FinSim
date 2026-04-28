import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants';
import { MenuScene } from '@/scenes/MenuScene';
import { BootScene } from '@/scenes/BootScene';
import { ScamSlumScene } from '@/scenes/ScamSlumScene';
import { WallStreetScene } from '@/scenes/WallStreetScene';
import { DalalStreetScene } from '@/scenes/DalalStreetScene';
import { CryptoCoveScene } from '@/scenes/CryptoCoveScene';
import { QuantQuarterScene } from '@/scenes/QuantQuarterScene';
import { VegasViceScene } from '@/scenes/VegasViceScene';
import { WorldMapScene } from '@/scenes/WorldMapScene';
import { TrainTransitionScene } from '@/scenes/TrainTransitionScene';
import { HUDManager } from '@/ui/HUDManager';
import { TradingTerminal } from '@/ui/TradingTerminal';
import { PortfolioModal, BiasToast, HelpModal, EchoModal } from '@/ui/Modals';
import { ProTerminal } from '@/ui/ProTerminal';
import { AuthBar } from '@/ui/AuthBar';
import { LearnHub } from '@/ui/LearnHub';
import { CoachOverlay } from '@/ui/CoachOverlay';
import { HudMenu } from '@/ui/HudMenu';
import { OnboardingOverlay } from '@/ui/OnboardingOverlay';
import { LeaderboardOverlay } from '@/ui/LeaderboardOverlay';
import { TourOverlay } from '@/ui/TourOverlay';
import { MapHints } from '@/ui/MapHints';
import { WeatherSystem } from '@/systems/WeatherSystem';
import { userProfile } from '@/systems/UserProfile';
import { behaviorTracker } from '@/systems/BehaviorTracker';
import { soundManager } from '@/systems/SoundManager';
import { leaderboard as leaderboardSystem } from '@/systems/Leaderboard';
import { firebaseAuth } from '@/systems/FirebaseAuth';
import { portfolio } from '@/systems/PortfolioSystem';
import { traderScore } from '@/systems/TraderScore';
import { dailyMissions } from '@/systems/DailyMissions';
import { hardMode } from '@/systems/HardMode';
import { BiasProfileModal } from '@/ui/BiasProfileModal';
import { HudV2Widgets } from '@/ui/HudV2Widgets';
import type { BiasDetection } from '@/types';

const portfolioModal = new PortfolioModal();
const helpModal = new HelpModal();
const echoModal = new EchoModal();
const biasToast = new BiasToast();
const proTerminal = new ProTerminal();
const authBar = new AuthBar();
const learnHub = new LearnHub();
const coachOverlay = new CoachOverlay();
const onboarding = new OnboardingOverlay();
const leaderboard = new LeaderboardOverlay();
const tour = new TourOverlay((sceneKey: string) => {
  const active = game!.scene.getScenes(true)[0];
  if (!active) return;
  if (active.scene.key === sceneKey) return;
  soundManager.play('portal');
  active.cameras.main.fadeOut(260, 14, 26, 42);
  active.cameras.main.once('camerafadeoutcomplete', () => {
    active.scene.start(sceneKey);
  });
});
const mapHints = new MapHints((sceneKey: string) => {
  const active = game!.scene.getScenes(true)[0];
  if (active) active.scene.start(sceneKey);
});

new WeatherSystem();

void coachOverlay;

const tradingTerminal = new TradingTerminal((bias: BiasDetection) => {
  biasToast.show(bias);
  behaviorTracker.triggerIntervention(bias);
});

document.getElementById('btn-pro')?.addEventListener('click', () => proTerminal.open());

document.getElementById('btn-learn')?.addEventListener('click', () => learnHub.toggle());

document.getElementById('btn-leaderboard')?.addEventListener('click', () => leaderboard.toggle());
document.getElementById('btn-map')?.addEventListener('click', () => mapHints.toggle());
document.getElementById('btn-tour')?.addEventListener('click', () => tour.start());
document.getElementById('btn-profile')?.addEventListener('click', () => onboarding.open(() => {}));

new HudMenu();

const biasProfileModal = new BiasProfileModal();
new HudV2Widgets(() => biasProfileModal.open());
document.getElementById('btn-bias-profile')?.addEventListener('click', () => biasProfileModal.toggle());

const hardModeBtn = document.getElementById('btn-hardmode');
const renderHardModeBtn = () => {
  if (!hardModeBtn) return;
  const on = hardMode.isEnabled();
  hardModeBtn.setAttribute('aria-checked', on ? 'true' : 'false');
  hardModeBtn.classList.toggle('is-on', on);
  const label = hardModeBtn.querySelector('.hud-menu-text em');
  if (label) label.textContent = on ? 'ON' : 'OFF';
};
renderHardModeBtn();
hardModeBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  hardMode.setEnabled(!hardMode.isEnabled());
  renderHardModeBtn();
});
hardMode.subscribe(renderHardModeBtn);

const buyOrig = portfolio.buy.bind(portfolio);
portfolio.buy = ((symbol: string, qty: number, district?: string, opts?: import('@/systems/PortfolioSystem').TradeOptions) => {
  if (hardMode.isLocked()) {
    const secs = Math.ceil(hardMode.remainingMs() / 1000);
    return { ok: false, error: `Hard Mode cool-off: ${secs}s remaining. Journal what went wrong before the next trade.` };
  }
  return buyOrig(symbol, qty, district, opts);
}) as typeof portfolio.buy;

let lastTxId: string | null = null;
portfolio.subscribe(() => {
  const txs = portfolio.getTransactions();
  if (txs.length === 0) return;
  const last = txs[txs.length - 1];
  if (last.id === lastTxId) return;
  lastTxId = last.id;
  const events = behaviorTracker.getEvents();
  const recentBias = events.length > 0 && events[events.length - 1].eventType === 'bias_detected'
    && Date.now() - events[events.length - 1].timestamp < 30_000;
  let isWin = false;
  if (last.side === 'sell') {
    const priorBuys = txs.filter(t => t.symbol === last.symbol && t.side === 'buy' && t.timestamp < last.timestamp);
    if (priorBuys.length) {
      const avgBuy = priorBuys.reduce((a, t) => a + t.price * t.quantity, 0) /
                     priorBuys.reduce((a, t) => a + t.quantity, 0);
      isWin = last.price > avgBuy;
    }
  }
  const stops = (portfolio.getState() as { stops?: Record<string, number> }).stops ?? {};
  const hadStop = last.side === 'buy' && Object.prototype.hasOwnProperty.call(stops, last.symbol);
  dailyMissions.noteTrade({ hadBiasTrigger: recentBias, hadStop, isWin });
});

const _origRegistrySetters = (window as unknown as Record<string, unknown>);
void _origRegistrySetters;
void traderScore;

portfolio.subscribe(() => leaderboardSystem.publish());

firebaseAuth.subscribe((s) => {
  if (s.status === 'signed-in') leaderboardSystem.cloudInit(s.user.uid);
  else leaderboardSystem.cloudTeardown();
});

if (!userProfile.isOnboarded()) {

  window.setTimeout(() => {
    onboarding.open((startTour) => {
      if (startTour && !userProfile.isTourDone()) tour.start();
    });
  }, 400);
}

const hud = new HUDManager(
  () => portfolioModal.open(),
  () => helpModal.open()
);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0E1A2A',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    MenuScene,
    BootScene,
    ScamSlumScene,
    WallStreetScene,
    DalalStreetScene,
    CryptoCoveScene,
    QuantQuarterScene,
    VegasViceScene,
    WorldMapScene,
    TrainTransitionScene,
  ],
};

let game: Phaser.Game | undefined;

function startGame() {
  const landing = document.getElementById('landing-page');
  if (landing) landing.classList.add('hidden');

  game = new Phaser.Game(config);

  game.registry.set('hudUpdater', (district: string) => {
    hud.setDistrict(district);
    hud.show();
    dailyMissions.noteDistrictVisit(district);
  });

  game.registry.set('onTerminalOpen', (market: 'wall-street' | 'dalal-street') => {
    tradingTerminal.open(market);
  });

  game.registry.set('onEchoOpen', () => {
    echoModal.open();

    const obs = new MutationObserver(() => {
      if (echoModal.isOpen() === false) {
        dailyMissions.noteEchoComplete();
        obs.disconnect();
      }
    });
    const el = document.getElementById('echo-modal');
    if (el) obs.observe(el, { attributes: true, attributeFilter: ['class'] });
  });

  const win = window as unknown as Record<string, any>;
  if (win.finsim) win.finsim.game = game;
}

document.getElementById('btn-play-now')?.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (tour.isOpen()) tour.close();
    else if (mapHints.isOpen()) mapHints.close();
    else if (leaderboard.isOpen()) leaderboard.close();
    else if (learnHub.isOpen()) learnHub.close();
    else if (biasProfileModal.isOpen()) biasProfileModal.close();
    else if (proTerminal.isOpen()) proTerminal.close();
    else if (tradingTerminal.isOpen()) tradingTerminal.close();
    else if (portfolioModal.isOpen()) portfolioModal.close();
    else if (helpModal.isOpen()) helpModal.close();
    else if (echoModal.isOpen()) echoModal.close();
  }

  const t = e.target as HTMLElement | null;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if (typing) return;
  if (e.key === 'r' || e.key === 'R') {
    if (!proTerminal.isOpen()) proTerminal.open();
  }
  if (e.key === 'l' || e.key === 'L') {
    learnHub.toggle();
  }
  if (e.key === 'b' || e.key === 'B') {
    leaderboard.toggle();
  }
  if (e.key === 't' || e.key === 'T') {
    if (!tour.isOpen()) tour.start();
  }
  if (e.key === 'p' || e.key === 'P') {
    if (!portfolioModal.isOpen()) portfolioModal.open();
  }
  if (e.key === 'i' || e.key === 'I') {
    biasProfileModal.toggle();
  }
  if (e.key === 'm' || e.key === 'M') {

    if (!game) return;
    const activeScene = game.scene.getScenes(true)[0];
    if (activeScene && activeScene.scene.key !== 'WorldMapScene' && activeScene.scene.key !== 'MenuScene' && activeScene.scene.key !== 'BootScene') {
      soundManager.play('portal');
      activeScene.cameras.main.fadeOut(400, 14, 26, 42);
      activeScene.cameras.main.once('camerafadeoutcomplete', () => {
        activeScene.scene.start('WorldMapScene');
      });
    }
  }
});

(window as unknown as Record<string, unknown>).finsim = {
  game: undefined,
  behavior: behaviorTracker,
  openEcho: () => echoModal.open(),
  openTerminal: () => tradingTerminal.open('wall-street'),
  goTo: (scene: string) => {
    if (!game) return;
    const active = game.scene.getScenes(true)[0];
    if (active) active.scene.start(scene);
  },
  reset: () => {
    localStorage.clear();
    location.reload();
  },
  unlockAll: () => {
    const flags = ['unlock.wall_street', 'unlock.dalal_street', 'unlock.crypto_cove',
      'unlock.quant_quarter', 'unlock.vegas_vice', 'unlock.forex_plaza', 'quest.main.started'];
    try {
      const raw = localStorage.getItem('finsim.portfolio.v1');
      const s = raw ? JSON.parse(raw) : { flags: [] as string[] };
      if (!s.flags) s.flags = [];
      flags.forEach(f => { if (!s.flags.includes(f)) s.flags.push(f); });
      localStorage.setItem('finsim.portfolio.v1', JSON.stringify(s));
    } catch (_) {  }
    console.log('All districts unlocked. Press M for World Map (reload if needed).');
  },
};

console.log('%c FINSIM ', 'background:#1F3A5F;color:#D4A84B;font-size:20px;padding:8px 16px;font-weight:bold;');
console.log('%c The Financial Metaverse — 6 Districts, 15 Echo Scenarios, 27 Dialogue Trees ', 'color:#D4A84B;font-size:11px;');
console.log('Dev: window.finsim.{ goTo(scene), openEcho, openTerminal, unlockAll, reset }');
console.log('Keys: WASD=move  E/Space=interact  P=portfolio  M=world map  Esc=close');
