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
            "[ENGINE] CONSTRUCTOR"
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

        try {

            this.ambient =
                new AmbientController(
                    cameraController
                );

            console.log(
                "[ENGINE] AMBIENT CREATED"
            );

        } catch (error) {

            console.error(
                "[ENGINE] AMBIENT ERROR:",
                error
            );

            this.ambient =
                null;
        }


        this.running =
            false;

        this.last =
            performance.now();

        this.frameCount =
            0;
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
                "[ENGINE] ALREADY RUNNING"
            );

            return;
        }


        console.log(
            "[ENGINE] START"
        );


        this.running =
            true;

        this.last =
            performance.now();

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
         * Only print the first few frames
         * so console does not explode.
         */

        if (
            this.frameCount <= 10
        ) {

            console.log(
                "[ENGINE] FRAME",
                this.frameCount
            );
        }


        const dt =
            Math.min(
                0.05,
                (
                    now -
                    this.last
                ) / 1000
            );


        this.last =
            now;


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
                "[ENGINE] updateIdle ERROR:",
                error
            );
        }


        /*
         * =================================================
         * CAMERA / AMBIENT
         * =================================================
         */

        if (
            !STATE.observationLocked
        ) {

            try {

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
                            "[ENGINE] AMBIENT ENTER"
                        );
                    }
                }

            } catch (error) {

                console.error(
                    "[ENGINE] AMBIENT CHECK ERROR:",
                    error
                );
            }


            /*
             * Ambient controller
             */

            if (
                this.ambient
            ) {

                try {

                    this.ambient.update(
                        dt
                    );

                } catch (error) {

                    console.error(
                        "[ENGINE] AMBIENT UPDATE ERROR:",
                        error
                    );
                }
            }


            /*
             * Camera controller
             */

            try {

                this.cameraController
                    .update(
                        dt
                    );

            } catch (error) {

                console.error(
                    "[ENGINE] CAMERA UPDATE ERROR:",
                    error
                );
            }
        }


        /*
         * =================================================
         * UNIVERSE
         * =================================================
         */

        try {

            this.universe.update(
                now,
                dt
            );

        } catch (error) {

            console.error(
                "[ENGINE] UNIVERSE UPDATE ERROR:",
                error
            );
        }


        /*
         * =================================================
         * ROAMING
         * =================================================
         */

        try {

            this.roaming.update(
                dt
            );

        } catch (error) {

            console.error(
                "[ENGINE] ROAMING UPDATE ERROR:",
                error
            );
        }


        /*
         * =================================================
         * OBSERVER
         * =================================================
         */

        if (
            !STATE.ambient &&
            !STATE.observationLocked &&
            !STATE.observationComplete &&
            !STATE.shuffle
        ) {

            try {

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
                        "[ENGINE] OBSERVATION COMPLETE"
                    );


                    this.universe
                        .completeObservation();

                } else if (
                    result &&
                    result.failed
                ) {

                    console.log(
                        "[ENGINE] OBSERVATION FAILED"
                    );


                    this.universe
                        .shuffle();
                }

            } catch (error) {

                console.error(
                    "[ENGINE] OBSERVER ERROR:",
                    error
                );
            }
        }


        /*
         * =================================================
         * RENDER
         * =================================================
         */

        try {

            if (
                !this.renderer
            ) {

                console.error(
                    "[ENGINE] RENDERER MISSING"
                );

            } else if (
                !this.scene
            ) {

                console.error(
                    "[ENGINE] SCENE MISSING"
                );

            } else if (
                !this.camera
            ) {

                console.error(
                    "[ENGINE] CAMERA MISSING"
                );

            } else {

                this.renderer.render(
                    this.scene,
                    this.camera
                );


                if (
                    this.frameCount <= 10
                ) {

                    console.log(
                        "[ENGINE] RENDER OK"
                    );
                }
            }

        } catch (error) {

            console.error(
                "[ENGINE] RENDER ERROR:",
                error
            );
        }


        /*
         * =================================================
         * NEXT FRAME
         * =================================================
         */

        requestAnimationFrame(
            this.frame.bind(
                this
            )
        );
    }


    /*
     * =====================================================
     * STOP
     * =====================================================
     */

    stop() {

        console.log(
            "[ENGINE] STOP"
        );

        this.running =
            false;
    }
}