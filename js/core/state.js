/*

* =========================================================
* PARTICLE UNIVERSE
* GLOBAL STATE
* 
* Central runtime state for the Particle Universe.
* 
* State flow:
* 
* ENTRY
* ↓
* EXPLORATION
* ↓
* OBSERVATION_EVENT
* ↓
* COLLAPSING
* ↓
* SINGULARITY
* ↓
* EXPLOSION
* ↓
* EXPLORATION
* 
* This module contains GLOBAL application state only.
* 
* Particle geometry state is owned by ParticleSystem.
* 
* This module must NOT directly manipulate:
* - THREE.js
* - particles
* - camera
* - audio
* 
* It only describes what the application is doing.
* =========================================================
  */

/*

* =========================================================
* TIME
* =========================================================
  */

function now() {

if (
    typeof performance !==
    "undefined" &&
    typeof performance.now ===
    "function"
) {

    return performance.now();
}


return Date.now();

}

/*

* =========================================================
* GLOBAL STATE
* =========================================================
  */

export const STATE = {

/*
 * =====================================================
 * ENTRY
 * =====================================================
 */

entered:
    false,


/*
 * Current renderer mode.
 *
 * Example:
 *
 * "none"
 * "three"
 */

rendererMode:
    "none",


/*
 * =====================================================
 * APPLICATION PHASE
 * =====================================================
 *
 * This is the high-level application state.
 *
 * ParticleSystem has its own particle state.
 *
 */

phase:
    "ENTRY",


/*
 * =====================================================
 * OBSERVATION EVENT
 * =====================================================
 */

/*
 * True while the complete observation event
 * is currently executing.
 */

observationEvent:
    false,


/*
 * True while user interaction is forbidden
 * because an observation event owns the scene.
 */

observationLocked:
    false,


/*
 * Controls-only lock.
 *
 * This is intentionally separate from
 * observationLocked.
 */

controlsLocked:
    false,


/*
 * Whether the observation sequence has
 * successfully completed at least once.
 */

observationComplete:
    false,


/*
 * Whether the observation sequence has
 * started at least once.
 */

observationStarted:
    false,


/*
 * =====================================================
 * AMBIENT / IDLE
 * =====================================================
 */

ambient:
    false,


idleTime:
    0,


lastInteraction:
    now(),


/*
 * =====================================================
 * SHUFFLE
 * =====================================================
 *
 * This represents the application-level
 * shuffle operation.
 *
 * ParticleSystem.data.state remains the
 * authoritative particle state.
 */

shuffle:
    false,


/*
 * =====================================================
 * EXPLOSION
 * =====================================================
 *
 * Application-level indicator.
 *
 * ParticleSystem.data.state remains authoritative
 * for actual particle geometry state.
 */

explosion:
    false,


/*
 * =====================================================
 * ACTIVE NEBULA
 * =====================================================
 */

activeNebula:
    null,


/*
 * =====================================================
 * CUSTOM IMAGES
 * =====================================================
 */

customImages:
    []

};

/*

* =========================================================
* VALID PHASES
* =========================================================
  */

const VALID_PHASES = new Set([

"ENTRY",

"EXPLORATION",

"OBSERVATION_EVENT",

"COLLAPSING",

"SINGULARITY",

"EXPLOSION"

]);

/*

* =========================================================
* SET PHASE
* =========================================================
* 
* Central phase transition function.
* 
* This prevents random modules from directly
* changing phase-related flags inconsistently.
* =========================================================
  */

export function setPhase(
next
) {

if (
    typeof next !==
    "string"
) {

    console.warn(
        "[STATE] Invalid phase:",
        next
    );

    return false;
}


if (
    !VALID_PHASES.has(
        next
    )
) {

    console.warn(
        "[STATE] Unknown phase:",
        next
    );

    return false;
}


STATE.phase =
    next;


/*
 * =====================================================
 * SYNCHRONIZE HIGH-LEVEL FLAGS
 * =====================================================
 */

switch (
    next
) {

    /*
     * -------------------------------------------------
     * ENTRY
     * -------------------------------------------------
     */

    case "ENTRY":

        STATE.observationEvent =
            false;

        STATE.observationLocked =
            false;

        STATE.controlsLocked =
            false;

        STATE.shuffle =
            false;

        STATE.explosion =
            false;

        break;


    /*
     * -------------------------------------------------
     * EXPLORATION
     * -------------------------------------------------
     */

    case "EXPLORATION":

        STATE.observationEvent =
            false;

        STATE.observationLocked =
            false;

        STATE.controlsLocked =
            false;

        STATE.explosion =
            false;

        break;


    /*
     * -------------------------------------------------
     * OBSERVATION EVENT
     * -------------------------------------------------
     */

    case "OBSERVATION_EVENT":

        STATE.observationEvent =
            true;

        STATE.observationLocked =
            true;

        STATE.controlsLocked =
            true;

        break;


    /*
     * -------------------------------------------------
     * COLLAPSING
     * -------------------------------------------------
     */

    case "COLLAPSING":

        STATE.observationEvent =
            true;

        STATE.observationLocked =
            true;

        STATE.controlsLocked =
            true;

        STATE.explosion =
            false;

        break;


    /*
     * -------------------------------------------------
     * SINGULARITY
     * -------------------------------------------------
     */

    case "SINGULARITY":

        STATE.observationEvent =
            true;

        STATE.observationLocked =
            true;

        STATE.controlsLocked =
            true;

        STATE.explosion =
            false;

        break;


    /*
     * -------------------------------------------------
     * EXPLOSION
     * -------------------------------------------------
     */

    case "EXPLOSION":

        STATE.observationEvent =
            true;

        STATE.observationLocked =
            true;

        STATE.controlsLocked =
            true;

        STATE.explosion =
            true;

        break;

}


console.log(
    "[STATE] PHASE:",
    STATE.phase
);


return true;

}

/*

* =========================================================
* REGISTER INTERACTION
* =========================================================
* 
* Called by mouse / touch / keyboard / camera controls.
* 
* Interaction during an observation event is ignored.
* =========================================================
  */

export function registerInteraction() {

/*
 * Observation owns the scene.
 *
 * Do not allow interaction events to
 * modify idle state during the event.
 */

if (
    STATE.observationLocked ||
    STATE.controlsLocked
) {

    return false;
}


STATE.lastInteraction =
    now();


STATE.idleTime =
    0;


/*
 * Any user interaction means
 * the scene is no longer ambient.
 */

if (
    STATE.ambient
) {

    STATE.ambient =
        false;
}


return true;

}

/*

* =========================================================
* UPDATE IDLE
* =========================================================
  */

export function updateIdle(
currentTime
) {

const current =
    Number.isFinite(
        Number(
            currentTime
        )
    )
        ? Number(
            currentTime
        )
        : now();


STATE.idleTime =
    Math.max(
        0,
        current -
        STATE.lastInteraction
    );


return STATE.idleTime;

}

/*

* =========================================================
* ENTER UNIVERSE
* =========================================================
* 
* Convenience helper.
* 
* Main entry controller can call:
* 
* enterUniverse()
* 
* instead of manually modifying several flags.
* =========================================================
  */

export function enterUniverse() {

STATE.entered =
    true;


STATE.observationEvent =
    false;


STATE.observationLocked =
    false;


STATE.controlsLocked =
    false;


STATE.observationStarted =
    false;


STATE.observationComplete =
    false;


STATE.shuffle =
    false;


STATE.explosion =
    false;


STATE.ambient =
    false;


STATE.lastInteraction =
    now();


STATE.idleTime =
    0;


setPhase(
    "EXPLORATION"
);


console.log(
    "[STATE] UNIVERSE ENTERED"
);

}

/*

* =========================================================
* BEGIN OBSERVATION
* =========================================================
* 
* Called by the observation trigger.
* =========================================================
  */

export function beginObservation() {

/*
 * Already running.
 */

if (
    STATE.observationEvent
) {

    return false;
}


/*
 * Must already be inside the universe.
 */

if (
    !STATE.entered
) {

    console.warn(
        "[STATE] Cannot begin observation before entry."
    );

    return false;
}


STATE.observationStarted =
    true;


STATE.observationComplete =
    false;


STATE.shuffle =
    false;


STATE.explosion =
    false;


setPhase(
    "OBSERVATION_EVENT"
);


console.log(
    "[STATE] OBSERVATION BEGIN"
);


return true;

}

/*

* =========================================================
* COMPLETE OBSERVATION
* =========================================================
  */

export function completeObservation() {

STATE.observationComplete =
    true;


STATE.observationEvent =
    false;


STATE.observationLocked =
    false;


STATE.controlsLocked =
    false;


STATE.explosion =
    false;


STATE.shuffle =
    false;


STATE.lastInteraction =
    now();


STATE.idleTime =
    0;


setPhase(
    "EXPLORATION"
);


console.log(
    "[STATE] OBSERVATION COMPLETE"
);

}

/*

* =========================================================
* SET SHUFFLE STATE
* =========================================================
  */

export function setShuffleState(
active
) {

STATE.shuffle =
    Boolean(
        active
    );


/*
 * Shuffle should never
 * accidentally become an
 * observation event.
 */

if (
    active &&
    STATE.observationEvent
) {

    console.warn(
        "[STATE] Shuffle blocked during observation."
    );

    STATE.shuffle =
        false;

    return false;
}


return true;

}

/*

* =========================================================
* SET EXPLOSION STATE
* =========================================================
  */

export function setExplosionState(
active
) {

STATE.explosion =
    Boolean(
        active
    );


return true;

}

/*

* =========================================================
* CONTROL LOCK HELPERS
* =========================================================
  */

export function lockControls() {

STATE.controlsLocked =
    true;

}

export function unlockControls() {

/*
 * Do not unlock controls while
 * an observation event is still active.
 */

if (
    STATE.observationEvent
) {

    return false;
}


STATE.controlsLocked =
    false;


return true;

}

/*

* =========================================================
* RESET RUNTIME STATE
* =========================================================
* 
* Useful for recovery / debugging.
* =========================================================
  */

export function resetRuntimeState() {

STATE.entered =
    false;


STATE.rendererMode =
    "none";


STATE.observationEvent =
    false;


STATE.observationLocked =
    false;


STATE.controlsLocked =
    false;


STATE.observationComplete =
    false;


STATE.observationStarted =
    false;


STATE.ambient =
    false;


STATE.shuffle =
    false;


STATE.explosion =
    false;


STATE.idleTime =
    0;


STATE.lastInteraction =
    now();


STATE.activeNebula =
    null;


setPhase(
    "ENTRY"
);


console.log(
    "[STATE] RUNTIME RESET"
);

}