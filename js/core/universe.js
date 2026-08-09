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


            this.scene.add(
                this.stars
            );


            this.scene.add(
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
         * Cancel previous timer.
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
         * =================================================
         * PHASE
         * =================================================
         */

        setPhase(
            "SUMMONING"
        );


        console.log(
            "[Universe] PHASE: SUMMONING"
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

            const error =
                new Error(
                    "getRandomImage() returned nothing."
                );


            console.error(
                "[Universe] NO IMAGE"
            );


            this.showError(
                error
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


            setPhase(
                "EXPLORATION"
            );


            return;
        }


        console.log(
            "[Universe] NEBULA GENERATED"
        );


        /*
         * Ignore old cycle.
         */

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

            const error =
                new Error(
                    "generateNebula() returned null."
                );


            this.showError(
                error
            );


            return;
        }


        this.nebula =
            nebula;


        /*
         * =================================================
         * OLD PARTICLES
         * =================================================
         */

        console.log(
            "[Universe] DISPOSING OLD PARTICLES"
        );


        this.disposeParticleSystem();


        /*
         * =================================================
         * PARTICLE SYSTEM
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

            const error =
                new Error(
                    "ParticleSystem created without points."
                );


            this.showError(
                error
            );


            this.particleSystem =
                null;


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
         * OBSERVATION ORIENTATION
         * =================================================
         */

        if (
            nebula.observation
        ) {

            const observation =
                nebula.observation;


            console.log(
                "[Universe] APPLYING OBSERVATION"
            );


            this.particleSystem
                .points
                .rotation.set(

                    Number.isFinite(
                        observation.pitch
                    )
                        ? observation.pitch
                        : 0,

                    Number.isFinite(
                        observation.yaw
                    )
                        ? observation.yaw
                        : 0,

                    Number.isFinite(
                        observation.roll
                    )
                        ? observation.roll
                        : 0
                );


            if (
                observation.position
            ) {

                try {

                    this.particleSystem
                        .points
                        .position.copy(
                            observation.position
                        );

                } catch (error) {

                    console.warn(
                        "[Universe] POSITION APPLY ERROR:",
                        error
                    );
                }
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


                console.log(
                    "[Universe] CAMERA DISTANCE:",
                    observation.distance
                );
            }
        }


        /*
         * =================================================
         * SUMMONING
         * =================================================
         */

        nebula.state =
            "SUMMONING";


        console.log(
            "[Universe] NEBULA STATE: SUMMONING"
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


                    console.log(
                        "[Universe] PHASE: EXPLORATION"
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
         * =================================================
         * STARS
         * =================================================
         */

        if (
            this.stars &&
            this.stars.rotation
        ) {

            this.stars.rotation.y +=
                dt * 0.003;
        }


        /*
         * =================================================
         * DUST
         * =================================================
         */

        if (
            this.dust &&
            this.dust.rotation
        ) {

            this.dust.rotation.y -=
                dt * 0.0015;
        }


        /*
         * =================================================
         * PARTICLES
         * =================================================
         */

        if (
            this.particleSystem
        ) {

            try {

                this.particleSystem.update(
                    time,
                    dt
                );

            } catch (error) {

                console.error(
                    "[Universe] PARTICLE UPDATE ERROR:",
                    error
                );
            }
        }


        /*
         * No nebula yet.
         */

        if (
            !this.nebula ||
            !this.particleSystem
        ) {

            return;
        }


        /*
         * =================================================
         * NATURAL ROTATION
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

        console.log(
            "[Universe] SHUFFLE REQUEST"
        );


        if (
            !this.particleSystem ||
            !this.nebula ||
            STATE.shuffle
        ) {

            console.log(
                "[Universe] SHUFFLE IGNORED"
            );

            return;
        }


        STATE.shuffle =
            true;


        setPhase(
            "PARTICLE_SHUFFLE"
        );


        console.log(
            "[Universe] PHASE: PARTICLE_SHUFFLE"
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

        console.log(
            "[Universe] COMPLETE OBSERVATION"
        );


        if (
            !this.particleSystem
        ) {

            console.warn(
                "[Universe] NO PARTICLE SYSTEM"
            );

            return;
        }


        if (
            STATE.observationComplete
        ) {

            console.log(
                "[Universe] OBSERVATION ALREADY COMPLETE"
            );

            return;
        }


        STATE.observationComplete =
            true;


        try {

            await runObservationEvent(
                this.camera,
                this.particleSystem
            );


            console.log(
                "[Universe] OBSERVATION EVENT COMPLETE"
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


        console.log(
            "[Universe] DISPOSING PARTICLE SYSTEM"
        );


        try {

            this.scene.remove(
                this.particleSystem.points
            );

        } catch (error) {

            console.warn(
                "[Universe] REMOVE PARTICLES ERROR:",
                error
            );
        }


        try {

            this.particleSystem.dispose();

        } catch (error) {

            console.warn(
                "[Universe] PARTICLE DISPOSE ERROR:",
                error
            );


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
     * ERROR DISPLAY
     * =====================================================
     */

    showError(
        error
    ) {

        const message =
            error?.stack ||
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