(function () {

    "use strict";

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

            box.style.position = "fixed";
            box.style.left = "10px";
            box.style.top = "10px";
            box.style.zIndex = "999999";
            box.style.padding = "12px";
            box.style.background =
                "rgba(0,0,0,0.85)";
            box.style.color = "#00ff88";
            box.style.fontFamily =
                "monospace";
            box.style.fontSize = "14px";
            box.style.lineHeight = "1.5";
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


    /*
     * =========================================================
     * THIS MESSAGE APPEARS BEFORE IMPORTS.
     *
     * If this does NOT appear:
     *
     * → main.js itself did not execute.
     * =========================================================
     */

    debug(
        "MAIN MODULE EXECUTING"
    );


    /*
     * =========================================================
     * DYNAMIC IMPORT DIAGNOSTIC
     *
     * Instead of static imports killing the module before
     * we can see anything, load them one by one.
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
                "ERROR: universeCanvas missing"
            );

            return;
        }

        debug(
            "CANVAS OK"
        );


        let runtime = null;
        let engine = null;
        let booted = false;
        let audioStarted = false;


        /*
         * =====================================================
         * AUDIO EVENT
         * =====================================================
         */

        window.addEventListener(
            "particle-universe-audio",
            async function () {

                if (audioStarted) {
                    return;
                }

                audioStarted = true;

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

                    debug(
                        "AUDIO ERROR: " +
                        (
                            error?.message ||
                            String(error)
                        )
                    );
                }

            },
            false
        );


        /*
         * =====================================================
         * ENTRY EVENT
         * =====================================================
         */

        window.addEventListener(
            "particle-universe-enter",
            async function () {

                if (booted) {
                    return;
                }

                booted = true;

                debug(
                    "ENTER EVENT RECEIVED"
                );


                /*
                 * Audio backup.
                 */

                if (!audioStarted) {

                    try {

                        audioStarted =
                            true;

                        initAudio();

                        await startMusic();

                        debug(
                            "AUDIO BACKUP OK"
                        );

                    } catch (error) {

                        debug(
                            "AUDIO BACKUP ERROR"
                        );
                    }
                }


                try {

                    await bootUniverse();

                } catch (error) {

                    debug(
                        "UNIVERSE BOOT ERROR"
                    );

                    debug(
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
                                fallbackError?.message ||
                                String(fallbackError)
                            )
                        );
                    }
                }

            },
            {
                once: true
            }
        );


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
             * Canvas fallback
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
             * Raw WebGL
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
             * Three.js
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
             * Scene
             */

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

            debug(
                "CAMERA OK"
            );


            /*
             * Universe
             */

            const universe =
                new Universe(
                    THREE,
                    scene,
                    cameraController
                );

            debug(
                "UNIVERSE CREATED"
            );


            /*
             * Observer
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
             * Roaming
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
                function () {

                    return STATE
                        .observationLocked;
                }
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
                "CONTROLS OK"
            );


            /*
             * Image upload
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
                                event.target.files ||
                                []
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

                                debug(
                                    "IMAGE ERROR"
                                );
                            }
                        }

                        imageInput.value = "";
                    }
                );
            }


            /*
             * Resize
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
                            window.devicePixelRatio ||
                            1,
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
             * Next nebula
             */

            window.__generateNextNebula =
                async function () {

                    try {

                        await universe
                            .startNewCycle();

                        observer.reset();

                    } catch (error) {

                        debug(
                            "NEXT NEBULA ERROR"
                        );
                    }
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

            debug(
                "ENGINE CREATED"
            );


            /*
             * Start
             */

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
    }

})();