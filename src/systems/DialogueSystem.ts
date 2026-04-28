import type { DialogueTree, DialogueNode, DialogueEffect } from '@/types';
import { portfolio } from './PortfolioSystem';
import { behaviorTracker } from './BehaviorTracker';
import { soundManager } from './SoundManager';

type CompleteHandler = (finalFlags: string[]) => void;

export class DialogueSystem {
  private dialogueEl: HTMLElement;
  private speakerEl: HTMLElement;
  private textEl: HTMLElement;
  private choicesEl: HTMLElement;
  private closeBtn: HTMLButtonElement | null;
  private textWrap: HTMLElement | null;
  private skipHint: HTMLElement | null;
  private currentTree: DialogueTree | null = null;
  private currentNodeId: string | null = null;
  private onComplete: CompleteHandler | null = null;
  private collectedFlags: string[] = [];
  private typewriterTimeout: number | null = null;
  private typewriterDone = true;
  private currentFullText = '';
  private currentOnTypedDone: (() => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.dialogueEl = document.getElementById('dialogue')!;
    this.speakerEl = document.getElementById('dialogue-speaker')!;
    this.textEl = document.getElementById('dialogue-text')!;
    this.choicesEl = document.getElementById('dialogue-choices')!;
    this.closeBtn = document.getElementById('dialogue-close') as HTMLButtonElement | null;
    this.textWrap = document.getElementById('dialogue-text-wrap');
    this.skipHint = document.getElementById('dialogue-skip-hint');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundManager.play('dialogueClose');
        this.end();
      });
    }

    if (this.textWrap) {
      this.textWrap.addEventListener('click', () => {
        if (!this.typewriterDone) {
          this.finishTypewriter();
        }
      });
    }
  }

  isActive(): boolean {
    return !this.dialogueEl.classList.contains('hidden');
  }

  start(tree: DialogueTree, onComplete?: CompleteHandler): void {
    this.currentTree = tree;
    this.collectedFlags = [];
    this.onComplete = onComplete ?? null;
    this.dialogueEl.classList.remove('hidden');

    this.dialogueEl.classList.remove('dialogue-enter');
    void this.dialogueEl.offsetWidth;
    this.dialogueEl.classList.add('dialogue-enter');
    soundManager.play('dialogueOpen');
    this.showNode(tree.start);
    behaviorTracker.log('dialogue_start', { treeId: tree.id });
    this.attachKeyHandler();
  }

  private attachKeyHandler(): void {
    if (this.keyHandler) return;
    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.isActive()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        soundManager.play('dialogueClose');
        this.end();
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        if (!this.typewriterDone) {
          e.preventDefault();
          this.finishTypewriter();
          return;
        }
        const firstBtn = this.choicesEl.querySelector<HTMLButtonElement>('button');
        if (firstBtn) {
          e.preventDefault();
          firstBtn.click();
        }
        return;
      }

      if (/^[1-9]$/.test(e.key)) {
        if (!this.typewriterDone) return;
        const idx = parseInt(e.key, 10) - 1;
        const btns = this.choicesEl.querySelectorAll<HTMLButtonElement>('button');
        if (btns[idx]) {
          e.preventDefault();
          btns[idx].click();
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler, true);
  }

  private detachKeyHandler(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler, true);
      this.keyHandler = null;
    }
  }

  private showNode(nodeId: string): void {
    if (!this.currentTree) return;
    const node = this.currentTree.nodes[nodeId];
    if (!node) {
      console.warn(`[Dialogue] Node not found: ${nodeId}`);
      this.end();
      return;
    }

    this.currentNodeId = nodeId;
    this.speakerEl.textContent = node.speaker;

    if (node.flags) this.collectedFlags.push(...node.flags);
    if (node.effect) this.applyEffect(node.effect);

    this.typewrite(node.text, () => {
      this.renderChoices(node);
    });
  }

  private typewrite(text: string, onDone: () => void): void {
    if (this.typewriterTimeout !== null) {
      window.clearTimeout(this.typewriterTimeout);
    }
    this.textEl.textContent = '';
    this.choicesEl.innerHTML = '';
    this.currentFullText = text;
    this.currentOnTypedDone = onDone;
    this.typewriterDone = false;
    if (this.skipHint) this.skipHint.classList.remove('is-hidden');
    if (this.textWrap) this.textWrap.classList.add('is-typing');

    let i = 0;
    const type = () => {
      if (i >= text.length) {
        this.typewriterDone = true;
        if (this.skipHint) this.skipHint.classList.add('is-hidden');
        if (this.textWrap) this.textWrap.classList.remove('is-typing');
        onDone();
        return;
      }
      this.textEl.textContent += text[i];

      if (i % 3 === 0 && !/\s/.test(text[i])) soundManager.play('type');
      i++;
      this.typewriterTimeout = window.setTimeout(type, 18);
    };
    type();
  }

  private finishTypewriter(): void {
    if (this.typewriterDone) return;
    if (this.typewriterTimeout !== null) {
      window.clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }
    this.textEl.textContent = this.currentFullText;
    this.typewriterDone = true;
    if (this.skipHint) this.skipHint.classList.add('is-hidden');
    if (this.textWrap) this.textWrap.classList.remove('is-typing');
    if (this.currentOnTypedDone) {
      const cb = this.currentOnTypedDone;
      this.currentOnTypedDone = null;
      cb();
    }
  }

  private renderChoices(node: DialogueNode): void {
    this.choicesEl.innerHTML = '';
    if (node.choices && node.choices.length > 0) {
      node.choices.forEach((choice, idx) => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice';
        btn.innerHTML = `<span class="dialogue-choice-num">${idx + 1}</span><span>${choice.text}</span>`;
        btn.addEventListener('mouseenter', () => soundManager.play('hover'));
        btn.onclick = () => {
          soundManager.play('choice');
          if (choice.flags) this.collectedFlags.push(...choice.flags);
          if (choice.effect) this.applyEffect(choice.effect);
          behaviorTracker.log('dialogue_choice', {
            treeId: this.currentTree?.id,
            nodeId: this.currentNodeId,
            choice: choice.text,
          });
          this.showNode(choice.next);
        };
        this.choicesEl.appendChild(btn);
      });
    } else if (node.next) {
      const btn = document.createElement('button');
      btn.className = 'dialogue-continue';
      btn.textContent = 'Continue →';
      btn.addEventListener('mouseenter', () => soundManager.play('hover'));
      btn.onclick = () => {
        soundManager.play('choice');
        this.showNode(node.next!);
      };
      this.choicesEl.appendChild(btn);
    } else {

      const btn = document.createElement('button');
      btn.className = 'dialogue-continue dialogue-end';
      btn.textContent = '✓ Close';
      btn.addEventListener('mouseenter', () => soundManager.play('hover'));
      btn.onclick = () => {
        soundManager.play('dialogueClose');
        this.end();
      };
      this.choicesEl.appendChild(btn);
    }
  }

  private applyEffect(effect: DialogueEffect): void {
    if (effect.cash !== undefined) {
      portfolio.addCash(effect.cash);
      if (effect.cash > 0) soundManager.play('coin');
    }
    if (effect.startQuest) {
      portfolio.setFlag(`quest.${effect.startQuest}.started`);
    }
    if (effect.completeQuest) {
      portfolio.setFlag(`quest.${effect.completeQuest}.completed`);
      soundManager.play('success');
    }
    if (effect.teachLesson) {
      portfolio.setFlag(`lesson.${effect.teachLesson}`);
    }
    if (effect.giveItem) {
      portfolio.setFlag(`item.${effect.giveItem}`);
      soundManager.play('unlock');
    }
    if (effect.isScamAccept) {
      behaviorTracker.log('fell_for_scam', {});
      portfolio.addCash(-5000);
      soundManager.play('error');
    }
  }

  end(): void {
    this.dialogueEl.classList.add('hidden');
    this.dialogueEl.classList.remove('dialogue-enter');
    if (this.typewriterTimeout !== null) {
      window.clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }
    this.typewriterDone = true;
    this.detachKeyHandler();
    const flags = this.collectedFlags.slice();
    this.currentTree = null;
    this.currentNodeId = null;
    behaviorTracker.log('dialogue_end', { flags });
    if (this.onComplete) this.onComplete(flags);
  }
}

export const dialogueSystem = new DialogueSystem();
