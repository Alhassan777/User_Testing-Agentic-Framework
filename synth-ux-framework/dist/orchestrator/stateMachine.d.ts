import { Phase } from './types.js';
export interface StateTransition {
    from: Phase;
    to: Phase;
    timestamp: Date;
    reason?: string;
}
export declare class StateMachine {
    private currentPhase;
    private history;
    private retryCount;
    private maxRetries;
    private validTransitions;
    getPhase(): Phase;
    getHistory(): StateTransition[];
    canTransitionTo(phase: Phase): boolean;
    transition(to: Phase, reason?: string): Promise<void>;
    isComplete(): boolean;
    isError(): boolean;
    canRetry(): boolean;
    getRetryCount(): number;
    enterErrorState(error: Error): Promise<void>;
    attemptRecovery(targetPhase: Phase): Promise<void>;
    getProgressPercentage(): number;
}
