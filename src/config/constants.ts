export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const TILE_SIZE = 32;
export const PLAYER_SPEED = 180;

export const STARTING_CASH = 10000;
export const MOM_LOST_AMOUNT = 200000;

export const COLORS = {
  BRAND: 0x1F3A5F,
  ACCENT: 0xD4A84B,
  DANGER: 0xC44536,
  SUCCESS: 0x4A9B5E,
  DARK_BG: 0x0E1A2A,
  PANEL: 0x1A2B42,
  LIGHT: 0xF4F1EA,
  INK: 0x1A1A1A,
  GROUND: 0x3A4A5C,
  GROUND_ALT: 0x2E3A47,
  WALL: 0x5A4A3A,
  ROAD: 0x222222,
  GRASS: 0x2E5A3E,
} as const;

export const BIAS_THRESHOLDS = {
  FOMO_PUMP_PCT: 5,
  FOMO_WINDOW_MS: 10 * 60 * 1000,
  REVENGE_LOSS_COUNT: 2,
  REVENGE_SIZE_MULTIPLIER: 1.5,
  OVERCONFIDENCE_WIN_COUNT: 3,
  LOSS_AVERSION_RATIO: 0.5,
} as const;

export const DISTRICTS = {
  SCAM_SLUM: 'Scam Slum',
  WALL_STREET: 'Wall Street',
  DALAL_STREET: 'Dalal Street',
  CRYPTO_COVE: 'Crypto Cove',
  QUANT_QUARTER: 'Quant Quarter',
  VEGAS_VICE: 'Vegas Vice',
  FOREX_PLAZA: 'Forex Plaza',
  REAL_ESTATE_ROW: 'Real Estate Row',
} as const;

export type DistrictName = typeof DISTRICTS[keyof typeof DISTRICTS];
