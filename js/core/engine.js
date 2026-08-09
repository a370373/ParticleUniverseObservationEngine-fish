/*
 * =========================================================
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


        this.ambient =
            new AmbientController(
                cameraController
            );


        this.running =
            false;


        this.last =
            performance.now();


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

            console.log(
                "[Engine] ALREADY RUNNING"
            );

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
                (now - this.last) /
                1000
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
         * CAMERA / AMBIENT
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
                            "[Engine] AMBIENT ENTER"
                        );
                    }
                }


                this.ambient.update(
                    dt
                );


                this.cameraController.update(
                    dt
                );
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
                this.universe
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
                this.roaming
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
         * OBSERVER
         * =================================================
         *
         * Observation is only evaluated when:
         *
         * 1. not ambient
         * 2. not locked
         * 3. not already complete
         * 4. not shuffling
         */

        try {

            if (
                this.observer &&
                this.universe &&
                !STATE.ambient &&
                !STATE.observationLocked &&
                !STATE.observationComplete &&
                !STATE.shuffle
            ) {

                this.observer.ambient =
                    false;


                const result =
                    this.observer.update(
                        now
                    );


                if (
                    result.completed
                ) {

                    console.log(
                        "[Engine] OBSERVATION DETECTED:",
                        result.score
                    );


                    this.universe
                        .completeObservation();


                } else if (
                    result.failed
                ) {

                    console.log(
                        "[Engine] OBSERVATION FAILED:",
                        result.score
                    );


                    this.universe
                        .shuffle();
                }
            }

        } catch (error) {

            console.error(
                "[Engine] OBSERVER ERROR:",
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

        this.running =
            false;


        console.log(
            "[Engine] LOOP STOP"
        );
    }
}