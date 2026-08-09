import { CONFIG } from "../config.js";

let audio = null;
let fadeTimer = null;

export function initAudio() {

    audio = new Audio("./music/universe.mp3");

    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
}

export async function startMusic() {

    if (!audio) {
        initAudio();
    }

    try {
        await audio.play();
    } catch {
        return;
    }

    fadeTo(1, CONFIG.AUDIO.FADE_IN);
}

export function fadeMusicOut() {
    fadeTo(0, CONFIG.AUDIO.FADE_OUT);
}

export function restoreMusic() {

    if (!audio) {
        return;
    }

    audio.volume = 0;

    audio.play().catch(() => {});

    fadeTo(1, 800);
}

export function stopMusic() {

    if (!audio) {
        return;
    }

    audio.pause();
    audio.currentTime = 0;
}

function fadeTo(target, duration) {

    if (!audio) {
        return;
    }

    if (fadeTimer) {
        cancelAnimationFrame(fadeTimer);
    }

    const start = audio.volume;
    const startTime = performance.now();

    function step(now) {

        const t = Math.min(
            1,
            (now - startTime) / duration
        );

        const eased =
            t * t * (3 - 2 * t);

        audio.volume =
            start + (target - start) * eased;

        if (t < 1) {
            fadeTimer =
                requestAnimationFrame(step);
        }
    }

    fadeTimer =
        requestAnimationFrame(step);
}