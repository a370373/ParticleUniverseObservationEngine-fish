/*
 * =========================================================
 * PARTICLE UNIVERSE OBSERVATION ENGINE
 *
 * Main Universe Bootstrap
 *
 * IMPORTANT:
 *
 * Entry is NOT initialized here.
 *
 * Entry is completely independent:
 *
 * index.html
 *     ↓
 * entry-standalone.js
 *     ↓
 * particle-universe-enter
 *     ↓
 * main.js
 *
 * This prevents a Universe loading error from killing
 * the Click to Enter screen.
 * =========================================================
 */


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

let universeStarted = false;



/*
 * =========================================================
 * BOOT UNIVERSE
 * =========================================================
 */

async function bootUniverse() {

    /*
     * Prevent duplicate boot.
     */

    if (universeStarted) {

        console.warn(
            "[UNIVERSE] Already running."
        );

        return;
    }


    universeStarted = true;


    console.log(
        "[UNIVERSE] Boot started."
    );


    /*
     * =====================================================
     * RENDERER SELECTION
     *
     * Level 1:
     * WebGPU
     *
     * Level 2:
     * Three.js WebGL
     *
     * Level 3:
     * Native WebGL
     *
     * Level 4:
     * Canvas
     * =====================================================
     */

    runtime =
        await createRenderer(
            canvas
        );


    STATE.rendererMode =
        runtime.mode;


    console.log(
        "[UNIVERSE] Renderer:",
        runtime.mode
    );



    /*
     * =====================================================
     * CANVAS FALLBACK
     * =====================================================
     */

    if (
        runtime.mode ===
        "CANVAS"
    ) {

        console.warn(
            "[UNIVERSE] Using Canvas fallback."
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
        runtime.mode ===
        "RAW_WEBGL"
    ) {

        console.warn(
            "[UNIVERSE] Using native WebGL fallback."
        );


        startRawWebGL(
            canvas,
            runtime.gl
        );


        return;
    }



    /*
     * =====================================================
     * THREE.JS RUNTIME
     * =====================================================
     */

    const THREE =
        runtime.THREE;


    const renderer =
        runtime.renderer;



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
        cameraController
            .createCamera();



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
     * ROAMING UNIVERSE
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
     * ===================================================== */

    initDesktopControls(
        canvas,
        cameraController,
        () =>
            STATE.observationLocked
    );



    /*
     * =====================================================
     * MOBILE CONTROLS
     * ===================================================== */

    initMobileControls(
        canvas,
        cameraController,
        () =>
            STATE.observationLocked
    );



    /*
     * =====================================================
     * CUSTOM IMAGE SYSTEM
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

                try {

                    const files =
                        [
                            ...(
                                event
                                    .target
                                    .files ||
                                []
                            )
                        ];


                    for (
                        const file
                        of files
                    ) {

                        /*
                         * Only images.
                         */

                        if (
                            !file.type
                                .startsWith(
                                    "image/"
                                )
                        ) {

                            continue;
                        }


                        /*
                         * Convert:
                         *
                         * Image
                         * ↓
                         * Base64
                         */

                        const base64 =
                            await fileToBase64(
                                file
                            );


                        /*
                         * Add to image library.
                         */

                        addBase64Image(
                            base64
                        );

                    }


                } catch (error) {

                    console.error(
                        "[IMAGE] Upload failed:",
                        error
                    );

                }

            }
        );

    }



    /*
     * =====================================================
     * RESIZE
     * =====================================================
     */

    function resize() {

        try {

            cameraController
                .resize();


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
                        window.devicePixelRatio ||
                        1,
                        2
                    )
                );

            }

        } catch (error) {

            console.error(
                "[UNIVERSE] Resize error:",
                error
            );

        }

    }


    window.addEventListener(
        "resize",
        resize
    );


    /*
     * Initial resize.
     */

    resize();



    /*
     * =====================================================
     * NEXT NEBULA EVENT
     *
     * Observation / explosion can request
     * a new observation cycle.
     * =====================================================
     */

    window.__generateNextNebula =
        async function () {

            try {

                await universe
                    .startNewCycle();


                observer.reset();


            } catch (error) {

                console.error(
                    "[UNIVERSE] Next nebula failed:",
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
        "[UNIVERSE] Engine started."
    );

}



/*
 * =========================================================
 * FILE → BASE64
 * =========================================================
 */

function fileToBase64(
    file
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

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



/*
 * =========================================================
 * ENTRY EVENT
 *
 * This is the ONLY bridge between the standalone
 * Entry system and the Universe system.
 *
 * Entry itself does not import this file.
 *
 * main.js simply waits for the event.
 * =========================================================
 */

window.addEventListener(
    "particle-universe-enter",
    () => {

        console.log(
            "[UNIVERSE] Entry received."
        );


        bootUniverse()
            .catch(
                error => {

                    console.error(
                        "[UNIVERSE] Boot failed:",
                        error
                    );


                    /*
                     * Final safety fallback.
                     *
                     * If Three/WebGPU/WebGL engine
                     * crashes after Entry, attempt
                     * Canvas instead of leaving
                     * a black screen.
                     */

                    try {

                        universeStarted =
                            false;


                        startCanvasFallback(
                            canvas
                        );


                    } catch (
                        fallbackError
                    ) {

                        console.error(
                            "[UNIVERSE] Canvas fallback failed:",
                            fallbackError
                        );

                    }

                }
            );

    },
    {
        once: true
    }
);



/*
 * =========================================================
 * SAFETY LOG
 * =========================================================
 */

console.log(
    "[UNIVERSE] Main module loaded."
);