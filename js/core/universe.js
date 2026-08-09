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


        /*
         * Current particle universe.
         */

        this.particleSystem =
            null;

        this.nebula =
            null;


        /*
         * Prevent overlapping
         * asynchronous generation cycles.
         */

        this.cycleId =
            0;


        /*
         * Summoning timer.
         */

        this.summonTimer =
            null;


        /*
         * =================================================
         * BACKGROUND STARS
         * =================================================
         */

        this.stars =
            createStars(
                THREE,
                CONFIG.PARTICLES.STARS
            );


        /*
         * =================================================
         * BACKGROUND DUST
         * =================================================
         */

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
         * FIRST CYCLE
         * =================================================
         */

        this.startNewCycle();
    }


    /*
     * =====================================================
     * START NEW NEBULA
     * =====================================================
     */

    async startNewCycle() {

        const currentCycle =
            ++this.cycleId;


        /*
         * Cancel previous summon timer.
         */

        if (
            this.summonTimer
        ) {

            clearTimeout(
                this.summonTimer
            );

            this.summonTimer =
                null;
        }


        /*
         * Get image.
         */

        const source =
            getRandomImage();


        if (!source) {

            console.warn(
                "[Universe] No image source available."
            );

            setPhase(
                "EXPLORATION"
            );

            return;
        }


        setPhase(
            "SUMMONING"
        );


        /*
         * =================================================
         * GENERATE PARTICLE DATA
         * =================================================
         */

        let nebula;

        try {

            nebula =
                await generateNebula(
                    this.THREE,
                    source
                );

        } catch (error) {

            console.error(
                "[Universe] Nebula generation failed:",
                error
            );

            return;
        }


        /*
         * If another cycle started while
         * image generation was running,
         * discard this result.
         */

        if (
            currentCycle !== this.cycleId
        ) {

            return;
        }


        this.nebula =
            nebula;


        /*
         * =================================================
         * DELETE OLD PARTICLES
         * =================================================
         */

        this.disposeParticleSystem();


        /*
         * =================================================
         * CREATE PARTICLE SYSTEM
         * =================================================
         */

        try {

            this.particleSystem =
                new ParticleSystem(
                    this.THREE,
                    nebula
                );

        } catch (error) {

            console.error(
                "[Universe] ParticleSystem creation failed:",
                error
            );

            this.particleSystem =
                null;

            throw error;
        }


        this.scene.add(
            this.particleSystem.points
        );


        /*
         * =================================================
         * HIDDEN OBSERVATION ORIENTATION
         * =================================================
         */

        this.particleSystem
            .points
            .rotation.set(

                nebula.observation.pitch,

                nebula.observation.yaw,

                nebula.observation.roll
            );


        /*
         * =================================================
         * RANDOM WORLD POSITION
         * =================================================
         */

        this.particleSystem
            .points
            .position.copy(
                nebula.observation.position
            );


        /*
         * =================================================
         * RANDOM SCALE
         * =================================================
         */

        this.particleSystem
            .points
            .scale.setScalar(
                nebula.observation.scale
            );


        /*
         * =================================================
         * SUMMONING
         * =================================================
         */

        nebula.state =
            "SUMMONING";


        this.summonStart =
            performance.now();


        this.summonDuration =
            6500;


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
                        this.nebula !== nebula
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
    }


    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    update(
        time,
        dt
    ) {

        /*
         * Background stars.
         */

        if (
            this.stars &&
            this.stars.rotation
        ) {

            this.stars.rotation.y +=
                dt * 0.003;
        }


        /*
         * Background dust.
         */

        if (
            this.dust &&
            this.dust.rotation
        ) {

            this.dust.rotation.y -=
                dt * 0.0015;
        }


        /*
         * Main particles.
         */

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


        /*
         * =================================================
         * NATURAL NEBULA MOVEMENT
         * =================================================
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


    /*
     * =====================================================
     * SHUFFLE
     * =====================================================
     */

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


            /*
             * Keep the same image.
             */

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


    /*
     * =====================================================
     * OBSERVATION COMPLETE
     * =====================================================
     */

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
                "[Universe] Observation event failed:",
                error
            );
        }
    }


    /*
     * =====================================================
     * DISPOSE
     * =====================================================
     */

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

            this.particleSystem.geometry
                ?.dispose();

        } catch (_) {}


        try {

            this.particleSystem.material
                ?.dispose();

        } catch (_) {}


        this.particleSystem =
            null;
    }
}