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

    if (
        !particleSystem
    ) {

        throw new Error(
            "shuffleParticles(): particleSystem is required."
        );
    }


    const data =
        particleSystem.data;


    if (
        !data
    ) {

        throw new Error(
            "shuffleParticles(): particleSystem.data is missing."
        );
    }


    const geometry =
        particleSystem.geometry;


    const positionAttribute =
        geometry
            ?.attributes
            ?.position;


    if (
        !positionAttribute
    ) {

        throw new Error(
            "shuffleParticles(): position attribute is missing."
        );
    }


    const positions =
        positionAttribute.array;


    const count =
        Number.isFinite(
            data.count
        )
            ? data.count
            : Math.floor(
                positions.length / 3
            );


    if (
        count <= 0
    ) {

        return Promise.resolve();
    }


    /*
     * Prevent invalid duration.
     */

    duration =
        Math.max(
            1,
            Number(
                duration
            ) || 1
        );


    /*
     * =====================================================
     * SAVE ORIGINAL POSITIONS
     * =====================================================
     *
     * Important:
     *
     * Never continuously add velocity to the
     * live position array.
     *
     * Instead:
     *
     * original → temporary offset → original
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
            Math.random() * 2 - 1;


        let y =
            Math.random() * 2 - 1;


        let z =
            Math.random() * 2 - 1;


        const length =
            Math.sqrt(
                x * x +
                y * y +
                z * z
            ) || 1;


        /*
         * Normalize random direction.
         */

        x /=
            length;


        y /=
            length;


        z /=
            length;


        /*
         * Random displacement.
         *
         * Keep this relatively small so
         * shuffle remains visually controlled.
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
        data.state;


    data.state =
        "SHUFFLE";


    /*
     * =====================================================
     * ANIMATION
     * =====================================================
     */

    const start =
        performance.now();


    return new Promise(
        resolve => {

            let finished =
                false;


            function finish() {

                if (
                    finished
                ) {

                    return;
                }


                finished =
                    true;


                /*
                 * Guarantee exact original
                 * positions.
                 */

                positions.set(
                    originalPositions
                );


                positionAttribute
                    .needsUpdate =
                    true;


                data.state =
                    previousState ||
                    "STABLE";


                resolve();
            }


            function animate(
                now
            ) {

                const elapsed =
                    now -
                    start;


                const progress =
                    Math.min(
                        1,
                        elapsed /
                        duration
                    );


                /*
                 * Smooth out-and-back.
                 *
                 * sin(πt)
                 *
                 * 0 → 1 → 0
                 */

                const factor =
                    Math.sin(
                        progress *
                        Math.PI
                    );


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


                if (
                    progress >= 1
                ) {

                    finish();

                    return;
                }


                requestAnimationFrame(
                    animate
                );
            }


            requestAnimationFrame(
                animate
            );
        }
    );
}