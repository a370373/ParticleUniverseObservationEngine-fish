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


/*
 * =========================================================
 * VISUAL DIAGNOSTIC
 * =========================================================
 */

function debug(message) {

    let box =
        document.getElementById(
            "universeDebug"
        );

    if (!box) {

        box =
            document.createElement("div");

        box.id =
            "universeDebug";

        box.style.position =
            "fixed";

        box.style.left =
            "10px";

        box.style.bottom =
            "10px";

        box.style.zIndex =
            "999998";

        box.style.padding =
            "12px";

        box.style.background =
            "rgba(0,0,0,0.88)";

        box.style.color =
            "#00ff88";

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

        box.style.maxWidth =
            "calc(100vw - 20px)";

        box.style.maxHeight =
            "45vh";

        box.style.overflow =
            "hidden";

        document.body.appendChild(
            box
        );
    }

    box.textContent +=
        "[UNIVERSE] " +
        message +
        "\n";

    console.log(
        "[UNIVERSE]",
        message
    );
}


/*
 * =========================================================
 * UNIVERSE
 * =========================================================
 */

export class Universe {

    constructor(
        THREE,
        scene,
        cameraController
    ) {

        debug(
            "CONSTRUCTOR START"
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


        this.cycleId =
            0;


        this.summonTimer =
            null;


        /*
         * =================================================
         * BACKGROUND STARS
         * =================================================
         */

        try {

            this.stars =
                createStars(
                    THREE,
                    CONFIG.PARTICLES.STARS
                );

            scene.add(
                this.stars
            );

            debug(
                "STARS ADDED"
            );

        } catch (error) {

            debug(
                "STARS ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );

            this.stars =
                null;
        }


        /*
         * =================================================
         * BACKGROUND DUST
         * =================================================
         */

        try {

            this.dust =
                createDust(
                    THREE,
                    CONFIG.PARTICLES.DUST
                );

            scene.add(
                this.dust
            );

            debug(
                "DUST ADDED"
            );

        } catch (error) {

            debug(
                "DUST ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );

            this.dust =
                null;
        }


        /*
         * =================================================
         * FIRST CYCLE
         * =================================================
         */

        debug(
            "STARTING FIRST CYCLE"
        );

        this.startNewCycle();

        debug(
            "CONSTRUCTOR COMPLETE"
        );
    }


    /*
     * =====================================================
     * START NEW NEBULA
     * =====================================================
     */

    async startNewCycle() {

        const currentCycle =
            ++this.cycleId;


        debug(
            "NEW CYCLE #" +
            currentCycle
        );


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
         * IMAGE
         * =================================================
         */

        let source;

        try {

            source =
                getRandomImage();

        } catch (error) {

            debug(
                "IMAGE LIBRARY ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );

            return;
        }


        if (!source) {

            debug(
                "NO IMAGE SOURCE"
            );

            setPhase(
                "EXPLORATION"
            );

            return;
        }


        debug(
            "IMAGE SOURCE FOUND"
        );


        /*
         * Do not print the Base64 itself.
         */

        if (
            typeof source === "string"
        ) {

            debug(
                "IMAGE SOURCE LENGTH: " +
                source.length
            );

            debug(
                "IMAGE SOURCE TYPE: " +
                source.substring(
                    0,
                    30
                )
            );
        }


        setPhase(
            "SUMMONING"
        );


        /*
         * =================================================
         * GENERATE NEBULA
         * =================================================
         */

        let nebula;

        debug(
            "GENERATING NEBULA..."
        );

        try {

            nebula =
                await generateNebula(
                    this.THREE,
                    source
                );

        } catch (error) {

            debug(
                "NEBULA GENERATION ERROR"
            );

            debug(
                error?.message ||
                String(error)
            );

            console.error(
                "[Universe] Nebula generation failed:",
                error
            );

            return;
        }


        /*
         * =================================================
         * VERIFY NEBULA
         * =================================================
         */

        if (!nebula) {

            debug(
                "ERROR: NEBULA IS NULL"
            );

            return;
        }


        debug(
            "NEBULA READY"
        );


        debug(
            "PARTICLE COUNT: " +
            (
                nebula.count ??
                "UNKNOWN"
            )
        );


        /*
         * Prevent old asynchronous cycles
         * from replacing newer ones.
         */

        if (
            currentCycle !==
            this.cycleId
        ) {

            debug(
                "OLD CYCLE DISCARDED"
            );

            return;
        }


        this.nebula =
            nebula;


        /*
         * =================================================
         * DELETE OLD PARTICLES
         * =================================================
         */

        debug(
            "DISPOSING OLD PARTICLES"
        );

        this.disposeParticleSystem();


        /*
         * =================================================
         * CREATE PARTICLE SYSTEM
         * =================================================
         */

        debug(
            "CREATING PARTICLE SYSTEM..."
        );

        try {

            this.particleSystem =
                new ParticleSystem(
                    this.THREE,
                    nebula
                );

        } catch (error) {

            debug(
                "PARTICLE SYSTEM ERROR"
            );

            debug(
                error?.message ||
                String(error)
            );

            console.error(
                "[Universe] ParticleSystem creation failed:",
                error
            );

            this.particleSystem =
                null;

            throw error;
        }


        if (
            !this.particleSystem
        ) {

            debug(
                "ERROR: PARTICLE SYSTEM NULL"
            );

            return;
        }


        debug(
            "PARTICLE SYSTEM READY"
        );


        /*
         * =================================================
         * ADD TO SCENE
         * =================================================
         */

        if (
            !this.particleSystem.points
        ) {

            debug(
                "ERROR: PARTICLE POINTS MISSING"
            );

            return;
        }


        this.scene.add(
            this.particleSystem.points
        );


        debug(
            "PARTICLES ADDED TO SCENE"
        );


        /*
         * =================================================
         * HIDDEN OBSERVATION ORIENTATION
         * =================================================
         */

        try {

            this.particleSystem
                .points
                .rotation.set(

                    nebula.observation.pitch,

                    nebula.observation.yaw,

                    nebula.observation.roll
                );

        } catch (error) {

            debug(
                "ROTATION ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }


        /*
         * =================================================
         * WORLD POSITION
         * =================================================
         */

        try {

            this.particleSystem
                .points
                .position.copy(
                    nebula.observation.position
                );

        } catch (error) {

            debug(
                "POSITION ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }


        /*
         * =================================================
         * SCALE
         * =================================================
         */

        try {

            this.particleSystem
                .points
                .scale.setScalar(
                    nebula.observation.scale
                );

        } catch (error) {

            debug(
                "SCALE ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }


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


                    debug(
                        "SUMMONING COMPLETE"
                    );

                },
                this.summonDuration
            );


        /*
         * =================================================
         * SUCCESS
         * =================================================
         */

        debug(
            "UNIVERSE PARTICLES ONLINE"
        );

        debug(
            "SCENE CHILDREN: " +
            this.scene.children.length
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
         * Stars
         */

        if (
            this.stars &&
            this.stars.rotation
        ) {

            this.stars.rotation.y +=
                dt * 0.003;
        }


        /*
         * Dust
         */

        if (
            this.dust &&
            this.dust.rotation
        ) {

            this.dust.rotation.y -=
                dt * 0.0015;
        }


        /*
         * Main particles
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