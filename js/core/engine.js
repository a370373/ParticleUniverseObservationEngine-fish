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
     * Observer is owned by Universe.
     *
     * Keep the reference for compatibility/debugging,
     * but Engine does not update it directly.
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
        new AmbientController(
            cameraController
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
        "[Engine] OBSERVATION OWNERSHIP: UNIVERSE"
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


            /*
             * Ambient camera behaviour.
             */

            this.ambient.update(
                dt
            );


            /*
             * Camera controller.
             */

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
     *
     * IMPORTANT:
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
     * Engine must NOT call the detector again.
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