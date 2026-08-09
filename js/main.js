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

            document.body.appendChild(box);
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
        let universe = null;
        let observer = null;


        /*
         * =====================================================
         * AUDIO
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

            }
        );


        /*
         * =====================================================
         * ENTER
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


                if (!audioStarted) {

                    try {

                        audioStarted = true;

                        initAudio();

                        await startMusic();

                        debug(
                            "AUDIO BACKUP OK"
                        );

                    } catch (error) {

                        debug(
                            "AUDIO BACKUP ERROR: " +
                            (
                                error?.message ||
                                String(error)
                            )
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
         * BOOT
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


            const scene =
                new THREE.Scene();


            scene.background =
                new THREE.Color(
                    0x000000
                );


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
             * IMPORTANT:
             * Make sure camera begins at
             * a sane visible distance.
             */

            if (
                camera.position.z === 0
            ) {

                camera.position.z =
                    120;
            }


            universe =
                new Universe(
                    THREE,
                    scene,
                    cameraController
                );


            debug(
                "UNIVERSE CREATED"
            );


            observer =
                new Observer(
                    THREE,
                    cameraController,
                    function () {

                        return universe.nebula;
                    }
                );


            const roaming =
                new UniverseRoaming(
                    THREE,
                    scene
                );


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


                        imageInput.value = "";


                        /*
                         * Immediately generate
                         * a new universe after upload.
                         */

                        if (universe) {

                            try {

                                debug(
                                    "GENERATING FROM UPLOADED IMAGE"
                                );

                                await universe
                                    .startNewCycle();

                                if (observer) {

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
                        "CAMERA RESIZE ERROR"
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
             * =================================================
             */

            window.__generateNextNebula =
                async function () {

                    try {

                        debug(
                            "NEXT NEBULA"
                        );

                        await universe
                            .startNewCycle();

                        if (observer) {

                            observer.reset();
                        }

                    } catch (error) {

                        debug(
                            "NEXT NEBULA ERROR: " +
                            (
                                error?.message ||
                                String(error)
                            )
                        );
                    }
                };


            /*
             * =================================================
             * ENGINE
             * =================================================
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


            engine.start();


            debug(
                "ENGINE STARTED"
            );


            debug(
                "SYSTEM ONLINE"
            );
        }


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