/*
 * =========================================================
 * ENGINE
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
                (now - this.last) / 1000
            );

        this.last =
            now;


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
         * Observer temporarily disabled.
         * We reconnect it after the visual pipeline
         * is confirmed working.
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


        requestAnimationFrame(
            this.frame.bind(this)
        );
    }
}