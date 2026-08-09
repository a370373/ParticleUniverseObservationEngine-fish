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
    startMusic
} from "./media/audio.js";

import {
    startRawWebGL
} from "./fallback/raw-webgl.js";

import {
    startCanvasFallback
} from "./fallback/canvas-fallback.js";


/*
 * =========================================================
 * CANVAS
 * =========================================================
 */

const canvas =
    document.getElementById(
        "universeCanvas"
    );


/*
 * =========================================================
 * RUNTIME
 * =========================================================
 */

let runtime = null;
let engine = null;
let booted = false;


/*
 * =========================================================
 * ENTRY EVENT
 *
 * entry-standalone.js ONLY sends this event.
 *
 * The actual universe starts here.
 * =========================================================
 */

window.addEventListener(
    "particle-universe-enter",
    handleUniverseEntry,
    {
        once: true
    }
);


async function handleUniverseEntry() {

    if (booted) {
        return;
    }

    booted = true;

    console.log(
        "[MAIN] Particle Universe entry received."
    );


    /*
     * =====================================================
     * AUDIO
     *
     * This is executed as a consequence of the
     * user click event.
     * =====================================================
     */

    try {

        await startMusic();

    } catch (error) {

        console.warn(
            "[MAIN] Audio start failed:",
            error
        );
    }


    /*
     * =====================================================
     * UNIVERSE BOOT
     * =====================================================
     */

    try {

        await bootUniverse();

    } catch (error) {

        console.error(
            "[MAIN] Universe boot failed:",
            error
        );

        /*
         * Last-resort visual fallback.
         */

        startCanvasFallback(
            canvas
        );
    }
}


/*
 * =========================================================
 * BOOT UNIVERSE
 * =========================================================
 */

async function bootUniverse() {

    if (!canvas) {

        throw new Error(
            "universeCanvas not found."
        );
    }


    console.log(
        "[MAIN] Creating renderer..."
    );


    /*
     * =====================================================
     * RENDERER
     * =====================================================
     */

    runtime =
        await createRenderer(
            canvas
        );


    STATE.rendererMode =
        runtime.mode;


    console.log(
        "[MAIN] Renderer mode:",
        runtime.mode
    );


    /*
     * =====================================================
     * LEVEL 4 / 5 FALLBACK
     * =====================================================
     */

    if (
        runtime.mode ===
        "CANVAS"
    ) {

        console.warn(
            "[MAIN] Using Canvas fallback."
        );

        startCanvasFallback(
            canvas
        );

        return;
    }


    if (
        runtime.mode ===
        "RAW_WEBGL"
    ) {

        console.warn(
            "[MAIN] Using Raw WebGL fallback."
        );

        startRawWebGL(
            canvas,
            runtime.gl
        );

        return;
    }


    /*
     * =====================================================
     * THREE.JS
     * =====================================================
     */

    const THREE =
        runtime.THREE;

    const renderer =
        runtime.renderer;


    if (!THREE || !renderer) {

        throw new Error(
            "Three.js renderer unavailable."
        );
    }


    /*
     * =====================================================
     * SCENE
     * =====================================================
     */

    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x000000
        );


    /*
     * =====================================================
     * CAMERA
     * =====================================================
     */

    const cameraController =
        new CameraController(
            THREE
        );

    const camera =
        cameraController.createCamera();


    /*
     * =====================================================
     * UNIVERSE
     * =====================================================
     */

    const universe =
        new Universe(
            THREE,
            scene,
            cameraController
        );


    /*
     * =====================================================
     * OBSERVER
     * =====================================================
 */

    const observer =
        new Observer(
            THREE,
            cameraController,
            () =>
                universe.nebula
        );


    /*
     * =====================================================
     * ROAMING
     * =====================================================
     */

    const roaming =
        new UniverseRoaming(
            THREE,
            scene
        );


    /*
     * =====================================================
     * DESKTOP CONTROLS
     * =====================================================
 */

    initDesktopControls(
        canvas,
        cameraController,
        () =>
            STATE.observationLocked
    );


    /*
     * =====================================================
     * MOBILE CONTROLS
     * =====================================================
 */

    initMobileControls(
        canvas,
        cameraController,
        () =>
            STATE.observationLocked
    );


    /*
     * =====================================================
     * IMAGE UPLOAD
     * =====================================================
 */

    const imageInput =
        document.getElementById(
            "imageInput"
        );


    if (imageInput) {

        imageInput.addEventListener(
            "change",
            async event => {

                const files =
                    Array.from(
                        event.target.files || []
                    );


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


                    try {

                        const base64 =
                            await fileToBase64(
                                file
                            );

                        addBase64Image(
                            base64
                        );

                    } catch (error) {

                        console.error(
                            "[IMAGE] Failed:",
                            error
                        );
                    }
                }


                /*
                 * Allow selecting the same
                 * file again.
                 */

                imageInput.value = "";
            }
        );
    }


    /*
     * =====================================================
     * RESIZE
     * =====================================================
 */

    function resize() {

        cameraController.resize();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight,
            false
        );

        if (
            renderer.setPixelRatio
        ) {

            renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    2
                )
            );
        }
    }


    window.addEventListener(
        "resize",
        resize
    );


    /*
     * Initial resize
     */

    resize();


    /*
     * =====================================================
     * NEXT NEBULA
     * =====================================================
 */

    window.__generateNextNebula =
        async () => {

            try {

                await universe.startNewCycle();

                observer.reset();

            } catch (error) {

                console.error(
                    "[MAIN] Next nebula failed:",
                    error
                );
            }
        };


    /*
     * =====================================================
     * ENGINE
     * =====================================================
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


    /*
     * =====================================================
     * START
     * =====================================================
 */

    engine.start();


    console.log(
        "[MAIN] Particle Universe Engine started."
    );
}


/*
 * =========================================================
 * FILE → BASE64
 * =========================================================
 */

function fileToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );
                };


            reader.onerror =
                () => {

                    reject(
                        reader.error ||
                        new Error(
                            "FileReader failed."
                        )
                    );
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}