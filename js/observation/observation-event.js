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


    /*
     * =====================================================
     * LOCK
     * =====================================================
     */

    lockControls();


    setPhase(
        "OBSERVATION_EVENT"
    );


    try {

        /*
         * =================================================
         * AUDIO FADE
         * =================================================
         */

        await fadeOutAudio(
            1200
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
            2600
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
            1400
        );


        /*
         * =================================================
         * BURST
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
            1800
        );


        /*
         * =================================================
         * RESET
         * =================================================
         */

        particleSystem.resetPositions?.();


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
         * Always attempt to
         * recover the particle system.
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


    /*
     * Generic event flag.
     *
     * Existing controls can inspect
     * STATE.controlsLocked without
     * requiring direct coupling.
     */

    document.documentElement
        .classList
        .add(
            "observation-locked"
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


    document.documentElement
        .classList
        .remove(
            "observation-locked"
        );


    console.log(
        "[Observation] CONTROLS UNLOCKED"
    );
}


/*
 * =========================================================
 * AUDIO FADE
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


    const start =
        performance.now();


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
                    (1 - p)
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

    /*
     * First try common IDs.
     */

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
            element instanceof
            HTMLMediaElement
        ) {

            return element;
        }
    }


    /*
     * Fallback:
     * first audio element.
     */

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


    const start =
        performance.now();


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

    const startZ =
        Number.isFinite(
            camera.position?.z
        )
            ? camera.position.z
            : 100;


    const startX =
        Number.isFinite(
            camera.position?.x
        )
            ? camera.position.x
            : 0;


    const startY =
        Number.isFinite(
            camera.position?.y
        )
            ? camera.position.y
            : 0;


    /*
     * Singularity is represented
     * by the particle system itself.
     */

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
             * Camera slowly approaches
             * the center.
             */

            if (
                camera.position
            ) {

                camera.position.z =
                    lerp(
                        startZ,
                        Math.max(
                            2,
                            startZ * 0.45
                        ),
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
     * Hold singularity briefly.
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

    const startZ =
        Number.isFinite(
            camera.position?.z
        )
            ? camera.position.z
            : 50;


    const startX =
        Number.isFinite(
            camera.position?.x
        )
            ? camera.position.x
            : 0;


    const startY =
        Number.isFinite(
            camera.position?.y
        )
            ? camera.position.y
            : 0;


    /*
     * Camera shock.
     */

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
             * Force camera outward.
             */

            if (
                camera.position
            ) {

                const pullBack =
                    lerp(
                        0,
                        startZ * 1.8,
                        p
                    );


                camera.position.z =
                    startZ +
                    pullBack;


                /*
                 * Small shock wave.
                 */

                const shock =
                    Math.sin(
                        progress *
                        Math.PI *
                        8
                    ) *
                    (1 - progress) *
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


    /*
     * Guarantee final explosion state.
     */

    particleSystem
        .explode?.(
            1
        );


    /*
     * Restore music.
     */

    await fadeInAudio(
        1200
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
        resolve => {

            const start =
                performance.now();


            function frame(
                now
            ) {

                const elapsed =
                    now -
                    start;


                const progress =
                    Math.min(
                        1,
                        elapsed /
                        duration
                    );


                try {

                    callback(
                        progress
                    );

                } catch (error) {

                    console.error(
                        "[Observation] ANIMATION CALLBACK ERROR:",
                        error
                    );
                }


                if (
                    progress >= 1
                ) {

                    resolve();

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
                milliseconds
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

    return t * t * t;
}


function easeOutCubic(
    t
) {

    return 1 -
        Math.pow(
            1 - t,
            3
        );
}


function easeInOut(
    t
) {

    return t < 0.5

        ? 2 * t * t

        : 1 -
          Math.pow(
              -2 * t + 2,
              2
          ) / 2;
}