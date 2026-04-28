import type { EchoScenario } from '@/types';

function priceSeries(points: { day: number; price: number }[], totalDays: number): number[] {
  const series: number[] = [];
  for (let d = 0; d <= totalDays; d++) {
    let before = points[0];
    let after = points[points.length - 1];
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].day <= d && points[i + 1].day >= d) {
        before = points[i];
        after = points[i + 1];
        break;
      }
    }
    if (before.day === after.day) {
      series.push(before.price);
    } else {
      const t = (d - before.day) / (after.day - before.day);
      const interp = before.price + (after.price - before.price) * t;
      const noise = (Math.random() - 0.5) * interp * 0.02;
      series.push(Math.max(0.01, interp + noise));
    }
  }
  return series;
}

export const echoScenarios: EchoScenario[] = [

  {
    id: 'soros_gbp_1992',
    titleHidden: 'Currency Crisis',
    titleRevealed: 'Soros Breaks the Bank of England — September 1992',
    contextHidden: 'A European currency has been artificially pegged. The underlying economy is weak. The central bank raised rates to 15% in one day to defend the peg. Traders sense the defense is unsustainable. The central bank is burning reserves daily.',
    contextRevealed: 'You walked in Soros\'s footsteps. He shorted £10 billion on Black Wednesday. The Bank of England burned through reserves and capitulated. The pound devalued 15% in a single day. Soros made $1 billion.',
    headlines: [
      'Bank of England raises rates to 15% in emergency move',
      'Treasury commits $20B in reserves to defend ERM peg',
      'Bundesbank president privately doubts peg sustainability',
      'UK recession deepens — unemployment at 10-year high',
    ],
    chartData: priceSeries([
      { day: 0, price: 2.95 }, { day: 10, price: 2.92 }, { day: 20, price: 2.85 },
      { day: 25, price: 2.78 }, { day: 30, price: 2.62 },
    ], 30),
    actions: [
      { id: 'buy_pound', label: 'Buy the pound — support the peg', outcomeIfChosen: 'You lost 15% overnight.' },
      { id: 'hold', label: 'Hold — wait for clarity', outcomeIfChosen: 'Missed the decade\'s biggest macro trade.' },
      { id: 'short_pound', label: 'Short the pound aggressively', outcomeIfChosen: '+$1 billion in a single day.' },
      { id: 'short_small', label: 'Short cautiously (small size)', outcomeIfChosen: 'Correct direction, left 90% on the table.' },
    ],
    correctActionId: 'short_pound',
    heroName: 'George Soros',
    heroOutcome: '$1 billion profit. "The Man Who Broke the Bank of England."',
    lesson: 'When a central bank defends an indefensible peg, the asymmetry is extreme: their losses are bounded by reserves, your gains are not.',
    isFraud: false,
  },

  {
    id: 'mehta_acc_1992',
    titleHidden: 'Bull Run on a Cement Stock',
    titleRevealed: 'Harshad Mehta ACC Manipulation — 1992',
    contextHidden: 'A broker has driven a cement stock from ₹200 to ₹9,000 in one year. Volume is extraordinary. The broker has access to enormous bank funding no one fully understands. Small investors are piling in.',
    contextRevealed: 'Harshad Mehta used forged bank receipts to siphon ₹4,000 crore into the market. ACC went from ₹200 to ₹9,000. When the scam broke, Sensex crashed from 4,500 to 2,500 — ₹1,000 billion wiped out. He died awaiting trial.',
    headlines: [
      'ACC stock hits ₹9,000 — 45x in one year',
      'Broker claims cement sector is the next boom',
      '"Ready forward" deal volumes at record highs',
      'SBI reports minor discrepancies in securities ledger',
    ],
    chartData: priceSeries([
      { day: 0, price: 200 }, { day: 100, price: 800 }, { day: 200, price: 3500 },
      { day: 280, price: 9000 }, { day: 300, price: 7500 }, { day: 310, price: 2800 }, { day: 330, price: 1400 },
    ], 330),
    actions: [
      { id: 'buy_heavy', label: 'Buy heavily — momentum is everything', outcomeIfChosen: 'You were the exit liquidity. Lost 80% when the scam broke.' },
      { id: 'short_it', label: 'Short — clearly unsustainable', outcomeIfChosen: 'Correct. You made a fortune on the crash.' },
      { id: 'run_the_scam', label: 'Run the scheme yourself with fake receipts', outcomeIfChosen: 'You are arrested. You die in Thane prison. Game over.' },
      { id: 'avoid', label: 'Avoid entirely — something is wrong', outcomeIfChosen: 'Capital preserved. You survived to trade another day.' },
    ],
    correctActionId: 'avoid',
    heroName: 'Harshad Mehta',
    heroOutcome: 'Prison. The scam crashed Indian markets and destroyed ₹1,000 billion of retail wealth.',
    lesson: 'When a single broker can move a stock 45x on funding mechanisms nobody understands, the music will stop. Avoiding is the trade.',
    isFraud: true,
  },

  {
    id: 'burry_mbs_2005',
    titleHidden: 'The Housing Market Bet',
    titleRevealed: 'Michael Burry Shorts Subprime MBS — 2005',
    contextHidden: 'Home prices doubled in 5 years. Banks issue mortgages to people with no income verification. Rating agencies stamp bundles of these loans AAA. A tiny asset class (Credit Default Swaps) lets you pay small premiums to bet against these bundles.',
    contextRevealed: 'Michael Burry read thousands of mortgage prospectuses and saw teaser-rate loans would reset in 2007. He bought CDS on MBS tranches. Scion Capital made $700M+ when housing collapsed. His story became The Big Short.',
    headlines: [
      'Home prices up 90% in 5 years — no end in sight',
      'No-doc mortgages now 40% of new originations',
      'Rating agencies maintain AAA on MBS despite rising delinquencies',
      'Fed keeps rates low to maintain "ownership society"',
    ],
    chartData: priceSeries([
      { day: 0, price: 100 }, { day: 90, price: 120 }, { day: 180, price: 140 },
      { day: 270, price: 150 }, { day: 360, price: 140 }, { day: 450, price: 100 }, { day: 540, price: 60 },
    ], 540),
    actions: [
      { id: 'buy_homebuilder', label: 'Buy homebuilder stocks — housing is hot', outcomeIfChosen: 'Homebuilder ETF fell 80% in the crash.' },
      { id: 'buy_mbs', label: 'Buy MBS for the 6% yield', outcomeIfChosen: 'Your AAA bond became worthless in 18 months.' },
      { id: 'short_cds', label: 'Buy CDS protection against subprime MBS', outcomeIfChosen: 'You paid small premiums 2 years, then collected 10x.' },
      { id: 'ignore', label: 'Stay in index funds', outcomeIfChosen: 'S&P fell 57%. You lost half.' },
    ],
    correctActionId: 'short_cds',
    heroName: 'Michael Burry',
    heroOutcome: '$700M for Scion Capital, 489% personal return. Immortalized in The Big Short.',
    lesson: 'When an entire asset class is structurally mispriced and an asymmetric instrument exists to bet against it, the patient analyst wins. Burry\'s edge: he did the reading others refused to do.',
    isFraud: false,
  },

  {
    id: 'buffett_coke_1988',
    titleHidden: 'The Consumer Brand Opportunity',
    titleRevealed: 'Buffett Buys Coca-Cola — 1988',
    contextHidden: 'A 102-year-old beverage company trades at 15x earnings. Dominant global brand, 200+ countries, 45% gross margins, aligned management. Stock flat for 6 years while earnings grew 40%. A famous investor starts accumulating.',
    contextRevealed: 'Buffett spent $1.3 billion buying 7% of Coke in 1988. That stake is now worth $25B+ and has paid $15B+ in dividends. One of the most profitable individual stock positions in investing history.',
    headlines: [
      'Coca-Cola CEO Goizueta announces aggressive buyback program',
      'Coke earnings up 14% for 6th consecutive year',
      'Stock trades 20% below historical multiple at 15x earnings',
      'Global expansion accelerating in Asia and Latin America',
    ],
    chartData: priceSeries([
      { day: 0, price: 42 }, { day: 60, price: 44 }, { day: 120, price: 45 },
      { day: 180, price: 48 }, { day: 240, price: 52 }, { day: 300, price: 58 }, { day: 365, price: 65 },
    ], 365),
    actions: [
      { id: 'buy_huge', label: 'Buy enormous position, hold forever', outcomeIfChosen: '35+ years of dividends and appreciation. ~20x return.' },
      { id: 'buy_small', label: 'Buy small, diversify widely', outcomeIfChosen: 'Made money but left most upside on the table.' },
      { id: 'skip', label: 'Skip — boring, slow growth', outcomeIfChosen: 'Missed one of the greatest compound returns in history.' },
      { id: 'short', label: 'Short — flat for 6 years', outcomeIfChosen: 'Wiped out within 2 years.' },
    ],
    correctActionId: 'buy_huge',
    heroName: 'Warren Buffett',
    heroOutcome: '$1.3B → $25B+, with $15B+ in dividends. A permanent Berkshire holding.',
    lesson: 'A wonderful business at a fair price beats a fair business at a wonderful price. Dominant brand + global moat + aligned management + reasonable multiple = time is your friend.',
    isFraud: false,
  },

  {
    id: 'ftx_collapse_2022',
    titleHidden: 'Exchange Liquidity Crisis',
    titleRevealed: 'FTX Collapse — November 2022',
    contextHidden: 'You have funds on a large crypto exchange. A rival CEO tweets he\'s selling the exchange\'s native token. Price drops 10%. Reports emerge of customer deposits loaned to an affiliated hedge fund. The exchange announces a "liquidity crunch" and halts withdrawals.',
    contextRevealed: 'FTX\'s Sam Bankman-Fried had secretly loaned customer deposits to Alameda Research. When Binance\'s CZ dumped FTT, a bank run started. Withdrawals halted Nov 8. Bankruptcy Nov 11. Customers lost billions.',
    headlines: [
      'Rival CEO dumps FTT token — "we won\'t support people who lobby against us"',
      'Leaked balance sheet shows $8B liability gap',
      '"Temporary" withdrawal pause announced by CEO',
      'Former executives had no oversight over customer funds',
    ],
    chartData: priceSeries([
      { day: 0, price: 25 }, { day: 3, price: 22 }, { day: 5, price: 18 },
      { day: 7, price: 3 }, { day: 10, price: 1.5 },
    ], 10),
    actions: [
      { id: 'withdraw_now', label: 'Withdraw EVERYTHING immediately', outcomeIfChosen: 'You got out. Those who waited 24 hours lost everything.' },
      { id: 'buy_dip', label: 'Buy the dip — it\'ll bounce', outcomeIfChosen: 'Bought at $18. Hit $1. Lost 95%.' },
      { id: 'hold', label: 'Hold — don\'t panic sell', outcomeIfChosen: 'Bankruptcy froze your funds. Possibly permanently lost.' },
      { id: 'short', label: 'Short FTT on another exchange', outcomeIfChosen: 'Caught the collapse. 10x return.' },
    ],
    correctActionId: 'withdraw_now',
    heroName: 'FTX depositors who acted Nov 6-7',
    heroOutcome: 'The minority who acted fast kept their funds. VCs, funds, and retail investors who waited lost billions.',
    lesson: '"Not your keys, not your crypto." When withdrawals slow, exit first — ask questions later.',
    isFraud: true,
  },

  {
    id: 'buffett_amex_1964',
    titleHidden: 'Scandal at a Commodity Broker',
    titleRevealed: 'Buffett Buys American Express After Salad Oil Scandal — 1964',
    contextHidden: 'A major financial company is embroiled in a fraud scandal involving a commodity warehouse. Clients were given loans against non-existent salad oil. The company faces potential $175M in losses. Stock has crashed 50%. The company\'s core travel and financial services business is untouched.',
    contextRevealed: 'The Salad Oil Scandal threatened AmEx. Buffett sat in a restaurant for days watching whether people still used AmEx cards. They did. The brand was intact. He invested 40% of his partnership into AmEx — his most concentrated bet ever. The stock 5x\'d within 5 years.',
    headlines: [
      'American Express warehouse fraud — $150M in claims',
      'Stock down 50% since scandal broke',
      'Board debating whether to pay claims or fight in court',
      'Core travel business shows no signs of customer flight',
    ],
    chartData: priceSeries([
      { day: 0, price: 60 }, { day: 30, price: 42 }, { day: 60, price: 38 },
      { day: 90, price: 41 }, { day: 180, price: 55 }, { day: 365, price: 90 },
    ], 365),
    actions: [
      { id: 'buy_concentrated', label: 'Buy 40% of your portfolio in AmEx', outcomeIfChosen: '5x in 5 years. Buffett\'s best early trade.' },
      { id: 'buy_small', label: 'Buy a small position (5%)', outcomeIfChosen: 'Made a good return but sized too small to matter.' },
      { id: 'avoid_scandal', label: 'Avoid — scandal companies never recover', outcomeIfChosen: 'You missed the 5x return. Brand survived perfectly.' },
      { id: 'wait', label: 'Wait until the legal outcome is clear', outcomeIfChosen: 'By the time it\'s clear, the stock is already 3x.' },
    ],
    correctActionId: 'buy_concentrated',
    heroName: 'Warren Buffett (age 33)',
    heroOutcome: '5x in 5 years. Demonstrated that separating "business in trouble" from "business permanently impaired" is the key skill.',
    lesson: 'Distinguish between a business with a temporary problem vs. a permanently impaired franchise. Check whether customers still trust the core brand.',
    isFraud: false,
  },

  {
    id: 'enron_2001',
    titleHidden: 'Energy Giant Under Pressure',
    titleRevealed: 'Enron Collapse — 2001',
    contextHidden: 'A major energy company has been Wall Street\'s darling for 5 years. Revenue grew from $10B to $100B. It\'s valued at $70 billion. A short seller published a detailed report claiming the company is booking fictional profits through SPV accounting. The company\'s response: "The analyst is wrong."',
    contextRevealed: 'Enron used hundreds of special purpose vehicles to hide $30B in debt. CFO Andy Fastow created a labyrinth of fake entities to manufacture accounting profits. When Bethany McLean at Fortune asked "How does Enron make money?", nobody could answer. The stock went from $90 to $0.67 in 12 months.',
    headlines: [
      'Enron revenue grew from $10B to $100B in 4 years — how?',
      'Short seller: "Enron\'s numbers don\'t add up"',
      'CEO calls analyst "unethical" for questioning financials',
      'Mark-to-market accounting allows booking future profits today',
    ],
    chartData: priceSeries([
      { day: 0, price: 90 }, { day: 60, price: 80 }, { day: 120, price: 60 },
      { day: 180, price: 35 }, { day: 240, price: 10 }, { day: 270, price: 1 },
    ], 270),
    actions: [
      { id: 'buy_dip', label: 'Buy the dip — short sellers are wrong', outcomeIfChosen: 'You lost everything. Enron went bankrupt.' },
      { id: 'hold', label: 'Hold — it\'s a Fortune 500 company', outcomeIfChosen: 'Enron filed Chapter 11. Your shares are worthless.' },
      { id: 'sell_everything', label: 'Sell everything immediately', outcomeIfChosen: 'You got out near the top. Capital preserved.' },
      { id: 'short_enron', label: 'Short Enron — the numbers don\'t add up', outcomeIfChosen: '90% gain as stock collapsed to zero.' },
    ],
    correctActionId: 'sell_everything',
    heroName: 'Bethany McLean & Short Sellers',
    heroOutcome: 'Those who read the 10-K footnotes and couldn\'t understand how Enron made money were right. The company was a $30B fraud.',
    lesson: 'If you can\'t understand how a company makes money after reading its annual report, that\'s a red flag. Revenue growth means nothing if profits are manufactured.',
    isFraud: true,
  },

  {
    id: 'gamestop_2021',
    titleHidden: 'Short Squeeze',
    titleRevealed: 'GameStop Short Squeeze — January 2021',
    contextHidden: 'A struggling retail video game chain has 140% of its shares sold short by hedge funds. A Reddit community notices. They begin buying call options, forcing market makers to buy shares (gamma squeeze). Short sellers face unlimited losses. The stock is trading at $20.',
    contextRevealed: 'r/WallStreetBets coordinated the most famous short squeeze in history. GameStop went from $20 to $483 in 30 days. Melvin Capital lost $6.8B. Robinhood halted buying. The squeeze collapsed when retail traders couldn\'t buy. Stock fell 90% from peak.',
    headlines: [
      'GameStop short interest at 140% of float — all-time record',
      'r/WallStreetBets: "We can squeeze this to infinity"',
      'Institutional short sellers report mounting losses',
      'Option market makers forced to hedge by buying shares',
    ],
    chartData: priceSeries([
      { day: 0, price: 20 }, { day: 5, price: 40 }, { day: 10, price: 120 },
      { day: 15, price: 350 }, { day: 20, price: 483 }, { day: 25, price: 200 },
      { day: 35, price: 50 }, { day: 50, price: 15 },
    ], 50),
    actions: [
      { id: 'buy_at_20', label: 'Buy at $20 — the squeeze is just starting', outcomeIfChosen: 'You bought early and rode it to $483. Sold at $200 before collapse.' },
      { id: 'buy_at_400', label: 'Buy at $400 — this time it\'s different', outcomeIfChosen: 'FOMO struck at the top. You lost 96% as it fell to $15.' },
      { id: 'short_at_20', label: 'Short at $20 — fundamentals are terrible', outcomeIfChosen: 'Technically correct on fundamentals. But you were squeezed from $20 to $483 first. Margin call.' },
      { id: 'stay_out', label: 'Watch the chaos from the sidelines', outcomeIfChosen: 'Preserved capital. Entertainment was free.' },
    ],
    correctActionId: 'buy_at_20',
    heroName: 'Early r/WSB buyers',
    heroOutcome: 'Those who bought early and sold at peak made 10-20x. Those who held at peak lost everything. Timing was everything.',
    lesson: 'Short squeezes are mathematically real but temporally unpredictable. The fundamental thesis (GameStop is dying) was correct. The timing was not. Never short 140% float.',
    isFraud: false,
  },

  {
    id: 'druckenmiller_dmark_1992',
    titleHidden: 'Currency Reunification Trade',
    titleRevealed: 'Druckenmiller Buys Deutsche Mark — German Reunification 1990',
    contextHidden: 'Two countries have just reunified after decades of division. The western nation\'s currency is strong. The combined nation\'s government is spending massively on infrastructure to rebuild the eastern region. High government spending usually leads to higher inflation, which leads to higher interest rates, which strengthens the currency.',
    contextRevealed: 'Druckenmiller identified that German reunification would force the Bundesbank to raise rates to fight inflation from reconstruction spending. Higher German rates would attract capital and strengthen the Deutsche Mark. His fund made over $1B on this thesis.',
    headlines: [
      'German reunification: West to spend $1T rebuilding East',
      'Bundesbank warns of inflationary pressures',
      'German government deficit widening rapidly',
      'D-Mark under pressure from capital flows to Eastern Europe',
    ],
    chartData: priceSeries([
      { day: 0, price: 0.55 }, { day: 30, price: 0.57 }, { day: 60, price: 0.60 },
      { day: 90, price: 0.63 }, { day: 120, price: 0.61 }, { day: 180, price: 0.67 },
    ], 180),
    actions: [
      { id: 'long_dmark', label: 'Buy Deutsche Mark aggressively', outcomeIfChosen: 'You captured the full appreciation. 20%+ return.' },
      { id: 'short_dmark', label: 'Short — reconstruction is bad for currency', outcomeIfChosen: 'You got the monetary logic backwards. Lost badly.' },
      { id: 'long_small', label: 'Buy cautiously (small position)', outcomeIfChosen: 'Right direction, but sized too small for meaningful gains.' },
      { id: 'ignore', label: 'Macro is too complex, avoid currencies', outcomeIfChosen: 'You missed a clear, thesis-driven trade.' },
    ],
    correctActionId: 'long_dmark',
    heroName: 'Stanley Druckenmiller',
    heroOutcome: '$1B+ on this macro thesis. Combined with the Soros GBP short, 1992 was Druckenmiller\'s legendary year.',
    lesson: 'Macro trades require understanding the full monetary transmission mechanism: fiscal spending → inflation → central bank response → currency flows. Follow the chain.',
    isFraud: false,
  },

  {
    id: 'livermore_1929',
    titleHidden: 'The Great Bull Market',
    titleRevealed: 'Jesse Livermore Shorts the 1929 Crash',
    contextHidden: 'Markets have risen 400% in 8 years. Retail investors borrow money on 10:1 margin to buy stocks. Shoeshine boys give stock tips. Corporate earnings growth has plateaued while prices keep rising. A famous trader quietly accumulates short positions despite tremendous social pressure to be bullish.',
    contextRevealed: 'Jesse Livermore shorted the 1929 market and made $100 million ($1.5 billion today) in the crash. He identified margin debt, overvaluation, and speculative fever as preconditions for collapse. He was shunned by society for "betting against America" while everyone else lost everything.',
    headlines: [
      'Dow up 400% since 1921 — highest since records began',
      '90% of new investors use maximum margin leverage',
      'Corporate earnings growth slowing but stock prices accelerate',
      '"You can\'t lose money in stocks long term" — popular wisdom',
    ],
    chartData: priceSeries([
      { day: 0, price: 380 }, { day: 30, price: 410 }, { day: 60, price: 380 },
      { day: 80, price: 300 }, { day: 100, price: 200 }, { day: 130, price: 150 }, { day: 180, price: 120 },
    ], 180),
    actions: [
      { id: 'buy_margin', label: 'Buy on 10:1 margin — market always goes up', outcomeIfChosen: 'Margin call destroyed you. Lost 100% plus debts.' },
      { id: 'sell_all_hold_cash', label: 'Sell everything, hold cash', outcomeIfChosen: 'Preserved capital. S&P fell 90% from peak.' },
      { id: 'short_market', label: 'Short the market with conviction', outcomeIfChosen: '+$100M. You became the most profitable trader in America.' },
      { id: 'buy_safe', label: 'Buy quality companies without margin', outcomeIfChosen: 'Even "quality" companies fell 80-90%. Slow recovery.' },
    ],
    correctActionId: 'short_market',
    heroName: 'Jesse Livermore',
    heroOutcome: '$100 million in the crash (~$1.5B today). Made 4 great fortunes, lost 3. Died broke and alone in 1940.',
    lesson: 'When margin debt is at historic highs, when shoeshine boys give tips, and when "stocks always go up" becomes conventional wisdom — a top may be forming. Livermore\'s warning: pride in a big win leads to bigger losses.',
    isFraud: false,
  },

  {
    id: 'buffett_apple_2016',
    titleHidden: 'The Tech Brand Nobody Expected Buffett to Touch',
    titleRevealed: 'Buffett Buys Apple — 2016',
    contextHidden: 'A consumer technology company trades at 13x earnings. iPhone growth has stalled. Tech analysts call it "hardware," not "software." The narrative is: growth is over. Services (App Store, iCloud) are tiny. A legendary value investor who says he doesn\'t understand tech begins buying.',
    contextRevealed: 'Buffett started buying Apple in 2016 at ~$25 (split-adjusted). His team\'s insight: Apple isn\'t a tech company — it\'s a luxury consumer brand with an unbreakable ecosystem. Today Berkshire\'s Apple stake is worth $170B+, the largest single position in Buffett history.',
    headlines: [
      'iPhone sales decline for first time — "peak iPhone"',
      'Apple trades at 13x earnings, discount to S&P',
      'Services revenue tiny but fast-growing',
      'Consumer loyalty and switching costs underappreciated by market',
    ],
    chartData: priceSeries([
      { day: 0, price: 25 }, { day: 90, price: 27 }, { day: 180, price: 30 },
      { day: 270, price: 38 }, { day: 365, price: 42 }, { day: 500, price: 75 },
    ], 500),
    actions: [
      { id: 'buy_big', label: 'Buy a major position — it\'s a consumer brand', outcomeIfChosen: '6x in 8 years. Berkshire made $100B+.' },
      { id: 'skip_tech', label: 'Skip — Buffett doesn\'t do tech', outcomeIfChosen: 'Everyone said this. He did it anyway. You missed the best trade of the decade.' },
      { id: 'buy_small', label: 'Buy a small position', outcomeIfChosen: 'Right direction, insufficient size.' },
      { id: 'short', label: 'Short — hardware cycle is over', outcomeIfChosen: 'Massively wrong. The moat was the ecosystem, not the hardware.' },
    ],
    correctActionId: 'buy_big',
    heroName: 'Warren Buffett',
    heroOutcome: '$36B invested → $170B+. His largest ever position. Changed Wall Street\'s view of Apple.',
    lesson: 'Reframe the question. Apple isn\'t "hardware" — it\'s a consumer loyalty ecosystem with switching costs higher than almost any brand in history. The market was right about iPhones, wrong about the moat.',
    isFraud: false,
  },

  {
    id: 'tulip_mania_1637',
    titleHidden: 'The Flower Futures Bubble',
    titleRevealed: 'Dutch Tulip Mania — 1636-1637',
    contextHidden: 'Exotic flower bulbs have been traded in futures markets. Prices have risen 5,900% in 3 years. A single bulb now costs more than a house. Contracts trade for bulbs that won\'t even bloom until spring. New speculators pour in daily, certain they can sell to a bigger fool.',
    contextRevealed: 'The world\'s first speculative bubble. Dutch tulip bulb futures peaked in February 1637, then crashed 99.9% in a week. Contracts became worthless. The "Semper Augustus" bulb peak price: 10,000 guilders — more than a luxury Amsterdam house. Within months: 50 guilders.',
    headlines: [
      'Semper Augustus bulb sells for 10,000 guilders (price of a house)',
      'New speculators flooding the futures markets daily',
      'Everyone agrees: "Prices will never fall — demand is insatiable"',
      'Tavern contracts for future bulb delivery surge',
    ],
    chartData: priceSeries([
      { day: 0, price: 100 }, { day: 60, price: 500 }, { day: 120, price: 2000 },
      { day: 150, price: 5900 }, { day: 155, price: 1000 }, { day: 160, price: 200 }, { day: 180, price: 50 },
    ], 180),
    actions: [
      { id: 'buy_at_peak', label: 'Buy at peak — "prices will keep rising forever"', outcomeIfChosen: 'Price crashed 99.9% in a week. Your contracts are worthless.' },
      { id: 'sell_short', label: 'Sell futures — this is clearly insane', outcomeIfChosen: 'Premature. It went 3x more before crashing. But eventually right.' },
      { id: 'sold_early', label: 'Sell your bulbs when up 10x (early)', outcomeIfChosen: 'Sold at 1000% profit. Left the last 90% on the table but preserved gains.' },
      { id: 'never_entered', label: 'Never buy bulbs — no intrinsic value', outcomeIfChosen: 'Correct. Watched the spectacle from safety.' },
    ],
    correctActionId: 'never_entered',
    heroName: 'Those who never entered the bulb market',
    heroOutcome: 'The Dutch economy survived. The speculators did not. "A fool and his money are soon parted — in a bubble, quickly and spectacularly."',
    lesson: 'Assets without intrinsic cash flows can reach any price temporarily — then collapse to near zero. The question to ask: "Why does this have value in 10 years?" If you can\'t answer, it\'s speculation.',
    isFraud: false,
  },

  {
    id: 'madoff_ponzi_2008',
    titleHidden: 'Consistent Returns in Any Market',
    titleRevealed: 'Madoff Ponzi Scheme — Collapse 2008',
    contextHidden: 'An investment firm has returned 10-12% annually for 20 consecutive years — with almost no down months. Strategy described as "split-strike conversion." The SEC investigated twice and found nothing. Top hedge funds invest with them. Smart investors notice the returns are impossibly consistent.',
    contextRevealed: 'Bernie Madoff ran the largest Ponzi scheme in history — $65 billion. His 1-1.5% per month returns with no volatility were mathematically impossible. Harry Markopolos sent the SEC a 17-page report titled "The World\'s Largest Hedge Fund is a Fraud" in 2000. They ignored it for 8 years.',
    headlines: [
      '10-12% annual returns for 20 years — through every crash',
      'Returns show 1 losing month in 17 years',
      'Strategy: "split-strike conversion" — vague but sounds sophisticated',
      'SEC investigation found nothing irregular (2006)',
    ],
    chartData: priceSeries([
      { day: 0, price: 100 }, { day: 60, price: 105 }, { day: 120, price: 111 },
      { day: 180, price: 117 }, { day: 240, price: 124 }, { day: 270, price: 131 },
      { day: 275, price: 0 },
    ], 275),
    actions: [
      { id: 'invest_everything', label: 'Invest everything — SEC cleared them!', outcomeIfChosen: 'You lost 100% when Madoff confessed in December 2008.' },
      { id: 'invest_small', label: 'Invest a small amount — diversify', outcomeIfChosen: 'Lost that amount. The red flags were there.' },
      { id: 'refuse_invest', label: 'Refuse — 1 down month in 17 years is impossible', outcomeIfChosen: 'You recognized the fraud. Capital preserved.' },
      { id: 'report_sec', label: 'Report to SEC with analysis', outcomeIfChosen: 'You did what Markopolos did. SEC ignored it. But you kept your money.' },
    ],
    correctActionId: 'refuse_invest',
    heroName: 'Harry Markopolos',
    heroOutcome: 'Sent a 17-page fraud report to the SEC in 2000. Ignored for 8 years. Was right. Madoff confessed 2008, sentenced to 150 years.',
    lesson: 'Too-consistent returns are impossible in real markets. Volatility is the price of return. If someone shows you 20 years of smooth positive returns with no drawdowns, it\'s either fraud or it will fail soon.',
    isFraud: true,
  },

  {
    id: 'japan_bubble_1989',
    titleHidden: 'The Miracle Economy',
    titleRevealed: 'Japanese Asset Bubble — Peak December 1989',
    contextHidden: 'An Asian nation\'s stock market has risen 400% in a decade. Tokyo real estate has risen 7x. The Imperial Palace grounds are valued at more than all of California. P/E ratios average 60x. A narrative of unique cultural advantages and permanent dominance pervades. A famous foreign investor refuses to participate.',
    contextRevealed: 'The Nikkei peaked at 38,957 on December 29, 1989. By 1992 it was at 16,000. By 2003, below 8,000. Japan took 33 years to recover its 1989 peak (2023). Jim Rogers shorted it in 1987, was early, but eventually right.',
    headlines: [
      'Nikkei up 400% in 10 years — "Japan Inc" changes everything',
      'Tokyo office space costs $30,000 per sq meter',
      'P/E ratios at 60x — "Japan is different from Western markets"',
      'Bank of Japan raises rates to cool overheating (1989)',
    ],
    chartData: priceSeries([
      { day: 0, price: 38957 }, { day: 60, price: 30000 }, { day: 180, price: 25000 },
      { day: 365, price: 16000 }, { day: 500, price: 20000 }, { day: 700, price: 14000 },
    ], 700),
    actions: [
      { id: 'all_in_japan', label: 'All-in on Japan — miracle economy!', outcomeIfChosen: 'The Nikkei took 33 years to recover. You\'re still underwater.' },
      { id: 'short_japan', label: 'Short Japan — 60x P/E is insane', outcomeIfChosen: 'Correct thesis. Very hard to time. Years of pain before the payoff.' },
      { id: 'avoid_japan', label: 'Avoid — valuations make no sense globally', outcomeIfChosen: 'Capital preserved. Missed a temporary 10% more upside, avoided a 33-year flat market.' },
      { id: 'invest_small', label: 'Small position — FOMO is real', outcomeIfChosen: 'Down 80% and held for 30 years waiting for recovery.' },
    ],
    correctActionId: 'avoid_japan',
    heroName: 'Investors who avoided Japan in 1989',
    heroOutcome: 'Those who stayed out compounded elsewhere. Nikkei finally recovered in 2023. 34 years of patience or permanent loss.',
    lesson: 'No economy is exempt from valuation gravity. "This time is different" almost never is. When P/E ratios reach 60x and real estate exceeds all rational comparable value, exit is rational regardless of narrative.',
    isFraud: false,
  },
];

export function getEchoScenarioById(id: string): EchoScenario | undefined {
  return echoScenarios.find(s => s.id === id);
}

export function getRandomEchoScenario(): EchoScenario {
  return echoScenarios[Math.floor(Math.random() * echoScenarios.length)];
}
