export class StateMachine {
    currentPhase = 'init';
    history = [];
    retryCount = 0;
    maxRetries = 3;
    validTransitions = {
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
    getPhase() {
        return this.currentPhase;
    }
    getHistory() {
        return [...this.history];
    }
    canTransitionTo(phase) {
        return this.validTransitions[this.currentPhase]?.includes(phase) ?? false;
    }
    async transition(to, reason) {
        if (!this.canTransitionTo(to)) {
            throw new Error(`Invalid state transition: ${this.currentPhase} → ${to}. ` +
                `Valid transitions: ${this.validTransitions[this.currentPhase]?.join(', ') || 'none'}`);
        }
        const transition = {
            from: this.currentPhase,
            to,
            timestamp: new Date(),
            reason,
        };
        this.history.push(transition);
        this.currentPhase = to;
        if (to === 'error') {
            this.retryCount++;
        }
        else if (to !== 'recovery') {
            this.retryCount = 0;
        }
    }
    isComplete() {
        return this.currentPhase === 'complete';
    }
    isError() {
        return this.currentPhase === 'error';
    }
    canRetry() {
        return this.retryCount < this.maxRetries;
    }
    getRetryCount() {
        return this.retryCount;
    }
    async enterErrorState(error) {
        await this.transition('error', error.message);
    }
    async attemptRecovery(targetPhase) {
        if (!this.canRetry()) {
            throw new Error(`Max retries (${this.maxRetries}) exceeded. Cannot recover.`);
        }
        await this.transition('recovery', `Attempting recovery to ${targetPhase}`);
        await this.transition(targetPhase, 'Recovery successful');
    }
    getProgressPercentage() {
        const phaseOrder = [
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
        if (currentIndex === -1)
            return 0;
        return Math.round((currentIndex / (phaseOrder.length - 1)) * 100);
    }
}
