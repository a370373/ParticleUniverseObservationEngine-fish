/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION SIMILARITY
 *
 * Single Observation Score Core
 *
 * 負責：
 *
 * Camera
 *   ↓
 * Rotation
 * Distance
 * Position
 * Scale
 *   ↓
 * Unified Similarity Score
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * 這個模組只負責「計算」。
 *
 * 不負責：
 *
 * - Hold Timer
 * - Observation Complete
 * - Audio
 * - Particle Collapse
 * - Explosion
 * - Control Lock
 *
 * 所有 Observation 判定模組
 * 都應該使用這裡的結果。
 * =========================================================
 */


/*
 * =========================================================
 * DEFAULTS
 * =========================================================
 */

const DEFAULTS = {

    ANGLE_TOLERANCE:
        0.12,

    DISTANCE_TOLERANCE:
        0.10,

    POSITION_TOLERANCE:
        0.08,

    SCALE_TOLERANCE:
        0.08,

    /*
     * Rotation is dominant because
     * the hidden image is primarily
     * revealed by camera orientation.
     */

    ROTATION_WEIGHT:
        0.50,

    DISTANCE_WEIGHT:
        0.20,

    POSITION_WEIGHT:
        0.15,

    SCALE_WEIGHT:
        0.15
};


/*
 * =========================================================
 * MAIN SCORE
 * =========================================================
 */

export function calculateObservationScore(
    camera,
    nebula,
    THREE
) {

    /*
     * -----------------------------------------------------
     * VALIDATION
     * -----------------------------------------------------
     */

    if (
        !camera ||
        !nebula
    ) {

        return createEmptyResult();
    }


    const target =
        nebula.observation;


    if (
        !target
    ) {

        return createEmptyResult();
    }


    /*
     * -----------------------------------------------------
     * CAMERA NORMALIZATION
     * -----------------------------------------------------
     */

    const cameraState =
        normalizeCamera(
            camera
        );


    /*
     * -----------------------------------------------------
     * ROTATION
     * -----------------------------------------------------
     */

    const rotation =
        calculateRotationScore(
            cameraState.rotation,
            target
        );


    /*
     * -----------------------------------------------------
     * DISTANCE
     * -----------------------------------------------------
     */

    const distance =
        calculateDistanceScore(
            cameraState.position,
            target,
            nebula
        );


    /*
     * -----------------------------------------------------
     * POSITION
     * -----------------------------------------------------
     */

    const position =
        calculatePositionScore(
            cameraState.position,
            target
        );


    /*
     * -----------------------------------------------------
     * SCALE
     * -----------------------------------------------------
     */

    const scale =
        calculateScaleScore(
            nebula,
            target
        );


    /*
     * -----------------------------------------------------
     * FINAL SCORE
     * -----------------------------------------------------
     */

    const score =

        rotation.score *
        DEFAULTS.ROTATION_WEIGHT

        +

        distance.score *
        DEFAULTS.DISTANCE_WEIGHT

        +

        position.score *
        DEFAULTS.POSITION_WEIGHT

        +

        scale.score *
        DEFAULTS.SCALE_WEIGHT;


    /*
     * -----------------------------------------------------
     * VALID
     * -----------------------------------------------------
     */

    const valid =

        score >=
        getThreshold()

        &&

        rotation.score >=
        0.70

        &&

        distance.score >=
        0.70;


    return {

        valid,

        score,

        rotationScore:
            rotation.score,

        distanceScore:
            distance.score,

        positionScore:
            position.score,

        scaleScore:
            scale.score,

        yawError:
            rotation.yawError,

        pitchError:
            rotation.pitchError,

        rollError:
            rotation.rollError,

        distanceError:
            distance.error,

        positionError:
            position.error,

        scaleError:
            scale.error
    };
}


/*
 * =========================================================
 * ROTATION SCORE
 * =========================================================
 */

function calculateRotationScore(
    rotation,
    target
) {

    const targetYaw =
        toNumber(
            target.yaw,
            0
        );


    const targetPitch =
        toNumber(
            target.pitch,
            0
        );


    const targetRoll =
        toNumber(
            target.roll,
            0
        );


    const yawError =
        angleDifference(
            rotation.yaw,
            targetYaw
        );


    const pitchError =
        angleDifference(
            rotation.pitch,
            targetPitch
        );


    const rollError =
        angleDifference(
            rotation.roll,
            targetRoll
        );


    const yawScore =
        toleranceScore(
            yawError,
            DEFAULTS.ANGLE_TOLERANCE
        );


    const pitchScore =
        toleranceScore(
            pitchError,
            DEFAULTS.ANGLE_TOLERANCE
        );


    const rollScore =
        toleranceScore(
            rollError,
            DEFAULTS.ANGLE_TOLERANCE
        );


    const score =

        yawScore * 0.45

        +

        pitchScore * 0.35

        +

        rollScore * 0.20;


    return {

        score,

        yawError,

        pitchError,

        rollError
    };
}


/*
 * =========================================================
 * DISTANCE SCORE
 * =========================================================
 */

function calculateDistanceScore(
    cameraPosition,
    target,
    nebula
) {

    /*
     * Target distance is authoritative.
     */

    const targetDistance =
        toNumber(
            target.distance,
            110
        );


    /*
     * Prefer distance from origin,
     * because observation targets are
     * defined in camera/world coordinates.
     *
     * If nebula.center exists, it can
     * still be used when available.
     */

    const center =
        normalizeVector3(
            nebula?.center
        );


    const cameraDistance =
        distance3(
            cameraPosition,
            center
        );


    const safeTargetDistance =
        Math.max(
            0.000001,
            Math.abs(
                targetDistance
            )
        );


    const error =
        Math.abs(
            cameraDistance -
            targetDistance
        )
        /
        safeTargetDistance;


    const score =
        toleranceScore(
            error,
            DEFAULTS.DISTANCE_TOLERANCE
        );


    return {

        score,

        error,

        cameraDistance,

        targetDistance
    };
}


/*
 * =========================================================
 * POSITION SCORE
 * =========================================================
 */

function calculatePositionScore(
    cameraPosition,
    target
) {

    const targetPosition =
        normalizeVector3(
            target.position
        );


    const error =
        distance3(
            cameraPosition,
            targetPosition
        );


    /*
     * Normalize position error
     * against observation distance.
     */

    const reference =
        Math.max(
            1,
            Math.abs(
                toNumber(
                    target.distance,
                    100
                )
            )
        );


    const normalizedError =
        error /
        reference;


    const score =
        toleranceScore(
            normalizedError,
            DEFAULTS.POSITION_TOLERANCE
        );


    return {

        score,

        error:
            normalizedError
    };
}


/*
 * =========================================================
 * SCALE SCORE
 * =========================================================
 */

function calculateScaleScore(
    nebula,
    target
) {

    const targetScale =
        toNumber(
            target.scale,
            1
        );


    /*
     * Try particle object scale first.
     */

    const particleObject =
        nebula?.particleSystem
            ?.points

        ||

        nebula?.points

        ||

        null;


    let actualScale =
        1;


    if (
        particleObject?.scale
    ) {

        actualScale =
            toNumber(
                particleObject.scale.x,
                1
            );
    }


    /*
     * If the nebula itself exposes
     * a scale value, prefer it.
     */

    if (
        Number.isFinite(
            Number(
                nebula?.scale
            )
        )
    ) {

        actualScale =
            Number(
                nebula.scale
            );
    }


    const error =
        relativeError(
            actualScale,
            targetScale
        );


    const score =
        toleranceScore(
            error,
            DEFAULTS.SCALE_TOLERANCE
        );


    return {

        score,

        error,

        actualScale,

        targetScale
    };
}


/*
 * =========================================================
 * CAMERA NORMALIZATION
 * =========================================================
 */

function normalizeCamera(
    camera
) {

    /*
     * Supports:
     *
     * camera.rotation
     *
     * camera.yaw / pitch / roll
     *
     * camera.position
     */

    const rotation =
        camera.rotation
            ? {

                yaw:
                    toNumber(
                        camera.rotation.y,
                        0
                    ),

                pitch:
                    toNumber(
                        camera.rotation.x,
                        0
                    ),

                roll:
                    toNumber(
                        camera.rotation.z,
                        0
                    )

            }
            : {

                yaw:
                    toNumber(
                        camera.yaw,
                        0
                    ),

                pitch:
                    toNumber(
                        camera.pitch,
                        0
                    ),

                roll:
                    toNumber(
                        camera.roll,
                        0
                    )
            };


    const position =
        normalizeVector3(
            camera.position
        );


    return {

        rotation,

        position
    };
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
 * ANGLE DIFFERENCE
 * =========================================================
 */

function angleDifference(
    a,
    b
) {

    let difference =
        toNumber(
            a,
            0
        )
        -

        toNumber(
            b,
            0
        );


    while (
        difference >
        Math.PI
    ) {

        difference -=
            Math.PI * 2;
    }


    while (
        difference <
        -Math.PI
    ) {

        difference +=
            Math.PI * 2;
    }


    return Math.abs(
        difference
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
            toNumber(
                value.x,
                0
            ),

        y:
            toNumber(
                value.y,
                0
            ),

        z:
            toNumber(
                value.z,
                0
            )
    };
}


/*
 * =========================================================
 * DISTANCE 3D
 * =========================================================
 */

function distance3(
    a,
    b
) {

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

        dx * dx

        +

        dy * dy

        +

        dz * dz

    );
}


/*
 * =========================================================
 * NUMBER
 * =========================================================
 */

function toNumber(
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
 * THRESHOLD
 * =========================================================
 */

function getThreshold() {

    /*
     * Avoid importing CONFIG here.
     *
     * This keeps similarity.js a pure
     * calculation module.
     *
     * Higher-level modules can enforce
     * their configured threshold.
     */

    return 0.86;
}


/*
 * =========================================================
 * EMPTY RESULT
 * =========================================================
 */

function createEmptyResult() {

    return {

        valid:
            false,

        score:
            0,

        rotationScore:
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

        positionError:
            Infinity,

        scaleError:
            Infinity
    };
}