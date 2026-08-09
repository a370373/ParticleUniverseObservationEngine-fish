import {
    generateNebula
} from "../particles/nebula-generator.js";

import {
    ParticleSystem
} from "../particles/particle-system.js";

import {
    createStars
} from "../universe/stars.js";

import {
    createDust
} from "../universe/dust.js";

import {
    getRandomImage
} from "../media/image-library.js";

import {
    STATE,
    setPhase
} from "./state.js";

import {
    CONFIG
} from "../config.js";

import {
    runObservationEvent
} from "../observation/observation-event.js";

import {
    shuffleParticles
} from "../particles/particle-shuffle.js";

export class Universe {

    constructor(
        THREE,
        scene,
        cameraController
    ) {

        this.THREE =
            THREE;

        this.scene =
            scene;

        this.camera =
            cameraController;

        this.particleSystem =
            null;

        this.nebula =
            null;

        this.stars =
            createStars(
                THREE,
                CONFIG.PARTICLES.STARS
            );

        this.dust =
            createDust(
                THREE,
                CONFIG.PARTICLES.DUST
            );

        scene.add(
            this.stars
        );

        scene.add(
            this.dust
        );

        this.startNewCycle();
    }

    async startNewCycle() {

        const source =
            getRandomImage();

        if (!source) {
            return;
        }

        setPhase(
            "SUMMONING"
        );

        const nebula =
            await generateNebula(
                this.THREE,
                source
            );

        this.nebula =
            nebula;

        /*
         * Delete old visible system.
         */
        if (
            this.particleSystem
        ) {

            this.scene.remove(
                this.particleSystem.points
            );

            this.particleSystem
                .geometry
                .dispose();

            this.particleSystem
                .material
                .dispose();
        }

        this.particleSystem =
            new ParticleSystem(
                this.THREE,
                nebula
            );

        this.scene.add(
            this.particleSystem.points
        );

        /*
         * Apply hidden random orientation.
         */
        this.particleSystem.points.rotation.set(
            nebula.observation.pitch,
            nebula.observation.yaw,
            nebula.observation.roll
        );

        /*
         * The actual world position is random.
         */
        this.particleSystem.points.position.copy(
            nebula.observation.position
        );

        /*
         * Phase 1:
         * particles enter from all directions.
         */
        nebula.state =
            "SUMMONING";

        this.summonStart =
            performance.now();

        this.summonDuration =
            6500;

        setTimeout(
            () => {

                if (
                    this.nebula === nebula
                ) {

                    nebula.state =
                        "STABLE";

                    setPhase(
                        "EXPLORATION"
                    );
                }

            },
            this.summonDuration
        );
    }

    update(time, dt) {

        if (
            this.particleSystem
        ) {

            this.particleSystem
                .update(
                    time,
                    dt
                );
        }

        if (
            !this.nebula
        ) {
            return;
        }

        /*
         * Natural nebula movement.
         */
        if (
            this.nebula.state ===
            "STABLE"
        ) {

            switch (
                this.nebula.rotationMode
            ) {

                case "ROTATE":

                    this.particleSystem
                        .points
                        .rotation.y +=
                        dt * 0.015;

                    break;

                case "FLIP":

                    this.particleSystem
                        .points
                        .rotation.x +=
                        Math.sin(
                            time * 0.0001
                        ) *
                        dt *
                        0.01;

                    break;

                case "DEFORM":

                    this.particleSystem
                        .points
                        .rotation.z +=
                        dt * 0.008;

                    break;

                case "STOP":
                    break;
            }
        }
    }

    async shuffle() {

        if (
            !this.particleSystem ||
            STATE.shuffle
        ) {
            return;
        }

        STATE.shuffle =
            true;

        setPhase(
            "PARTICLE_SHUFFLE"
        );

        await shuffleParticles(
            this.particleSystem,
            CONFIG.OBSERVATION
                .SHUFFLE_TIME
        );

        STATE.shuffle =
            false;

        /*
         * Image source remains SAME.
         *
         * Therefore failed observation
         * does not change image.
         */
        this.nebula.state =
            "STABLE";

        setPhase(
            "EXPLORATION"
        );
    }

    async completeObservation() {

        if (
            !this.particleSystem
        ) {
            return;
        }

        STATE.observationComplete =
            true;

        await runObservationEvent(
            this.camera,
            this.particleSystem
        );
    }
}