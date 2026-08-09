export const STATE = {

    entered: false,

    rendererMode: "none",

    phase: "ENTRY",

    observationLocked: false,

    observationComplete: false,

    observationStarted: false,

    ambient: false,

    shuffle: false,

    explosion: false,

    idleTime: 0,

    lastInteraction: performance.now(),

    activeNebula: null,

    customImages: []
};

export function setPhase(next) {
    STATE.phase = next;
}

export function registerInteraction() {
    STATE.lastInteraction = performance.now();
    STATE.idleTime = 0;

    if (STATE.ambient) {
        STATE.ambient = false;
    }
}

export function updateIdle(now) {
    STATE.idleTime = now - STATE.lastInteraction;
}