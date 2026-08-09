import {
    createRenderer
} from "./core/renderer.js";

import {
    CameraController
} from "./core/camera.js";

import {
    Universe
} from "./core/universe.js";

import {
    Observer
} from "./observation/observer.js";

import {
    UniverseRoaming
} from "./universe/roaming.js";

import {
    Engine
} from "./core/engine.js";

import {
    initClickEntry
} from "./entry/click-entry.js";

import {
    initDesktopControls
} from "./navigation/desktop.js";

import {
    initMobileControls
} from "./navigation/mobile.js";

import {
    addBase64Image
} from "./media/image-library.js";

import {
    STATE
} from "./core/state.js";

import {
    startRawWebGL
} from "./fallback/raw-webgl.js";

import {
    startCanvasFallback
} from "./fallback/canvas-fallback.js";

const canvas =
    document.getElementById(
        "universeCanvas"
    );

let runtime = null;

let engine = null;

async function bootUniverse() {

    runtime =
        await createRenderer(
            canvas
        );

    STATE.rendererMode =
        runtime.mode;

    /*
     * =====================================================
     * Native fallback
     * =====================================================
     */

    if (
        runtime.mode ===
        "CANVAS"
    ) {

        startCanvasFallback(
            canvas
        );

        return;
    }

    if (
        runtime.mode ===
        "RAW_WEBGL"
    ) {

        startRawWebGL(
            canvas,
            runtime.gl
        );

        return;
    }

    /*
     * =====================================================
     * Three.js runtime
     * =====================================================
     */

    const THREE =
        runtime.THREE;

    const renderer =
        runtime.renderer;

    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x000000
        );

    /*
     * Camera
     */
    const cameraController =
        new CameraController(
            THREE
        );

    const camera =
        cameraController
            .createCamera();

    /*
     * Universe
     */
    const universe =
        new Universe(
            THREE,
            scene,
            cameraController
        );

    /*
     * Observer
     */
    const observer =
        new Observer(
            THREE,
            cameraController,
            () =>
                universe.nebula
        );

    /*
     * Roaming universe
     */
    const roaming =
        new UniverseRoaming(
            THREE,
            scene
        );

    /*
     * Controls
     */
    initDesktopControls(
        canvas,
        cameraController,
        () =>
            STATE.observationLocked
    );

    initMobileControls(
        canvas,
        cameraController,
        () =>
            STATE.observationLocked
    );

    /*
     * Image upload
     */
    const imageInput =
        document.getElementById(
            "imageInput"
        );

    imageInput?.addEventListener(
        "change",
        async event => {

            const files =
                [...event.target.files];

            for (
                const file of files
            ) {

                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {
                    continue;
                }

                const base64 =
                    await fileToBase64(
                        file
                    );

                addBase64Image(
                    base64
                );
            }

            /*
             * Custom image does not immediately
             * force observation.
             *
             * It becomes part of the universe
             * image pool.
             */
        }
    );

    /*
     * Resize
     */
    window.addEventListener(
        "resize",
        () => {

            cameraController.resize();

            renderer.setSize(
                window.innerWidth,
                window.innerHeight,
                false
            );

            renderer.setPixelRatio?.(
                Math.min(
                    window.devicePixelRatio || 1,
                    2
                )
            );
        }
    );

    /*
     * Allow observation event to
     * request a new cycle.
     */
    window.__generateNextNebula =
        () => {

            universe
                .startNewCycle()
                .catch(
                    console.error
                );

            observer.reset();
        };

    /*
     * Engine
     */
    engine =
        new Engine(
            renderer,
            scene,
            camera,
            cameraController,
            universe,
            observer,
            roaming
        );

    engine.start();
}

function fileToBase64(file) {

    return new Promise(
        resolve => {

            const reader =
                new FileReader();

            reader.onload =
                () =>
                    resolve(
                        reader.result
                    );

            reader.readAsDataURL(
                file
            );
        }
    );
}

/*
 * =========================================================
 * ENTRY IS THE ONLY THING STARTING THE UNIVERSE.
 *
 * Click event itself remains completely separated.
 * =========================================================
 */

initClickEntry(
    () => {

        bootUniverse()
            .catch(
                error => {

                    console.error(
                        "Universe boot failed:",
                        error
                    );

                    startCanvasFallback(
                        canvas
                    );
                }
            );
    }
);