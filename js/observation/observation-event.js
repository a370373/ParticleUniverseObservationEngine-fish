import {
    fadeMusicOut,
    restoreMusic
} from "../media/audio.js";

import {
    STATE,
    setPhase
} from "../core/state.js";

import {
    CONFIG
} from "../config.js";

export async function runObservationEvent(
    camera,
    particleSystem
) {

    if (
        STATE.observationLocked
    ) {
        return;
    }

    STATE.observationLocked =
        true;

    document.body.classList.add(
        "observation-lock"
    );

    setPhase(
        "OBSERVATION_COMPLETE"
    );

    /*
     * MUSIC FADE OUT
     */
    fadeMusicOut();

    /*
     * CAMERA + PARTICLES
     */
    const start =
        performance.now();

    const duration =
        8500;

    const originalPosition =
        camera.position.clone();

    function collapse(now) {

        const progress =
            Math.min(
                1,
                (now - start) /
                duration
            );

        const eased =
            progress *
            progress *
            (3 - 2 * progress);

        particleSystem
            .applyCollapse(eased);

        /*
         * Camera is pulled inward.
         */
        camera.position.lerp(
            particleSystem.data.center,
            eased * 0.02
        );

        if (
            progress < 1
        ) {

            requestAnimationFrame(
                collapse
            );

        } else {

            explosion(
                camera,
                particleSystem
            );
        }
    }

    requestAnimationFrame(
        collapse
    );
}

function explosion(
    camera,
    particleSystem
) {

    setPhase(
        "EXPLOSION"
    );

    const start =
        performance.now();

    const duration =
        5500;

    restoreMusic();

    function frame(now) {

        const progress =
            Math.min(
                1,
                (now - start) /
                duration
            );

        particleSystem
            .explode(progress);

        /*
         * Camera shock / forced pullback.
         */
        camera.position.z -=
            0.4 *
            (1 - progress);

        if (
            progress < 1
        ) {

            requestAnimationFrame(
                frame
            );

        } else {

            /*
             * New observation cycle.
             */
            STATE.observationLocked =
                false;

            STATE.observationComplete =
                false;

            document.body.classList.remove(
                "observation-lock"
            );

            setPhase(
                "NEW_CYCLE"
            );

            if (
                typeof window
                    .__generateNextNebula ===
                "function"
            ) {

                window
                    .__generateNextNebula();
            }
        }
    }

    requestAnimationFrame(
        frame
    );
}