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
 * Camera Shock / Pull Back
 *        ↓
 * Audio Fade In
 *        ↓
 * Event Complete
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
 * MAIN EVENT
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
            "Observation requires a camera."
        );
    }


    if (
        !particleSystem
    ) {

        throw new Error(
            "Observation requires a particle system."
        );
    }


    /*
     * Prevent duplicate event.
     */

    if (
        STATE.observationEvent
    ) {

        console.warn(
            "[Observation] EVENT ALREADY RUNNING"
        );

        return;
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

        /*
         * =================================================
         * AUDIO FADE OUT
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
         * ENERGY BURST
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
         * RESET
         * =================================================
         */

        try {

            particleSystem
                .resetPositions?.();

        } catch (error) {

            console.warn(
                "[Observation] RESET FAILED:",
                error
            );
        }


        /*
         * =================================================
         * COMPLETE
         * =================================================
         */

        console.log(
            "[Observation] EVENT COMPLETE"
        );


        setPhase(
            "EXPLORATION"
        );

    } catch (error) {

        console.error(
            "[Observation] EVENT ERROR:",
            error
        );


        /*
         * Attempt particle recovery.
         */

        try {

            particleSystem
                .resetPositions?.();

        } catch (_) {}


        setPhase(
            "EXPLORATION"
        );


        throw error;

    } finally {

        /*
         * =================================================
         * UNLOCK
         * =================================================
         */

        unlockControls();


        STATE.observationLocked =
            false;


        STATE.observationEvent =
            false;
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


    console.log(
        "[Observation] CONTROLS LOCKED"
    );


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
            audio.volume
        )
            ? audio.volume
            : 1;


    await animate(
        duration,
        progress => {

            const p =
                easeInOut(
                    progress
                );


            audio.volume =
                Math.max(
                    0,
                    startVolume *
                    (
                        1 -
                        p
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

        "audio",

        "music",

        "mainAudio"

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


    if (
        audio
    ) {

        return audio;
    }


    return null;
}


/*
 * =========================================================
 * PARTICLE COLLAPSE
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

            const p =
                easeInCubic(
                    progress
                );


            particleSystem
                .applyCollapse?.(
                    p
                );
        }
    );


    /*
     * Guarantee final state.
     */

    particleSystem
        .applyCollapse?.(
            1
        );


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


    const targetZ =
        Math.max(
            2,
            startZ * 0.45
        );


    await animate(
        duration,
        progress => {

            const p =
                easeInOut(
                    progress
                );


            /*
             * Keep particles compressed.
             */

            particleSystem
                .applyCollapse?.(
                    1
                );


            /*
             * Camera approaches
             * the singularity.
             */

            if (
                camera.position
            ) {

                camera.position.z =
                    lerp(
                        startZ,
                        targetZ,
                        p
                    );


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
            }
        }
    );


    /*
     * Hold the singularity.
     */

    await wait(
        250
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
     * Prevent invalid camera
     * pull-back distance.
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

            const p =
                easeOutCubic(
                    progress
                );


            /*
             * Explosion.
             */

            particleSystem
                .explode?.(
                    p
                );


            /*
             * Camera pull-back.
             */

            if (
                camera.position
            ) {

                camera.position.z =
                    startZ +
                    pullDistance *
                    p;


                /*
                 * Camera shock wave.
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
     * Guarantee final explosion state.
     */

    particleSystem
        .explode?.(
            1
        );


    /*
     * Restore audio.
     */

    await fadeInAudio(
        getObservationConfig(
            "AUDIO_FADE_IN",
            1200
        )
    );


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

            const safeDuration =
                Math.max(
                    1,
                    Number(
                        duration
                    ) || 1
                );


            const start =
                performance.now();


            let finished =
                false;


            function finish() {

                if (
                    finished
                ) {

                    return;
                }


                finished =
                    true;


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
                        elapsed /
                        safeDuration
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


                requestAnimationFrame(
                    frame
                );
            }


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

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                Math.max(
                    0,
                    Number(
                        milliseconds
                    ) || 0
                )
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

    return t *
        t *
        t;
}


function easeOutCubic(
    t
) {

    return 1 -
        Math.pow(
            1 -
            t,
            3
        );
}


function easeInOut(
    t
) {

    return t < 0.5

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
          2;
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

    return Number.isFinite(
        Number(
            value
        )
    )
        ? Number(
            value
        )
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


        if (
            observation &&
            Number.isFinite(
                observation[key]
            )
        ) {

            return observation[key];
        }


        return fallback;

    } catch (_) {

        return fallback;
    }
}