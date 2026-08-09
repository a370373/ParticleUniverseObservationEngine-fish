import {
    STATE,
    setPhase
} from "../core/state.js";

import {
    startMusic
} from "../media/audio.js";

let initialized = false;
let entering = false;

export function initClickEntry(onEntered) {

    if (initialized) {
        return;
    }

    initialized = true;

    const layer =
        document.getElementById(
            "entryLayer"
        );

    const button =
        document.getElementById(
            "enterButton"
        );

    if (!layer || !button) {

        console.error(
            "[Entry] Entry elements missing."
        );

        return;
    }

    /*
     * IMPORTANT:
     * Entry listener is completely independent
     * from Three.js / WebGPU / WebGL.
     */

    button.addEventListener(
        "click",
        handleEnter
    );

    /*
     * Touch fallback.
     *
     * Some mobile browsers can have unusual
     * pointer/click behaviour.
     */

    button.addEventListener(
        "pointerup",
        event => {

            if (
                event.pointerType ===
                "touch"
            ) {

                handleEnter(
                    event
                );
            }
        }
    );


    async function handleEnter(event) {

        if (
            entering ||
            STATE.entered
        ) {

            return;
        }

        entering = true;

        event?.preventDefault?.();

        STATE.entered =
            true;

        setPhase(
            "LOADING"
        );

        /*
         * =================================================
         * Fullscreen
         * =================================================
         *
         * Fullscreen failure must NEVER stop boot.
         */

        try {

            if (
                !document.fullscreenElement &&
                document.documentElement
                    .requestFullscreen
            ) {

                await document.documentElement
                    .requestFullscreen();

            }

        } catch (error) {

            console.warn(
                "[Entry] Fullscreen unavailable:",
                error
            );
        }


        /*
         * =================================================
         * Audio
         * =================================================
         *
         * Audio failure must NEVER stop boot.
         */

        try {

            await startMusic();

        } catch (error) {

            console.warn(
                "[Entry] Audio unavailable:",
                error
            );
        }


        /*
         * =================================================
         * Hide Entry
         * =================================================
         */

        layer.classList.add(
            "hidden"
        );

        document.body.classList.add(
            "entered"
        );


        /*
         * =================================================
         * Universe boot
         * =================================================
         */

        setTimeout(
            () => {

                layer.remove();

                if (
                    typeof onEntered ===
                    "function"
                ) {

                    try {

                        onEntered();

                    } catch (error) {

                        console.error(
                            "[Entry] Universe boot error:",
                            error
                        );
                    }
                }

            },
            800
        );
    }
}