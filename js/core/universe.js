/*
 * =========================================================
 * PARTICLE UNIVERSE
 * FULL RUNTIME
 * =========================================================
 */

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

        console.log(
            "[Universe] CONSTRUCTOR"
        );

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
            null;

        this.dust =
            null;

        this.cycleId =
            0;

        this.summonTimer =
            null;

        this.summonDuration =
            6500;

        this.ready =
            false;


        /*
         * =================================================
         * BACKGROUND
         * =================================================
         */

        try {

            console.log(
                "[Universe] CREATING STARS"
            );

            this.stars =
                createStars(
                    THREE,
                    CONFIG.PARTICLES.STARS
                );

            this.scene.add(
                this.stars
            );

            console.log(
                "[Universe] STARS CREATED"
            );


            console.log(
                "[Universe] CREATING DUST"
            );

            this.dust =
                createDust(
                    THREE,
                    CONFIG.PARTICLES.DUST
                );

            this.scene.add(
                this.dust
            );

            console.log(
                "[Universe] DUST CREATED"
            );

        } catch (error) {

            console.error(
                "[Universe] BACKGROUND ERROR:",
                error
            );

            this.showError(
                error
            );

            return;
        }


        /*
         * =================================================
         * READY
         * =================================================
         */

        this.ready =
            true;

        console.log(
            "[Universe] READY"
        );


        /*
         * =================================================
         * FIRST CYCLE
         * =================================================
         */

        this.startNewCycle()
            .catch(
                error => {

                    console.error(
                        "[Universe] FIRST CYCLE ERROR:",
                        error
                    );

                    this.showError(
                        error
                    );
                }
            );
    }


    /*
     * =====================================================
     * START NEW CYCLE
     * =====================================================
     */

    async startNewCycle() {

        console.log(
            "[Universe] START NEW CYCLE"
        );


        if (
            !this.ready
        ) {

            console.warn(
                "[Universe] NOT READY"
            );

            return;
        }


        const currentCycle =
            ++this.cycleId;


        /*
         * Cancel old timer.
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


        setPhase(
            "SUMMONING"
        );


        /*
         * =================================================
         * IMAGE
         * =================================================
         */

        console.log(
            "[Universe] GET RANDOM IMAGE"
        );


        let source;

        try {

            source =
                getRandomImage();

        } catch (error) {

            console.error(
                "[Universe] IMAGE ERROR:",
                error
            );

            this.showError(
                error
            );

            return;
        }


        /*
         * Image library may return
         * an empty value.
         *
         * Nebula generator already
         * supports procedural fallback.
         */

        if (
            !source
        ) {

            console.warn(
                "[Universe] NO IMAGE - PROCEDURAL FALLBACK"
            );
        } else {

            console.log(
                "[Universe] IMAGE FOUND"
            );
        }


        /*
         * =================================================
         * GENERATE NEBULA
         * =================================================
         */

        console.log(
            "[Universe] GENERATING NEBULA"
        );


        let nebula;

        try {

            nebula =
                await generateNebula(
                    this.THREE,
                    source
                );

        } catch (error) {

            console.error(
                "[Universe] NEBULA ERROR:",
                error
            );

            this.showError(
                error
            );

            return;
        }


        console.log(
            "[Universe] NEBULA GENERATED"
        );


        if (
            currentCycle !==
            this.cycleId
        ) {

            console.log(
                "[Universe] OLD CYCLE IGNORED"
            );

            return;
        }


        if (
            !nebula
        ) {

            this.showError(
                new Error(
                    "generateNebula() returned null."
                )
            );

            return;
        }


        /*
         * =================================================
         * REMOVE OLD PARTICLES
         * =================================================
         */

        this.disposeParticleSystem();


        /*
         * =================================================
         * STORE NEBULA
         * =================================================
         */

        this.nebula =
            nebula;


        /*
         * =================================================
         * CREATE PARTICLE SYSTEM
         * =================================================
         */

        console.log(
            "[Universe] CREATING PARTICLE SYSTEM"
        );


        try {

            this.particleSystem =
                new ParticleSystem(
                    this.THREE,
                    nebula
                );

        } catch (error) {

            console.error(
                "[Universe] PARTICLE SYSTEM ERROR:",
                error
            );

            this.particleSystem =
                null;

            this.showError(
                error
            );

            return;
        }


        if (
            !this.particleSystem ||
            !this.particleSystem.points
        ) {

            const error =
                new Error(
                    "ParticleSystem created without points."
                );

            this.showError(
                error
            );

            return;
        }


        /*
         * =================================================
         * ADD PARTICLES
         * =================================================
         */

        this.scene.add(
            this.particleSystem.points
        );


        console.log(
            "[Universe] PARTICLES ADDED:",
            nebula.count
        );


        /*
         * =================================================
         * OBSERVATION TRANSFORM
         * =================================================
         */

        if (
            nebula.observation
        ) {

            const observation =
                nebula.observation;


            if (
                this.particleSystem.points
                    .rotation
            ) {

                this.particleSystem.points
                    .rotation.set(

                        observation.pitch || 0,

                        observation.yaw || 0,

                        observation.roll || 0
                    );
            }


            if (
                observation.position &&
                this.particleSystem.points
                    .position
            ) {

                this.particleSystem.points
                    .position.copy(
                        observation.position
                    );
            }


            if (
                Number.isFinite(
                    observation.scale
                )
            ) {

                this.particleSystem.points
                    .scale.setScalar(
                        observation.scale
                    );
            }


            /*
             * Camera distance.
             *
             * Do NOT force the camera
             * orientation here.
             *
             * The hidden target belongs
             * to the observation system.
             */

            if (
                Number.isFinite(
                    observation.distance
                ) &&
                this.camera &&
                this.camera.camera
            ) {

                /*
                 * Only establish the initial
                 * viewing distance for the
                 * first generated nebula.
                 */

                if (
                    !this.camera.__particleUniverseInitialised
                ) {

                    this.camera.camera
                        .position.z =
                        observation.distance;

                    this.camera
                        .__particleUniverseInitialised =
                        true;
                }
            }
        }


        /*
         * =================================================
         * SUMMONING
         * =================================================
         */

        nebula.state =
            "SUMMONING";


        setPhase(
            "SUMMONING"
        );


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


                    console.log(
                        "[Universe] NEBULA STABLE"
                    );

                },
                this.summonDuration
            );


        console.log(
            "[Universe] NEBULA READY:",
            nebula.count,
            "PARTICLES"
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
         * Background.
         */

        if (
            this.stars
        ) {

            this.stars.rotation.y +=
                dt * 0.003;
        }


        if (
            this.dust
        ) {

            this.dust.rotation.y -=
                dt * 0.0015;
        }


        /*
         * Particle system.
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
         * STABLE NEBULA MOTION
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


        console.log(
            "[Universe] SHUFFLE START"
        );


        try {

            await shuffleParticles(
                this.particleSystem,
                CONFIG.OBSERVATION
                    .SHUFFLE_TIME
            );


            /*
             * Shuffle changes the
             * arrangement, but NOT
             * the image source.
             */

            this.nebula.state =
                "STABLE";


            setPhase(
                "EXPLORATION"
            );


            console.log(
                "[Universe] SHUFFLE COMPLETE"
            );

        } catch (error) {

            console.error(
                "[Universe] SHUFFLE ERROR:",
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
     * COMPLETE OBSERVATION
     * =====================================================
     */

    async completeObservation() {

        if (
            !this.particleSystem
        ) {

            console.warn(
                "[Universe] OBSERVATION WITHOUT PARTICLES"
            );

            return;
        }


        if (
            STATE.observationComplete
        ) {

            return;
        }


        STATE.observationComplete =
            true;


        console.log(
            "[Universe] OBSERVATION COMPLETE"
        );


        try {

            await runObservationEvent(
                this.camera.camera,
                this.particleSystem
            );

        } catch (error) {

            console.error(
                "[Universe] OBSERVATION EVENT ERROR:",
                error
            );

            STATE.observationComplete =
                false;
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


    /*
     * =====================================================
     * ERROR
     * =====================================================
     */

    showError(
        error
    ) {

        const message =
            error?.message ||
            String(error);


        console.error(
            "[Universe ERROR]",
            message
        );


        let box =
            document.getElementById(
                "universeError"
            );


        if (!box) {

            box =
                document.createElement(
                    "div"
                );

            box.id =
                "universeError";

            box.style.position =
                "fixed";

            box.style.left =
                "10px";

            box.style.right =
                "10px";

            box.style.bottom =
                "10px";

            box.style.zIndex =
                "999999";

            box.style.padding =
                "14px";

            box.style.background =
                "rgba(120,0,0,0.92)";

            box.style.color =
                "#ffffff";

            box.style.fontFamily =
                "monospace";

            box.style.fontSize =
                "13px";

            box.style.lineHeight =
                "1.5";

            box.style.whiteSpace =
                "pre-wrap";

            box.style.pointerEvents =
                "none";

            document.body.appendChild(
                box
            );
        }


        box.textContent =
            "[UNIVERSE ERROR]\n" +
            message;
    }
}