/*
 * =========================================================
 * ENGINE
 * FULL PARTICLE UNIVERSE RUNTIME
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

        this.frameCount =
            0;

        this.lastDebug =
            0;

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

            console.warn(
                "[Engine] START IGNORED: ALREADY RUNNING"
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


        const dt =
            Math.min(
                0.05,
                Math.max(
                    0,
                    (now - this.last) /
                    1000
                )
            );


        this.last =
            now;


        /*
         * =================================================
         * PERIODIC DEBUG
         * =================================================
         *
         * 每約 3 秒印一次，
         * 避免 console 被每幀 log 爆。
         */

        if (
            now - this.lastDebug >
            3000
        ) {

            this.lastDebug =
                now;

            console.log(
                "[Engine] FRAME:",
                this.frameCount,
                "DT:",
                dt.toFixed(4),
                "PHASE:",
                STATE.phase,
                "IDLE:",
                STATE.idleTime
            );
        }


        /*
         * =================================================
         * IDLE
         * =================================================
         */

        try {

            updateIdle(
                now
            );

        } catch (error) {

            console.error(
                "[Engine] IDLE ERROR:",
                error
            );
        }


        /*
         * =================================================
         * AMBIENT + CAMERA
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


                if (
                    this.cameraController
                ) {

                    this.cameraController
                        .update(
                            dt
                        );
                }
            }

        } catch (error) {

            console.error(
                "[Engine] CAMERA / AMBIENT ERROR:",
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
                "[Engine] UNIVERSE UPDATE ERROR:",
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
         * 這裡重新接回完整觀察系統。
         */

        try {

            if (
                !STATE.ambient &&
                !STATE.observationLocked &&
                !STATE.observationComplete &&
                !STATE.shuffle &&
                this.observer
            ) {

                this.observer.ambient =
                    false;


                const result =
                    this.observer.update(
                        now
                    );


                if (
                    result &&
                    result.completed
                ) {

                    console.log(
                        "[Engine] OBSERVATION COMPLETED"
                    );


                    if (
                        this.universe
                    ) {

                        this.universe
                            .completeObservation();
                    }

                } else if (
                    result &&
                    result.failed
                ) {

                    console.log(
                        "[Engine] OBSERVATION FAILED -> SHUFFLE"
                    );


                    if (
                        this.universe
                    ) {

                        this.universe
                            .shuffle();
                    }
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
}