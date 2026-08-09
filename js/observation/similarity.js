export function calculateObservationScore(
    camera,
    nebula,
    THREE
) {

    const target =
        nebula.observation;

    /*
     * Camera orientation
     */
    const yaw =
        camera.yaw;

    const pitch =
        camera.pitch;

    const yawError =
        angleDifference(
            yaw,
            target.yaw
        );

    const pitchError =
        angleDifference(
            pitch,
            target.pitch
        );

    /*
     * Rotation score
     */
    const rotationScore =
        1 -
        Math.min(
            1,
            (
                yawError +
                pitchError
            ) /
            Math.PI
        );

    /*
     * Distance score.
     *
     * No hard camera limit.
     */
    const distance =
        camera.position.distanceTo(
            nebula.center
        );

    const distanceError =
        Math.abs(
            distance -
            target.distance
        ) /
        target.distance;

    const distanceScore =
        1 -
        Math.min(
            1,
            distanceError
        );

    /*
     * Position score
     */
    const positionError =
        camera.position
            .clone()
            .sub(target.position)
            .length();

    const positionScore =
        1 -
        Math.min(
            1,
            positionError / 10
        );

    /*
     * Scale score
     */
    const scaleScore =
        1 -
        Math.min(
            1,
            Math.abs(
                1 -
                target.scale
            )
        );

    /*
     * Final projection-like score.
     */
    const score =
        rotationScore * 0.50 +
        distanceScore * 0.25 +
        positionScore * 0.15 +
        scaleScore * 0.10;

    return score;
}

function angleDifference(a, b) {

    let d =
        a - b;

    while (
        d > Math.PI
    ) {
        d -=
            Math.PI * 2;
    }

    while (
        d < -Math.PI
    ) {
        d +=
            Math.PI * 2;
    }

    return Math.abs(d);
}