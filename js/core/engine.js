/*
 * =========================================================
 * ENGINE
 * MINIMAL VISUAL TEST
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
                    }
                }


                this.ambient.update(
                    dt
                );


                this.cameraController
                    .update(
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
         *
         * DISABLED IN TEST MODE
         * =================================================
         */

        /*
         * 不執行 observer。
         *
         * 等畫面成功顯示後再重新接回。
         */


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
}