export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

export interface Transaction {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  district: string;
}

export interface BehaviorEvent {
  id: string;
  timestamp: number;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface Stock {
  symbol: string;
  name: string;
  currency: string;
  sector: string;

  price: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;

  drift: number;
  volatility: number;

  candles: Candle[];
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type BiasType =
  | 'fomo'
  | 'revenge_trading'
  | 'overconfidence'
  | 'loss_aversion'
  | 'recency'
  | 'sunk_cost'
  | 'naked_trade'
  | 'news_roulette'
  | 'tweet_trade'
  | 'concentration'
  | 'size_violation';

export interface BiasDetection {
  type: BiasType;
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  statistic: string;
}

export interface DialogueNode {
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  next?: string;
  flags?: string[];
  effect?: DialogueEffect;
}

export interface DialogueChoice {
  text: string;
  next: string;
  flags?: string[];
  effect?: DialogueEffect;
}

export interface DialogueEffect {
  cash?: number;
  giveItem?: string;
  startQuest?: string;
  completeQuest?: string;
  teachLesson?: string;
  isScamAccept?: boolean;
}

export interface DialogueTree {
  id: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}

export interface EchoScenario {
  id: string;
  titleHidden: string;
  titleRevealed: string;
  contextHidden: string;
  contextRevealed: string;
  headlines: string[];
  chartData: number[];
  actions: EchoAction[];
  correctActionId: string;
  heroName: string;
  heroOutcome: string;
  lesson: string;
  isFraud: boolean;
}

export interface EchoAction {
  id: string;
  label: string;
  outcomeIfChosen: string;
}
