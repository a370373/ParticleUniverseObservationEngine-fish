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


        this.lastResult =
            null;


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

            console.warn(
                "[ObservationDetector] ATTACH FAILED: no nebula"
            );

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


        this.lastResult =
            null;


        nebula.observationScore =
            0;


        nebula.observationHold =
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


        this.lastResult =
            null;
    }


    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    update(
        now = performance.now()
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


        const nebula =
            this.currentNebula;


        if (
            !nebula
        ) {

            return;
        }


        /*
         * Only stable nebula can
         * be observed.
         */

        if (
            nebula.state !==
            "STABLE"
        ) {

            this.resetHold();

            return;
        }


        /*
         * Never detect during
         * another major event.
         */

        if (
            STATE.observationEvent ||
            STATE.observationLocked ||
            STATE.controlsLocked ||
            STATE.shuffle
        ) {

            this.resetHold();

            return;
        }


        const camera =
            this.getCamera();


        if (
            !camera
        ) {

            return;
        }


        const result =
            this.evaluate(
                camera,
                nebula
            );


        this.lastScore =
            result.score;


        this.lastResult =
            result;


        nebula.observationScore =
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


            nebula.observationHold =
                held;


            const holdTime =
                getConfig(
                    "HOLD_TIME",
                    DEFAULTS.HOLD_TIME
                );


            if (
                held >=
                holdTime
            ) {

                this.complete();
            }


        } else {

            if (
                this.holdStart !==
                0
            ) {

                console.log(
                    "[ObservationDetector] TARGET LOST"
                );
            }


            this.resetHold();
        }
    }


    /*
     * =====================================================
     * RESET HOLD
     * =====================================================
     */

    resetHold() {

        this.holdStart =
            0;


        if (
            this.currentNebula
        ) {

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
            nebula?.observation;


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
                Number(
                    target.yaw
                ) || 0
            );


        const pitchError =
            angularDistance(
                rotation.pitch,
                Number(
                    target.pitch
                ) || 0
            );


        const rollError =
            angularDistance(
                rotation.roll,
                Number(
                    target.roll
                ) || 0
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
         * CAMERA DISTANCE
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
         * CAMERA POSITION
         * =================================================
         *
         * The target position is the intended
         * camera position.
         *
         * If no target position exists,
         * default to origin.
         */

        const targetPosition =
            normalizeVector3(
                target.position
            );


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
         * PARTICLE SCALE
         * =================================================
         */

        const particleObject =
            this.universe
                ?.particleSystem
                ?.points;


        const actualScale =
            particleObject &&
            particleObject.scale
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
         *
         * Orientation is dominant.
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
         * Universe owns the actual
         * observation event.
         */

        if (
            this.universe &&
            typeof this.universe
                .completeObservation ===
            "function"
        ) {

            Promise.resolve(
                this.universe
                    .completeObservation()
            )
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
            this.cameraController &&
            this.cameraController.camera
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
                    ?.observationHold ||
                0,

            result:
                this.lastResult
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
        !camera ||
        !camera.rotation
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
                Number(
                    camera.rotation.y
                ) || 0
            ),

        pitch:
            normalizeAngle(
                Number(
                    camera.rotation.x
                ) || 0
            ),

        roll:
            normalizeAngle(
                Number(
                    camera.rotation.z
                ) || 0
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

    const difference =
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

    let value =
        Number(
            angle
        ) || 0;


    while (
        value >
        Math.PI
    ) {

        value -=
            Math.PI * 2;
    }


    while (
        value <
        -Math.PI
    ) {

        value +=
            Math.PI * 2;
    }


    return value;
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
        !Number.isFinite(
            error
        )
    ) {

        return 0;
    }


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
        Math.min(
            1,
            1 -
            (
                error /
                tolerance
            )
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
 * CAMERA DISTANCE
 * =========================================================
 */

function getCameraDistance(
    camera
) {

    if (
        !camera ||
        !camera.position
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
        Number(
            a.x
        ) -
        Number(
            b.x
        );


    const dy =
        Number(
            a.y
        ) -
        Number(
            b.y
        );


    const dz =
        Number(
            a.z
        ) -
        Number(
            b.z
        );


    return Math.sqrt(

        dx * dx +
        dy * dy +
        dz * dz

    );
}


/*
 * =========================================================
 * VECTOR NORMALIZATION
 * =========================================================
 */

function normalizeVector3(
    value
) {

    if (
        !value
    ) {

        return {

            x:
                0,

            y:
                0,

            z:
                0
        };
    }


    return {

        x:
            Number(
                value.x
            ) || 0,

        y:
            Number(
                value.y
            ) || 0,

        z:
            Number(
                value.z
            ) || 0
    };
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