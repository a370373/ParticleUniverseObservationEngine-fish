(function () {

"use strict";

/*
 * =========================================================
 * PARTICLE UNIVERSE
 * MAIN BOOTSTRAP
 * =========================================================
 */

function debug(message) {

    let box =
        document.getElementById(
            "startupDebug"
        );

    if (!box) {

        box =
            document.createElement("div");

        box.id =
            "startupDebug";

        box.style.position =
            "fixed";

        box.style.left =
            "10px";

        box.style.top =
            "10px";

        box.style.zIndex =
            "999999";

        box.style.maxWidth =
            "calc(100vw - 20px)";

        box.style.maxHeight =
            "45vh";

        box.style.overflow =
            "auto";

        box.style.padding =
            "12px";

        box.style.background =
            "rgba(0,0,0,0.85)";

        box.style.color =
            "#00ff88";

        box.style.fontFamily =
            "monospace";

        box.style.fontSize =
            "13px";

        box.style.lineHeight =
            "1.5";

        box.style.whiteSpace =
            "pre-wrap";

        box.style.pointerEvents =
            "none";

        document.body.appendChild(
            box
        );
    }

    box.textContent +=
        "[MAIN] " +
        message +
        "\n";

    console.log(
        "[MAIN]",
        message
    );
}


debug(
    "MAIN MODULE EXECUTING"
);


/*
 * =========================================================
 * EVENT MEMORY
 * =========================================================
 */

let enterRequested =
    false;

let audioRequested =
    false;


window.addEventListener(
    "particle-universe-enter",
    function () {

        enterRequested =
            true;

        debug(
            "ENTER REQUEST CAPTURED"
        );

    },
    false
);


window.addEventListener(
    "particle-universe-audio",
    function () {

        audioRequested =
            true;

        debug(
            "AUDIO REQUEST CAPTURED"
        );

    },
    false
);


/*
 * =========================================================
 * IMPORTS
 * =========================================================
 */

Promise.all([

    import("./core/renderer.js"),
    import("./core/camera.js"),
    import("./core/universe.js"),
    import("./observation/observer.js"),
    import("./universe/roaming.js"),
    import("./core/engine.js"),
    import("./navigation/desktop.js"),
    import("./navigation/mobile.js"),
    import("./media/image-library.js"),
    import("./core/state.js"),
    import("./media/audio.js"),
    import("./fallback/raw-webgl.js"),
    import("./fallback/canvas-fallback.js")

])
.then(
    function (modules) {

        debug(
            "ALL IMPORTS OK"
        );

        startApplication(
            modules
        );
    }
)
.catch(
    function (error) {

        debug(
            "IMPORT ERROR"
        );

        debug(
            error?.stack ||
            error?.message ||
            String(error)
        );

        debug(
            "MAIN STOPPED BEFORE ENGINE"
        );

        console.error(
            "[MAIN] IMPORT ERROR:",
            error
        );
    }
);


/*
 * =========================================================
 * APPLICATION
 * =========================================================
 */

function startApplication(
    modules
) {

    const [

        rendererModule,
        cameraModule,
        universeModule,
        observerModule,
        roamingModule,
        engineModule,
        desktopModule,
        mobileModule,
        imageModule,
        stateModule,
        audioModule,
        rawWebGLModule,
        canvasModule

    ] = modules;


    debug(
        "MODULES CONNECTED"
    );


    const {
        createRenderer
    } =
        rendererModule;

    const {
        CameraController
    } =
        cameraModule;

    const {
        Universe
    } =
        universeModule;

    const {
        Observer
    } =
        observerModule;

    const {
        UniverseRoaming
    } =
        roamingModule;

    const {
        Engine
    } =
        engineModule;

    const {
        initDesktopControls
    } =
        desktopModule;

    const {
        initMobileControls
    } =
        mobileModule;

    const {
        addBase64Image
    } =
        imageModule;

    const {
        STATE
    } =
        stateModule;

    const {
        initAudio,
        startMusic
    } =
        audioModule;

    const {
        startRawWebGL
    } =
        rawWebGLModule;

    const {
        startCanvasFallback
    } =
        canvasModule;


    /*
     * =====================================================
     * CANVAS
     * =====================================================
     */

    const canvas =
        document.getElementById(
            "universeCanvas"
        );


    if (!canvas) {

        debug(
            "ERROR: universeCanvas MISSING"
        );

        return;
    }


    debug(
        "CANVAS OK"
    );


    let runtime =
        null;

    let engine =
        null;

    let booted =
        false;

    let audioStarted =
        false;

    let universe =
        null;

    let observer =
        null;


    /*
     * =====================================================
     * AUDIO
     * =====================================================
     */

    async function handleAudio() {

        if (
            audioStarted
        ) {

            return;
        }

        audioStarted =
            true;

        debug(
            "AUDIO EVENT RECEIVED"
        );

        try {

            initAudio();

            await startMusic();

            debug(
                "AUDIO STARTED"
            );

        } catch (error) {

            audioStarted =
                false;

            debug(
                "AUDIO ERROR: " +
                (
                    error?.stack ||
                    error?.message ||
                    String(error)
                )
            );
        }
    }


    window.addEventListener(
        "particle-universe-audio",
        handleAudio,
        false
    );


    /*
     * =====================================================
     * ENTER
     * =====================================================
     */

    async function handleEnter() {

        if (
            booted
        ) {

            return;
        }

        booted =
            true;

        debug(
            "ENTER EVENT RECEIVED"
        );


        if (
            !audioStarted
        ) {

            await handleAudio();

        }


        try {

            await bootUniverse();

        } catch (error) {

            debug(
                "UNIVERSE BOOT ERROR"
            );

            debug(
                error?.stack ||
                error?.message ||
                String(error)
            );


            console.error(
                error
            );


            try {

                startCanvasFallback(
                    canvas
                );

                debug(
                    "CANVAS FALLBACK STARTED"
                );

            } catch (
                fallbackError
            ) {

                debug(
                    "FALLBACK ERROR: " +
                    (
                        fallbackError?.stack ||
                        fallbackError?.message ||
                        String(fallbackError)
                    )
                );
            }
        }
    }


    window.addEventListener(
        "particle-universe-enter",
        handleEnter,
        false
    );


    /*
     * =====================================================
     * MISSED ENTER RECOVERY
     * =====================================================
     */

    if (
        enterRequested
    ) {

        debug(
            "ENTER WAS FIRED BEFORE MAIN"
        );

        queueMicrotask(
            handleEnter
        );

    } else if (
        window.__particleUniverseEntered === true
    ) {

        debug(
            "ENTER GLOBAL FLAG DETECTED"
        );

        queueMicrotask(
            handleEnter
        );
    }


    /*
     * =====================================================
     * AUDIO RECOVERY
     * =====================================================
     */

    if (
        audioRequested &&
        !audioStarted
    ) {

        debug(
            "AUDIO WAS FIRED BEFORE MAIN"
        );

        queueMicrotask(
            handleAudio
        );
    }


    /*
     * =====================================================
     * BOOT UNIVERSE
     * =====================================================
     */

    async function bootUniverse() {

        debug(
            "CREATING RENDERER"
        );


        runtime =
            await createRenderer(
                canvas
            );


        if (!runtime) {

            throw new Error(
                "Renderer returned null."
            );
        }


        STATE.rendererMode =
            runtime.mode;


        debug(
            "RENDERER: " +
            runtime.mode
        );


        /*
         * =================================================
         * CANVAS
         * =================================================
         */

        if (
            runtime.mode ===
            "CANVAS"
        ) {

            startCanvasFallback(
                canvas
            );

            debug(
                "CANVAS FALLBACK RUNNING"
            );

            return;
        }


        /*
         * =================================================
         * RAW WEBGL
         * =================================================
         */

        if (
            runtime.mode ===
            "RAW_WEBGL"
        ) {

            if (!runtime.gl) {

                throw new Error(
                    "Raw WebGL context missing."
                );
            }


            startRawWebGL(
                canvas,
                runtime.gl
            );


            debug(
                "RAW WEBGL RUNNING"
            );

            return;
        }


        /*
         * =================================================
         * THREE
         * =================================================
         */

        const THREE =
            runtime.THREE;

        const renderer =
            runtime.renderer;


        if (!THREE) {

            throw new Error(
                "THREE is missing."
            );
        }


        if (!renderer) {

            throw new Error(
                "Renderer instance missing."
            );
        }


        debug(
            "THREE.JS OK"
        );


        /*
         * =================================================
         * SCENE
         * =================================================
         */

        const scene =
            new THREE.Scene();


        scene.background =
            new THREE.Color(
                0x000000
            );


        /*
         * =================================================
         * CAMERA
         * =================================================
         */

        const cameraController =
            new CameraController(
                THREE
            );


        const camera =
            cameraController
                .createCamera();


        debug(
            "CAMERA OK"
        );


        if (
            !Number.isFinite(
                camera.position.z
            ) ||
            camera.position.z === 0
        ) {

            camera.position.z =
                120;
        }


        /*
         * =================================================
         * UNIVERSE
         * =================================================
         */

        universe =
            new Universe(
                THREE,
                scene,
                cameraController
            );


        debug(
            "UNIVERSE CREATED"
        );


        /*
         * =================================================
         * OBSERVER
         * =================================================
         */

        observer =
            new Observer(
                THREE,
                cameraController,
                function () {

                    return universe.nebula;
                }
            );


        debug(
            "OBSERVER CREATED"
        );


        /*
         * =================================================
         * ROAMING
         * =================================================
         */

        const roaming =
            new UniverseRoaming(
                THREE,
                scene
            );


        debug(
            "ROAMING CREATED"
        );


        /*
         * =================================================
         * DESKTOP CONTROLS
         * =================================================
         */

        debug(
            "INITIALIZING DESKTOP CONTROLS"
        );


        initDesktopControls(
            canvas,
            cameraController,
            function () {

                return STATE
                    .observationLocked;
            }
        );


        debug(
            "DESKTOP CONTROLS INITIALIZED"
        );


        /*
         * =================================================
         * MOBILE CONTROLS
         * =================================================
         */

        debug(
            "INITIALIZING MOBILE CONTROLS"
        );


        initMobileControls(
            canvas,
            cameraController,
            function () {

                return STATE
                    .observationLocked;
            }
        );


        debug(
            "MOBILE CONTROLS INITIALIZED"
        );


        /*
         * =================================================
         * INPUT DEBUG
         * =================================================
         *
         * CAPTURE PHASE = TRUE
         *
         * If these logs appear, the browser is delivering
         * input events to our canvas/window.
         *
         * =================================================
         */

        debug(
            "INPUT DEBUG INSTALLED"
        );


        canvas.addEventListener(
            "pointerdown",
            function (event) {

                debug(
                    "POINTER DOWN " +
                    event.clientX +
                    "," +
                    event.clientY
                );

            },
            true
        );


        canvas.addEventListener(
            "pointermove",
            function (event) {

                debug(
                    "POINTER MOVE"
                );

            },
            true
        );


        canvas.addEventListener(
            "pointerup",
            function () {

                debug(
                    "POINTER UP"
                );

            },
            true
        );


        canvas.addEventListener(
            "pointercancel",
            function () {

                debug(
                    "POINTER CANCEL"
                );

            },
            true
        );


        canvas.addEventListener(
            "wheel",
            function (event) {

                debug(
                    "WHEEL " +
                    event.deltaY
                );

            },
            {
                capture: true,
                passive: true
            }
        );


        canvas.addEventListener(
            "touchstart",
            function () {

                debug(
                    "TOUCH START"
                );

            },
            true
        );


        canvas.addEventListener(
            "touchmove",
            function () {

                debug(
                    "TOUCH MOVE"
                );

            },
            true
        );


        canvas.addEventListener(
            "touchend",
            function () {

                debug(
                    "TOUCH END"
                );

            },
            true
        );


        window.addEventListener(
            "keydown",
            function (event) {

                debug(
                    "KEY DOWN: " +
                    event.key
                );

            },
            true
        );


        window.addEventListener(
            "keyup",
            function (event) {

                debug(
                    "KEY UP: " +
                    event.key
                );

            },
            true
        );


        debug(
            "INPUT DEBUG READY"
        );


        /*
         * =================================================
         * IMAGE UPLOAD
         * =================================================
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


                            const added =
                                addBase64Image(
                                    base64
                                );


                            debug(
                                added
                                    ? "IMAGE ADDED"
                                    : "IMAGE REJECTED"
                            );

                        } catch (error) {

                            debug(
                                "IMAGE ERROR: " +
                                (
                                    error?.message ||
                                    String(error)
                                )
                            );
                        }
                    }


                    imageInput.value =
                        "";


                    if (
                        universe
                    ) {

                        try {

                            debug(
                                "GENERATING FROM UPLOADED IMAGE"
                            );


                            await universe
                                .startNewCycle();


                            if (
                                observer
                            ) {

                                observer.reset();
                            }


                            debug(
                                "UPLOADED IMAGE UNIVERSE READY"
                            );

                        } catch (error) {

                            debug(
                                "UPLOAD UNIVERSE ERROR: " +
                                (
                                    error?.message ||
                                    String(error)
                                )
                            );
                        }
                    }

                }
            );
        }


        /*
         * =================================================
         * RESIZE
         * =================================================
         */

        function resize() {

            try {

                cameraController.resize();

            } catch (error) {

                debug(
                    "CAMERA RESIZE ERROR: " +
                    (
                        error?.message ||
                        String(error)
                    )
                );
            }


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
         * =================================================
         * NEXT NEBULA
         * ================================================= */

        window.__generateNextNebula =
            async function () {

                try {

                    debug(
                        "NEXT NEBULA"
                    );


                    await universe
                        .startNewCycle();


                    if (
                        observer
                    ) {

                        observer.reset();
                    }


                    debug(
                        "NEXT NEBULA READY"
                    );

                } catch (error) {

                    debug(
                        "NEXT NEBULA ERROR: " +
                        (
                            error?.stack ||
                            error?.message ||
                            String(error)
                        )
                    );
                }
            };


        /*
         * =================================================
         * ENGINE
         * ================================================= */

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


        debug(
            "ENGINE CREATED"
        );


        engine.start();


        debug(
            "ENGINE STARTED"
        );


        debug(
            "SYSTEM ONLINE"
        );
    }


    /*
     * =====================================================
     * FILE → BASE64
     * =====================================================
     */

    function fileToBase64(
        file
    ) {

        return new Promise(
            function (
                resolve,
                reject
            ) {

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

}

})();