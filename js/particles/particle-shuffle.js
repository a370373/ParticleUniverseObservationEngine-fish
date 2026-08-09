/*
 * =========================================================
 * PARTICLE UNIVERSE
 * PARTICLE SHUFFLE
 *
 * Stable Temporary Particle Shuffle
 *
 * Original Visible Positions
 *          ↓
 * Temporary Random Expansion
 *          ↓
 * Maximum Displacement
 *          ↓
 * Return To Original Visible Positions
 *          ↓
 * Exact Restoration
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * This module NEVER modifies:
 *
 *     particleSystem.data.positions
 *
 * It only modifies:
 *
 *     geometry.attributes.position.array
 *
 * The shuffle is therefore a temporary visual effect.
 * =========================================================
 */


/*
 * =========================================================
 * SHUFFLE PARTICLES
 * =========================================================
 */

export function shuffleParticles(
    particleSystem,
    duration = 1200
) {

    /*
     * =====================================================
     * VALIDATION
     * =====================================================
     */

    if (
        !particleSystem
    ) {

        throw new Error(
            "[ParticleShuffle] particleSystem is required."
        );
    }


    const data =
        particleSystem.data;


    if (
        !data
    ) {

        throw new Error(
            "[ParticleShuffle] particleSystem.data is missing."
        );
    }


    const geometry =
        particleSystem.geometry;


    if (
        !geometry
    ) {

        throw new Error(
            "[ParticleShuffle] particleSystem.geometry is missing."
        );
    }


    const positionAttribute =
        geometry
            .attributes
            ?.position;


    if (
        !positionAttribute
    ) {

        throw new Error(
            "[ParticleShuffle] position attribute is missing."
        );
    }


    const positions =
        positionAttribute.array;


    if (
        !positions ||
        positions.length < 3
    ) {

        return Promise.resolve();
    }


    /*
     * =====================================================
     * PARTICLE COUNT
     * =====================================================
     */

    const bufferCount =
        Math.floor(
            positions.length / 3
        );


    const dataCount =
        Number.isFinite(
            Number(data.count)
        )
            ? Math.floor(
                Number(data.count)
            )
            : bufferCount;


    const count =
        Math.min(
            Math.max(
                0,
                dataCount
            ),
            bufferCount
        );


    if (
        count <= 0
    ) {

        return Promise.resolve();
    }


    /*
     * =====================================================
     * DURATION
     * =====================================================
     */

    const numericDuration =
        Number(
            duration
        );


    const safeDuration =
        Number.isFinite(
            numericDuration
        )
            ? Math.max(
                1,
                numericDuration
            )
            : 1200;


    /*
     * =====================================================
     * EVENT SAFETY
     * =====================================================
     *
     * ParticleSystem.update() intentionally ignores
     * SHUFFLE state.
     *
     * Therefore we mark the system as SHUFFLE before
     * starting the animation.
     *
     */

    if (
        data.state ===
        "SHUFFLE"
    ) {

        console.warn(
            "[ParticleShuffle] SHUFFLE ALREADY ACTIVE"
        );

        return Promise.resolve();
    }


    /*
     * =====================================================
     * SAVE CURRENT VISIBLE POSITIONS
     * =====================================================
     *
     * IMPORTANT:
     *
     * Save the actual GPU-side runtime positions.
     *
     * Do NOT use:
     *
     *     data.positions
     *
     * because ParticleSystem may currently have
     * breathing / drift applied.
     *
     */

    const originalPositions =
        new Float32Array(
            count * 3
        );


    originalPositions.set(
        positions.subarray(
            0,
            count * 3
        )
    );


    /*
     * =====================================================
     * RANDOM OFFSETS
     * =====================================================
     */

    const offsets =
        new Float32Array(
            count * 3
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const n =
            i * 3;


        let x =
            Math.random() * 2 -
            1;


        let y =
            Math.random() * 2 -
            1;


        let z =
            Math.random() * 2 -
            1;


        let length =
            Math.sqrt(

                x * x +
                y * y +
                z * z

            );


        /*
         * Extremely unlikely, but avoid
         * zero-length direction.
         */

        if (
            length <
            0.000001
        ) {

            x =
                1;

            y =
                0;

            z =
                0;

            length =
                1;
        }


        x /=
            length;


        y /=
            length;


        z /=
            length;


        /*
         * Controlled shuffle radius.
         *
         * This is deliberately much smaller
         * than an explosion.
         */

        const distance =
            1 +
            Math.random() * 3;


        offsets[n] =
            x *
            distance;


        offsets[n + 1] =
            y *
            distance;


        offsets[n + 2] =
            z *
            distance;
    }


    /*
     * =====================================================
     * STATE
     * =====================================================
     */

    const previousState =
        data.state ||
        "STABLE";


    data.state =
        "SHUFFLE";


    console.log(
        "[ParticleShuffle] START:",
        count,
        "PARTICLES"
    );


    /*
     * =====================================================
     * ANIMATION
     * =====================================================
     */

    return new Promise(
        resolve => {

            let finished =
                false;


            let frameId =
                null;


            /*
             * =================================================
             * FINISH
             * =================================================
             */

            function finish(
                restoreState = true
            ) {

                if (
                    finished
                ) {

                    return;
                }


                finished =
                    true;


                /*
                 * Cancel pending frame.
                 */

                if (
                    frameId !== null &&
                    typeof cancelAnimationFrame ===
                    "function"
                ) {

                    cancelAnimationFrame(
                        frameId
                    );

                    frameId =
                        null;
                }


                /*
                 * ALWAYS restore exact original
                 * visible positions.
                 */

                positions.set(
                    originalPositions
                );


                positionAttribute
                    .needsUpdate =
                    true;


                /*
                 * Restore previous state.
                 *
                 * Never leave the system stuck
                 * in SHUFFLE.
                 */

                if (
                    restoreState
                ) {

                    data.state =
                        previousState ===
                        "SHUFFLE"

                            ? "STABLE"

                            : previousState;
                }


                console.log(
                    "[ParticleShuffle] COMPLETE"
                );


                resolve();
            }


            /*
             * =================================================
             * FRAME
             * =================================================
             */

            function animate(
                now
            ) {

                if (
                    finished
                ) {

                    return;
                }


                try {

                    const elapsed =
                        now -
                        startTime;


                    const progress =
                        Math.min(
                            1,
                            Math.max(
                                0,
                                elapsed /
                                safeDuration
                            )
                        );


                    /*
                     * Smooth out-and-back.
                     *
                     * 0       → original
                     * 0.5     → maximum shuffle
                     * 1       → original
                     *
                     * sin(πt)
                     */

                    const factor =
                        Math.sin(
                            progress *
                            Math.PI
                        );


                    /*
                     * =================================================
                     * APPLY TEMPORARY OFFSET
                     * =================================================
                     */

                    for (
                        let i = 0;
                        i < count;
                        i++
                    ) {

                        const n =
                            i * 3;


                        positions[n] =

                            originalPositions[n] +

                            offsets[n] *
                            factor;


                        positions[n + 1] =

                            originalPositions[n + 1] +

                            offsets[n + 1] *
                            factor;


                        positions[n + 2] =

                            originalPositions[n + 2] +

                            offsets[n + 2] *
                            factor;
                    }


                    positionAttribute
                        .needsUpdate =
                        true;


                    /*
                     * =================================================
                     * END
                     * =================================================
                     */

                    if (
                        progress >= 1
                    ) {

                        finish();

                        return;
                    }


                    frameId =
                        requestAnimationFrame(
                            animate
                        );

                } catch (error) {

                    console.error(
                        "[ParticleShuffle] ANIMATION ERROR:",
                        error
                    );


                    /*
                     * Recovery is mandatory.
                     */

                    finish();
                }
            }


            const startTime =
                typeof performance !==
                "undefined"
                    ? performance.now()
                    : Date.now();


            /*
             * =================================================
             * START FRAME
             * =================================================
             */

            if (
                typeof requestAnimationFrame !==
                "function"
            ) {

                /*
                 * Extremely defensive fallback.
                 */

                finish();

                return;
            }


            frameId =
                requestAnimationFrame(
                    animate
                );
        }
    );
}