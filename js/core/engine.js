/*
 * =========================================================
 * PARTICLE UNIVERSE
 * ENGINE
 * FULL RUNTIME
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

import {
    ObservationDetector
} from "../observation/observation-detector.js";


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

        this.observer =
            observer;

        this.roaming =
            roaming;


        /*
         * =================================================
         * AMBIENT
         * =================================================
         */

        this.ambient =
            new AmbientController(
                cameraController
            );


        /*
         * =================================================
         * OBSERVATION DETECTOR
         * =================================================
         */

        this.observationDetector =
            new ObservationDetector(
                cameraController,
                universe
            );


        /*
         * =================================================
         * RUNTIME
         * =================================================
         */

        this.running =
            false;


        this.last =
            performance.now();


        console.log(
            "[Engine] OBSERVATION DETECTOR READY"
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
         */

        try {

            if (
                !STATE.observationLocked
            ) {

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


                this.ambient.update(
                    dt
                );


                if (
                    this.cameraController &&
                    typeof this.cameraController
                        .update ===
                    "function"
                ) {

                    this.cameraController
                        .update(
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
         * UNIVERSE
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
         * OBSERVATION
         *
         * Must run AFTER Universe update
         * and AFTER Camera update.
         * =================================================
         */

        try {

            if (
                this.observationDetector
            ) {

                this.syncObservationTarget();


                this.observationDetector
                    .update(
                        now
                    );
            }

        } catch (error) {

            console.error(
                "[Engine] OBSERVATION ERROR:",
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
     * SYNC OBSERVATION TARGET
     * =====================================================
     *
     * Universe creates a new nebula.
     *
     * Engine detects that change and attaches
     * the detector exactly once.
     *
     * This avoids modifying the Universe runtime
     * unnecessarily.
     * =====================================================
     */

    syncObservationTarget() {

        if (
            !this.universe ||
            !this.observationDetector
        ) {

            return;
        }


        const nebula =
            this.universe.nebula;


        if (
            !nebula
        ) {

            return;
        }


        if (
            this.observationDetector
                .currentNebula ===
            nebula
        ) {

            return;
        }


        console.log(
            "[Engine] NEW OBSERVATION TARGET"
        );


        this.observationDetector
            .attach(
                nebula
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