export class GameState {
    static STATES = {
        INITIALIZING: 'INITIALIZING',
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        SHOP: 'SHOP',
        GAME_OVER: 'GAME_OVER'
    };

    constructor() {
        this.currentState = GameState.STATES.INITIALIZING;
        this.previousState = null;
        this.stateStartTime = Date.now();
        this.stateData = {};
    }

    setState(newState, data = {}) {
        if (this.currentState === newState) return;
        
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateStartTime = Date.now();
        this.stateData = data;
        
        console.log(`Game state changed: ${this.previousState} -> ${this.currentState}`);
    }

    getStateDuration() {
        return (Date.now() - this.stateStartTime) / 1000;
    }

    isState(state) {
        return this.currentState === state;
    }

    wasState(state) {
        return this.previousState === state;
    }

    canTransitionTo(newState) {
        const validTransitions = {
            [GameState.STATES.INITIALIZING]: [GameState.STATES.MENU],
            [GameState.STATES.MENU]: [GameState.STATES.PLAYING],
            [GameState.STATES.PLAYING]: [GameState.STATES.PAUSED, GameState.STATES.SHOP, GameState.STATES.GAME_OVER],
            [GameState.STATES.PAUSED]: [GameState.STATES.PLAYING, GameState.STATES.MENU],
            [GameState.STATES.SHOP]: [GameState.STATES.PLAYING],
            [GameState.STATES.GAME_OVER]: [GameState.STATES.MENU, GameState.STATES.PLAYING]
        };

        return validTransitions[this.currentState]?.includes(newState) || false;
    }

    getStateData() {
        return { ...this.stateData };
    }

    updateStateData(newData) {
        this.stateData = { ...this.stateData, ...newData };
    }
} 