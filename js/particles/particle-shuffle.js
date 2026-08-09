/*
 * =========================================================
 * PARTICLE UNIVERSE
 * PARTICLE SHUFFLE
 *
 * Stable Particle Shuffle
 *
 * Original Positions
 *        ↓
 * Temporary Expansion
 *        ↓
 * Randomized Displacement
 *        ↓
 * Return To Original Positions
 *        ↓
 * Stable
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * This module does NOT permanently modify nebula.positions.
 *
 * It only modifies the live BufferGeometry position buffer
 * during the shuffle animation.
 *
 * The original particle data remains untouched.
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
        positions.length === 0
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


    const requestedCount =
        Number.isFinite(
            data.count
        )
            ? Math.floor(
                data.count
            )
            : bufferCount;


    const count =
        Math.min(
            Math.max(
                0,
                requestedCount
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

    const safeDuration =
        Math.max(
            1,
            Number.isFinite(
                Number(
                    duration
                )
            )
                ? Number(
                    duration
                )
                : 1200
        );


    /*
     * =====================================================
     * PREVENT DUPLICATE SHUFFLE
     * =====================================================
     *
     * If another shuffle is already active,
     * do not start a second animation on the
     * same position buffer.
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
     * SAVE ORIGINAL LIVE POSITIONS
     * =====================================================
     *
     * IMPORTANT:
     *
     * We save the CURRENT visible positions,
     * not simply data.positions.
     *
     * This matters because ParticleSystem may
     * already have drift/breathing applied.
     *
     * Therefore:
     *
     * current visible position
     *          ↓
     * temporary shuffle
     *          ↓
     * exact current visible position
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
     * CREATE RANDOM OFFSETS
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


        /*
         * Random vector.
         */

        let x =
            Math.random() * 2 -
            1;


        let y =
            Math.random() * 2 -
            1;


        let z =
            Math.random() * 2 -
            1;


        /*
         * Normalize direction.
         */

        const length =
            Math.sqrt(

                x * x +

                y * y +

                z * z

            ) || 1;


        x /=
            length;


        y /=
            length;


        z /=
            length;


        /*
         * Random displacement.
         *
         * Keep this controlled.
         *
         * The purpose is a visible
         * particle shuffle, not a
         * complete explosion.
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
     * SAVE PREVIOUS STATE
     * =====================================================
     */

    const previousState =
        data.state;


    data.state =
        "SHUFFLE";


    /*
     * =====================================================
     * ANIMATION START
     * =====================================================
     */

    const start =
        performance.now();


    return new Promise(
        resolve => {

            let finished =
                false;


            /*
             * =================================================
             * FINISH
             * =================================================
             */

            function finish() {

                if (
                    finished
                ) {

                    return;
                }


                finished =
                    true;


                /*
                 * Restore EXACT original
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
                 * If the previous state is
                 * unavailable, fall back to STABLE.
                 */

                data.state =
                    previousState ||
                    "STABLE";


                console.log(
                    "[ParticleShuffle] COMPLETE"
                );


                resolve();
            }


            /*
             * =================================================
             * ANIMATION FRAME
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
                        start;


                    const progress =
                        Math.min(

                            1,

                            elapsed /
                            safeDuration

                        );


                    /*
                     * =================================================
                     * SHUFFLE CURVE
                     * =================================================
                     *
                     * sin(πt)
                     *
                     * t = 0
                     *      ↓
                     * original
                     *
                     * t = 0.5
                     *      ↓
                     * maximum expansion
                     *
                     * t = 1
                     *      ↓
                     * original
                     *
                     */

                    const factor =
                        Math.sin(
                            progress *
                            Math.PI
                        );


                    /*
                     * =================================================
                     * APPLY TEMPORARY DISPLACEMENT
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


                    /*
                     * Tell THREE.js that the
                     * GPU buffer changed.
                     */

                    positionAttribute
                        .needsUpdate =
                        true;


                    /*
                     * =================================================
                     * COMPLETE
                     * =================================================
                     */

                    if (
                        progress >= 1
                    ) {

                        finish();

                        return;
                    }


                    requestAnimationFrame(
                        animate
                    );

                } catch (error) {

                    console.error(
                        "[ParticleShuffle] ANIMATION ERROR:",
                        error
                    );


                    /*
                     * Even if something goes wrong,
                     * restore the particle system.
                     */

                    finish();
                }
            }


            /*
             * =================================================
             * START
             * =================================================
             */

            console.log(
                "[ParticleShuffle] START:",
                count,
                "PARTICLES"
            );


            requestAnimationFrame(
                animate
            );
        }
    );
}