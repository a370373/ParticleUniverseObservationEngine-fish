/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION EVENT
 * =========================================================
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
 * Camera Pull Back
 *        ↓
 * Audio Fade In
 *        ↓
 * Particle Recovery
 *        ↓
 * Exploration
 *
 * This module ONLY owns the event timeline.
 * =========================================================
 */

import {
    STATE,
    setPhase
} from "../core/state.js";

import {
    CONFIG
} from "../config.js";


export async function runObservationEvent(
    camera,
    particleSystem
) {

    console.log(
        "[Observation] EVENT START"
    );


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


    if (
        STATE.observationEvent
    ) {

        console.warn(
            "[Observation] EVENT ALREADY RUNNING"
        );

        return false;
    }


    STATE.observationEvent =
        true;

    STATE.observationLocked =
        true;

    lockControls();


    setPhase(
        "OBSERVATION_EVENT"
    );


    try {

        await fadeOutAudio(
            getObservationConfig(
                "AUDIO_FADE_OUT",
                1200
            )
        );


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


        recoverParticleSystem(
            particleSystem
        );


        setPhase(
            "EXPLORATION"
        );


        console.log(
            "[Observation] EVENT COMPLETE"
        );


        return true;

    } catch (error) {

        console.error(
            "[Observation] EVENT ERROR:",
            error
        );


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


        setPhase(
            "EXPLORATION"
        );


        throw error;

    } finally {

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
 * PARTICLE RECOVERY
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
 * LOCK
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
}


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
}


/*
 * =========================================================
 * AUDIO
 * =========================================================
 */

let savedAudioVolume =
    1;


async function fadeOutAudio(
    duration = 1000
) {

    const audio =
        getMainAudio();


    if (
        !audio
    ) {

        await wait(
            duration
        );

        return;
    }


    savedAudioVolume =
        Number.isFinite(
            Number(
                audio.volume
            )
        )
            ? audio.volume
            : 1;


    if (
        savedAudioVolume <=
        0
    ) {

        try {

            audio.pause();

        } catch (_) {}

        return;
    }


    await animate(
        duration,
        progress => {

            audio.volume =
                Math.max(
                    0,
                    savedAudioVolume *
                    (
                        1 -
                        easeInOut(
                            progress
                        )
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
        const id
        of ids
    ) {

        const element =
            document.getElementById(
                id
            );


        if (
            element &&
            typeof element.play ===
            "function" &&
            typeof element.pause ===
            "function"
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

        console.warn(
            "[Observation] AUDIO PLAY FAILED:",
            error
        );

        return;
    }


    const targetVolume =
        Number.isFinite(
            Number(
                savedAudioVolume
            )
        )
            ? savedAudioVolume
            : 1;


    await animate(
        duration,
        progress => {

            audio.volume =
                targetVolume *
                easeInOut(
                    progress
                );
        }
    );


    audio.volume =
        targetVolume;
}


/*
 * =========================================================
 * COLLAPSE
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


    const direction =
        startZ >= 0
            ? 1
            : -1;


    const targetDistance =
        Math.max(
            2,
            Math.abs(
                startZ
            ) * 0.45
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


    particleSystem
        .setSingularity?.();


    await wait(
        getObservationConfig(
            "SINGULARITY_HOLD",
            250
        )
    );
}


/*
 * =========================================================
 * EXPLOSION
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

            const explosionProgress =
                easeOutCubic(
                    progress
                );


            particleSystem
                .explode?.(
                    explosionProgress
                );


            if (
                camera.position
            ) {

                camera.position.z =
                    startZ +
                    pullDistance *
                    progress;


                const shock =
                    Math.sin(
                        progress *
                        Math.PI *
                        8
                    )
                    *
                    (
                        1 -
                        progress
                    )
                    *
                    1.5;


                camera.position.x =
                    startX +
                    shock;


                camera.position.y =
                    startY +
                    shock * 0.5;
            }
        }
    );


    particleSystem
        .explode?.(
            1
        );


    await wait(
        getObservationConfig(
            "EXPLOSION_HOLD",
            120
        )
    );


    await fadeInAudio(
        getObservationConfig(
            "AUDIO_FADE_IN",
            1200
        )
    );


    particleSystem
        .finishExplosion?.();


    console.log(
        "[Observation] EXPLOSION COMPLETE"
    );
}


/*
 * =========================================================
 * ANIMATION
 * =========================================================
 */

function animate(
    duration,
    callback
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

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
                    Math.max(
                        0,
                        Math.min(
                            1,
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
                    progress >=
                    1
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
        ) * t
    );
}


/*
 * =========================================================
 * EASING
 * =========================================================
 */

function easeOutCubic(
    t
) {

    return (
        1 -
        Math.pow(
            1 - t,
            3
        )
    );
}


function easeInOut(
    t
) {

    return (
        t < 0.5

            ? 2 * t * t

            : 1 -
              Math.pow(
                  -2 * t + 2,
                  2
              ) / 2
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
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}


/*
 * =========================================================
 * CONFIG
 * =========================================================
 */

function getObservationConfig(
    key,
    fallback
) {

    try {

        const value =
            CONFIG?.OBSERVATION?.[key];


        const number =
            Number(value);


        return Number.isFinite(
            number
        )
            ? number
            : fallback;

    } catch (_) {

        return fallback;
    }
}