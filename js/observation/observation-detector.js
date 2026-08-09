/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION DETECTOR
 *
 * Pure Observation Validator
 *
 * 負責：
 *
 * Camera
 *   ↓
 * Rotation
 *   ↓
 * Distance
 *   ↓
 * Position
 *   ↓
 * Scale
 *   ↓
 * Observation Score
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * Detector ONLY calculates observation validity.
 *
 * Detector DOES NOT:
 *
 * - start observation event
 * - lock controls
 * - play / pause audio
 * - collapse particles
 * - explode particles
 * - call universe.completeObservation()
 *
 * Observer / Universe 負責事件流程。
 * =========================================================
 */

import {
    CONFIG
} from "../config.js";


const DEFAULTS = {

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

        this.lastScore =
            0;

        this.lastResult =
            null;

        this.active =
            false;


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

            this.reset();

            console.warn(
                "[ObservationDetector] ATTACH FAILED"
            );

            return;
        }


        this.currentNebula =
            nebula;

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
     *
     * Pure detector update.
     *
     * Returns:
     *
     * {
     *   valid,
     *   score,
     *   ...
     * }
     * =====================================================
     */

    update() {

        if (
            !this.active
        ) {

            return this.invalidResult();
        }


        const nebula =
            this.currentNebula;


        if (
            !nebula
        ) {

            return this.invalidResult();
        }


        /*
         * Only stable nebula
         * can be observed.
         */

        if (
            nebula.state !==
            "STABLE"
        ) {

            return this.invalidResult();
        }


        const camera =
            this.getCamera();


        if (
            !camera
        ) {

            return this.invalidResult();
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


        return result;
    }


    /*
     * =====================================================
     * INVALID RESULT
     * =====================================================
     */

    invalidResult() {

        this.lastScore =
            0;

        this.lastResult =
            null;


        return {

            valid:
                false,

            score:
                0,

            angleScore:
                0,

            distanceScore:
                0,

            positionScore:
                0,

            scaleScore:
                0,

            yawError:
                Infinity,

            pitchError:
                Infinity,

            rollError:
                Infinity,

            distanceError:
                Infinity,

            normalizedPositionError:
                Infinity,

            scaleError:
                Infinity
        };
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

            return this.invalidResult();
        }


        /*
         * -------------------------------------------------
         * ROTATION
         * -------------------------------------------------
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
         * -------------------------------------------------
         * DISTANCE
         * -------------------------------------------------
         */

        const targetDistance =
            Number.isFinite(
                Number(
                    target.distance
                )
            )
                ? Number(
                    target.distance
                )
                : 110;


        const cameraDistance =
            getCameraDistance(
                camera
            );


        const distanceError =
            relativeError(
                cameraDistance,
                targetDistance
            );


        const distanceScore =
            toleranceScore(
                distanceError,
                getConfig(
                    "DISTANCE_TOLERANCE",
                    DEFAULTS.DISTANCE_TOLERANCE
                )
            );


        /*
         * -------------------------------------------------
         * POSITION
         * -------------------------------------------------
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


        const positionReference =
            Math.max(
                1,
                Math.abs(
                    targetDistance
                )
            );


        const normalizedPositionError =
            positionDistance /
            positionReference;


        const positionScore =
            toleranceScore(
                normalizedPositionError,
                getConfig(
                    "POSITION_TOLERANCE",
                    DEFAULTS.POSITION_TOLERANCE
                )
            );


        /*
         * -------------------------------------------------
         * SCALE
         * -------------------------------------------------
         */

        const particleObject =
            this.universe
                ?.particleSystem
                ?.points;


        const actualScale =
            particleObject?.scale
                ? Number(
                    particleObject.scale.x
                )
                : 1;


        const targetScale =
            Number.isFinite(
                Number(
                    target.scale
                )
            )
                ? Number(
                    target.scale
                )
                : 1;


        const scaleError =
            relativeError(
                actualScale,
                targetScale
            );


        const scaleScore =
            toleranceScore(
                scaleError,
                getConfig(
                    "SCALE_TOLERANCE",
                    DEFAULTS.SCALE_TOLERANCE
                )
            );


        /*
         * -------------------------------------------------
         * FINAL SCORE
         * -------------------------------------------------
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


        const valid =
            score >=
            threshold;


        return {

            valid,

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


        return this.cameraController ||
            null;
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

            score:
                this.lastScore,

            result:
                this.lastResult,

            nebula:
                this.currentNebula
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
        !camera?.rotation
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
 * ANGLE
 * =========================================================
 */

function angularDistance(
    a,
    b
) {

    return Math.abs(
        normalizeAngle(
            a - b
        )
    );
}


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
 * TOLERANCE
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
        !camera?.position
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
 * DISTANCE 3
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
        Number(a.x) -
        Number(b.x);


    const dy =
        Number(a.y) -
        Number(b.y);


    const dz =
        Number(a.z) -
        Number(b.z);


    return Math.sqrt(

        dx * dx +
        dy * dy +
        dz * dz
    );
}


/*
 * =========================================================
 * VECTOR
 * =========================================================
 */

function normalizeVector3(
    value
) {

    return {

        x:
            Number(
                value?.x
            ) || 0,

        y:
            Number(
                value?.y
            ) || 0,

        z:
            Number(
                value?.z
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
                Number(
                    observation[key]
                )
            )
        ) {

            return Number(
                observation[key]
            );
        }

    } catch (_) {}


    return fallback;
}