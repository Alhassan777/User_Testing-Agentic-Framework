import { Phase } from './types.js';

export interface StateTransition {
  from: Phase;
  to: Phase;
  timestamp: Date;
  reason?: string;
}

export class StateMachine {
  private currentPhase: Phase = 'init';
  private history: StateTransition[] = [];
  private retryCount = 0;
  private maxRetries = 3;

  private validTransitions: Record<Phase, Phase[]> = {
    init: ['pre_testing', 'error'],
    pre_testing: ['intelligence', 'error'],
    intelligence: ['derivation', 'error'],
    derivation: ['execution', 'error'],
    execution: ['analysis', 'error'],
    analysis: ['clips', 'output', 'error'], // Can skip clips
    clips: ['output', 'error'],
    output: ['complete', 'error'],
    complete: [],
    error: ['recovery'],
    recovery: ['init', 'pre_testing', 'intelligence', 'derivation', 'execution', 'analysis', 'clips', 'output', 'complete'],
  };

  getPhase(): Phase {
    return this.currentPhase;
  }

  getHistory(): StateTransition[] {
    return [...this.history];
  }

  canTransitionTo(phase: Phase): boolean {
    return this.validTransitions[this.currentPhase]?.includes(phase) ?? false;
  }

  async transition(to: Phase, reason?: string): Promise<void> {
    if (!this.canTransitionTo(to)) {
      throw new Error(
        `Invalid state transition: ${this.currentPhase} → ${to}. ` +
        `Valid transitions: ${this.validTransitions[this.currentPhase]?.join(', ') || 'none'}`
      );
    }

    const transition: StateTransition = {
      from: this.currentPhase,
      to,
      timestamp: new Date(),
      reason,
    };

    this.history.push(transition);
    this.currentPhase = to;

    if (to === 'error') {
      this.retryCount++;
    } else if (to !== 'recovery') {
      this.retryCount = 0;
    }
  }

  isComplete(): boolean {
    return this.currentPhase === 'complete';
  }

  isError(): boolean {
    return this.currentPhase === 'error';
  }

  canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  async enterErrorState(error: Error): Promise<void> {
    await this.transition('error', error.message);
  }

  async attemptRecovery(targetPhase: Phase): Promise<void> {
    if (!this.canRetry()) {
      throw new Error(`Max retries (${this.maxRetries}) exceeded. Cannot recover.`);
    }
    await this.transition('recovery', `Attempting recovery to ${targetPhase}`);
    await this.transition(targetPhase, 'Recovery successful');
  }

  getProgressPercentage(): number {
    const phaseOrder: Phase[] = [
      'init',
      'pre_testing',
      'intelligence',
      'derivation',
      'execution',
      'analysis',
      'clips',
      'output',
      'complete',
    ];
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    if (currentIndex === -1) return 0;
    return Math.round((currentIndex / (phaseOrder.length - 1)) * 100);
  }
}
