import type { DialogueTree } from '@/types';

export const momCall: DialogueTree = {
  id: 'mom_call',
  start: 'm1',
  nodes: {
    m1: {
      speaker: 'Mom',
      text: 'Beta, I saw a message on WhatsApp. Sharma Uncle\'s nephew is a trader, he said a stock would double in 7 days.',
      next: 'm2',
    },
    m2: {
      speaker: 'Mom',
      text: 'I invested our savings — two lakh rupees. The stock just crashed 80 percent. It\'s all gone.',
      next: 'm3',
    },
    m3: {
      speaker: 'Mom',
      text: 'Beta, you have to help. That was everything.',
      choices: [
        {
          text: 'I\'ll fix this, Mom. I promise.',
          next: 'm4',
          flags: ['quest.main.started'],
          effect: { startQuest: 'main_recover_savings' },
        },
      ],
    },
    m4: {
      speaker: 'You',
      text: '(I need to learn how markets work. And how scams work. I have ₹10,000 left. I have to turn it into ₹2,00,000.)',
    },
  },
};

export const scammer1: DialogueTree = {
  id: 'scammer_gold_chain',
  start: 's1',
  nodes: {
    s1: {
      speaker: 'Mr. Goldie',
      text: 'Brother! Brother! Come here. I have something special for you. Guaranteed double money in 7 days. 100% safe.',
      choices: [
        { text: '[Invest ₹5,000]', next: 's_invest' },
        { text: 'Walk away', next: 's_walk', flags: ['scam.avoided.goldie'] },
        { text: 'Ask questions', next: 's_q1' },
      ],
    },
    s_q1: {
      speaker: 'You',
      text: 'How is it guaranteed? What\'s the underlying investment?',
      next: 's_q1_reply',
    },
    s_q1_reply: {
      speaker: 'Mr. Goldie',
      text: 'Forex, crypto, stocks, everything! My team is very expert. Don\'t worry about details brother, just invest.',
      choices: [
        { text: 'Ask about registration with SEBI', next: 's_q2' },
        { text: 'Walk away', next: 's_walk_informed', flags: ['scam.avoided.goldie', 'lesson.unrealistic_returns'] },
      ],
    },
    s_q2: {
      speaker: 'You',
      text: 'Are you registered with SEBI? Show me your license.',
      next: 's_q2_reply',
    },
    s_q2_reply: {
      speaker: 'Mr. Goldie',
      text: 'Arre, SEBI-VEBI all bureaucracy. My scheme is better than any of these regulated things. Trust me, I help my brothers.',
      choices: [
        { text: 'Walk away. This is clearly a scam.', next: 's_walk_informed', flags: ['scam.avoided.goldie', 'lesson.sebi_registration', 'lesson.unrealistic_returns'] },
      ],
    },
    s_invest: {
      speaker: 'Mr. Goldie',
      text: '[7 days later... Mr. Goldie has disappeared. Phone number is switched off. Your ₹5,000 is gone.]',
      effect: { isScamAccept: true },
      next: 's_invest_lesson',
    },
    s_invest_lesson: {
      speaker: 'You',
      text: '(Lesson learned the hard way: "Guaranteed returns" is always a lie. No legitimate investment promises guaranteed high returns.)',
      flags: ['lesson.unrealistic_returns'],
    },
    s_walk: {
      speaker: 'You',
      text: '(Something felt wrong. Good instinct.)',
    },
    s_walk_informed: {
      speaker: 'You',
      text: '(Red flags spotted: guaranteed returns, no SEBI registration, pressure tactics. Classic scam.)',
    },
  },
};

export const scammer2: DialogueTree = {
  id: 'scammer_mlm',
  start: 'm1',
  nodes: {
    m1: {
      speaker: 'Priya (MLM Recruiter)',
      text: 'Hi! I saw you walking by. You look smart. Do you want to earn ₹50,000 a month from home?',
      choices: [
        { text: 'Tell me more', next: 'm2' },
        { text: 'Walk away', next: 'm_walk', flags: ['scam.avoided.mlm'] },
      ],
    },
    m2: {
      speaker: 'Priya (MLM Recruiter)',
      text: 'It\'s easy. You pay ₹15,000 joining fee. You get forex signals every day. Copy them and profit. Also, you can recruit your friends and earn 30% of their fees.',
      choices: [
        { text: 'So I earn more by recruiting than by trading?', next: 'm_q1' },
        { text: 'Where do the signals come from?', next: 'm_q2' },
        { text: 'This sounds like a pyramid scheme', next: 'm_q3', flags: ['lesson.mlm_structure'] },
      ],
    },
    m_q1: {
      speaker: 'Priya (MLM Recruiter)',
      text: 'The real money is in the team building, yes. More downline = more money.',
      choices: [
        { text: 'That\'s a pyramid scheme. Walk away.', next: 'm_walk_informed', flags: ['scam.avoided.mlm', 'lesson.mlm_structure'] },
      ],
    },
    m_q2: {
      speaker: 'Priya (MLM Recruiter)',
      text: 'Our master trader from Dubai sends them. Very high success rate, 90%!',
      choices: [
        { text: 'If his signals are 90% accurate, why does he need my ₹15,000?', next: 'm_q2_callout' },
        { text: 'Walk away', next: 'm_walk_informed', flags: ['scam.avoided.mlm'] },
      ],
    },
    m_q2_callout: {
      speaker: 'Priya (MLM Recruiter)',
      text: '[She gets defensive and changes the subject.] Anyway, the spots are limited, are you joining or not?',
      choices: [
        { text: 'Walk away. Clearly a scam.', next: 'm_walk_informed', flags: ['scam.avoided.mlm', 'lesson.mlm_red_flags'] },
      ],
    },
    m_q3: {
      speaker: 'Priya (MLM Recruiter)',
      text: 'It\'s not a pyramid! It\'s multi-level marketing. Totally legal.',
      choices: [
        { text: 'MLM that pays more for recruiting than for the "product" IS a pyramid. Walk away.', next: 'm_walk_informed', flags: ['scam.avoided.mlm', 'lesson.mlm_structure'] },
      ],
    },
    m_walk: { speaker: 'You', text: '(50K a month from home, no experience needed? Too good to be true.)' },
    m_walk_informed: { speaker: 'You', text: '(MLM warning: when the revenue comes from recruitment fees, not product sales, it\'s a pyramid scheme.)' },
  },
};

export const scammer3: DialogueTree = {
  id: 'scammer_pre_ipo',
  start: 'p1',
  nodes: {
    p1: {
      speaker: 'Rohit (Pre-IPO Salesman)',
      text: 'Psst. Bhai. Pre-IPO allocation. Tech startup, going public in 3 months at 10x. Only for insiders.',
      choices: [
        { text: 'What company?', next: 'p2' },
        { text: 'Walk away', next: 'p_walk', flags: ['scam.avoided.preIpo'] },
      ],
    },
    p2: {
      speaker: 'Rohit (Pre-IPO Salesman)',
      text: 'TechnoVision Innovations Ltd. Very hot sector — AI, blockchain, quantum. Minimum investment ₹25,000.',
      choices: [
        { text: 'Let me see their financials and DRHP', next: 'p_q1' },
        { text: 'Can I verify on the SEBI website?', next: 'p_q2' },
        { text: '[Invest ₹25,000]', next: 'p_invest' },
      ],
    },
    p_q1: {
      speaker: 'Rohit (Pre-IPO Salesman)',
      text: 'No no, all that will come later. For now trust me, my sources are inside the company.',
      choices: [
        { text: 'No DRHP = no deal. Walk away.', next: 'p_walk_informed', flags: ['scam.avoided.preIpo', 'lesson.drhp_verification'] },
      ],
    },
    p_q2: {
      speaker: 'Rohit (Pre-IPO Salesman)',
      text: '[Looks shifty.] Uhh, SEBI registration is in process. Very soon.',
      choices: [
        { text: 'Walk away. No legit pre-IPO deal happens on a street corner.', next: 'p_walk_informed', flags: ['scam.avoided.preIpo', 'lesson.preIpo_reality'] },
      ],
    },
    p_invest: {
      speaker: 'Rohit (Pre-IPO Salesman)',
      text: '[3 months later. TechnoVision Innovations does not exist. Your ₹25,000 is gone. Rohit\'s number is disconnected.]',
      effect: { isScamAccept: true },
      next: 'p_invest_lesson',
    },
    p_invest_lesson: {
      speaker: 'You',
      text: '(Legitimate pre-IPO access goes through registered intermediaries — not strangers on the street. Always verify DRHP filing on SEBI.)',
      flags: ['lesson.preIpo_reality'],
    },
    p_walk: { speaker: 'You', text: '(10x in 3 months is a red flag. Real IPOs do not work this way.)' },
    p_walk_informed: { speaker: 'You', text: '(Every legitimate IPO has a DRHP filed with SEBI. No DRHP, no deal.)' },
  },
};

export const trainStationMaster: DialogueTree = {
  id: 'train_master',
  start: 't1',
  nodes: {
    t1: {
      speaker: 'Station Master',
      text: 'You survived Scam Slum. Where to now?',
      choices: [
        { text: 'Wall Street — US equities', next: 't_wallst' },
        { text: 'Dalal Street — Indian stocks', next: 't_dalal' },
        { text: 'World Map — see all districts', next: 't_world' },
        { text: 'Not yet, I\'ll stay here', next: 't_stay' },
      ],
    },
    t_wallst: {
      speaker: 'Station Master',
      text: 'Wall Street! All 6 districts now unlocked. Press M anytime to open the World Map.',
      flags: ['unlock.wall_street', 'unlock.dalal_street', 'unlock.crypto_cove', 'unlock.quant_quarter', 'unlock.vegas_vice'],
    },
    t_dalal: {
      speaker: 'Station Master',
      text: 'Dalal Street! All 6 districts unlocked. Press M for the World Map.',
      flags: ['unlock.wall_street', 'unlock.dalal_street', 'unlock.crypto_cove', 'unlock.quant_quarter', 'unlock.vegas_vice'],
    },
    t_world: {
      speaker: 'Station Master',
      text: 'The World Map shows all 8 districts. All districts unlocked! Press M anytime to open the world map.',
      flags: ['unlock.wall_street', 'unlock.dalal_street', 'unlock.crypto_cove', 'unlock.quant_quarter', 'unlock.vegas_vice'],
    },
    t_stay: { speaker: 'Station Master', text: 'Take your time. The markets will still be here tomorrow.' },
  },
};

export const warrenBot: DialogueTree = {
  id: 'warren_bot',
  start: 'w1',
  nodes: {
    w1: {
      speaker: 'Warren-bot',
      text: 'Welcome to Wall Street. I\'m your mentor. The markets opened at 9:30 AM. What do you want to learn?',
      choices: [
        { text: 'How does a stock actually work?', next: 'w_stock' },
        { text: 'What\'s a candlestick chart?', next: 'w_candle' },
        { text: 'How do I pick a stock?', next: 'w_pick' },
        { text: 'What is a P/E ratio?', next: 'w_pe' },
      ],
    },
    w_stock: {
      speaker: 'Warren-bot',
      text: 'A stock is a tiny slice of a company. If Apple has 15 billion shares and you own 1, you own one-fifteen-billionth of Apple. You share in its profits through dividends and in its value through price appreciation.',
      next: 'w1',
    },
    w_candle: {
      speaker: 'Warren-bot',
      text: 'Each candle shows 4 numbers: Open, High, Low, Close. Green = Close > Open (price went up). Red = opposite. The thin wick is the full range. The body is open-to-close.',
      next: 'w1',
    },
    w_pick: {
      speaker: 'Warren-bot',
      text: 'Three questions: 1) Does it make money? 2) Will it make more in 10 years? 3) Is the price reasonable? Yes to all three, consider buying. Ignore tips, hype, and FOMO.',
      next: 'w1',
      flags: ['lesson.buffett_framework'],
    },
    w_pe: {
      speaker: 'Warren-bot',
      text: 'Price-to-Earnings ratio = stock price / annual earnings per share. If P/E is 20, you\'re paying ₹20 for every ₹1 of annual earnings. S&P 500 average is ~16-18. Above 25 = expensive. Below 12 = potentially cheap.',
      next: 'w1',
      flags: ['lesson.pe_ratio'],
    },
  },
};

export const satoshiBot: DialogueTree = {
  id: 'satoshi_bot',
  start: 'sb1',
  nodes: {
    sb1: {
      speaker: 'Satoshi-bot',
      text: 'Welcome to Crypto Cove. Bitcoin solved the double-spend problem. Ethereum added programmable contracts. DeFi removed the middlemen. What do you want to understand?',
      choices: [
        { text: 'What is Bitcoin actually?', next: 'sb_btc' },
        { text: 'How does an AMM work?', next: 'sb_amm' },
        { text: 'What is DeFi?', next: 'sb_defi' },
        { text: 'How do I spot a rug pull?', next: 'sb_rug' },
      ],
    },
    sb_btc: {
      speaker: 'Satoshi-bot',
      text: 'Bitcoin is a decentralized ledger. 21 million coins, ever. Every 4 years, the issuance halves ("halving"). No central bank controls it. Value comes from scarcity + trustless settlement + global censorship resistance.',
      next: 'sb1',
      flags: ['lesson.bitcoin_basics'],
    },
    sb_amm: {
      speaker: 'Satoshi-bot',
      text: 'AMM = Automated Market Maker. Formula: x × y = k. Two tokens in a pool; their product stays constant. To buy Token A, you add Token B, which raises A\'s price. Slippage increases with trade size vs pool depth.',
      next: 'sb1',
      flags: ['lesson.amm_formula'],
    },
    sb_defi: {
      speaker: 'Satoshi-bot',
      text: 'DeFi replaces banks with smart contracts. You can lend (earn interest), borrow (post collateral), trade (via DEX), and farm yield (provide liquidity). Risk: smart contract bugs, oracle manipulation, impermanent loss.',
      next: 'sb1',
      flags: ['lesson.defi_basics'],
    },
    sb_rug: {
      speaker: 'Satoshi-bot',
      text: 'Rug pull red flags: anonymous team, no audit, mint function not renounced, ownership not transferred to null address, sudden huge volume from 1-2 wallets. Also: fake Twitter followers, no locked liquidity.',
      next: 'sb1',
      flags: ['lesson.rug_pull_detection'],
    },
  },
};

export const rugPullScammer: DialogueTree = {
  id: 'rug_pull_scammer',
  start: 'rp1',
  nodes: {
    rp1: {
      speaker: 'CryptoKing99',
      text: 'Bro! MoonCoin 🚀🚀🚀 is going to 100x. I\'m the dev. Whitepaper coming soon. Audit coming soon. Liquidity locked. Just buy and hold!',
      choices: [
        { text: 'Can I see the smart contract?', next: 'rp_contract' },
        { text: 'Who is on the team?', next: 'rp_team' },
        { text: '[Buy 1 ETH of MoonCoin]', next: 'rp_invest' },
        { text: 'Walk away', next: 'rp_walk', flags: ['scam.avoided.rugpull'] },
      ],
    },
    rp_contract: {
      speaker: 'CryptoKing99',
      text: 'The contract is on Etherscan but the code is complex. Trust me bro. Dev is known in the space.',
      choices: [
        { text: 'I read the contract. It has a mint() function.', next: 'rp_contract_callout' },
        { text: 'Walk away', next: 'rp_walk', flags: ['scam.avoided.rugpull', 'lesson.mint_function'] },
      ],
    },
    rp_contract_callout: {
      speaker: 'CryptoKing99',
      text: '[Defensive] Mint function is for future development only bro! Very common in legit projects!',
      choices: [
        { text: 'Unlimited mint = infinite dilution. Walk away.', next: 'rp_walk', flags: ['scam.avoided.rugpull', 'lesson.mint_function'] },
      ],
    },
    rp_team: {
      speaker: 'CryptoKing99',
      text: 'Team is anonymous for security. You know how it is in crypto. Privacy is a right.',
      choices: [
        { text: 'Anonymous team with no audits is maximum risk.', next: 'rp_walk', flags: ['scam.avoided.rugpull', 'lesson.anon_team_risk'] },
        { text: '[Buy anyway]', next: 'rp_invest' },
      ],
    },
    rp_invest: {
      speaker: 'CryptoKing99',
      text: '[3 days later. CryptoKing99 drained the liquidity pool at 3 AM. MoonCoin is worth $0. Your ETH is gone. Dev wallet shows 47 previous rugs.]',
      effect: { isScamAccept: true },
      next: 'rp_lesson',
    },
    rp_lesson: {
      speaker: 'You',
      text: '(Rug pull anatomy: mint function + anonymous team + no audit + artificial hype = exit scam. Always check Etherscan, always check liquidity lock.)',
      flags: ['lesson.rug_pull_mechanics'],
    },
    rp_walk: {
      speaker: 'You',
      text: '(Red flags: anonymous devs, unaudited contracts, mint function. Never invest in unaudited contracts.)',
    },
  },
};

export const rugPullLesson: DialogueTree = {
  id: 'rug_pull_lesson',
  start: 'rl1',
  nodes: {
    rl1: {
      speaker: '[Rug Pull Simulator]',
      text: 'You\'ve entered the Rug Pull Simulator. 85% of new crypto tokens are scams. Here are the 5 checks before any DeFi investment.',
      next: 'rl2',
    },
    rl2: {
      speaker: 'Check 1',
      text: 'CONTRACT AUDIT: Is the contract audited by Certik, OpenZeppelin, or Hacken? Look for the audit on the audit firm\'s website (not just the project\'s claims).',
      next: 'rl3',
    },
    rl3: {
      speaker: 'Check 2',
      text: 'LIQUIDITY LOCK: Is LP locked for 12+ months on Unicrypt or Team.Finance? If not, devs can drain in seconds.',
      next: 'rl4',
    },
    rl4: {
      speaker: 'Check 3',
      text: 'OWNERSHIP RENOUNCED: Is the contract owner the null address (0x000...)? If one wallet owns it, one person can change the rules.',
      next: 'rl5',
    },
    rl5: {
      speaker: 'Check 4',
      text: 'TOKENOMICS: What % do devs hold? If the team holds 30%+ of supply and it\'s unlocked, that\'s a sell button pointed at your face.',
      next: 'rl6',
    },
    rl6: {
      speaker: 'Check 5',
      text: 'SOCIAL PROOF: Real community or bought followers? Check Twitter audit tools. Are Telegram members bots? When was the domain registered?',
      flags: ['lesson.rug_pull_checklist'],
    },
  },
};

export const nftLesson: DialogueTree = {
  id: 'nft_lesson',
  start: 'nft1',
  nodes: {
    nft1: {
      speaker: '[NFT Gallery]',
      text: 'An NFT (Non-Fungible Token) is a unique token on a blockchain that proves ownership of a digital asset.',
      next: 'nft2',
    },
    nft2: {
      speaker: '[NFT Gallery]',
      text: 'Key fact: the NFT is NOT the image. The image lives on a server (or IPFS). The NFT is a certificate of ownership. If the server goes down, your "ownership" is of a broken link.',
      next: 'nft3',
    },
    nft3: {
      speaker: '[NFT Gallery]',
      text: 'NFT value drivers: royalty mechanics, creator reputation, utility (access, governance), and community. Most NFTs went to zero in 2022-2023. Do not buy JPEGs expecting investment returns.',
      flags: ['lesson.nft_basics'],
    },
  },
};

export const defiExplanation: DialogueTree = {
  id: 'defi_explanation',
  start: 'df1',
  nodes: {
    df1: {
      speaker: 'DeFi Dave',
      text: 'Yield farming is providing liquidity to a DEX pool and earning trading fees. The "yield" sounds great — but beware impermanent loss.',
      choices: [
        { text: 'What is impermanent loss?', next: 'df_il' },
        { text: 'What APY is realistic?', next: 'df_apy' },
      ],
    },
    df_il: {
      speaker: 'DeFi Dave',
      text: 'If you provide ETH/USDC liquidity and ETH price moves significantly, you end up with less than if you just held. The loss is "impermanent" only if prices revert — otherwise it\'s permanent.',
      next: 'df1',
      flags: ['lesson.impermanent_loss'],
    },
    df_apy: {
      speaker: 'DeFi Dave',
      text: 'Real sustained APY from fees: 5-20% on major pairs (ETH/USDC). If APY shows 1000%+, that\'s new token emissions that will inflate to zero. Farm and dump the reward token quickly — you\'re competing with everyone else doing the same.',
      flags: ['lesson.yield_farming_reality'],
    },
  },
};

export const quantMentor: DialogueTree = {
  id: 'quant_mentor',
  start: 'qm1',
  nodes: {
    qm1: {
      speaker: 'Dr. Simons',
      text: 'At Quant Quarter we believe: what cannot be measured cannot be managed. What do you want to quantify?',
      choices: [
        { text: 'What is Sharpe Ratio?', next: 'qm_sharpe' },
        { text: 'How does backtesting work?', next: 'qm_backtest' },
        { text: 'What is alpha vs beta?', next: 'qm_alpha' },
        { text: 'Explain Monte Carlo simulation', next: 'qm_mc' },
      ],
    },
    qm_sharpe: {
      speaker: 'Dr. Simons',
      text: 'Sharpe Ratio = (Return - Risk-Free Rate) / Volatility. Above 1.0 = good. Above 2.0 = excellent. Below 0 = you\'d be better in a savings account. Renaissance Medallion averages ~3.0. S&P 500 is ~0.5.',
      next: 'qm1',
      flags: ['lesson.sharpe_ratio'],
    },
    qm_backtest: {
      speaker: 'Dr. Simons',
      text: 'Backtesting = testing your strategy on historical data. Key warnings: overfitting (strategy only works on the data you tested), look-ahead bias (using future data accidentally), and survivorship bias (only testing stocks that survived).',
      next: 'qm1',
      flags: ['lesson.backtesting'],
    },
    qm_alpha: {
      speaker: 'Dr. Simons',
      text: 'Beta = market exposure. If beta is 1.2, your portfolio moves 1.2x with the market. Alpha = excess return above what beta explains. True alpha is rare. Most "alpha" is hidden beta or fees not accounted for.',
      next: 'qm1',
      flags: ['lesson.alpha_beta'],
    },
    qm_mc: {
      speaker: 'Dr. Simons',
      text: 'Monte Carlo = run your strategy 10,000 times with random inputs sampled from historical distributions. The distribution of outcomes tells you not just the expected return, but the 5th percentile (worst case) scenario. Manage for the worst case.',
      next: 'qm1',
      flags: ['lesson.monte_carlo'],
    },
  },
};

export const algoExplanation: DialogueTree = {
  id: 'algo_explanation',
  start: 'ae1',
  nodes: {
    ae1: {
      speaker: 'AlgoBot',
      text: 'Algorithmic trading is executing rules with no human emotion. My current strategy: buy when RSI < 30 (oversold), sell when RSI > 70 (overbought). It beats random trading but underperforms buy-and-hold in strong bull markets.',
      choices: [
        { text: 'What is RSI?', next: 'ae_rsi' },
        { text: 'What strategies exist?', next: 'ae_strategies' },
      ],
    },
    ae_rsi: {
      speaker: 'AlgoBot',
      text: 'RSI = Relative Strength Index, 0-100. Above 70: overbought (may pull back). Below 30: oversold (may bounce). The trick: in strong trends, RSI can stay above 70 for months. Don\'t fight the trend.',
      flags: ['lesson.rsi'],
    },
    ae_strategies: {
      speaker: 'AlgoBot',
      text: 'Main algo families: Mean Reversion (prices return to average), Momentum (winners keep winning), Statistical Arbitrage (exploit correlations between assets), Market Making (profit from bid-ask spread). Each requires different market conditions to work.',
      flags: ['lesson.algo_strategies'],
    },
  },
};

export const backtestLesson: DialogueTree = {
  id: 'backtest_lesson',
  start: 'bl1',
  nodes: {
    bl1: {
      speaker: '[Backtest Lab]',
      text: 'Backtesting gives you a performance report of how a strategy WOULD have done in the past. Three lies to watch for:',
      next: 'bl2',
    },
    bl2: {
      speaker: 'Lie #1: Overfitting',
      text: 'If you test 1,000 parameter combinations and pick the best one, of course it looks great — it was curve-fitted to the data. Test on "out-of-sample" data you never touched during development.',
      next: 'bl3',
    },
    bl3: {
      speaker: 'Lie #2: Transaction Costs',
      text: 'If you\'re trading frequently, each trade has a spread, commission, and slippage. A strategy with 5 trades/day at 0.1% friction costs 1.25%/month before making anything.',
      next: 'bl4',
    },
    bl4: {
      speaker: 'Lie #3: Maximum Drawdown',
      text: 'The backtest might show 30% annual returns, but it also shows a 60% drawdown in 2008. Could you watch your portfolio fall 60% without selling? If not, that strategy will destroy you emotionally.',
      flags: ['lesson.backtest_lies'],
    },
  },
};

export const riskManagement: DialogueTree = {
  id: 'risk_management',
  start: 'rm1',
  nodes: {
    rm1: {
      speaker: '[Risk Engine]',
      text: 'The three rules of risk management that pro traders live by:',
      next: 'rm2',
    },
    rm2: {
      speaker: 'Rule 1: Position Sizing',
      text: 'Never risk more than 1-2% of total capital on a single trade. If you have ₹1,00,000 and set a stop at 10% below entry, max position size = ₹10,000-20,000. This way 10 losses in a row = 10-20% drawdown, not bankruptcy.',
      next: 'rm3',
    },
    rm3: {
      speaker: 'Rule 2: Correlation',
      text: 'Owning 5 tech stocks isn\'t diversification — they all fall together. True diversification = assets with low correlation: stocks, bonds, real estate, commodities. When stocks fall 40%, gold and bonds often rise.',
      next: 'rm4',
    },
    rm4: {
      speaker: 'Rule 3: Stress Testing',
      text: 'Ask: "What happens to my portfolio in 2008, 2020, 1987?" Model it. If the answer is "I lose 80%", restructure now. The market will eventually give you its worst. Be ready for it.',
      flags: ['lesson.risk_management'],
    },
  },
};

export const probabilityLesson: DialogueTree = {
  id: 'probability_lesson',
  start: 'pl1',
  nodes: {
    pl1: {
      speaker: '[Grand Casino]',
      text: 'Welcome to the Probability Lab. Every game here demonstrates a real mathematical concept. The casino always wins in the long run. Here\'s why:',
      next: 'pl2',
    },
    pl2: {
      speaker: 'The Math',
      text: 'European roulette: 37 slots (0-36). Bet on black: 18/37 = 48.6% win chance. Payout 1:1. Expected value = (18/37 × 1) + (19/37 × -1) = -0.027. The house takes 2.7 cents per dollar bet. Every single spin.',
      next: 'pl3',
    },
    pl3: {
      speaker: 'The Math',
      text: 'The Law of Large Numbers: the more you play, the closer your results approach the expected value. In 100 spins, you might be up. In 100,000 spins, you will be very close to -2.7%. The house has infinite time. You don\'t.',
      next: 'pl4',
    },
    pl4: {
      speaker: 'The Lesson',
      text: 'Any game with negative expected value will drain you eventually. The only winning strategy: don\'t play. Apply this to: lottery tickets, sports betting (without edge), any trade where you don\'t understand your edge.',
      flags: ['lesson.expected_value'],
    },
  },
};

export const kellyCriterionLesson: DialogueTree = {
  id: 'kelly_criterion_lesson',
  start: 'kc1',
  nodes: {
    kc1: {
      speaker: '[Sports Book]',
      text: 'The Kelly Criterion answers: "Given I have a known edge, how much should I bet?" Formula: f* = (bp - q) / b. Where b = odds, p = win probability, q = 1-p.',
      next: 'kc2',
    },
    kc2: {
      speaker: 'Example',
      text: 'You find a coin that lands heads 55% of the time. Even-money bet (b=1). Kelly says: f* = (1×0.55 - 0.45) / 1 = 10%. Bet 10% of your bankroll per flip. Bet more and variance destroys you. Bet less and you sub-optimize.',
      next: 'kc3',
    },
    kc3: {
      speaker: 'In Practice',
      text: 'Most pros use "half-Kelly" (5% in this case) to account for estimation errors. A stock pick where you\'re 55% confident with 2:1 upside: Kelly says ~20% of portfolio. Sounds high, but Kelly math is sound.',
      flags: ['lesson.kelly_criterion'],
    },
  },
};

export const pokerLesson: DialogueTree = {
  id: 'poker_lesson',
  start: 'po1',
  nodes: {
    po1: {
      speaker: '[Poker Room]',
      text: 'Pot odds: if there\'s ₹100 in the pot and your opponent bets ₹50, you face a ₹50 call for a ₹150 pot. You need 50/150 = 33% equity to call profitably.',
      next: 'po2',
    },
    po2: {
      speaker: 'The Connection to Investing',
      text: 'Investors use the same math. "Implied odds" = what does the stock price imply about future growth? If a stock trades at 40x earnings, the market prices in ~15% growth forever. Agree? Buy. Disagree? Don\'t.',
      next: 'po3',
    },
    po3: {
      speaker: 'Poker vs Investing',
      text: 'Unlike poker, you can fold your position at any time in markets. Unlike markets, poker has a finite game. The key crossover: both reward correct long-term decision-making, not short-term results. Bad decisions sometimes win. Good decisions always win eventually.',
      flags: ['lesson.pot_odds'],
    },
  },
};

export const probabilityMentor: DialogueTree = {
  id: 'probability_mentor',
  start: 'pm1',
  nodes: {
    pm1: {
      speaker: 'Prof. Pascal',
      text: 'I\'m Pascal, Professor of Probability. Most people confuse "possible" with "probable." What do you want to understand?',
      choices: [
        { text: 'Explain gambler\'s fallacy', next: 'pm_gf' },
        { text: 'What is base rate neglect?', next: 'pm_br' },
        { text: 'Explain standard deviation', next: 'pm_sd' },
      ],
    },
    pm_gf: {
      speaker: 'Prof. Pascal',
      text: 'Gambler\'s Fallacy: thinking past outcomes influence future independent events. "Black came up 10 times, so red is due!" No. Each spin is independent. A roulette wheel has no memory. Neither does a stock on Monday.',
      next: 'pm1',
      flags: ['lesson.gamblers_fallacy'],
    },
    pm_br: {
      speaker: 'Prof. Pascal',
      text: 'Base Rate Neglect: ignoring the prior probability. "This startup has a great team, they\'ll succeed!" Base rate: 90% of startups fail in 10 years. Your gut feeling vs. a 90% failure rate — which should weigh more?',
      next: 'pm1',
      flags: ['lesson.base_rate'],
    },
    pm_sd: {
      speaker: 'Prof. Pascal',
      text: 'Standard deviation measures spread. A stock with 30% annual volatility: in a typical year, expect returns within ±30% of average. In 68% of years (1σ). In 95% of years, within ±60% (2σ). This is why "safe" 30% volatility assets can still lose 60% in a bad year.',
      next: 'pm1',
      flags: ['lesson.standard_deviation'],
    },
  },
};

export const gamblersFallacy: DialogueTree = {
  id: 'gamblers_fallacy',
  start: 'gf1',
  nodes: {
    gf1: {
      speaker: 'Lucky Larry',
      text: 'I\'ve been playing roulette for 6 hours. Lost 15 times in a row. Statistically, I MUST win now. The table is due for red. Are you in?',
      choices: [
        { text: 'Yes, the table is due!', next: 'gf_wrong' },
        { text: 'No. Each spin is independent.', next: 'gf_right', flags: ['lesson.gamblers_fallacy'] },
      ],
    },
    gf_wrong: {
      speaker: 'Lucky Larry',
      text: '[8 more spins. 8 more losses.] I... I don\'t understand. It HAD to come up red...',
      next: 'gf_lesson',
    },
    gf_lesson: {
      speaker: 'You',
      text: '(The wheel has no memory. 15 losses don\'t change the odds of spin 16. This fallacy has bankrupted more gamblers than any bad hand. Each event is independent.)',
      flags: ['lesson.gamblers_fallacy'],
    },
    gf_right: {
      speaker: 'Lucky Larry',
      text: 'Are you sure? The last 15 spins were black... [He keeps playing. Eventually leaves broke.] You saved your money.',
      flags: ['lesson.gamblers_fallacy'],
    },
  },
};

export const houseEdgeLesson: DialogueTree = {
  id: 'house_edge_lesson',
  start: 'he1',
  nodes: {
    he1: {
      speaker: 'The House',
      text: 'Welcome, player. I always win. Want to know why? Because I have a mathematical edge in every single game.',
      choices: [
        { text: 'What\'s your edge in blackjack?', next: 'he_bj' },
        { text: 'What about poker?', next: 'he_poker' },
        { text: 'What\'s the connection to trading?', next: 'he_trading' },
      ],
    },
    he_bj: {
      speaker: 'The House',
      text: 'Blackjack: ~0.5% edge if you play perfect basic strategy. Without card counting, ~1-3%. Over millions of hands, that\'s billions. The edge isn\'t big — I just need time and volume.',
      next: 'he1',
    },
    he_poker: {
      speaker: 'The House',
      text: 'In poker, I\'m not your opponent. I take the "rake" — 3-5% of each pot. I win whether you win or lose. Becoming a profitable poker player means beating the other players AND paying my rake.',
      next: 'he1',
    },
    he_trading: {
      speaker: 'The House',
      text: 'In trading, I\'m your broker. Every trade has a spread. ETF has a management fee. Your fund manager takes 2% and 20% of profits. High-frequency traders front-run your orders. To win long-term, you must overcome ALL of these costs.',
      next: 'he1',
      flags: ['lesson.trading_costs'],
    },
  },
};

export const sensexMentor: DialogueTree = {
  id: 'sensex_mentor',
  start: 'sm1',
  nodes: {
    sm1: {
      speaker: 'Radhakrishnan',
      text: 'Namaste! I\'ve traded on Dalal Street for 30 years. Before we trade, you must understand the basics. What do you want to know?',
      choices: [
        { text: 'What is the Sensex?', next: 'sm_sensex' },
        { text: 'NSE vs BSE?', next: 'sm_exchanges' },
        { text: 'What is F&O?', next: 'sm_fo' },
        { text: 'How are IPOs in India different?', next: 'sm_ipo' },
      ],
    },
    sm_sensex: {
      speaker: 'Radhakrishnan',
      text: 'Sensex = 30 largest companies on BSE. Like the Dow Jones but for India. Nifty 50 = 50 companies on NSE. When news says "market up 200 points," they usually mean Sensex. It started at 100 in 1979 — today it\'s over 70,000. That\'s a 700x return in 45 years.',
      next: 'sm1',
      flags: ['lesson.sensex_basics'],
    },
    sm_exchanges: {
      speaker: 'Radhakrishnan',
      text: 'BSE is older (1875) and has 5,000+ companies. NSE is newer (1992) but dominates trading volume. Most retail traders use NSE. Prices are nearly identical due to arbitrage. Use NSE for futures/options — deeper liquidity.',
      next: 'sm1',
      flags: ['lesson.nse_bse'],
    },
    sm_fo: {
      speaker: 'Radhakrishnan',
      text: 'F&O = Futures & Options. Derivatives — their value derives from an underlying stock or index. High leverage, high risk. 90%+ of retail F&O traders lose money. SEBI data proves this. Learn equities first. Master them. Only then consider F&O.',
      next: 'sm1',
      flags: ['lesson.fo_risk'],
    },
    sm_ipo: {
      speaker: 'Radhakrishnan',
      text: 'India IPO process: company files DRHP with SEBI → 21-day comment period → price band announced → 3-day bidding window → allotment by lottery for retail investors → listing. Grey market premium predicts but doesn\'t guarantee listing gains.',
      next: 'sm1',
      flags: ['lesson.india_ipo'],
    },
  },
};

export const harshadWarning: DialogueTree = {
  id: 'harshad_warning',
  start: 'hw1',
  nodes: {
    hw1: {
      speaker: 'The Big Bull',
      text: '(This NPC is a ghostly echo of Harshad Mehta, who manipulated the Bombay stock market in 1992.) "The market is a game of perception. If everyone believes the price will go up, it will go up... for a while."',
      choices: [
        { text: 'Tell me about the 1992 scam', next: 'hw_scam' },
        { text: 'What was the BR deal?', next: 'hw_br' },
      ],
    },
    hw_scam: {
      speaker: 'The Big Bull',
      text: 'I used "ready forward" deals — short-term bank loans — to siphon money from banks into the stock market. Used the cash to pump stocks like ACC from ₹200 to ₹9,000. When the scam broke in April 1992, the market crashed 50%. I died in jail. The lesson: fraud built on other people\'s money always collapses.',
      next: 'hw1',
      flags: ['lesson.harshad_scam'],
    },
    hw_br: {
      speaker: 'The Big Bull',
      text: 'BR = Bank Receipt. I forged bank receipts to borrow money from banks using phantom securities. Banks thought they held collateral. They held nothing. 28 banks were defrauded. Lesson: Always verify collateral. Always question "too smooth" returns.',
      flags: ['lesson.br_fraud'],
    },
  },
};

export const foExplanation: DialogueTree = {
  id: 'fo_explanation',
  start: 'fe1',
  nodes: {
    fe1: {
      speaker: 'Ramesh (Trader)',
      text: 'I\'ve been trading F&O for 3 years. Lost ₹8 lakh. Want to know what I wish I knew?',
      choices: [
        { text: 'Yes, tell me everything', next: 'fe_lessons' },
        { text: 'What is a call option?', next: 'fe_call' },
      ],
    },
    fe_lessons: {
      speaker: 'Ramesh (Trader)',
      text: '1) Options expire worthless 75% of the time for buyers. 2) Selling options is like collecting insurance premiums — works until it doesn\'t. 3) Never risk more than you can afford to lose. 4) SEBI shows 9 out of 10 F&O traders lose money. Be the 1, not the 9.',
      next: 'fe1',
      flags: ['lesson.fo_reality'],
    },
    fe_call: {
      speaker: 'Ramesh (Trader)',
      text: 'Call option: the right (not obligation) to buy 100 shares at a "strike price" before expiry. You pay a premium. If the stock goes above strike + premium, you profit. If not, premium is lost. Maximum loss = premium paid. Maximum gain = unlimited.',
      next: 'fe1',
      flags: ['lesson.call_option'],
    },
  },
};

export const nsevsBSE: DialogueTree = {
  id: 'nse_vs_bse',
  start: 'nb1',
  nodes: {
    nb1: {
      speaker: '[NSE Building]',
      text: 'NSE (National Stock Exchange) was founded in 1992 to bring technology and transparency to Indian markets.',
      next: 'nb2',
    },
    nb2: {
      speaker: '[NSE Building]',
      text: 'NSE innovations: electronic trading (replaced open outcry), T+1 settlement (vs T+2 globally), derivatives market (India is now world\'s largest derivatives market by contracts).',
      next: 'nb3',
    },
    nb3: {
      speaker: '[NSE Building]',
      text: 'Key NSE indices: NIFTY 50 (top 50), Bank NIFTY (banking sector), NIFTY IT (technology), NIFTY Midcap. Futures and options on all indices trade daily with enormous volume.',
      flags: ['lesson.nse_basics'],
    },
  },
};

export const sebiExplanation: DialogueTree = {
  id: 'sebi_explanation',
  start: 'se1',
  nodes: {
    se1: {
      speaker: '[SEBI Office]',
      text: 'SEBI = Securities and Exchange Board of India. Founded 1992. Equivalent of SEC in the USA.',
      next: 'se2',
    },
    se2: {
      speaker: '[SEBI Office]',
      text: 'SEBI protects investors by: 1) Regulating exchanges, brokers, and mutual funds. 2) Mandating disclosures for listed companies. 3) Prosecuting insider trading and market manipulation.',
      next: 'se3',
    },
    se3: {
      speaker: '[SEBI Office]',
      text: 'Red flags that violate SEBI rules: guaranteed returns (no investment can guarantee returns), unsolicited tips, unregistered advisors. Check SEBI registration at sebi.gov.in before following any financial advice.',
      flags: ['lesson.sebi_role'],
    },
  },
};

export const ipoLesson: DialogueTree = {
  id: 'ipo_lesson',
  start: 'il1',
  nodes: {
    il1: {
      speaker: '[IPO Window]',
      text: 'IPO = Initial Public Offering. A company sells shares to the public for the first time to raise capital.',
      next: 'il2',
    },
    il2: {
      speaker: '[IPO Window]',
      text: 'Process: 1) Company files DRHP (Draft Red Herring Prospectus) with SEBI. 2) Banks underwrite the offering. 3) Price band set. 4) 3-day application window. 5) Allotment. 6) Listing.',
      next: 'il3',
    },
    il3: {
      speaker: '[IPO Window]',
      text: 'IPO investing risk: companies go public when insiders want to sell at high prices. Retail investors often get allocation in weak IPOs (oversubscribed ones allocate by lottery). Study the DRHP financials, especially revenue growth and profit margins — not just the hype.',
      flags: ['lesson.ipo_process'],
    },
  },
};

export const discountBrokerLesson: DialogueTree = {
  id: 'discount_broker_lesson',
  start: 'db1',
  nodes: {
    db1: {
      speaker: '[Zerodha]',
      text: 'Zerodha pioneered discount broking in India — flat ₹20/trade vs 0.5% at traditional brokers. On a ₹1,00,000 trade, you save ₹480 per trade. Over 100 trades a year, that\'s ₹48,000 saved.',
      next: 'db2',
    },
    db2: {
      speaker: '[Zerodha]',
      text: 'Broker comparison checklist: 1) Brokerage per trade, 2) Demat account charges, 3) Platform quality (charts, screeners), 4) Margin rates, 5) Customer service speed during crashes.',
      next: 'db3',
    },
    db3: {
      speaker: '[Zerodha]',
      text: 'Your broker makes money from: brokerage, STT (Securities Transaction Tax), exchange fees, float on your idle cash. Always read the fee schedule before opening an account.',
      flags: ['lesson.broker_fees'],
    },
  },
};

export const dalalChaiwala: DialogueTree = {
  id: 'dalal_chaiwala',
  start: 'c1',
  nodes: {
    c1: {
      speaker: 'Ramesh the Chaiwala',
      text: 'Cutting chai? Five rupees only! Best rate-of-return in Dalal Street, I tell you!',
      choices: [
        { text: 'How is the market today, Ramesh?', next: 'c_mkt' },
        { text: 'Why do you call it rate of return?', next: 'c_ror' },
        { text: 'Maybe later.', next: 'c_bye' },
      ],
    },
    c_mkt: {
      speaker: 'Ramesh',
      text: 'Sahib, when traders frown they buy two chais. When they smile they buy one. Today — they bought four. Market is volatile, na?',
      next: 'c_lesson',
    },
    c_ror: {
      speaker: 'Ramesh',
      text: 'Five rupees in, two hours of energy out. Better Sharpe ratio than half these "tipster" calls on Telegram!',
      next: 'c_lesson',
    },
    c_lesson: {
      speaker: 'Ramesh',
      text: 'Lesson: Sentiment shows up in odd places. Watch the chaiwala, not just the ticker.',
      flags: ['lesson.sentiment_signal'],
    },
    c_bye: {
      speaker: 'Ramesh',
      text: 'Chai is patient. Like a long-term investor.',
    },
  },
};

export const wallStreetCabbie: DialogueTree = {
  id: 'wallstreet_cabbie',
  start: 't1',
  nodes: {
    t1: {
      speaker: 'NYC Cabbie',
      text: 'You headed to the Exchange? Buckle up. I\'ve been driving these streets since the \'87 crash.',
      choices: [
        { text: 'Tell me about \'87.', next: 't_87' },
        { text: 'What do drivers know about markets?', next: 't_know' },
        { text: 'Just drop me at the bull statue.', next: 't_bye' },
      ],
    },
    t_87: {
      speaker: 'Cabbie',
      text: 'Black Monday. Dow dropped 22% in one day. My fares triple-tipped because nobody could afford to lose me. Markets always come back — but you have to still be in business when they do.',
      next: 't_lesson',
    },
    t_know: {
      speaker: 'Cabbie',
      text: 'I overhear ten executives a day. When they switch from talking deals to talking weather — sell. When they\'re bragging about their boats — definitely sell.',
      next: 't_lesson',
    },
    t_lesson: {
      speaker: 'Cabbie',
      text: 'Lesson: Survival > heroics. Position size so a crash doesn\'t put you out of the game.',
      flags: ['lesson.survival_first'],
    },
    t_bye: {
      speaker: 'Cabbie',
      text: 'Bull statue\'s overrated. The Charging Bull was guerrilla art. So is most of trading.',
    },
  },
};

export const cryptoSurfer: DialogueTree = {
  id: 'crypto_surfer',
  start: 's1',
  nodes: {
    s1: {
      speaker: 'Surfer Sam',
      text: 'Yo, dude. The blockchain\'s got that *swell* today. You catching the wave or watching from shore?',
      choices: [
        { text: 'What\'s a "good wave" in crypto?', next: 's_wave' },
        { text: 'Heard about the Mt.Gox hack?', next: 's_gox' },
        { text: 'Catch you later, Sam.', next: 's_bye' },
      ],
    },
    s_wave: {
      speaker: 'Sam',
      text: 'A real one has volume + on-chain activity + new addresses. The fakes are pure Twitter hype. Don\'t paddle out for a Twitter wave, brah.',
      next: 's_lesson',
    },
    s_gox: {
      speaker: 'Sam',
      text: '850,000 BTC vanished in 2014. Lesson: "Not your keys, not your coins." If you can\'t move it, you don\'t own it.',
      next: 's_lesson',
    },
    s_lesson: {
      speaker: 'Sam',
      text: 'Lesson: Self-custody = real ownership. Cold wallet > hot wallet > exchange.',
      flags: ['lesson.self_custody'],
    },
    s_bye: {
      speaker: 'Sam',
      text: 'Stay liquid, my friend. Both kinds.',
    },
  },
};

export const quantIntern: DialogueTree = {
  id: 'quant_intern',
  start: 'q1',
  nodes: {
    q1: {
      speaker: 'Priya the Intern',
      text: 'Hi! I\'m running a 200-day moving-average backtest. Want to hear my preliminary findings?',
      choices: [
        { text: 'Sure, what did you find?', next: 'q_find' },
        { text: 'How do you avoid overfitting?', next: 'q_overfit' },
        { text: 'Maybe later, Priya.', next: 'q_bye' },
      ],
    },
    q_find: {
      speaker: 'Priya',
      text: 'On 20 years of S&P data: simple 200-DMA crossover beat buy-and-hold... only after fees, on 8 of 12 datasets. The takeaway: anything that "always works" probably has a bug.',
      next: 'q_lesson',
    },
    q_overfit: {
      speaker: 'Priya',
      text: 'I split data: 70% train, 15% validate, 15% out-of-sample. If a strategy only works in train, it\'s memorising noise — not learning the market.',
      next: 'q_lesson',
    },
    q_lesson: {
      speaker: 'Priya',
      text: 'Lesson: Out-of-sample testing is everything. A backtest that predicts the past is just a story.',
      flags: ['lesson.out_of_sample'],
    },
    q_bye: {
      speaker: 'Priya',
      text: 'I\'ll be here. Probably re-running the same backtest.',
    },
  },
};

export const vegasMagician: DialogueTree = {
  id: 'vegas_magician',
  start: 'v1',
  nodes: {
    v1: {
      speaker: 'The Amazing Vinod',
      text: 'Pick a card, friend. Any card. Now — would you like the *honest* odds, or the *casino\'s* odds?',
      choices: [
        { text: 'Honest, please.', next: 'v_honest' },
        { text: 'What\'s the difference?', next: 'v_diff' },
        { text: 'I\'ll keep my wallet, thanks.', next: 'v_bye' },
      ],
    },
    v_honest: {
      speaker: 'Vinod',
      text: 'In a fair 52-card deck, you have a 1/52 chance to predict any card. The casino prices games to give them an edge of 1–15% per bet. Multiply that by hundreds of bets and... well, here I am working at a casino.',
      next: 'v_lesson',
    },
    v_diff: {
      speaker: 'Vinod',
      text: 'Honest odds say "you will lose 5% per round." Casino odds say "feel the rush!" Same probability — different framing.',
      next: 'v_lesson',
    },
    v_lesson: {
      speaker: 'Vinod',
      text: 'Lesson: Expected value lives in math. Excitement lives in marketing.',
      flags: ['lesson.expected_value_framing'],
    },
    v_bye: {
      speaker: 'Vinod',
      text: 'Smart. The best magic trick is keeping your money.',
    },
  },
};

export const slumNewspaperKid: DialogueTree = {
  id: 'slum_newspaper_kid',
  start: 'k1',
  nodes: {
    k1: {
      speaker: 'Newspaper Boy',
      text: 'Today\'s headline: "MIRACLE STOCK DOUBLES OVERNIGHT!" Want a paper, sahib? Five rupees!',
      choices: [
        { text: 'Is the headline real?', next: 'k_real' },
        { text: 'Why are you selling those?', next: 'k_why' },
        { text: 'No thanks, kid.', next: 'k_bye' },
      ],
    },
    k_real: {
      speaker: 'Newspaper Boy',
      text: 'Real? It says it on the paper, no? But papa says headlines that scream are the cheapest to print. The boring stories — those are the true ones.',
      next: 'k_lesson',
    },
    k_why: {
      speaker: 'Newspaper Boy',
      text: 'Five rupees a paper, twenty papers a day. Hundred rupees, every day. No "guaranteed double" — but every day, hundred rupees. That is also a return, no?',
      next: 'k_lesson',
    },
    k_lesson: {
      speaker: 'Newspaper Boy',
      text: 'Lesson: Steady, boring income compounds. Loud headlines lose money.',
      flags: ['lesson.boring_compounds'],
    },
    k_bye: {
      speaker: 'Newspaper Boy',
      text: 'Sahib, save your five rupees for a chai. Better deal!',
    },
  },
};

export const allDialogues: Record<string, DialogueTree> = {

  mom_call: momCall,
  scammer_gold_chain: scammer1,
  scammer_mlm: scammer2,
  scammer_pre_ipo: scammer3,
  train_master: trainStationMaster,
  slum_newspaper_kid: slumNewspaperKid,

  warren_bot: warrenBot,
  wallstreet_cabbie: wallStreetCabbie,

  satoshi_bot: satoshiBot,
  rug_pull_scammer: rugPullScammer,
  rug_pull_lesson: rugPullLesson,
  nft_lesson: nftLesson,
  defi_explanation: defiExplanation,
  crypto_surfer: cryptoSurfer,

  quant_mentor: quantMentor,
  algo_explanation: algoExplanation,
  backtest_lesson: backtestLesson,
  risk_management: riskManagement,
  quant_intern: quantIntern,

  probability_lesson: probabilityLesson,
  kelly_criterion_lesson: kellyCriterionLesson,
  poker_lesson: pokerLesson,
  probability_mentor: probabilityMentor,
  gamblers_fallacy: gamblersFallacy,
  house_edge_lesson: houseEdgeLesson,
  vegas_magician: vegasMagician,

  sensex_mentor: sensexMentor,
  harshad_warning: harshadWarning,
  fo_explanation: foExplanation,
  nse_vs_bse: nsevsBSE,
  sebi_explanation: sebiExplanation,
  ipo_lesson: ipoLesson,
  discount_broker_lesson: discountBrokerLesson,
  dalal_chaiwala: dalalChaiwala,
};
