/*

* =========================================================
* PARTICLE UNIVERSE
* PARTICLE SHUFFLE
* 
* Stable Temporary Particle Shuffle
* 
* ParticleSystem
*  ↓
* beginShuffle()
*  ↓
* applyShuffle()
*  ↓
* finishShuffle()
* 
* IMPORTANT
* ---
* 
* This module does NOT directly modify:
* 
* particleSystem.data.positions
* 
* ParticleSystem owns the actual runtime geometry.
* 
* This module only controls:
* 
* timing
* animation progress
* recovery
* 
* The generated nebula / image source is never replaced.
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


if (
    !particleSystem.data
) {

    throw new Error(
        "[ParticleShuffle] particleSystem.data is missing."
    );
}


if (
    !particleSystem.geometry
) {

    throw new Error(
        "[ParticleShuffle] particleSystem.geometry is missing."
    );
}


/*
 * =====================================================
 * ALREADY ACTIVE
 * =====================================================
 */

if (
    particleSystem.getState &&
    particleSystem.getState() ===
    "SHUFFLE"
) {

    console.warn(
        "[ParticleShuffle] SHUFFLE ALREADY ACTIVE"
    );

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
 * BEGIN PARTICLE SYSTEM SHUFFLE
 * =====================================================
 *
 * ParticleSystem now owns:
 *
 * - visible positions
 * - random targets
 * - temporary state
 * - restoration
 *
 */

const shuffle =
    particleSystem.beginShuffle();


if (
    !shuffle
) {

    console.warn(
        "[ParticleShuffle] Unable TO BEGIN SHUFFLE"
    );

    return Promise.resolve();
}


console.log(
    "[ParticleShuffle] START:",
    particleSystem.data.count,
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

        function finish() {

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
             * ALWAYS restore the generated
             * nebula.
             *
             * ParticleSystem owns the actual
             * restoration.
             */

            try {

                particleSystem
                    .finishShuffle();

            } catch (error) {

                console.error(
                    "[ParticleShuffle] FINISH ERROR:",
                    error
                );


                /*
                 * Hard recovery.
                 */

                try {

                    particleSystem
                        .resetPositions();

                } catch (recoveryError) {

                    console.error(
                        "[ParticleShuffle] RECOVERY ERROR:",
                        recoveryError
                    );
                }
            }


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
                 * =================================================
                 * SHUFFLE CURVE
                 * =================================================
                 *
                 * 0.0
                 *      original
                 *
                 * 0.5
                 *      maximum displacement
                 *
                 * 1.0
                 *      original
                 *
                 * ParticleSystem handles the
                 * actual interpolation.
                 */

                particleSystem
                    .applyShuffle(
                        progress
                    );


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
                 * Mandatory recovery.
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
         * START
         * =================================================
         */

        if (
            typeof requestAnimationFrame !==
            "function"
        ) {

            /*
             * Defensive fallback.
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