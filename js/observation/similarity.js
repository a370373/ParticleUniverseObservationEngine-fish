/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION SIMILARITY CORE
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

    IMAGE_SIMILARITY_WEIGHT:
        0.25,

    ROTATION_WEIGHT:
        0.50,

    DISTANCE_WEIGHT:
        0.20,

    POSITION_WEIGHT:
        0.15,

    SCALE_WEIGHT:
        0.15,

    SCORE_THRESHOLD:
        0.86,

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
        typeof target !==
        "object"
    ) {

        return createEmptyResult();
    }


    const cameraState =
        normalizeCamera(
            camera
        );


    const rotation =
        calculateRotationScore(
            cameraState.rotation,
            target
        );


    const distance =
        calculateDistanceScore(
            cameraState.position,
            target,
            nebula
        );


    const position =
        calculatePositionScore(
            cameraState.position,
            target,
            nebula
        );


    const scale =
        calculateScaleScore(
            camera,
            nebula,
            target
        );


    const image =
        getImageSimilarity(
            nebula,
            target
        );


    const geometryScore =
        calculateGeometryScore(
            rotation.score,
            distance.score,
            position.score,
            scale.score
        );


    let score =
        geometryScore;


    if (
        image.available
    ) {

        const weight =
            clamp(
                DEFAULTS.IMAGE_SIMILARITY_WEIGHT,
                0,
                1
            );


        score =

            geometryScore *
            (
                1 -
                weight
            )

            +

            image.score *
            weight;
    }


    const valid =

        score >=
        DEFAULTS.SCORE_THRESHOLD

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
            DEFAULTS.SCORE_THRESHOLD
        );


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
 * GEOMETRY
 * =========================================================
 */

function calculateGeometryScore(
    rotationScore,
    distanceScore,
    positionScore,
    scaleScore
) {

    const total =
        DEFAULTS.ROTATION_WEIGHT +
        DEFAULTS.DISTANCE_WEIGHT +
        DEFAULTS.POSITION_WEIGHT +
        DEFAULTS.SCALE_WEIGHT;


    if (
        total <= 0
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

    ) / total;
}


/*
 * =========================================================
 * ROTATION
 * =========================================================
 */

function calculateRotationScore(
    rotation,
    target
) {

    const yawError =
        angleDifference(
            rotation.yaw,
            target?.yaw
        );


    const pitchError =
        angleDifference(
            rotation.pitch,
            target?.pitch
        );


    const rollError =
        angleDifference(
            rotation.roll,
            target?.roll
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


    return {

        score:

            yawScore * 0.45

            +

            pitchScore * 0.35

            +

            rollScore * 0.20,

        yawError,

        pitchError,

        rollError
    };
}


/*
 * =========================================================
 * DISTANCE
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


    return {

        score:
            toleranceScore(
                error,
                DEFAULTS.DISTANCE_TOLERANCE
            ),

        error,

        cameraDistance,

        targetDistance
    };
}


/*
 * =========================================================
 * POSITION DIRECTION
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


    const x =
        cameraPosition.x -
        center.x;

    const y =
        cameraPosition.y -
        center.y;

    const z =
        cameraPosition.z -
        center.z;


    const length =
        Math.sqrt(
            x * x +
            y * y +
            z * z
        );


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


    const actual = {

        x:
            x / length,

        y:
            y / length,

        z:
            z / length
    };


    const targetVector =
        normalizeDirection(
            target?.position
        );


    if (
        !targetVector
    ) {

        return {

            score:
                1,

            error:
                0
        };
    }


    const dot =
        clamp(

            actual.x *
            targetVector.x

            +

            actual.y *
            targetVector.y

            +

            actual.z *
            targetVector.z,

            -1,
            1
        );


    const error =
        Math.acos(
            dot
        );


    return {

        score:
            toleranceScore(
                error,
                DEFAULTS.POSITION_TOLERANCE
            ),

        error
    };
}


/*
 * =========================================================
 * SCALE
 * =========================================================
 */

function calculateScaleScore(
    camera,
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


    let actualScale =
        readScalarScale(
            nebula?.scale
        );


    if (
        actualScale === null
    ) {

        const points =
            nebula?.particleSystem?.points
            ||
            nebula?.points
            ||
            null;


        actualScale =
            readScalarScale(
                points?.scale
            );
    }


    if (
        actualScale === null
    ) {

        actualScale =
            readScalarScale(
                camera?.scale
            );
    }


    if (
        actualScale === null
    ) {

        actualScale =
            1;
    }


    const error =
        relativeError(
            actualScale,
            targetScale
        );


    return {

        score:
            toleranceScore(
                error,
                DEFAULTS.SCALE_TOLERANCE
            ),

        error,

        actualScale,

        targetScale
    };
}


/*
 * =========================================================
 * SCALE READER
 * =========================================================
 */

function readScalarScale(
    value
) {

    if (
        Number.isFinite(
            Number(value)
        )
    ) {

        return Number(value);
    }


    if (
        value &&
        typeof value ===
        "object"
    ) {

        const x =
            Number(value.x);

        const y =
            Number(value.y);

        const z =
            Number(value.z);


        if (
            Number.isFinite(x)
        ) {

            if (
                !Number.isFinite(y) ||
                !Number.isFinite(z)
            ) {

                return x;
            }


            if (
                Math.abs(x - y) < 0.000001 &&
                Math.abs(x - z) < 0.000001
            ) {

                return x;
            }


            if (
                x > 0 &&
                y > 0 &&
                z > 0
            ) {

                return Math.cbrt(
                    x * y * z
                );
            }
        }
    }


    return null;
}


/*
 * =========================================================
 * IMAGE SIMILARITY
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
            Number(value);


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
 * CAMERA
 * =========================================================
 */

function normalizeCamera(
    camera
) {

    const rotation = {

        yaw:
            toNumber(
                camera?.rotation?.y ??
                camera?.yaw,
                0
            ),

        pitch:
            toNumber(
                camera?.rotation?.x ??
                camera?.pitch,
                0
            ),

        roll:
            toNumber(
                camera?.rotation?.z ??
                camera?.roll,
                0
            )
    };


    const position =
        normalizeVector3(
            camera?.position
        );


    return {

        rotation,

        position
    };
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


function normalizeDirection(
    value
) {

    if (
        !value ||
        typeof value !==
        "object"
    ) {

        return null;
    }


    const x =
        toNumber(
            value.x,
            0
        );

    const y =
        toNumber(
            value.y,
            0
        );

    const z =
        toNumber(
            value.z,
            0
        );


    const length =
        Math.sqrt(
            x * x +
            y * y +
            z * z
        );


    if (
        length <
        0.000001
    ) {

        return null;
    }


    return {

        x:
            x / length,

        y:
            y / length,

        z:
            z / length
    };
}


/*
 * =========================================================
 * CENTER
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
        !Number.isFinite(
            tolerance
        ) ||
        tolerance <= 0
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
            Math.abs(target)
        );


    return Math.abs(
        actual -
        target
    ) / denominator;
}


/*
 * =========================================================
 * ANGLE
 * =========================================================
 */

function angleDifference(
    a,
    b
) {

    let difference =
        toNumber(a, 0) -
        toNumber(b, 0);


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
 * DISTANCE
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
        dx * dx +
        dy * dy +
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
    fallback = 0
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
 * EMPTY
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