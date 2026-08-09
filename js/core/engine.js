/*
 * =========================================================
 * PARTICLE UNIVERSE
 * ENGINE
 * FULL RUNTIME
 *
 * Engine responsibilities:
 *
 * 1. Runtime loop
 * 2. Idle state
 * 3. Camera update
 * 4. Universe update
 * 5. Roaming update
 * 6. Render
 *
 * Observation responsibilities:
 *
 * Engine
 *  ↓
 * Universe.update()
 *  ↓
 * Observer
 *  ↓
 * ObservationDetector
 *  ↓
 * similarity.js
 *
 * Engine DOES NOT:
 *
 * - Create ObservationDetector
 * - Run ObservationDetector
 * - Sync observation target
 * - Calculate similarity
 *
 * =========================================================
 */

import {
    updateIdle,
    STATE
} from "./state.js";


import {
    AmbientController,
    shouldEnterAmbient
} from "../universe/ambient.js";


export class Engine {


    constructor(
        renderer,
        scene,
        camera,
        cameraController,
        universe,
        observer,
        roaming
    ) {

        console.log(
            "[Engine] CONSTRUCTOR"
        );


        /*
         * =================================================
         * CORE
         * =================================================
         */

        this.renderer =
            renderer;

        this.scene =
            scene;

        this.camera =
            camera;

        this.cameraController =
            cameraController;

        this.universe =
            universe;


        /*
         * =================================================
         * OBSERVER
         * =================================================
         *
         * Observer is owned by Universe.
         *
         * Engine only keeps a reference for compatibility
         * and debugging.
         * =================================================
         */

        this.observer =
            observer ||
            universe?.observer ||
            null;


        this.roaming =
            roaming;


        /*
         * =================================================
         * AMBIENT
         * =================================================
         */

        this.ambient =
            null;


        try {

            this.ambient =
                new AmbientController(
                    cameraController
                );

        } catch (error) {

            console.error(
                "[Engine] AMBIENT CONSTRUCTOR ERROR:",
                error
            );

            this.ambient =
                null;
        }


        /*
         * =================================================
         * RUNTIME
         * =================================================
         */

        this.running =
            false;


        this.last =
            performance.now();


        /*
         * =================================================
         * CAMERA DEBUG
         * =================================================
         */

        this.cameraFrameCounter =
            0;


        console.log(
            "[Engine] OBSERVATION OWNERSHIP: UNIVERSE"
        );


        console.log(
            "[Engine] CAMERA OWNERSHIP: CAMERA CONTROLLER"
        );


        console.log(
            "[Engine] READY"
        );
    }


    /*
     * =====================================================
     * START
     * =====================================================
     */

    start() {

        if (
            this.running
        ) {

            return;
        }


        this.running =
            true;


        this.last =
            performance.now();


        console.log(
            "[Engine] LOOP START"
        );


        /*
         * =================================================
         * INITIAL CAMERA SYNC
         * =================================================
         */

        this.syncCamera();


        requestAnimationFrame(
            this.frame.bind(this)
        );
    }


    /*
     * =====================================================
     * CAMERA SYNC
     * =====================================================
     *
     * Engine does not calculate camera movement here.
     *
     * CameraController owns:
     *
     * - position
     * - yaw
     * - pitch
     * - velocity
     * - lookAt
     *
     * Engine only makes sure the Three Camera exists and
     * receives the controller state.
     * =====================================================
     */

    syncCamera() {

        if (
            !this.camera ||
            !this.cameraController
        ) {

            return false;
        }


        try {

            /*
             * Preferred:
             *
             * CameraController.update()
             *
             * already synchronizes:
             *
             * controller.position
             *          ↓
             * THREE camera.position
             *
             * Therefore do not manually calculate
             * lookAt() here.
             */


            if (
                this.cameraController.camera !==
                this.camera
            ) {

                /*
                 * The controller should normally already
                 * own this exact camera instance.
                 *
                 * If it does not, synchronize the reference
                 * without replacing the actual camera.
                 */

                this.cameraController.camera =
                    this.camera;
            }


            /*
             * If controller exposes its position,
             * make sure Three Camera follows it.
             *
             * This is only a safety synchronization.
             */

            if (
                this.cameraController.position &&
                typeof this.camera.position.copy ===
                    "function"
            ) {

                this.camera.position.copy(
                    this.cameraController.position
                );
            }


            return true;

        } catch (error) {

            console.error(
                "[Engine] CAMERA SYNC ERROR:",
                error
            );


            return false;
        }
    }


    /*
     * =====================================================
     * FRAME
     * =====================================================
     */

    frame(
        now
    ) {

        if (
            !this.running
        ) {

            return;
        }


        /*
         * =================================================
         * DELTA TIME
         * =================================================
         */

        const dt =
            Math.min(
                0.05,
                Math.max(
                    0,
                    (
                        now -
                        this.last
                    ) / 1000
                )
            );


        this.last =
            now;


        /*
         * =================================================
         * STATE
         * =================================================
         */

        try {

            updateIdle(
                now
            );

        } catch (error) {

            console.error(
                "[Engine] updateIdle error:",
                error
            );
        }


        /*
         * =================================================
         * CAMERA
         * =================================================
         *
         * Camera pipeline:
         *
         * AmbientController
         *        ↓
         * CameraController
         *        ↓
         * THREE.Camera
         *
         * IMPORTANT:
         *
         * Do NOT directly call:
         *
         * camera.position.set()
         * camera.lookAt()
         *
         * here.
         *
         * CameraController owns those operations.
         * =================================================
         */

        try {

            if (
                !STATE.observationLocked
            ) {

                /*
                 * -----------------------------------------
                 * AMBIENT
                 * -----------------------------------------
                 */

                if (
                    shouldEnterAmbient(
                        STATE.idleTime
                    )
                ) {

                    if (
                        !STATE.ambient
                    ) {

                        STATE.ambient =
                            true;


                        console.log(
                            "[Engine] AMBIENT MODE"
                        );
                    }
                }


                /*
                 * -----------------------------------------
                 * AMBIENT CAMERA
                 * -----------------------------------------
                 */

                if (
                    this.ambient &&
                    typeof this.ambient.update ===
                        "function"
                ) {

                    try {

                        this.ambient.update(
                            dt
                        );

                    } catch (error) {

                        console.error(
                            "[Engine] AMBIENT UPDATE ERROR:",
                            error
                        );
                    }
                }


                /*
                 * -----------------------------------------
                 * CAMERA CONTROLLER
                 * -----------------------------------------
                 */

                if (
                    this.cameraController &&
                    typeof this.cameraController.update ===
                        "function"
                ) {

                    this.cameraController.update(
                        dt
                    );

                } else {

                    console.warn(
                        "[Engine] CAMERA CONTROLLER MISSING"
                    );
                }


                /*
                 * -----------------------------------------
                 * FINAL CAMERA SYNC
                 * -----------------------------------------
                 *
                 * This guarantees:
                 *
                 * CameraController.position
                 *          ↓
                 * THREE Camera
                 *
                 * after all camera behaviour has run.
                 */

                this.syncCamera();


                /*
                 * -----------------------------------------
                 * CAMERA DEBUG
                 * -----------------------------------------
                 *
                 * Only print occasionally so the debug
                 * panel does not get flooded every frame.
                 */

                this.cameraFrameCounter++;


                if (
                    this.cameraFrameCounter %
                    300 ===
                    0
                ) {

                    if (
                        this.cameraController &&
                        typeof this.cameraController
                            .getDebugState ===
                            "function"
                    ) {

                        console.log(
                            "[Engine] CAMERA:",
                            this.cameraController
                                .getDebugState()
                        );
                    }
                }
            }


        } catch (error) {

            console.error(
                "[Engine] CAMERA ERROR:",
                error
            );
        }


        /*
         * =================================================
         * UNIVERSE
         * =================================================
         *
         * Universe owns the entire observation pipeline.
         *
         * Universe.update()
         *      ↓
         * Observer.update()
         *      ↓
         * ObservationDetector.update()
         *      ↓
         * similarity.js
         *
         * Engine does NOT call Observer directly.
         * =================================================
         */

        try {

            if (
                this.universe &&
                typeof this.universe.update ===
                    "function"
            ) {

                this.universe.update(
                    now,
                    dt
                );
            }

        } catch (error) {

            console.error(
                "[Engine] UNIVERSE ERROR:",
                error
            );
        }


        /*
         * =================================================
         * ROAMING
         * =================================================
         */

        try {

            if (
                this.roaming &&
                typeof this.roaming.update ===
                    "function"
            ) {

                this.roaming.update(
                    dt
                );
            }

        } catch (error) {

            console.error(
                "[Engine] ROAMING ERROR:",
                error
            );
        }


        /*
         * =================================================
         * RENDER
         * =================================================
         */

        try {

            if (
                this.renderer &&
                this.scene &&
                this.camera
            ) {

                this.renderer.render(
                    this.scene,
                    this.camera
                );
            }

        } catch (error) {

            console.error(
                "[Engine] RENDER ERROR:",
                error
            );
        }


        /*
         * =================================================
         * NEXT FRAME
         * =================================================
         */

        requestAnimationFrame(
            this.frame.bind(this)
        );
    }


    /*
     * =====================================================
     * STOP
     * =====================================================
     */

    stop() {

        if (
            !this.running
        ) {

            return;
        }


        this.running =
            false;


        console.log(
            "[Engine] LOOP STOP"
        );
    }
}