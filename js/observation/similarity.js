/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION SIMILARITY
 *
 * Unified Observation Score Core
 *
 * Camera
 *   ↓
 * Rotation
 * Distance
 * Position
 * Scale
 * Optional Image Similarity
 *   ↓
 * Unified Observation Score
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * This module ONLY calculates observation similarity.
 *
 * It does NOT control:
 *
 * - Hold Timer
 * - Observation Complete
 * - Observation Event
 * - Audio
 * - Particle Collapse
 * - Explosion
 * - STATE
 * - Controls
 *
 * Observer / Universe logic should consume the
 * result returned by calculateObservationScore().
 *
 * =========================================================
 */


/*
 * =========================================================
 * DEFAULTS
 * =========================================================
 */

const DEFAULTS = {

    /*
     * Maximum tolerated angular error.
     *
     * radians
     */

    ANGLE_TOLERANCE:
        0.12,


    /*
     * Maximum relative distance error.
     *
     * 0.10 = 10%
     */

    DISTANCE_TOLERANCE:
        0.10,


    /*
     * Maximum normalized position error.
     */

    POSITION_TOLERANCE:
        0.08,


    /*
     * Maximum relative scale error.
     */

    SCALE_TOLERANCE:
        0.08,


    /*
     * Image similarity is optional.
     *
     * It is NOT automatically enabled unless
     * a valid image similarity value is supplied.
     */

    IMAGE_SIMILARITY_WEIGHT:
        0.25,


    /*
     * Geometry weights.
     *
     * When image similarity is unavailable,
     * these four geometry weights are normalized
     * automatically.
     */

    ROTATION_WEIGHT:
        0.50,

    DISTANCE_WEIGHT:
        0.20,

    POSITION_WEIGHT:
        0.15,

    SCALE_WEIGHT:
        0.15,


    /*
     * Final observation threshold.
     */

    SCORE_THRESHOLD:
        0.86,


    /*
     * Minimum individual geometry scores.
     *
     * Prevents a high total score from hiding
     * a completely incorrect camera orientation
     * or distance.
     */

    MIN_ROTATION_SCORE:
        0.70,

    MIN_DISTANCE_SCORE:
        0.70
};


/*
 * =========================================================
 * MAIN SCORE
 * =========================================================
 */

export function calculateObservationScore(
    camera,
    nebula
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
        !target ||
        typeof target !== "object"
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
            target,
            nebula
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
     * OPTIONAL IMAGE SIMILARITY
     * -----------------------------------------------------
     *
     * This module does not calculate image similarity.
     *
     * It only accepts an already calculated value if
     * another module provides one.
     *
     * Supported locations:
     *
     * nebula.observation.imageSimilarity
     * nebula.imageSimilarity
     *
     */

    const image =
        getImageSimilarity(
            nebula,
            target
        );


    /*
     * -----------------------------------------------------
     * FINAL SCORE
     * -----------------------------------------------------
     */

    const geometryScore =
        calculateGeometryScore(
            rotation.score,
            distance.score,
            position.score,
            scale.score
        );


    const score =
        image.available

            ? (

                geometryScore *
                (
                    1 -
                    DEFAULTS.IMAGE_SIMILARITY_WEIGHT
                )

                +

                image.score *
                DEFAULTS.IMAGE_SIMILARITY_WEIGHT

            )

            : geometryScore;


    /*
     * -----------------------------------------------------
     * VALIDATION
     * -----------------------------------------------------
     *
     * A valid observation requires:
     *
     * 1. Final score >= threshold
     * 2. Rotation reasonably correct
     * 3. Distance reasonably correct
     *
     * If image similarity exists,
     * it must also satisfy the final threshold.
     *
     */

    const valid =

        score >=
        getThreshold()

        &&

        rotation.score >=
        DEFAULTS.MIN_ROTATION_SCORE

        &&

        distance.score >=
        DEFAULTS.MIN_DISTANCE_SCORE

        &&

        (
            !image.available

            ||

            image.score >=
            getThreshold()
        );


    /*
     * -----------------------------------------------------
     * RESULT
     * -----------------------------------------------------
     */

    return {

        valid,

        score,

        geometryScore,

        imageSimilarityScore:
            image.score,

        imageSimilarityAvailable:
            image.available,


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
            scale.error,


        cameraDistance:
            distance.cameraDistance,

        targetDistance:
            distance.targetDistance,


        actualScale:
            scale.actualScale,

        targetScale:
            scale.targetScale
    };
}


/*
 * =========================================================
 * GEOMETRY SCORE
 * =========================================================
 */

function calculateGeometryScore(
    rotationScore,
    distanceScore,
    positionScore,
    scaleScore
) {

    const weightTotal =

        DEFAULTS.ROTATION_WEIGHT

        +

        DEFAULTS.DISTANCE_WEIGHT

        +

        DEFAULTS.POSITION_WEIGHT

        +

        DEFAULTS.SCALE_WEIGHT;


    if (
        weightTotal <=
        0
    ) {

        return 0;
    }


    return (

        rotationScore *
        DEFAULTS.ROTATION_WEIGHT

        +

        distanceScore *
        DEFAULTS.DISTANCE_WEIGHT

        +

        positionScore *
        DEFAULTS.POSITION_WEIGHT

        +

        scaleScore *
        DEFAULTS.SCALE_WEIGHT

    ) / weightTotal;
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
            target?.yaw,
            0
        );


    const targetPitch =
        toNumber(
            target?.pitch,
            0
        );


    const targetRoll =
        toNumber(
            target?.roll,
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


    const tolerance =
        DEFAULTS.ANGLE_TOLERANCE;


    const yawScore =
        toleranceScore(
            yawError,
            tolerance
        );


    const pitchScore =
        toleranceScore(
            pitchError,
            tolerance
        );


    const rollScore =
        toleranceScore(
            rollError,
            tolerance
        );


    /*
     * Yaw remains dominant.
     *
     * This is intentional because the hidden
     * projection is primarily controlled by
     * viewing orientation.
     */

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
 *
 * The target distance represents the radial
 * distance from the nebula center.
 *
 * target.position is NOT used here.
 *
 * This prevents position and distance from
 * fighting each other.
 *
 * =========================================================
 */

function calculateDistanceScore(
    cameraPosition,
    target,
    nebula
) {

    const center =
        getNebulaCenter(
            nebula
        );


    const cameraDistance =
        distance3(
            cameraPosition,
            center
        );


    const targetDistance =
        Math.max(
            0.000001,
            Math.abs(
                toNumber(
                    target?.distance,
                    110
                )
            )
        );


    const error =
        Math.abs(
            cameraDistance -
            targetDistance
        )
        /
        targetDistance;


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
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * target.position represents the desired camera
 * direction around the nebula rather than an
 * absolute world-space camera position.
 *
 * This avoids the old bug where:
 *
 * target.distance = 110
 *
 * while:
 *
 * target.position = (-8 ... +8)
 *
 * were incorrectly compared as absolute positions.
 *
 * =========================================================
 */

function calculatePositionScore(
    cameraPosition,
    target,
    nebula
) {

    const center =
        getNebulaCenter(
            nebula
        );


    const relativeX =
        cameraPosition.x -
        center.x;


    const relativeY =
        cameraPosition.y -
        center.y;


    const relativeZ =
        cameraPosition.z -
        center.z;


    const length =
        Math.sqrt(

            relativeX *
            relativeX

            +

            relativeY *
            relativeY

            +

            relativeZ *
            relativeZ

        );


    /*
     * No meaningful direction.
     */

    if (
        length <
        0.000001
    ) {

        return {

            score:
                0,

            error:
                Infinity
        };
    }


    /*
     * Normalize actual camera direction.
     */

    const actualX =
        relativeX /
        length;


    const actualY =
        relativeY /
        length;


    const actualZ =
        relativeZ /
        length;


    /*
     * Target observation position.
     */

    const targetPosition =
        normalizeVector3(
            target?.position
        );


    const targetLength =
        Math.sqrt(

            targetPosition.x *
            targetPosition.x

            +

            targetPosition.y *
            targetPosition.y

            +

            targetPosition.z *
            targetPosition.z

        );


    /*
     * If no valid target position exists,
     * fall back to a neutral score.
     */

    if (
        targetLength <
        0.000001
    ) {

        return {

            score:
                1,

            error:
                0
        };
    }


    const targetX =
        targetPosition.x /
        targetLength;


    const targetY =
        targetPosition.y /
        targetLength;


    const targetZ =
        targetPosition.z /
        targetLength;


    /*
     * Dot product gives angular
     * directional similarity.
     *
     * 1  = same direction
     * 0  = perpendicular
     * -1 = opposite direction
     */

    const dot =
        clamp(
            (
                actualX *
                targetX

                +

                actualY *
                targetY

                +

                actualZ *
                targetZ
            ),
            -1,
            1
        );


    /*
     * Convert angular difference
     * into radians.
     */

    const error =
        Math.acos(
            dot
        );


    const score =
        toleranceScore(
            error,
            DEFAULTS.POSITION_TOLERANCE
        );


    return {

        score,

        error
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
        Math.max(
            0.000001,
            toNumber(
                target?.scale,
                1
            )
        );


    /*
     * -----------------------------------------------------
     * SCALE SOURCE
     * -----------------------------------------------------
     */

    let actualScale =
        1;


    /*
     * Preferred:
     *
     * nebula.scale
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


    /*
     * Fallback:
     *
     * particleSystem.points.scale
     */

    else {

        const points =
            nebula?.particleSystem?.points

            ||

            nebula?.points

            ||

            null;


        if (
            points?.scale
        ) {

            actualScale =
                toNumber(
                    points.scale.x,
                    1
                );
        }
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
 * IMAGE SIMILARITY
 * =========================================================
 *
 * This module does not perform image comparison.
 *
 * It only consumes an external score.
 *
 * Accepted:
 *
 * 0.0 → completely different
 * 1.0 → identical
 *
 * Supported:
 *
 * nebula.observation.imageSimilarity
 *
 * OR
 *
 * nebula.imageSimilarity
 *
 * =========================================================
 */

function getImageSimilarity(
    nebula,
    target
) {

    const candidates = [

        target?.imageSimilarity,

        nebula?.imageSimilarity,

        nebula?.observationSimilarity

    ];


    for (
        const value
        of candidates
    ) {

        const number =
            Number(
                value
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return {

                available:
                    true,

                score:
                    clamp(
                        number,
                        0,
                        1
                    )
            };
        }
    }


    return {

        available:
            false,

        score:
            0
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
     * Three.js camera:
     *
     * camera.rotation.x
     * camera.rotation.y
     * camera.rotation.z
     *
     * These are interpreted as:
     *
     * pitch = X
     * yaw   = Y
     * roll  = Z
     */

    let rotation;


    if (
        camera.rotation
    ) {

        rotation = {

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
        };

    } else {

        rotation = {

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
    }


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
 * NEBULA CENTER
 * =========================================================
 */

function getNebulaCenter(
    nebula
) {

    return normalizeVector3(
        nebula?.center
    );
}


/*
 * =========================================================
 * TOLERANCE SCORE
 * =========================================================
 *
 * error = 0
 *     → 1
 *
 * error = tolerance
 *     → 0
 *
 * error > tolerance
 *     → 0
 *
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
        !Number.isFinite(
            tolerance
        ) ||
        tolerance <=
        0
    ) {

        return error <=
            0

                ? 1

                : 0;
    }


    return clamp(
        1 -
        (
            error /
            tolerance
        ),
        0,
        1
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

    return {

        x:
            toNumber(
                value?.x,
                0
            ),

        y:
            toNumber(
                value?.y,
                0
            ),

        z:
            toNumber(
                value?.z,
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
 * CLAMP
 * =========================================================
 */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
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
 * THRESHOLD
 * =========================================================
 */

function getThreshold() {

    return DEFAULTS.SCORE_THRESHOLD;
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

        geometryScore:
            0,

        imageSimilarityScore:
            0,

        imageSimilarityAvailable:
            false,


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
            Infinity,


        cameraDistance:
            0,

        targetDistance:
            0,


        actualScale:
            1,

        targetScale:
            1
    };
}