/*
 * =========================================================
 * PARTICLE UNIVERSE
 * GLOBAL STATE
 *
 * Central Runtime State
 *
 * ENTRY
 *   ↓
 * EXPLORATION
 *   ↓
 * OBSERVING
 *   ↓
 * OBSERVATION_EVENT
 *   ↓
 * COLLAPSING
 *   ↓
 * SINGULARITY
 *   ↓
 * EXPLOSION
 *   ↓
 * EXPLORATION
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * This module ONLY stores runtime state.
 *
 * It does NOT:
 *
 * - control particles
 * - control camera
 * - control audio
 * - run animation
 * - calculate observation score
 * - execute observation events
 * - perform particle shuffle
 *
 * Other modules read/write STATE through
 * the helper functions exported here.
 * =========================================================
 */


/*
 * =========================================================
 * PHASES
 * =========================================================
 *
 * Centralized phase names.
 *
 * Prevents random string mismatches between modules.
 * =========================================================
 */

export const PHASE = Object.freeze({

    ENTRY:
        "ENTRY",

    SUMMONING:
        "SUMMONING",

    EXPLORATION:
        "EXPLORATION",

    OBSERVING:
        "OBSERVING",

    OBSERVATION_EVENT:
        "OBSERVATION_EVENT",

    COLLAPSING:
        "COLLAPSING",

    SINGULARITY:
        "SINGULARITY",

    EXPLOSION:
        "EXPLOSION",

    SHUFFLE:
        "SHUFFLE",

    AMBIENT:
        "AMBIENT"
});


/*
 * =========================================================
 * RUNTIME STATE
 * =========================================================
 */

export const STATE = {

    /*
     * =====================================================
     * APPLICATION
     * =====================================================
     */

    entered:
        false,

    rendererMode:
        "none",

    phase:
        PHASE.ENTRY,


    /*
     * =====================================================
     * CONTROLS
     * =====================================================
     *
     * controlsLocked
     *     General movement/input lock.
     *
     * observationLocked
     *     Observation-event-specific lock.
     *
     * These are intentionally separate.
     * =====================================================
     */

    controlsLocked:
        false,

    observationLocked:
        false,


    /*
     * =====================================================
     * OBSERVATION
     * =====================================================
     */

    observationStarted:
        false,

    observationComplete:
        false,

    observationEvent:
        false,

    observationProgress:
        0,

    observationScore:
        0,

    observationValid:
        false,

    observationHold:
        false,

    observationHoldTime:
        0,

    observationStartedAt:
        0,

    observationCompletedAt:
        0,


    /*
     * =====================================================
     * AMBIENT
     * =====================================================
     */

    ambient:
        false,

    ambientStartedAt:
        0,


    /*
     * =====================================================
     * PARTICLE OPERATIONS
     * =====================================================
     */

    shuffle:
        false,

    shuffleStartedAt:
        0,

    explosion:
        false,

    explosionStartedAt:
        0,


    /*
     * =====================================================
     * IDLE
     * =====================================================
     */

    idleTime:
        0,

    lastInteraction:
        getNow(),


    /*
     * =====================================================
     * UNIVERSE
     * =====================================================
     */

    activeNebula:
        null,

    nebulaId:
        null,


    /*
     * =====================================================
     * CUSTOM IMAGES
     * =====================================================
     *
     * Stores user-provided image sources.
     *
     * Actual image processing belongs to
     * the NebulaGenerator / image system.
     * =====================================================
     */

    customImages:
        [],


    /*
     * =====================================================
     * RUNTIME METADATA
     * =====================================================
     */

    generation:
        0,

    restartCount:
        0
};


/*
 * =========================================================
 * GET TIME
 * =========================================================
 *
 * Defensive browser-safe timer.
 * =========================================================
 */

function getNow() {

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
 * SET PHASE
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
            "[STATE] INVALID PHASE:",
            next
        );

        return false;
    }


    /*
     * Allow only known phases.
     */

    const validPhase =
        Object.values(
            PHASE
        ).includes(
            next
        );


    if (
        !validPhase
    ) {

        console.warn(
            "[STATE] UNKNOWN PHASE:",
            next
        );

        return false;
    }


    STATE.phase =
        next;


    return true;
}


/*
 * =========================================================
 * REGISTER USER INTERACTION
 * =========================================================
 */

export function registerInteraction() {

    const now =
        getNow();


    STATE.lastInteraction =
        now;


    STATE.idleTime =
        0;


    /*
     * User activity exits ambient mode.
     *
     * This does NOT interrupt observation events.
     */

    if (
        STATE.ambient
    ) {

        STATE.ambient =
            false;


        STATE.ambientStartedAt =
            0;


        /*
         * Return to exploration only when
         * no higher-priority operation is active.
         */

        if (
            !STATE.observationEvent &&
            !STATE.shuffle &&
            !STATE.explosion &&
            !STATE.observationComplete
        ) {

            setPhase(
                PHASE.EXPLORATION
            );
        }
    }
}


/*
 * =========================================================
 * UPDATE IDLE TIME
 * =========================================================
 */

export function updateIdle(
    now = getNow()
) {

    const current =
        Number(
            now
        );


    if (
        !Number.isFinite(
            current
        )
    ) {

        return STATE.idleTime;
    }


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
 * START OBSERVATION
 * =========================================================
 *
 * Called when the observer begins evaluating
 * the current nebula.
 * =========================================================
 */

export function startObservation() {

    if (
        STATE.observationEvent
    ) {

        return false;
    }


    if (
        STATE.observationComplete
    ) {

        return false;
    }


    STATE.observationStarted =
        true;


    STATE.observationProgress =
        0;


    STATE.observationScore =
        0;


    STATE.observationValid =
        false;


    STATE.observationHold =
        false;


    STATE.observationHoldTime =
        0;


    STATE.observationStartedAt =
        getNow();


    if (
        !STATE.shuffle &&
        !STATE.explosion
    ) {

        setPhase(
            PHASE.OBSERVING
        );
    }


    return true;
}


/*
 * =========================================================
 * UPDATE OBSERVATION SCORE
 * =========================================================
 */

export function updateObservationScore(
    score,
    valid = false
) {

    const numericScore =
        Number(
            score
        );


    STATE.observationScore =
        Number.isFinite(
            numericScore
        )
            ? Math.max(
                0,
                Math.min(
                    1,
                    numericScore
                )
            )
            : 0;


    STATE.observationValid =
        Boolean(
            valid
        );


    return STATE.observationScore;
}


/*
 * =========================================================
 * START OBSERVATION HOLD
 * =========================================================
 */

export function startObservationHold() {

    if (
        !STATE.observationStarted ||
        STATE.observationComplete ||
        STATE.observationEvent
    ) {

        return false;
    }


    if (
        STATE.observationHold
    ) {

        return true;
    }


    STATE.observationHold =
        true;


    STATE.observationHoldTime =
        0;


    return true;
}


/*
 * =========================================================
 * UPDATE OBSERVATION HOLD
 * =========================================================
 */

export function updateObservationHold(
    milliseconds
) {

    if (
        !STATE.observationHold
    ) {

        return 0;
    }


    const value =
        Number(
            milliseconds
        );


    if (
        Number.isFinite(
            value
        )
    ) {

        STATE.observationHoldTime =
            Math.max(
                0,
                value
            );
    }


    return STATE.observationHoldTime;
}


/*
 * =========================================================
 * CANCEL OBSERVATION HOLD
 * =========================================================
 */

export function cancelObservationHold() {

    STATE.observationHold =
        false;


    STATE.observationHoldTime =
        0;
}


/*
 * =========================================================
 * COMPLETE OBSERVATION
 * =========================================================
 *
 * Marks the hidden image observation as completed.
 *
 * This does NOT execute the collapse/explosion event.
 * The Observation Event module owns that.
 * =========================================================
 */

export function completeObservation() {

    if (
        STATE.observationComplete
    ) {

        return false;
    }


    STATE.observationComplete =
        true;


    STATE.observationValid =
        true;


    STATE.observationProgress =
        1;


    STATE.observationCompletedAt =
        getNow();


    cancelObservationHold();


    return true;
}


/*
 * =========================================================
 * START OBSERVATION EVENT
 * =========================================================
 */

export function startObservationEvent() {

    if (
        STATE.observationEvent
    ) {

        return false;
    }


    STATE.observationEvent =
        true;


    STATE.observationStarted =
        true;


    STATE.observationLocked =
        true;


    STATE.controlsLocked =
        true;


    setPhase(
        PHASE.OBSERVATION_EVENT
    );


    return true;
}


/*
 * =========================================================
 * END OBSERVATION EVENT
 * =========================================================
 */

export function endObservationEvent() {

    STATE.observationEvent =
        false;


    STATE.observationLocked =
        false;


    STATE.controlsLocked =
        false;


    STATE.observationProgress =
        1;


    setPhase(
        PHASE.EXPLORATION
    );
}


/*
 * =========================================================
 * START SHUFFLE
 * =========================================================
 */

export function startShuffle() {

    if (
        STATE.shuffle
    ) {

        return false;
    }


    /*
     * Shuffle must never run during
     * observation event / explosion.
     */

    if (
        STATE.observationEvent ||
        STATE.explosion
    ) {

        return false;
    }


    STATE.shuffle =
        true;


    STATE.shuffleStartedAt =
        getNow();


    STATE.observationHold =
        false;


    STATE.observationHoldTime =
        0;


    setPhase(
        PHASE.SHUFFLE
    );


    return true;
}


/*
 * =========================================================
 * END SHUFFLE
 * =========================================================
 */

export function endShuffle() {

    STATE.shuffle =
        false;


    STATE.shuffleStartedAt =
        0;


    /*
     * Shuffle does NOT complete observation.
     *
     * The same image remains the observation target.
     */

    if (
        !STATE.observationComplete &&
        !STATE.observationEvent &&
        !STATE.explosion
    ) {

        setPhase(
            STATE.observationStarted
                ? PHASE.OBSERVING
                : PHASE.EXPLORATION
        );
    }
}


/*
 * =========================================================
 * START EXPLOSION
 * =========================================================
 */

export function startExplosion() {

    if (
        STATE.explosion
    ) {

        return false;
    }


    STATE.explosion =
        true;


    STATE.explosionStartedAt =
        getNow();


    STATE.controlsLocked =
        true;


    STATE.observationLocked =
        true;


    setPhase(
        PHASE.EXPLOSION
    );


    return true;
}


/*
 * =========================================================
 * END EXPLOSION
 * =========================================================
 */

export function endExplosion() {

    STATE.explosion =
        false;


    STATE.explosionStartedAt =
        0;


    STATE.controlsLocked =
        false;


    STATE.observationLocked =
        false;
}


/*
 * =========================================================
 * START AMBIENT MODE
 * =========================================================
 */

export function startAmbient() {

    /*
     * Ambient mode must never take over
     * an observation event.
     */

    if (
        STATE.observationEvent ||
        STATE.shuffle ||
        STATE.explosion
    ) {

        return false;
    }


    if (
        STATE.ambient
    ) {

        return true;
    }


    STATE.ambient =
        true;


    STATE.ambientStartedAt =
        getNow();


    setPhase(
        PHASE.AMBIENT
    );


    return true;
}


/*
 * =========================================================
 * END AMBIENT MODE
 * =========================================================
 */

export function endAmbient() {

    STATE.ambient =
        false;


    STATE.ambientStartedAt =
        0;


    if (
        !STATE.observationEvent &&
        !STATE.shuffle &&
        !STATE.explosion
    ) {

        setPhase(
            STATE.observationStarted
                ? PHASE.OBSERVING
                : PHASE.EXPLORATION
        );
    }
}


/*
 * =========================================================
 * SET ACTIVE NEBULA
 * =========================================================
 */

export function setActiveNebula(
    nebula
) {

    STATE.activeNebula =
        nebula || null;


    /*
     * Increase generation whenever
     * a new nebula becomes active.
     */

    STATE.generation +=
        1;


    /*
     * Try to expose an optional ID.
     */

    STATE.nebulaId =
        nebula?.id
            ??
            nebula?.originalImageId
            ??
            null;


    /*
     * A new nebula means a new observation.
     */

    resetObservationState();


    resetParticleOperationState();


    if (
        nebula
    ) {

        setPhase(
            PHASE.SUMMONING
        );

    } else {

        setPhase(
            PHASE.EXPLORATION
        );
    }


    return STATE.activeNebula;
}


/*
 * =========================================================
 * RESET OBSERVATION STATE
 * =========================================================
 *
 * Used when a new nebula becomes available.
 *
 * Does NOT unlock controls directly.
 * =========================================================
 */

export function resetObservationState() {

    STATE.observationEvent =
        false;


    STATE.observationStarted =
        false;


    STATE.observationComplete =
        false;


    STATE.observationProgress =
        0;


    STATE.observationScore =
        0;


    STATE.observationValid =
        false;


    STATE.observationHold =
        false;


    STATE.observationHoldTime =
        0;


    STATE.observationStartedAt =
        0;


    STATE.observationCompletedAt =
        0;
}


/*
 * =========================================================
 * RESET PARTICLE OPERATION STATE
 * =========================================================
 */

export function resetParticleOperationState() {

    STATE.shuffle =
        false;


    STATE.shuffleStartedAt =
        0;


    STATE.explosion =
        false;


    STATE.explosionStartedAt =
        0;
}


/*
 * =========================================================
 * RESET RUNTIME LOCKS
 * =========================================================
 */

export function resetLocks() {

    STATE.controlsLocked =
        false;


    STATE.observationLocked =
        false;
}


/*
 * =========================================================
 * RESET FULL RUNTIME
 * =========================================================
 *
 * Used when restarting the entire experience.
 *
 * This intentionally clears custom images.
 * =========================================================
 */

export function resetState() {

    STATE.entered =
        false;


    STATE.rendererMode =
        "none";


    STATE.phase =
        PHASE.ENTRY;


    STATE.controlsLocked =
        false;


    STATE.observationLocked =
        false;


    STATE.observationEvent =
        false;


    STATE.observationStarted =
        false;


    STATE.observationComplete =
        false;


    STATE.observationProgress =
        0;


    STATE.observationScore =
        0;


    STATE.observationValid =
        false;


    STATE.observationHold =
        false;


    STATE.observationHoldTime =
        0;


    STATE.observationStartedAt =
        0;


    STATE.observationCompletedAt =
        0;


    STATE.ambient =
        false;


    STATE.ambientStartedAt =
        0;


    STATE.shuffle =
        false;


    STATE.shuffleStartedAt =
        0;


    STATE.explosion =
        false;


    STATE.explosionStartedAt =
        0;


    STATE.idleTime =
        0;


    STATE.lastInteraction =
        getNow();


    STATE.activeNebula =
        null;


    STATE.nebulaId =
        null;


    STATE.customImages =
        [];


    STATE.generation =
        0;


    STATE.restartCount +=
        1;
}


/*
 * =========================================================
 * ENTER UNIVERSE
 * =========================================================
 */

export function enterUniverse() {

    STATE.entered =
        true;


    STATE.phase =
        PHASE.SUMMONING;


    STATE.lastInteraction =
        getNow();


    STATE.idleTime =
        0;
}


/*
 * =========================================================
 * SET RENDERER MODE
 * =========================================================
 */

export function setRendererMode(
    mode
) {

    if (
        typeof mode !==
        "string"
    ) {

        return false;
    }


    STATE.rendererMode =
        mode;


    return true;
}


/*
 * =========================================================
 * CUSTOM IMAGE
 * =========================================================
 */

export function addCustomImage(
    imageSource
) {

    if (
        typeof imageSource !==
        "string" ||
        !imageSource
    ) {

        return false;
    }


    STATE.customImages.push(
        imageSource
    );


    return true;
}


/*
 * =========================================================
 * REMOVE CUSTOM IMAGE
 * =========================================================
 */

export function removeCustomImage(
    imageSource
) {

    const index =
        STATE.customImages.indexOf(
            imageSource
        );


    if (
        index ===
        -1
    ) {

        return false;
    }


    STATE.customImages.splice(
        index,
        1
    );


    return true;
}


/*
 * =========================================================
 * CLEAR CUSTOM IMAGES
 * =========================================================
 */

export function clearCustomImages() {

    STATE.customImages.length =
        0;
}


/*
 * =========================================================
 * IS BUSY
 * =========================================================
 *
 * Useful for input systems.
 * =========================================================
 */

export function isUniverseBusy() {

    return (

        STATE.observationEvent ||

        STATE.shuffle ||

        STATE.explosion

    );
}


/*
 * =========================================================
 * IS CONTROLS LOCKED
 * =========================================================
 */

export function areControlsLocked() {

    return (

        STATE.controlsLocked ||

        STATE.observationLocked

    );
}


/*
 * =========================================================
 * IS OBSERVATION ACTIVE
 * =========================================================
 */

export function isObservationActive() {

    return (

        STATE.observationStarted &&

        !STATE.observationComplete &&

        !STATE.observationEvent

    );
}


/*
 * =========================================================
 * STATE SNAPSHOT
 * =========================================================
 *
 * Returns a read-only-style copy for debugging/UI.
 * The actual STATE object remains untouched.
 * =========================================================
 */

export function getStateSnapshot() {

    return {

        entered:
            STATE.entered,

        rendererMode:
            STATE.rendererMode,

        phase:
            STATE.phase,

        controlsLocked:
            STATE.controlsLocked,

        observationLocked:
            STATE.observationLocked,

        observationEvent:
            STATE.observationEvent,

        observationStarted:
            STATE.observationStarted,

        observationComplete:
            STATE.observationComplete,

        observationProgress:
            STATE.observationProgress,

        observationScore:
            STATE.observationScore,

        observationValid:
            STATE.observationValid,

        observationHold:
            STATE.observationHold,

        observationHoldTime:
            STATE.observationHoldTime,

        ambient:
            STATE.ambient,

        shuffle:
            STATE.shuffle,

        explosion:
            STATE.explosion,

        idleTime:
            STATE.idleTime,

        nebulaId:
            STATE.nebulaId,

        generation:
            STATE.generation
    };
}