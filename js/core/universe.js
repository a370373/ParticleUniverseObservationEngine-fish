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

            console.log(
                "[Universe] DUST CREATED"
            );


            scene.add(
                this.stars
            );

            scene.add(
                this.dust
            );

            console.log(
                "[Universe] BACKGROUND ADDED"
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
         * FIRST NEBULA
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
                "[Universe] IMAGE LIBRARY ERROR:",
                error
            );

            this.showError(
                error
            );

            return;
        }


        if (
            !source
        ) {

            console.error(
                "[Universe] NO IMAGE"
            );

            this.showError(
                new Error(
                    "getRandomImage() returned nothing."
                )
            );

            return;
        }


        console.log(
            "[Universe] IMAGE FOUND"
        );


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


        this.nebula =
            nebula;


        /*
         * =================================================
         * REMOVE OLD PARTICLES
         * =================================================
         */

        this.disposeParticleSystem();


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

            this.showError(
                error
            );

            this.particleSystem =
                null;

            return;
        }


        if (
            !this.particleSystem ||
            !this.particleSystem.points
        ) {

            this.showError(
                new Error(
                    "ParticleSystem created without points."
                )
            );

            return;
        }


        this.scene.add(
            this.particleSystem.points
        );


        console.log(
            "[Universe] PARTICLES ADDED"
        );


        /*
         * =================================================
         * ORIENTATION
         * =================================================
         */

        if (
            nebula.observation
        ) {

            const observation =
                nebula.observation;


            this.particleSystem
                .points
                .rotation.set(

                    observation.pitch || 0,
                    observation.yaw || 0,
                    observation.roll || 0
                );


            if (
                observation.position
            ) {

                this.particleSystem
                    .points
                    .position.copy(
                        observation.position
                    );
            }


            if (
                Number.isFinite(
                    observation.scale
                )
            ) {

                this.particleSystem
                    .points
                    .scale.setScalar(
                        observation.scale
                    );
            }


            if (
                Number.isFinite(
                    observation.distance
                ) &&
                this.camera &&
                this.camera.camera
            ) {

                this.camera.camera.position.z =
                    observation.distance;
            }
        }


        /*
         * =================================================
         * SUMMONING
         * =================================================
         */

        nebula.state =
            "SUMMONING";


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


            this.nebula.state =
                "STABLE";


            setPhase(
                "EXPLORATION"
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
                "[Universe] OBSERVATION ERROR:",
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