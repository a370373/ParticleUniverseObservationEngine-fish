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
    }

    start() {

        if (this.running) {
            return;
        }

        this.running =
            true;

        this.last =
            performance.now();

        requestAnimationFrame(
            this.frame.bind(this)
        );
    }

    frame(now) {

        if (!this.running) {
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

        updateIdle(now);

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
                .update(dt);
        }

        this.universe.update(
            now,
            dt
        );

        this.roaming.update(
            dt
        );

        /*
         * Observation is disabled
         * during ambient mode.
         */
        if (
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

                this.universe
                    .completeObservation();

            } else if (
                result.failed
            ) {

                this.universe
                    .shuffle();
            }
        }

        if (
            this.renderer
        ) {

            this.renderer.render(
                this.scene,
                this.camera
            );
        }

        requestAnimationFrame(
            this.frame.bind(this)
        );
    }
}