/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION DETECTOR
 *
 * Hidden Observation Target
 *
 * Camera
 *   ↓
 * Orientation
 *   ↓
 * Distance
 *   ↓
 * Position
 *   ↓
 * Scale
 *   ↓
 * Observation Score
 *   ↓
 * Hold ~2 seconds
 *   ↓
 * Observation Complete
 * =========================================================
 */

import {
    CONFIG
} from "../config.js";

import {
    STATE
} from "../core/state.js";


/*
 * =========================================================
 * DEFAULT CONFIG
 * =========================================================
 */

const DEFAULTS = {

    HOLD_TIME:
        2000,

    ANGLE_TOLERANCE:
        0.12,

    DISTANCE_TOLERANCE:
        0.10,

    POSITION_TOLERANCE:
        0.08,

    SCALE_TOLERANCE:
        0.08,

    SCORE_THRESHOLD:
        0.86
};


/*
 * =========================================================
 * OBSERVATION DETECTOR
 * =========================================================
 */

export class ObservationDetector {

    constructor(
        cameraController,
        universe
    ) {

        console.log(
            "[ObservationDetector] CONSTRUCTOR"
        );


        this.cameraController =
            cameraController;


        this.universe =
            universe;


        this.currentNebula =
            null;


        this.holdStart =
            0;


        this.completed =
            false;


        this.active =
            false;


        this.lastScore =
            0;


        this.lastCheck =
            0;


        console.log(
            "[ObservationDetector] READY"
        );
    }


    /*
     * =====================================================
     * ATTACH
     * =====================================================
     */

    attach(
        nebula
    ) {

        if (
            !nebula
        ) {

            return;
        }


        this.currentNebula =
            nebula;


        this.holdStart =
            0;


        this.completed =
            false;


        this.active =
            true;


        this.lastScore =
            0;


        console.log(
            "[ObservationDetector] ATTACHED"
        );
    }


    /*
     * =====================================================
     * RESET
     * =====================================================
     */

    reset() {

        this.currentNebula =
            null;


        this.holdStart =
            0;


        this.completed =
            false;


        this.active =
            false;


        this.lastScore =
            0;
    }


    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    update(
        now
    ) {

        if (
            !this.active
        ) {

            return;
        }


        if (
            this.completed
        ) {

            return;
        }


        if (
            !this.currentNebula
        ) {

            return;
        }


        /*
         * Only observation phase.
         */

        if (
            this.currentNebula.state !==
            "STABLE"
        ) {

            this.holdStart =
                0;

            return;
        }


        /*
         * Don't run detector while
         * another major event is active.
         */

        if (
            STATE.observationLocked ||
            STATE.shuffle
        ) {

            this.holdStart =
                0;

            return;
        }


        /*
         * Camera controller may not
         * be available during startup.
         */

        const camera =
            this.getCamera();


        if (
            !camera
        ) {

            return;
        }


        /*
         * Calculate observation score.
         */

        const result =
            this.evaluate(
                camera,
                this.currentNebula
            );


        this.lastScore =
            result.score;


        /*
         * Debug state.
         */

        this.currentNebula
            .observationScore =
            result.score;


        /*
         * =================================================
         * SUCCESS WINDOW
         * =================================================
         */

        if (
            result.success
        ) {

            if (
                this.holdStart ===
                0
            ) {

                this.holdStart =
                    now;


                console.log(
                    "[ObservationDetector] TARGET ACQUIRED"
                );
            }


            const held =
                now -
                this.holdStart;


            this.currentNebula
                .observationHold =
                held;


            /*
             * Hold long enough.
             */

            if (
                held >=
                getConfig(
                    "HOLD_TIME",
                    DEFAULTS.HOLD_TIME
                )
            ) {

                this.complete();

            }

        } else {

            /*
             * User moved away from
             * the observation window.
             */

            if (
                this.holdStart !==
                0
            ) {

                console.log(
                    "[ObservationDetector] TARGET LOST"
                );
            }


            this.holdStart =
                0;


            this.currentNebula
                .observationHold =
                0;
        }
    }


    /*
     * =====================================================
     * EVALUATE
     * =====================================================
     */

    evaluate(
        camera,
        nebula
    ) {

        const target =
            nebula.observation;


        if (
            !target
        ) {

            return {

                success:
                    false,

                score:
                    0
            };
        }


        /*
         * =================================================
         * CAMERA ROTATION
         * =================================================
         */

        const rotation =
            getCameraRotation(
                camera
            );


        const yawError =
            angularDistance(
                rotation.yaw,
                target.yaw
            );


        const pitchError =
            angularDistance(
                rotation.pitch,
                target.pitch
            );


        const rollError =
            angularDistance(
                rotation.roll,
                target.roll
            );


        const angleTolerance =
            getConfig(
                "ANGLE_TOLERANCE",
                DEFAULTS.ANGLE_TOLERANCE
            );


        const yawScore =
            toleranceScore(
                yawError,
                angleTolerance
            );


        const pitchScore =
            toleranceScore(
                pitchError,
                angleTolerance
            );


        const rollScore =
            toleranceScore(
                rollError,
                angleTolerance
            );


        const angleScore =
            (
                yawScore +
                pitchScore +
                rollScore
            ) / 3;


        /*
         * =================================================
         * DISTANCE
         * =================================================
         */

        const targetDistance =
            Number.isFinite(
                target.distance
            )
                ? target.distance
                : 110;


        const cameraDistance =
            getCameraDistance(
                camera
            );


        const distanceTolerance =
            getConfig(
                "DISTANCE_TOLERANCE",
                DEFAULTS.DISTANCE_TOLERANCE
            );


        const distanceError =
            relativeError(
                cameraDistance,
                targetDistance
            );


        const distanceScore =
            toleranceScore(
                distanceError,
                distanceTolerance
            );


        /*
         * =================================================
         * POSITION
         * =================================================
         */

        const targetPosition =
            target.position || {
                x: 0,
                y: 0,
                z: 0
            };


        const cameraPosition =
            camera.position;


        const positionDistance =
            distance3(
                cameraPosition,
                targetPosition
            );


        const positionScale =
            Math.max(
                1,
                Math.abs(
                    targetDistance
                )
            );


        const normalizedPositionError =
            positionDistance /
            positionScale;


        const positionTolerance =
            getConfig(
                "POSITION_TOLERANCE",
                DEFAULTS.POSITION_TOLERANCE
            );


        const positionScore =
            toleranceScore(
                normalizedPositionError,
                positionTolerance
            );


        /*
         * =================================================
         * SCALE
         * =================================================
         */

        const particleObject =
            this.universe
                ?.particleSystem
                ?.points;


        const actualScale =
            particleObject
                ? particleObject.scale.x
                : 1;


        const targetScale =
            Number.isFinite(
                target.scale
            )
                ? target.scale
                : 1;


        const scaleError =
            relativeError(
                actualScale,
                targetScale
            );


        const scaleTolerance =
            getConfig(
                "SCALE_TOLERANCE",
                DEFAULTS.SCALE_TOLERANCE
            );


        const scaleScore =
            toleranceScore(
                scaleError,
                scaleTolerance
            );


        /*
         * =================================================
         * FINAL SCORE
         * =================================================
         */

        /*
         * Orientation is the most important
         * part of the observation.
         */

        const score =

            angleScore *
            0.50

            +

            distanceScore *
            0.20

            +

            positionScore *
            0.15

            +

            scaleScore *
            0.15;


        const threshold =
            getConfig(
                "SCORE_THRESHOLD",
                DEFAULTS.SCORE_THRESHOLD
            );


        const success =
            score >=
            threshold;


        return {

            success,

            score,

            angleScore,

            distanceScore,

            positionScore,

            scaleScore,

            yawError,

            pitchError,

            rollError,

            distanceError,

            normalizedPositionError,

            scaleError
        };
    }


    /*
     * =====================================================
     * COMPLETE
     * =====================================================
     */

    complete() {

        if (
            this.completed
        ) {

            return;
        }


        this.completed =
            true;


        this.active =
            false;


        this.holdStart =
            0;


        if (
            this.currentNebula
        ) {

            this.currentNebula
                .observationScore =
                1;


            this.currentNebula
                .observationHold =
                getConfig(
                    "HOLD_TIME",
                    DEFAULTS.HOLD_TIME
                );
        }


        console.log(
            "[ObservationDetector] OBSERVATION COMPLETE"
        );


        /*
         * Universe already owns the
         * observation event.
         */

        if (
            this.universe &&
            typeof this.universe
                .completeObservation ===
            "function"
        ) {

            this.universe
                .completeObservation()
                .catch(
                    error => {

                        console.error(
                            "[ObservationDetector] COMPLETE EVENT ERROR:",
                            error
                        );

                    }
                );
        }
    }


    /*
     * =====================================================
     * CAMERA
     * =====================================================
     */

    getCamera() {

        if (
            this.cameraController?.camera
        ) {

            return this
                .cameraController
                .camera;
        }


        if (
            this.cameraController
        ) {

            return this.cameraController;
        }


        return null;
    }


    /*
     * =====================================================
     * DEBUG
     * =====================================================
     */

    getDebugState() {

        return {

            active:
                this.active,

            completed:
                this.completed,

            score:
                this.lastScore,

            holdStart:
                this.holdStart,

            holdDuration:
                this.currentNebula
                    ?.observationHold || 0
        };
    }
}


/*
 * =========================================================
 * CAMERA ROTATION
 * =========================================================
 */

function getCameraRotation(
    camera
) {

    if (
        !camera
    ) {

        return {

            yaw:
                0,

            pitch:
                0,

            roll:
                0
        };
    }


    return {

        yaw:
            normalizeAngle(
                camera.rotation.y
            ),

        pitch:
            normalizeAngle(
                camera.rotation.x
            ),

        roll:
            normalizeAngle(
                camera.rotation.z
            )
    };
}


/*
 * =========================================================
 * ANGULAR DISTANCE
 * =========================================================
 */

function angularDistance(
    a,
    b
) {

    let difference =
        normalizeAngle(
            a -
            b
        );


    return Math.abs(
        difference
    );
}


/*
 * =========================================================
 * NORMALIZE ANGLE
 * =========================================================
 */

function normalizeAngle(
    angle
) {

    while (
        angle >
        Math.PI
    ) {

        angle -=
            Math.PI * 2;
    }


    while (
        angle <
        -Math.PI
    ) {

        angle +=
            Math.PI * 2;
    }


    return angle;
}


/*
 * =========================================================
 * TOLERANCE SCORE
 * =========================================================
 */

function toleranceScore(
    error,
    tolerance
) {

    if (
        tolerance <=
        0
    ) {

        return error <=
            0
                ? 1
                : 0;
    }


    return Math.max(
        0,
        1 -
        (
            error /
            tolerance
        )
    );
}


/*
 * =========================================================
 * RELATIVE ERROR
 * =========================================================
 */

function relativeError(
    actual,
    target
) {

    const denominator =
        Math.max(
            0.000001,
            Math.abs(
                target
            )
        );


    return Math.abs(
        actual -
        target
    ) /
    denominator;
}


/*
 * =========================================================
 * DISTANCE
 * =========================================================
 */

function getCameraDistance(
    camera
) {

    if (
        !camera
    ) {

        return 0;
    }


    return Math.sqrt(

        camera.position.x *
        camera.position.x

        +

        camera.position.y *
        camera.position.y

        +

        camera.position.z *
        camera.position.z

    );
}


/*
 * =========================================================
 * 3D DISTANCE
 * =========================================================
 */

function distance3(
    a,
    b
) {

    if (
        !a ||
        !b
    ) {

        return Infinity;
    }


    const dx =
        a.x -
        b.x;


    const dy =
        a.y -
        b.y;


    const dz =
        a.z -
        b.z;


    return Math.sqrt(

        dx * dx +
        dy * dy +
        dz * dz

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