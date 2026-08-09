/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION EVENT
 *
 * Observation Complete
 *      ↓
 * Music Fade
 *      ↓
 * Input Lock
 *      ↓
 * Nebula Collapse
 *      ↓
 * Singularity
 *      ↓
 * Energy Explosion
 *      ↓
 * Camera Shock / Pullback
 *      ↓
 * Music Restore
 *      ↓
 * New Observation Cycle
 * =========================================================
 */

import {
    fadeMusicOut,
    restoreMusic
} from "../media/audio.js";

import {
    STATE,
    setPhase
} from "../core/state.js";

import {
    CONFIG
} from "../config.js";


/*
 * =========================================================
 * DEFAULT EVENT CONFIG
 *
 * CONFIG 裡面即使還沒有這些欄位，
 * 也會使用下面的安全預設值。
 * =========================================================
 */

const DEFAULTS = {

    COLLAPSE_DURATION:
        8500,

    EXPLOSION_DURATION:
        5500,

    CAMERA_PULL:
        0.025,

    CAMERA_EXPLOSION:
        0.8,

    CAMERA_SHAKE:
        0.35,

    SINGULARITY_HOLD:
        350,

    FADE_OUT:
        true,

    RESTORE_MUSIC:
        true
};


/*
 * =========================================================
 * PUBLIC EVENT
 * =========================================================
 */

export async function runObservationEvent(
    camera,
    particleSystem
) {

    console.log(
        "[ObservationEvent] START"
    );


    /*
     * =====================================================
     * SAFETY
     * =====================================================
     */

    if (
        !camera
    ) {

        console.error(
            "[ObservationEvent] CAMERA MISSING"
        );

        return;
    }


    if (
        !particleSystem
    ) {

        console.error(
            "[ObservationEvent] PARTICLE SYSTEM MISSING"
        );

        return;
    }


    if (
        STATE.observationLocked
    ) {

        console.log(
            "[ObservationEvent] ALREADY LOCKED"
        );

        return;
    }


    /*
     * =====================================================
     * LOCK
     * =====================================================
     */

    STATE.observationLocked =
        true;


    document.body.classList.add(
        "observation-lock"
    );


    setPhase(
        "OBSERVATION_COMPLETE"
    );


    console.log(
        "[ObservationEvent] INPUT LOCKED"
    );


    /*
     * =====================================================
     * MUSIC FADE
     * =====================================================
     */

    try {

        if (
            getConfig(
                "FADE_OUT",
                DEFAULTS.FADE_OUT
            )
        ) {

            fadeMusicOut();

            console.log(
                "[ObservationEvent] MUSIC FADING OUT"
            );
        }

    } catch (error) {

        console.warn(
            "[ObservationEvent] AUDIO FADE ERROR:",
            error
        );
    }


    /*
     * =====================================================
     * START COLLAPSE
     * =====================================================
     */

    try {

        await collapseNebula(
            camera,
            particleSystem
        );

    } catch (error) {

        console.error(
            "[ObservationEvent] COLLAPSE ERROR:",
            error
        );

        finishSafely();

        return;
    }


    /*
     * =====================================================
     * SINGULARITY HOLD
     * =====================================================
     */

    try {

        await wait(
            getConfig(
                "SINGULARITY_HOLD",
                DEFAULTS.SINGULARITY_HOLD
            )
        );

    } catch (_) {}


    /*
     * =====================================================
     * EXPLOSION
     * =====================================================
     */

    try {

        await explodeNebula(
            camera,
            particleSystem
        );

    } catch (error) {

        console.error(
            "[ObservationEvent] EXPLOSION ERROR:",
            error
        );

        finishSafely();

        return;
    }


    /*
     * =====================================================
     * NEW CYCLE
     * =====================================================
     */

    finishObservation();

}


/*
 * =========================================================
 * COLLAPSE
 * =========================================================
 */

function collapseNebula(
    camera,
    particleSystem
) {

    return new Promise(
        resolve => {

            console.log(
                "[ObservationEvent] COLLAPSE START"
            );


            setPhase(
                "COLLAPSE"
            );


            const start =
                performance.now();


            const duration =
                getConfig(
                    "COLLAPSE_DURATION",
                    DEFAULTS.COLLAPSE_DURATION
                );


            /*
             * Keep original camera position.
             *
             * This lets us create a controlled
             * inward movement rather than directly
             * teleporting the camera.
             */

            const originalCamera =
                camera.position.clone();


            /*
             * Determine singularity center.
             */

            const center =
                getParticleCenter(
                    particleSystem
                );


            /*
             * Store for debugging / later systems.
             */

            particleSystem.data
                .singularityCenter =
                center.clone();


            /*
             * =================================================
             * FRAME
             * =================================================
             */

            function frame(
                now
            ) {

                const raw =
                    Math.min(
                        1,
                        Math.max(
                            0,
                            (
                                now -
                                start
                            ) /
                            duration
                        )
                    );


                /*
                 * Smoothstep.
                 */

                const eased =
                    smoothstep(
                        raw
                    );


                /*
                 * =================================================
                 * PARTICLE COLLAPSE
                 * =================================================
                 */

                try {

                    particleSystem
                        .applyCollapse(
                            eased
                        );

                } catch (error) {

                    console.warn(
                        "[ObservationEvent] PARTICLE COLLAPSE ERROR:",
                        error
                    );
                }


                /*
                 * =================================================
                 * CAMERA GRAVITY
                 *
                 * Camera slowly moves toward
                 * the singularity.
                 * =================================================
                 */

                try {

                    const pull =
                        getConfig(
                            "CAMERA_PULL",
                            DEFAULTS.CAMERA_PULL
                        );


                    /*
                     * Don't instantly teleport.
                     *
                     * The pull becomes stronger
                     * as collapse approaches 100%.
                     */

                    const strength =
                        pull *
                        (
                            0.15 +
                            eased * 0.85
                        );


                    camera.position.lerp(
                        center,
                        strength
                    );

                } catch (error) {

                    console.warn(
                        "[ObservationEvent] CAMERA COLLAPSE ERROR:",
                        error
                    );
                }


                /*
                 * =================================================
                 * SINGULARITY VISUAL STATE
                 * =================================================
                 */

                updateSingularityVisual(
                    particleSystem,
                    eased
                );


                /*
                 * =================================================
                 * NEXT FRAME
                 * =================================================
                 */

                if (
                    raw < 1
                ) {

                    requestAnimationFrame(
                        frame
                    );

                    return;
                }


                /*
                 * Make sure final position
                 * is completely collapsed.
                 */

                try {

                    particleSystem
                        .applyCollapse(
                            1
                        );

                } catch (_) {}


                console.log(
                    "[ObservationEvent] SINGULARITY FORMED"
                );


                resolve();
            }


            requestAnimationFrame(
                frame
            );
        }
    );
}


/*
 * =========================================================
 * EXPLOSION
 * =========================================================
 */

function explodeNebula(
    camera,
    particleSystem
) {

    return new Promise(
        resolve => {

            console.log(
                "[ObservationEvent] EXPLOSION START"
            );


            setPhase(
                "EXPLOSION"
            );


            /*
             * Restore music exactly when
             * the singularity releases its energy.
             */

            try {

                if (
                    getConfig(
                        "RESTORE_MUSIC",
                        DEFAULTS.RESTORE_MUSIC
                    )
                ) {

                    restoreMusic();

                    console.log(
                        "[ObservationEvent] MUSIC RESTORED"
                    );
                }

            } catch (error) {

                console.warn(
                    "[ObservationEvent] AUDIO RESTORE ERROR:",
                    error
                );
            }


            const start =
                performance.now();


            const duration =
                getConfig(
                    "EXPLOSION_DURATION",
                    DEFAULTS.EXPLOSION_DURATION
                );


            /*
             * =================================================
             * ORIGINAL CAMERA POSITION
             * =================================================
             */

            const originalCameraZ =
                camera.position.z;


            /*
             * Explosion direction.
             *
             * Camera receives a temporary shock.
             */

            const shockDirection =
                new THREEVector3(
                    randomRange(
                        -1,
                        1
                    ),
                    randomRange(
                        -1,
                        1
                    ),
                    randomRange(
                        -1,
                        1
                    )
                );


            normalizeVector(
                shockDirection
            );


            /*
             * =================================================
             * FRAME
             * =================================================
             */

            function frame(
                now
            ) {

                const raw =
                    Math.min(
                        1,
                        Math.max(
                            0,
                            (
                                now -
                                start
                            ) /
                            duration
                        )
                    );


                /*
                 * Explosion starts violently,
                 * then slows down.
                 */

                const explosionPower =
                    1 -
                    easeOutCubic(
                        raw
                    );


                /*
                 * =================================================
                 * PARTICLES
                 * =================================================
                 */

                try {

                    particleSystem
                        .explode(
                            explosionPower
                        );

                } catch (error) {

                    console.warn(
                        "[ObservationEvent] PARTICLE EXPLOSION ERROR:",
                        error
                    );
                }


                /*
                 * =================================================
                 * CAMERA SHOCK
                 * =================================================
                 */

                try {

                    const shock =
                        getConfig(
                            "CAMERA_EXPLOSION",
                            DEFAULTS.CAMERA_EXPLOSION
                        );


                    /*
                     * Pull camera backward
                     * as the universe explodes.
                     */

                    camera.position.z =
                        originalCameraZ +
                        (
                            shock *
                            easeOutCubic(
                                raw
                            )
                        );


                    /*
                     * Small temporary shake.
                     */

                    const shake =
                        getConfig(
                            "CAMERA_SHAKE",
                            DEFAULTS.CAMERA_SHAKE
                        );


                    const shakeStrength =
                        Math.sin(
                            raw *
                            Math.PI *
                            8
                        ) *
                        (
                            1 -
                            raw
                        ) *
                        shake;


                    camera.position.x +=
                        shockDirection.x *
                        shakeStrength;


                    camera.position.y +=
                        shockDirection.y *
                        shakeStrength;


                } catch (error) {

                    console.warn(
                        "[ObservationEvent] CAMERA EXPLOSION ERROR:",
                        error
                    );
                }


                /*
                 * =================================================
                 * NEXT FRAME
                 * =================================================
                 */

                if (
                    raw < 1
                ) {

                    requestAnimationFrame(
                        frame
                    );

                    return;
                }


                console.log(
                    "[ObservationEvent] EXPLOSION COMPLETE"
                );


                resolve();
            }


            requestAnimationFrame(
                frame
            );
        }
    );
}


/*
 * =========================================================
 * SINGULARITY VISUAL
 * =========================================================
 *
 * The actual shader remains responsible for rendering.
 * Here we expose a normalized state so the particle
 * system can optionally use it later.
 * =========================================================
 */

function updateSingularityVisual(
    particleSystem,
    progress
) {

    if (
        !particleSystem ||
        !particleSystem.data
    ) {

        return;
    }


    particleSystem.data
        .collapseProgress =
        progress;


    /*
     * Optional material hooks.
     *
     * Current ParticleSystem does not require
     * these uniforms, therefore this is completely
     * backward compatible.
     */

    try {

        const uniforms =
            particleSystem
                .material
                ?.uniforms;


        if (!uniforms) {

            return;
        }


        if (
            uniforms.uCollapse
        ) {

            uniforms.uCollapse.value =
                progress;
        }


        if (
            uniforms.uBrightness
        ) {

            uniforms.uBrightness.value =
                1 +
                progress * 2;
        }

    } catch (_) {}
}


/*
 * =========================================================
 * FINISH
 * =========================================================
 */

function finishObservation() {

    console.log(
        "[ObservationEvent] EVENT COMPLETE"
    );


    /*
     * Unlock.
     */

    STATE.observationLocked =
        false;


    STATE.observationComplete =
        false;


    document.body.classList.remove(
        "observation-lock"
    );


    setPhase(
        "NEW_CYCLE"
    );


    /*
     * =====================================================
     * NEW NEBULA
     * =====================================================
     *
     * Universe already owns the cycle.
     *
     * Keep this bridge compatible with
     * your current universe.js.
     */

    try {

        if (
            typeof window !==
            "undefined" &&
            typeof window
                .__generateNextNebula ===
            "function"
        ) {

            console.log(
                "[ObservationEvent] REQUEST NEW CYCLE"
            );


            window
                .__generateNextNebula();

        } else {

            console.warn(
                "[ObservationEvent] NEXT CYCLE HOOK NOT FOUND"
            );
        }

    } catch (error) {

        console.error(
            "[ObservationEvent] NEXT CYCLE ERROR:",
            error
        );
    }
}


/*
 * =========================================================
 * SAFE FAILURE
 * =========================================================
 */

function finishSafely() {

    console.warn(
        "[ObservationEvent] SAFE RECOVERY"
    );


    STATE.observationLocked =
        false;


    STATE.observationComplete =
        false;


    document.body.classList.remove(
        "observation-lock"
    );


    setPhase(
        "EXPLORATION"
    );
}


/*
 * =========================================================
 * PARTICLE CENTER
 * =========================================================
 */

function getParticleCenter(
    particleSystem
) {

    if (
        particleSystem?.data
            ?.center
    ) {

        return particleSystem
            .data
            .center
            .clone();
    }


    return new THREEVector3(
        0,
        0,
        0
    );
}


/*
 * =========================================================
 * SMOOTHSTEP
 * =========================================================
 */

function smoothstep(
    x
) {

    return (
        x *
        x *
        (
            3 -
            2 * x
        )
    );
}


/*
 * =========================================================
 * EASE OUT CUBIC
 * =========================================================
 */

function easeOutCubic(
    x
) {

    return (
        1 -
        Math.pow(
            1 - x,
            3
        )
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
 * CONFIG
 * =========================================================
 */

function getConfig(
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


/*
 * =========================================================
 * RANDOM
 * =========================================================
 */

function randomRange(
    min,
    max
) {

    return (
        min +
        Math.random() *
        (
            max -
            min
        )
    );
}


/*
 * =========================================================
 * VECTOR HELPERS
 *
 * Kept local so this module does not
 * need another Three.js dependency.
 * =========================================================
 */

function THREEVector3(
    x = 0,
    y = 0,
    z = 0
) {

    return {

        x,
        y,
        z,

        clone() {

            return THREEVector3(
                this.x,
                this.y,
                this.z
            );
        },

        lerp(
            target,
            alpha
        ) {

            this.x +=
                (
                    target.x -
                    this.x
                ) *
                alpha;


            this.y +=
                (
                    target.y -
                    this.y
                ) *
                alpha;


            this.z +=
                (
                    target.z -
                    this.z
                ) *
                alpha;


            return this;
        }
    };
}


/*
 * =========================================================
 * VECTOR NORMALIZE
 * =========================================================
 */

function normalizeVector(
    vector
) {

    const length =
        Math.sqrt(
            vector.x * vector.x +
            vector.y * vector.y +
            vector.z * vector.z
        );


    if (
        length <=
        0.000001
    ) {

        vector.x =
            0;

        vector.y =
            0;

        vector.z =
            1;

        return vector;
    }


    vector.x /=
        length;

    vector.y /=
        length;

    vector.z /=
        length;


    return vector;
}