import {
    generateNebula
} from "../particles/nebula-generator.js";

import {
    ParticleSystem
} from "../particles/particle-system.js";

import {
    createStars,
    createDust
} from "../universe/stars.js";

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

        this.cycleId =
            0;

        this.summonTimer =
            null;

        this.summonStart =
            0;

        this.summonDuration =
            6500;


        /*
         * =================================================
         * BACKGROUND
         * =================================================
         */

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


        /*
         * =================================================
         * START FIRST CYCLE
         * =================================================
         */

        this.startNewCycle()
            .catch(
                error => {

                    console.error(
                        "[Universe] Initial cycle failed:",
                        error
                    );
                }
            );
    }


    async startNewCycle() {

        const currentCycle =
            ++this.cycleId;


        if (
            this.summonTimer
        ) {

            clearTimeout(
                this.summonTimer
            );

            this.summonTimer =
                null;
        }


        setPhase(
            "SUMMONING"
        );


        /*
         * =================================================
         * IMAGE
         * =================================================
         */

        const source =
            getRandomImage();


        let nebula;


        try {

            nebula =
                await generateNebula(
                    this.THREE,
                    source
                );

        } catch (error) {

            console.error(
                "[Universe] Image nebula failed:",
                error
            );


            /*
             * If image generation fails,
             * generate a procedural nebula.
             */

            try {

                nebula =
                    await generateNebula(
                        this.THREE,
                        null
                    );

            } catch (fallbackError) {

                console.error(
                    "[Universe] Fallback nebula failed:",
                    fallbackError
                );

                throw fallbackError;
            }
        }


        /*
         * A newer cycle may already exist.
         */

        if (
            currentCycle !==
            this.cycleId
        ) {

            return;
        }


        this.nebula =
            nebula;


        this.disposeParticleSystem();


        /*
         * =================================================
         * PARTICLE SYSTEM
         * =================================================
         */

        this.particleSystem =
            new ParticleSystem(
                this.THREE,
                nebula
            );


        this.scene.add(
            this.particleSystem.points
        );


        /*
         * =================================================
         * INITIAL ORIENTATION
         * =================================================
         */

        this.particleSystem
            .points
            .rotation.set(
                nebula.observation.pitch,
                nebula.observation.yaw,
                nebula.observation.roll
            );


        this.particleSystem
            .points
            .position.copy(
                nebula.observation.position
            );


        this.particleSystem
            .points
            .scale.setScalar(
                nebula.observation.scale
            );


        /*
         * =================================================
         * CAMERA SAFETY
         * =================================================
         */

        try {

            const distance =
                nebula.observation.distance;


            if (
                this.camera &&
                this.camera.camera
            ) {

                this.camera.camera.position.z =
                    distance;
            }

        } catch (_) {}


        nebula.state =
            "SUMMONING";


        this.summonStart =
            performance.now();


        this.summonTimer =
            setTimeout(
                () => {

                    if (
                        currentCycle !==
                        this.cycleId
                    ) {

                        return;
                    }


                    if (
                        this.nebula !==
                        nebula
                    ) {

                        return;
                    }


                    nebula.state =
                        "STABLE";


                    setPhase(
                        "EXPLORATION"
                    );


                    this.summonTimer =
                        null;

                },
                this.summonDuration
            );


        console.log(
            "[Universe] Nebula ready:",
            nebula.count,
            "particles"
        );
    }


    update(
        time,
        dt
    ) {

        if (
            this.stars &&
            this.stars.rotation
        ) {

            this.stars.rotation.y +=
                dt * 0.003;
        }


        if (
            this.dust &&
            this.dust.rotation
        ) {

            this.dust.rotation.y -=
                dt * 0.0015;
        }


        if (
            this.particleSystem
        ) {

            this.particleSystem.update(
                time,
                dt
            );
        }


        if (
            !this.nebula ||
            !this.particleSystem
        ) {

            return;
        }


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
            !this.nebula ||
            STATE.shuffle
        ) {

            return;
        }


        STATE.shuffle =
            true;


        setPhase(
            "PARTICLE_SHUFFLE"
        );


        try {

            await shuffleParticles(
                this.particleSystem,
                CONFIG.OBSERVATION
                    .SHUFFLE_TIME
            );


            this.nebula.state =
                "STABLE";


            setPhase(
                "EXPLORATION"
            );

        } catch (error) {

            console.error(
                "[Universe] Shuffle failed:",
                error
            );

            this.nebula.state =
                "STABLE";

            setPhase(
                "EXPLORATION"
            );

        } finally {

            STATE.shuffle =
                false;
        }
    }


    async completeObservation() {

        if (
            !this.particleSystem
        ) {

            return;
        }


        if (
            STATE.observationComplete
        ) {

            return;
        }


        STATE.observationComplete =
            true;


        try {

            await runObservationEvent(
                this.camera,
                this.particleSystem
            );

        } catch (error) {

            console.error(
                "[Universe] Observation failed:",
                error
            );
        }
    }


    disposeParticleSystem() {

        if (
            !this.particleSystem
        ) {

            return;
        }


        try {

            this.scene.remove(
                this.particleSystem.points
            );

        } catch (_) {}


        try {

            this.particleSystem.dispose();

        } catch (_) {

            try {

                this.particleSystem.geometry
                    ?.dispose();

                this.particleSystem.material
                    ?.dispose();

            } catch (_) {}
        }


        this.particleSystem =
            null;
    }
}