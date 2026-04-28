import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { NPC, type NpcArchetype } from '@/entities/NPC';
import { dialogueSystem } from '@/systems/DialogueSystem';
import { allDialogues } from '@/data/dialogues';
import { portfolio } from '@/systems/PortfolioSystem';
import { marketEngine } from '@/systems/MarketEngine';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const statusEl = document.getElementById('loading-status');
    const fillEl = document.getElementById('loading-fill');

    if (statusEl) statusEl.textContent = 'Generating world textures...';
    this.updateProgress(20, fillEl);

    this.load.image('house', '/assets/house.png');
    this.load.image('brokerage', '/assets/brokerage.png');
    this.load.image('bank', '/assets/bank.png');
    this.load.image('chai', '/assets/chai.png');
    this.load.image('time_machine', '/assets/time_machine.png');
    this.load.image('train_station', '/assets/train_station.png');

    this.load.on('progress', (value: number) => {
      this.updateProgress(20 + value * 20, fillEl);
    });

    this.load.on('complete', () => {

      Player.generateTexture(this);
      this.updateProgress(45, fillEl);

    const archetypes: NpcArchetype[] = [
      'scammer_gold', 'scammer_mlm', 'scammer_preipo',
      'mentor', 'station_master', 'neighbor', 'mom',
    ];
    archetypes.forEach(a => NPC.generateTexture(this, a));
    this.updateProgress(70, fillEl);

    if (statusEl) statusEl.textContent = 'Starting market simulation...';
    marketEngine.start();
    this.updateProgress(90, fillEl);
  });
}

  private updateProgress(pct: number, fillEl: HTMLElement | null): void {
    if (fillEl) fillEl.style.width = `${pct}%`;
  }

  create(): void {
    const statusEl = document.getElementById('loading-status');
    const fillEl = document.getElementById('loading-fill');
    if (statusEl) statusEl.textContent = 'Ready.';
    this.updateProgress(100, fillEl);

    setTimeout(() => {
      const loadingEl = document.getElementById('loading');
      if (loadingEl) {
        loadingEl.style.opacity = '0';
        setTimeout(() => loadingEl.style.display = 'none', 500);
      }
    }, 400);

    const isNewGame = !portfolio.hasFlag('quest.main.started');

    this.scene.start('ScamSlumScene', { showIntro: isNewGame });

    if (isNewGame) {
      setTimeout(() => {
        dialogueSystem.start(allDialogues.mom_call);
      }, 1200);

      setTimeout(() => {
        portfolio.setFlag('unlock.wall_street');
        portfolio.setFlag('unlock.dalal_street');
      }, 100);
    }
  }
}
