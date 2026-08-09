import {
    CONFIG
} from "../config.js";

let audio = null;
let fadeTimer = null;

export function initAudio() {

    if (audio) {
        return audio;
    }

    audio =
        new Audio(
            "./music/universe.mp3"
        );

    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;

    return audio;
}

export async function startMusic() {

    const player =
        initAudio();

    try {

        await player.play();

        fadeTo(
            1,
            CONFIG.AUDIO.FADE_IN
        );

    } catch (error) {

        /*
         * Audio autoplay failure is NOT fatal.
         */

        console.warn(
            "[Audio] Playback unavailable:",
            error
        );
    }
}

export function fadeMusicOut() {

    fadeTo(
        0,
        CONFIG.AUDIO.FADE_OUT
    );
}

export function restoreMusic() {

    if (!audio) {
        return;
    }

    audio.volume = 0;

    audio.play()
        .then(() => {

            fadeTo(
                1,
                800
            );

        })
        .catch(() => {});
}

export function stopMusic() {

    if (!audio) {
        return;
    }

    audio.pause();
    audio.currentTime = 0;
}

function fadeTo(
    target,
    duration
) {

    if (!audio) {
        return;
    }

    if (fadeTimer) {

        cancelAnimationFrame(
            fadeTimer
        );
    }

    const start =
        audio.volume;

    const startTime =
        performance.now();

    function step(now) {

        const t =
            Math.min(
                1,
                (now - startTime) /
                Math.max(
                    1,
                    duration
                )
            );

        const eased =
            t * t * (3 - 2 * t);

        audio.volume =
            start +
            (target - start) *
            eased;

        if (t < 1) {

            fadeTimer =
                requestAnimationFrame(
                    step
                );

        } else {

            fadeTimer = null;
        }
    }

    fadeTimer =
        requestAnimationFrame(
            step
        );
}