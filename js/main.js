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
    initAudio,
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
let audioStarted = false;


/*
 * =========================================================
 * AUDIO
 *
 * Listen independently from universe boot.
 *
 * This means a renderer failure cannot prevent
 * the music from starting.
 * =========================================================
 */

window.addEventListener(
    "particle-universe-audio",
    handleAudioStart,
    false
);


async function handleAudioStart() {

    if (audioStarted) {
        return;
    }

    audioStarted = true;

    console.log(
        "[MAIN] Audio event received."
    );

    try {

        initAudio();

        await startMusic();

        console.log(
            "[MAIN] Audio started."
        );

    } catch (error) {

        console.error(
            "[MAIN] Audio start failed:",
            error
        );
    }
}


/*
 * =========================================================
 * ENTRY
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
        "[MAIN] Universe entry received."
    );


    /*
     * =====================================================
     * AUDIO BACKUP
     *
     * Entry normally sends the audio event first.
     * This is a second safety layer.
     * =====================================================
     */

    if (!audioStarted) {

        try {

            initAudio();

            await startMusic();

            audioStarted = true;

            console.log(
                "[MAIN] Audio backup started."
            );

        } catch (error) {

            console.warn(
                "[MAIN] Audio backup failed:",
                error
            );
        }
    }


    /*
     * =====================================================
     * UNIVERSE
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
         * Last-resort Canvas fallback.
         */

        try {

            if (canvas) {

                startCanvasFallback(
                    canvas
                );
            }

        } catch (fallbackError) {

            console.error(
                "[MAIN] Canvas fallback failed:",
                fallbackError
            );
        }
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

    if (!runtime) {

        throw new Error(
            "createRenderer returned nothing."
        );
    }

    STATE.rendererMode =
        runtime.mode;

    console.log(
        "[MAIN] Renderer:",
        runtime.mode
    );


    /*
     * =====================================================
     * CANVAS FALLBACK
     * =====================================================
     */

    if (
        runtime.mode === "CANVAS"
    ) {

        console.warn(
            "[MAIN] Canvas fallback."
        );

        startCanvasFallback(
            canvas
        );

        return;
    }


    /*
     * =====================================================
     * RAW WEBGL FALLBACK
     * =====================================================
     */

    if (
        runtime.mode === "RAW_WEBGL"
    ) {

        console.warn(
            "[MAIN] Raw WebGL fallback."
        );

        if (!runtime.gl) {

            throw new Error(
                "Raw WebGL context unavailable."
            );
        }

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

    if (!THREE) {

        throw new Error(
            "Three.js module unavailable."
        );
    }

    if (!renderer) {

        throw new Error(
            "Three.js renderer unavailable."
        );
    }


    console.log(
        "[MAIN] Three.js initialized."
    );


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
            function () {

                return universe.nebula;
            }
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
        function () {

            return STATE.observationLocked;
        }
    );


    /*
     * =====================================================
     * MOBILE CONTROLS
     * =====================================================
     */

    initMobileControls(
        canvas,
        cameraController,
        function () {

            return STATE.observationLocked;
        }
    );


    /*
     * =====================================================
     * IMAGE INPUT
     * =====================================================
     */

    const imageInput =
        document.getElementById(
            "imageInput"
        );

    if (imageInput) {

        imageInput.addEventListener(
            "change",
            async function (event) {

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

                        console.log(
                            "[IMAGE] Added:",
                            file.name
                        );

                    } catch (error) {

                        console.error(
                            "[IMAGE] Failed:",
                            error
                        );
                    }
                }

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

    resize();


    /*
     * =====================================================
     * NEXT NEBULA
     * =====================================================
     */

    window.__generateNextNebula =
        async function () {

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
        function (resolve, reject) {

            const reader =
                new FileReader();

            reader.onload =
                function () {

                    resolve(
                        reader.result
                    );
                };

            reader.onerror =
                function () {

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