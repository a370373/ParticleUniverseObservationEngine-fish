import { STATE, setPhase } from "../core/state.js";
import { startMusic } from "../media/audio.js";

let initialized = false;

export function initClickEntry(onEntered) {

    if (initialized) {
        return;
    }

    initialized = true;

    const layer =
        document.getElementById("entryLayer");

    const button =
        document.getElementById("enterButton");

    if (!layer || !button) {
        return;
    }

    button.addEventListener(
        "click",
        handleEnter,
        {
            once: true,
            passive: true
        }
    );

    async function handleEnter() {

        if (STATE.entered) {
            return;
        }

        STATE.entered = true;

        setPhase("LOADING");

        /*
         * Fullscreen is attempted independently.
         * Failure is intentionally ignored.
         */
        try {

            if (!document.fullscreenElement) {

                await document.documentElement
                    .requestFullscreen?.();

            }

        } catch {
            // Mobile browsers may reject fullscreen.
        }

        /*
         * Audio starts from the user gesture.
         * This avoids autoplay blocking.
         */
        await startMusic();

        /*
         * Entry UI disappears ONLY after click.
         */
        layer.classList.add("hidden");

        document.body.classList.add("entered");

        setTimeout(() => {

            layer.remove();

            if (typeof onEntered === "function") {
                onEntered();
            }

        }, 1800);
    }
}