/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION EVENT
 *
 * Observation Complete
 *        ↓
 * Operation Lock
 *        ↓
 * Audio Fade Out
 *        ↓
 * Particle Collapse
 *        ↓
 * Singularity
 *        ↓
 * Energy Burst
 *        ↓
 * Particle Explosion
 *        ↓
 * Camera Pull Back / Shock
 *        ↓
 * Audio Fade In
 *        ↓
 * Particle Recovery
 *        ↓
 * Exploration
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * This module owns the observation event timeline.
 *
 * ParticleSystem owns particle rendering.
 *
 * Event states:
 *
 * COLLAPSING
 * SINGULARITY
 * EXPLOSION
 *
 * prevent ParticleSystem.update() from overwriting
 * event-controlled geometry.
 * =========================================================
 */

import {
    STATE,
    setPhase
} from "../core/state.js";

import {
    CONFIG
} from "../config.js";


/*
 * =========================================================
 * MAIN OBSERVATION EVENT
 * =========================================================
 */

export async function runObservationEvent(
    camera,
    particleSystem
) {

    console.log(
        "[Observation] EVENT START"
    );


    /*
     * =====================================================
     * VALIDATION
     * =====================================================
     */

    if (
        !camera
    ) {

        throw new Error(
            "[Observation] camera is required."
        );
    }


    if (
        !particleSystem
    ) {

        throw new Error(
            "[Observation] particleSystem is required."
        );
    }


    /*
     * =====================================================
     * DUPLICATE EVENT PROTECTION
     * =====================================================
     */

    if (
        STATE.observationEvent
    ) {

        console.warn(
            "[Observation] EVENT ALREADY RUNNING"
        );

        return;
    }


    /*
     * =====================================================
     * LOCK
     * =====================================================
     */

    STATE.observationEvent =
        true;


    STATE.observationLocked =
        true;


    lockControls();


    setPhase(
        "OBSERVATION_EVENT"
    );


    try {

        /*
         * =================================================
         * AUDIO OUT
         * =================================================
         */

        await fadeOutAudio(
            getObservationConfig(
                "AUDIO_FADE_OUT",
                1200
            )
        );


        /*
         * =================================================
         * COLLAPSE
         * =================================================
         */

        setPhase(
            "COLLAPSING"
        );


        console.log(
            "[Observation] COLLAPSE START"
        );


        await collapseParticles(
            particleSystem,
            getObservationConfig(
                "COLLAPSE_TIME",
                2600
            )
        );


        /*
         * =================================================
         * SINGULARITY
         * =================================================
         */

        setPhase(
            "SINGULARITY"
        );


        console.log(
            "[Observation] SINGULARITY"
        );


        await singularity(
            particleSystem,
            camera,
            getObservationConfig(
                "SINGULARITY_TIME",
                1400
            )
        );


        /*
         * =================================================
         * EXPLOSION
         * =================================================
         */

        setPhase(
            "EXPLOSION"
        );


        console.log(
            "[Observation] ENERGY BURST"
        );


        await energyBurst(
            particleSystem,
            camera,
            getObservationConfig(
                "EXPLOSION_TIME",
                1800
            )
        );


        /*
         * =================================================
         * FINAL PARTICLE RECOVERY
         * =================================================
         *
         * The explosion intentionally leaves the
         * geometry outside the original cloud.
         *
         * resetPositions() restores the generated
         * nebula exactly.
         */

        recoverParticleSystem(
            particleSystem
        );


        /*
         * =================================================
         * RETURN TO EXPLORATION
         * =================================================
         */

        setPhase(
            "EXPLORATION"
        );


        console.log(
            "[Observation] EVENT COMPLETE"
        );

    } catch (error) {

        console.error(
            "[Observation] EVENT ERROR:",
            error
        );


        /*
         * =================================================
         * EMERGENCY RECOVERY
         * =================================================
         */

        try {

            recoverParticleSystem(
                particleSystem
            );

        } catch (
            recoveryError
        ) {

            console.error(
                "[Observation] RECOVERY ERROR:",
                recoveryError
            );
        }


        /*
         * Restore phase even after
         * an event failure.
         */

        setPhase(
            "EXPLORATION"
        );


        /*
         * Keep original error visible
         * to the caller.
         */

        throw error;

    } finally {

        /*
         * =================================================
         * ALWAYS UNLOCK
         * =================================================
         */

        STATE.observationLocked =
            false;


        STATE.observationEvent =
            false;


        unlockControls();


        console.log(
            "[Observation] EVENT LOCK RELEASED"
        );
    }
}


/*
 * =========================================================
 * RECOVER PARTICLE SYSTEM
 * =========================================================
 */

function recoverParticleSystem(
    particleSystem
) {

    if (
        !particleSystem
    ) {

        return;
    }


    try {

        particleSystem
            .resetPositions?.();

    } catch (error) {

        console.warn(
            "[Observation] PARTICLE RESET FAILED:",
            error
        );
    }
}


/*
 * =========================================================
 * CONTROL LOCK
 * =========================================================
 */

function lockControls() {

    STATE.controlsLocked =
        true;


    if (
        typeof document !==
        "undefined"
    ) {

        document.documentElement
            .classList
            .add(
                "observation-locked"
            );
    }


    console.log(
        "[Observation] CONTROLS LOCKED"
    );
}


/*
 * =========================================================
 * CONTROL UNLOCK
 * =========================================================
 */

function unlockControls() {

    STATE.controlsLocked =
        false;


    if (
        typeof document !==
        "undefined"
    ) {

        document.documentElement
            .classList
            .remove(
                "observation-locked"
            );
    }


    console.log(
        "[Observation] CONTROLS UNLOCKED"
    );
}


/*
 * =========================================================
 * AUDIO FADE OUT
 * =========================================================
 */

async function fadeOutAudio(
    duration = 1000
) {

    const audio =
        getMainAudio();


    if (
        !audio
    ) {

        console.warn(
            "[Observation] AUDIO NOT FOUND"
        );

        await wait(
            duration
        );

        return;
    }


    const startVolume =
        Number.isFinite(
            Number(audio.volume)
        )
            ? Number(audio.volume)
            : 1;


    if (
        startVolume <= 0
    ) {

        try {

            audio.pause();

        } catch (_) {}


        return;
    }


    await animate(
        duration,
        progress => {

            const eased =
                easeInOut(
                    progress
                );


            audio.volume =
                Math.max(
                    0,
                    startVolume *
                    (
                        1 -
                        eased
                    )
                );
        }
    );


    try {

        audio.pause();

    } catch (_) {}


    audio.volume =
        0;
}


/*
 * =========================================================
 * FIND MAIN AUDIO
 * =========================================================
 */

function getMainAudio() {

    if (
        typeof document ===
        "undefined"
    ) {

        return null;
    }


    const ids = [

        "backgroundMusic",
        "bgMusic",
        "mainAudio",
        "audio",
        "music"

    ];


    for (
        const id of ids
    ) {

        const element =
            document.getElementById(
                id
            );


        if (
            typeof HTMLMediaElement !==
            "undefined" &&
            element instanceof
            HTMLMediaElement
        ) {

            return element;
        }
    }


    const audio =
        document.querySelector(
            "audio"
        );


    return audio || null;
}


/*
 * =========================================================
 * COLLAPSE PARTICLES
 * =========================================================
 */

async function collapseParticles(
    particleSystem,
    duration
) {

    if (
        !particleSystem
    ) {

        return;
    }


    await animate(
        duration,
        progress => {

            particleSystem
                .applyCollapse?.(
                    progress
                );
        }
    );


    /*
     * Guarantee exact singularity.
     */

    particleSystem
        .applyCollapse?.(
            1
        );


    particleSystem
        .setSingularity?.();


    console.log(
        "[Observation] COLLAPSE COMPLETE"
    );
}


/*
 * =========================================================
 * SINGULARITY
 * =========================================================
 */

async function singularity(
    particleSystem,
    camera,
    duration
) {

    /*
     * Ensure particles remain exactly
     * at the singularity.
     */

    particleSystem
        .setSingularity?.();


    const startX =
        getNumber(
            camera.position?.x,
            0
        );


    const startY =
        getNumber(
            camera.position?.y,
            0
        );


    const startZ =
        getNumber(
            camera.position?.z,
            100
        );


    /*
     * Approach the singularity,
     * but never move the camera behind
     * the origin accidentally.
     */

    const direction =
        startZ >= 0
            ? 1
            : -1;


    const targetDistance =
        Math.max(
            2,
            Math.abs(startZ) * 0.45
        );


    const targetZ =
        targetDistance *
        direction;


    await animate(
        duration,
        progress => {

            const p =
                easeInOut(
                    progress
                );


            /*
             * Keep singularity locked.
             */

            particleSystem
                .setSingularity?.();


            if (
                camera.position
            ) {

                camera.position.x =
                    lerp(
                        startX,
                        startX * 0.45,
                        p
                    );


                camera.position.y =
                    lerp(
                        startY,
                        startY * 0.45,
                        p
                    );


                camera.position.z =
                    lerp(
                        startZ,
                        targetZ,
                        p
                    );
            }
        }
    );


    /*
     * Final exact singularity.
     */

    particleSystem
        .setSingularity?.();


    /*
     * Short energy charge hold.
     */

    await wait(
        getObservationConfig(
            "SINGULARITY_HOLD",
            250
        )
    );
}


/*
 * =========================================================
 * ENERGY BURST
 * =========================================================
 */

async function energyBurst(
    particleSystem,
    camera,
    duration
) {

    if (
        !particleSystem
    ) {

        return;
    }


    /*
     * =====================================================
     * PREPARE EXPLOSION
     * =====================================================
     *
     * Generate directions ONCE.
     *
     * This prevents the explosion pattern from
     * changing every frame.
     */

    particleSystem
        .prepareExplosion?.(
            getObservationConfig(
                "EXPLOSION_STRENGTH",
                1
            )
        );


    const startX =
        getNumber(
            camera.position?.x,
            0
        );


    const startY =
        getNumber(
            camera.position?.y,
            0
        );


    const startZ =
        getNumber(
            camera.position?.z,
            50
        );


    /*
     * Camera pull-back distance.
     */

    const pullDistance =
        Math.max(
            5,
            Math.abs(
                startZ
            ) * 1.8
        );


    await animate(
        duration,
        progress => {

            /*
             * Explosion easing.
             */

            const explosionProgress =
                easeOutCubic(
                    progress
                );


            particleSystem
                .explode?.(
                    explosionProgress
                );


            /*
             * Camera movement.
             */

            if (
                camera.position
            ) {

                camera.position.z =

                    startZ +

                    pullDistance *
                    progress;


                /*
                 * Camera shock.
                 *
                 * Strong near the beginning,
                 * fades toward the end.
                 */

                const shock =
                    Math.sin(
                        progress *
                        Math.PI *
                        8
                    ) *
                    (
                        1 -
                        progress
                    ) *
                    1.5;


                camera.position.x =
                    startX +
                    shock;


                camera.position.y =
                    startY +
                    shock *
                    0.5;
            }
        }
    );


    /*
     * Guarantee final explosion position.
     */

    particleSystem
        .explode?.(
            1
        );


    /*
     * Give the explosion a tiny
     * visual hold before recovery.
     */

    await wait(
        getObservationConfig(
            "EXPLOSION_HOLD",
            120
        )
    );


    /*
     * =====================================================
     * AUDIO RETURN
     * =====================================================
     */

    await fadeInAudio(
        getObservationConfig(
            "AUDIO_FADE_IN",
            1200
        )
    );


    /*
     * Release explosion state only
     * after the animation and audio
     * sequence are complete.
     */

    particleSystem
        .finishExplosion?.();


    console.log(
        "[Observation] EXPLOSION COMPLETE"
    );
}


/*
 * =========================================================
 * AUDIO FADE IN
 * =========================================================
 */

async function fadeInAudio(
    duration = 1000
) {

    const audio =
        getMainAudio();


    if (
        !audio
    ) {

        return;
    }


    try {

        audio.volume =
            0;


        await audio.play();

    } catch (error) {

        /*
         * Browser autoplay policy may block
         * playback. Do not destroy the event.
         */

        console.warn(
            "[Observation] AUDIO PLAY FAILED:",
            error
        );

        return;
    }


    await animate(
        duration,
        progress => {

            audio.volume =
                easeInOut(
                    progress
                );
        }
    );


    audio.volume =
        1;
}


/*
 * =========================================================
 * GENERIC ANIMATION
 * =========================================================
 */

function animate(
    duration,
    callback
) {

    return new Promise(
        (resolve, reject) => {

            const numericDuration =
                Number(
                    duration
                );


            const safeDuration =
                Number.isFinite(
                    numericDuration
                )
                    ? Math.max(
                        1,
                        numericDuration
                    )
                    : 1;


            const start =
                typeof performance !==
                "undefined"
                    ? performance.now()
                    : Date.now();


            let finished =
                false;


            let frameId =
                null;


            function finish() {

                if (
                    finished
                ) {

                    return;
                }


                finished =
                    true;


                if (
                    frameId !== null &&
                    typeof cancelAnimationFrame ===
                    "function"
                ) {

                    cancelAnimationFrame(
                        frameId
                    );

                    frameId =
                        null;
                }


                resolve();
            }


            function frame(
                now
            ) {

                if (
                    finished
                ) {

                    return;
                }


                const elapsed =
                    now -
                    start;


                const progress =
                    Math.min(
                        1,
                        Math.max(
                            0,
                            elapsed /
                            safeDuration
                        )
                    );


                try {

                    callback(
                        progress
                    );

                } catch (error) {

                    finished =
                        true;

                    reject(
                        error
                    );

                    return;
                }


                if (
                    progress >= 1
                ) {

                    finish();

                    return;
                }


                frameId =
                    requestAnimationFrame(
                        frame
                    );
            }


            if (
                typeof requestAnimationFrame !==
                "function"
            ) {

                try {

                    callback(
                        1
                    );

                    finish();

                } catch (error) {

                    reject(
                        error
                    );
                }

                return;
            }


            frameId =
                requestAnimationFrame(
                    frame
                );
        }
    );
}


/*
 * =========================================================
 * WAIT
 * =========================================================
 */

function wait(
    milliseconds
) {

    const numeric =
        Number(
            milliseconds
        );


    const safe =
        Number.isFinite(
            numeric
        )
            ? Math.max(
                0,
                numeric
            )
            : 0;


    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                safe
            );
        }
    );
}


/*
 * =========================================================
 * LERP
 * =========================================================
 */

function lerp(
    a,
    b,
    t
) {

    return (

        a +

        (
            b -
            a
        ) *

        t
    );
}


/*
 * =========================================================
 * EASING
 * =========================================================
 */

function easeInCubic(
    t
) {

    return (
        t *
        t *
        t
    );
}


function easeOutCubic(
    t
) {

    return (

        1 -

        Math.pow(
            1 -
            t,
            3
        )

    );
}


function easeInOut(
    t
) {

    return (

        t < 0.5

            ? 2 *
              t *
              t

            : 1 -
              Math.pow(
                  -2 *
                  t +
                  2,
                  2
              ) /
              2
    );
}


/*
 * =========================================================
 * NUMBER
 * =========================================================
 */

function getNumber(
    value,
    fallback
) {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}


/*
 * =========================================================
 * OBSERVATION CONFIG
 * =========================================================
 */

function getObservationConfig(
    key,
    fallback
) {

    try {

        const observation =
            CONFIG?.OBSERVATION;


        const value =
            observation?.[key];


        const number =
            Number(
                value
            );


        return Number.isFinite(
            number
        )
            ? number
            : fallback;

    } catch (_) {

        return fallback;
    }
}