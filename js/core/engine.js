/*
 * =========================================================
 * PARTICLE UNIVERSE
 * ENGINE
 * FULL RUNTIME
 *
 * Responsibilities:
 *
 * 1. Runtime loop
 * 2. Idle state
 * 3. Camera update
 * 4. Universe update
 * 5. Roaming update
 * 6. Render
 *
 * Observation:
 *
 * Engine
 *   ↓
 * Universe.update()
 *   ↓
 * Observer
 *   ↓
 * ObservationDetector
 *   ↓
 * similarity.js
 *
 * Engine NEVER creates or updates Observer directly.
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

        this.roaming =
            roaming;


        /*
         * =================================================
         * OBSERVER
         * =================================================
         *
         * Universe owns Observer.
         *
         * Engine only keeps the reference.
         * =================================================
         */

        this.observer =
            observer ||
            universe?.observer ||
            null;


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
                "[Engine] AMBIENT INIT ERROR:",
                error
            );
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


        this.frameCount =
            0;


        /*
         * =================================================
         * CAMERA DIAGNOSTICS
         * =================================================
         */

        this.cameraDiagnosticsDone =
            false;


        console.log(
            "[Engine] CAMERA:",
            this.camera
        );

        console.log(
            "[Engine] CAMERA CONTROLLER:",
            this.cameraController
        );

        console.log(
            "[Engine] OBSERVER OWNERSHIP: UNIVERSE"
        );

        console.log(
            "[Engine] READY"
        );
    }


    /*
     * =====================================================
     * CAMERA INITIALIZATION
     * =====================================================
     */

    initializeCamera() {

        if (
            !this.camera
        ) {

            console.error(
                "[Engine] CAMERA IS NULL"
            );

            return false;
        }


        if (
            !this.cameraController
        ) {

            console.error(
                "[Engine] CAMERA CONTROLLER IS NULL"
            );

            return false;
        }


        /*
         * CameraController must operate on
         * exactly the same THREE camera.
         */

        this.cameraController.camera =
            this.camera;


        /*
         * =================================================
         * POSITION SYNCHRONIZATION
         * =================================================
         *
         * Do NOT overwrite a valid position created by
         * Universe.
         *
         * Only synchronize when controller position is
         * invalid.
         * =================================================
         */

        if (
            !this.cameraController.position ||
            !Number.isFinite(
                this.cameraController.position.x
            ) ||
            !Number.isFinite(
                this.cameraController.position.y
            ) ||
            !Number.isFinite(
                this.cameraController.position.z
            )
        ) {

            console.warn(
                "[Engine] INVALID CONTROLLER POSITION"
            );

            this.cameraController.position =
                this.camera.position.clone();
        }


        /*
         * If CameraController position and THREE camera
         * position are wildly different at initialization,
         * prefer the THREE camera position.
         *
         * This is important because Universe may have
         * already calculated the observation distance.
         */

        const dx =
            this.camera.position.x -
            this.cameraController.position.x;

        const dy =
            this.camera.position.y -
            this.cameraController.position.y;

        const dz =
            this.camera.position.z -
            this.cameraController.position.z;


        const difference =
            Math.sqrt(
                dx * dx +
                dy * dy +
                dz * dz
            );


        if (
            difference >
            0.001
        ) {

            console.log(
                "[Engine] CAMERA POSITION SYNC:",
                {
                    threeCamera:
                        this.camera.position.clone(),

                    controller:
                        this.cameraController.position.clone(),

                    difference
                }
            );


            /*
             * Universe / existing THREE camera wins.
             */

            this.cameraController.position.copy(
                this.camera.position
            );
        }


        /*
         * =================================================
         * CAMERA PROJECTION
         * =================================================
         */

        try {

            this.camera.updateProjectionMatrix();

        } catch (error) {

            console.error(
                "[Engine] CAMERA PROJECTION ERROR:",
                error
            );
        }


        console.log(
            "[Engine] CAMERA INITIALIZED:",
            {
                position:
                    this.camera.position.clone(),

                controller:
                    this.cameraController.position.clone(),

                yaw:
                    this.cameraController.yaw,

                pitch:
                    this.cameraController.pitch
            }
        );


        return true;
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


        /*
         * Initialize camera exactly once before
         * the animation loop begins.
         */

        this.initializeCamera();


        this.running =
            true;


        this.last =
            performance.now();


        console.log(
            "[Engine] LOOP START"
        );


        requestAnimationFrame(
            this.frame.bind(this)
        );
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


        this.frameCount++;


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
                "[Engine] STATE ERROR:",
                error
            );
        }


        /*
         * =================================================
         * CAMERA
         * =================================================
         *
         * IMPORTANT:
         *
         * Engine does NOT manually call lookAt().
         *
         * Engine does NOT manually calculate yaw/pitch.
         *
         * CameraController owns the camera.
         *
         * Pipeline:
         *
         * Ambient
         *    ↓
         * CameraController
         *    ↓
         * THREE Camera
         * =================================================
         */

        try {

            if (
                !STATE.observationLocked
            ) {

                /*
                 * -----------------------------------------
                 * AMBIENT MODE
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
                 * AMBIENT UPDATE
                 * -----------------------------------------
                 */

                if (
                    STATE.ambient &&
                    this.ambient &&
                    typeof this.ambient.update ===
                        "function"
                ) {

                    this.ambient.update(
                        dt
                    );
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
         * CAMERA DIAGNOSTIC
         * =================================================
         *
         * Only print once after the first successful frame.
         * =================================================
         */

        if (
            !this.cameraDiagnosticsDone &&
            this.frameCount >= 2
        ) {

            this.cameraDiagnosticsDone =
                true;


            try {

                const position =
                    this.camera.position;

                const controllerPosition =
                    this.cameraController?.position;


                console.log(
                    "[Engine] FIRST FRAME CAMERA:",
                    {
                        camera: {
                            x: position.x,
                            y: position.y,
                            z: position.z
                        },

                        controller:
                            controllerPosition
                                ? {
                                    x:
                                        controllerPosition.x,

                                    y:
                                        controllerPosition.y,

                                    z:
                                        controllerPosition.z
                                }
                                : null,

                        rotation: {
                            x:
                                this.camera.rotation.x,

                            y:
                                this.camera.rotation.y,

                            z:
                                this.camera.rotation.z
                        },

                        visible:
                            this.camera.visible
                    }
                );


            } catch (error) {

                console.error(
                    "[Engine] CAMERA DIAGNOSTIC ERROR:",
                    error
                );
            }
        }


        /*
         * =================================================
         * UNIVERSE
         * =================================================
         *
         * Universe owns:
         *
         * particles
         * observation
         * observer
         * detector
         * similarity
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