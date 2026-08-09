/*
 * =========================================================
 * PARTICLE UNIVERSE
 * FULL RUNTIME
 *
 * Universe
 *
 * 負責：
 *
 * 1. 建立背景宇宙
 * 2. 生成 Nebula
 * 3. 建立 ParticleSystem
 * 4. 管理 Nebula Cycle
 * 5. 建立 Observation Observer
 * 6. 執行 Observation Event
 * 7. Shuffle
 * 8. Runtime Update
 *
 * Observation 架構：
 *
 * similarity.js
 *      ↓
 * ObservationDetector
 *      ↓
 * Observer
 *      ↓
 * Universe.completeObservation()
 *      ↓
 * Observation Event
 *
 * Universe 不負責：
 *
 * - 計算 Similarity
 * - 計算 Observation Score
 * - HOLD Timer
 * - Target 判定
 *
 * 這些交給 Observation 系統。
 * =========================================================
 */


/*
 * =========================================================
 * IMPORTS
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
    Observer
} from "../observation/observer.js";


import {
    shuffleParticles
} from "../particles/particle-shuffle.js";


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

        console.log(
            "[Universe] CONSTRUCTOR"
        );


        /*
         * =================================================
         * CORE REFERENCES
         * =================================================
         */

        this.THREE =
            THREE;


        this.scene =
            scene;


        this.camera =
            cameraController;


        /*
         * =================================================
         * RUNTIME OBJECTS
         * =================================================
         */

        this.particleSystem =
            null;


        this.nebula =
            null;


        this.stars =
            null;


        this.dust =
            null;


        /*
         * =================================================
         * CYCLE
         * =================================================
         */

        this.cycleId =
            0;


        this.summonTimer =
            null;


        this.summonDuration =
            6500;


        /*
         * =================================================
         * OBSERVATION
         * =================================================
         */

        this.observer =
            null;


        this.observationEventRunning =
            false;


        /*
         * =================================================
         * RUNTIME
         * =================================================
         */

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
         * OBSERVER
         * =================================================
         *
         * Observer is created ONCE.
         *
         * It receives the current nebula through
         * nebulaProvider().
         *
         * Observer itself does not own the nebula.
         */

        try {

            console.log(
                "[Universe] CREATING OBSERVER"
            );


            this.observer =
                new Observer(
                    this.THREE,
                    this.camera,
                    () => {

                        return this.nebula;

                    },
                    this
                );


            console.log(
                "[Universe] OBSERVER CREATED"
            );

        } catch (error) {

            console.error(
                "[Universe] OBSERVER ERROR:",
                error
            );


            this.observer =
                null;


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


        /*
         * =================================================
         * NEW CYCLE ID
         * =================================================
         */

        const currentCycle =
            ++this.cycleId;


        /*
         * =================================================
         * CANCEL OLD SUMMON TIMER
         * =================================================
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
         * RESET OBSERVATION RUNTIME
         * =================================================
         */

        this.observationEventRunning =
            false;


        if (
            this.observer
        ) {

            this.observer.reset();

        }


        /*
         * Do NOT manually clear
         * observationComplete here before
         * Observer reset.
         *
         * Observer owns observation state reset.
         */


        STATE.observationEvent =
            false;


        STATE.observationLocked =
            false;


        STATE.controlsLocked =
            false;


        STATE.observationStarted =
            false;


        STATE.observationComplete =
            false;


        STATE.observationProgress =
            0;


        /*
         * =================================================
         * PHASE
         * =================================================
         */

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
         * Nebula generator supports
         * procedural fallback.
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


        /*
         * =================================================
         * OLD CYCLE PROTECTION
         * =================================================
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


        /*
         * =================================================
         * VALIDATION
         * =================================================
         */

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
         * INITIAL NEBULA STATE
         * =================================================
         */

        this.nebula.state =
            "SUMMONING";


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


        /*
         * =================================================
         * PARTICLE VALIDATION
         * =================================================
         */

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
         * OBSERVATION TARGET
         * =================================================
         *
         * IMPORTANT:
         *
         * observation is a TARGET.
         *
         * It must NOT automatically transform
         * the particle system into the answer.
         *
         * Otherwise the hidden image would already
         * be aligned when the nebula appears.
         *
         * Therefore:
         *
         * observation.rotation
         * observation.position
         * observation.scale
         *
         * are NOT directly applied here.
         */


        if (
            nebula.observation
        ) {

            console.log(
                "[Universe] OBSERVATION TARGET READY"
            );


            /*
             * Optional initial camera distance.
             *
             * This is only used if the camera has
             * never been initialized by Particle Universe.
             *
             * It does NOT set camera rotation.
             */

            const observation =
                nebula.observation;


            if (
                Number.isFinite(
                    Number(
                        observation.distance
                    )
                ) &&
                this.camera &&
                this.camera.camera
            ) {

                if (
                    !this.camera
                        .__particleUniverseInitialised
                ) {

                    this.camera.camera
                        .position.z =
                        Number(
                            observation.distance
                        );


                    this.camera
                        .__particleUniverseInitialised =
                        true;


                    console.log(
                        "[Universe] INITIAL CAMERA DISTANCE:",
                        observation.distance
                    );
                }
            }
        }


        /*
         * =================================================
         * ATTACH OBSERVER TO NEW NEBULA
         * =================================================
         */

        if (
            this.observer
        ) {

            try {

                this.observer.detector
                    .attach(
                        nebula
                    );


                console.log(
                    "[Universe] OBSERVER ATTACHED"
                );

            } catch (error) {

                console.error(
                    "[Universe] OBSERVER ATTACH ERROR:",
                    error
                );

            }
        }


        /*
         * =================================================
         * SUMMONING
         * =================================================
         */

        setPhase(
            "SUMMONING"
        );


        this.summonTimer =
            setTimeout(
                () => {

                    /*
                     * -------------------------------------
                     * OLD CYCLE
                     * -------------------------------------
                     */

                    if (
                        currentCycle !==
                        this.cycleId
                    ) {

                        return;
                    }


                    /*
                     * -------------------------------------
                     * OLD NEBULA
                     * -------------------------------------
                     */

                    if (
                        this.nebula !==
                        nebula
                    ) {

                        return;
                    }


                    /*
                     * -------------------------------------
                     * STABLE
                     * -------------------------------------
                     */

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
         * =================================================
         * BACKGROUND
         * =================================================
         */

        if (
            this.stars
        ) {

            this.stars.rotation.y +=
                dt *
                0.003;
        }


        if (
            this.dust
        ) {

            this.dust.rotation.y -=
                dt *
                0.0015;
        }


        /*
         * =================================================
         * PARTICLE SYSTEM
         * =================================================
         */

        if (
            this.particleSystem
        ) {

            this.particleSystem.update(
                time,
                dt
            );
        }


        /*
         * =================================================
         * NO NEBULA
         * =================================================
         */

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
         *
         * Do not apply normal nebula rotation while
         * observation event is running.
         *
         * Observation Event owns the particle geometry
         * during:
         *
         * COLLAPSING
         * SINGULARITY
         * EXPLOSION
         */

        if (
            this.nebula.state ===
            "STABLE" &&

            !STATE.observationEvent &&
            !STATE.observationLocked
        ) {

            switch (
                this.nebula.rotationMode
            ) {

                case "ROTATE":

                    this.particleSystem
                        .points
                        .rotation.y +=
                        dt *
                        0.015;

                    break;


                case "FLIP":

                    this.particleSystem
                        .points
                        .rotation.x +=
                        Math.sin(
                            time *
                            0.0001
                        ) *
                        dt *
                        0.01;

                    break;


                case "DEFORM":

                    this.particleSystem
                        .points
                        .rotation.z +=
                        dt *
                        0.008;

                    break;


                case "STOP":

                    break;
            }
        }


        /*
         * =================================================
         * OBSERVER
         * =================================================
         *
         * Observer owns:
         *
         * - observation timer
         * - similarity validation
         * - hold timer
         * - timeout
         *
         * Universe only provides runtime integration.
         */

        if (
            this.observer &&
            this.nebula.state ===
                "STABLE"
        ) {

            try {

                this.observer.update();

            } catch (error) {

                console.error(
                    "[Universe] OBSERVER UPDATE ERROR:",
                    error
                );

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


        /*
         * Do not shuffle during observation event.
         */

        if (
            STATE.observationEvent ||
            STATE.observationLocked
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
             * Shuffle changes arrangement,
             * but does not change image source.
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
     *
     * Observer calls this method AFTER:
     *
     * similarity valid
     *       ↓
     * HOLD complete
     *
     * Universe then starts the actual event.
     */

    async completeObservation() {

        /*
         * =================================================
         * VALIDATION
         * =================================================
         */

        if (
            !this.particleSystem
        ) {

            console.warn(
                "[Universe] OBSERVATION WITHOUT PARTICLES"
            );


            return;
        }


        /*
         * =================================================
         * DUPLICATE EVENT PROTECTION
         * =================================================
         *
         * DO NOT use STATE.observationComplete here.
         *
         * observationComplete means:
         *
         * "the observer successfully completed"
         *
         * observationEventRunning means:
         *
         * "the event animation is currently playing"
         *
         * They are different states.
         */

        if (
            this.observationEventRunning
        ) {

            console.warn(
                "[Universe] OBSERVATION EVENT ALREADY RUNNING"
            );


            return;
        }


        /*
         * =================================================
         * EVENT LOCK
         * =================================================
         */

        this.observationEventRunning =
            true;


        console.log(
            "[Universe] OBSERVATION EVENT START"
        );


        try {

            /*
             * ---------------------------------------------
             * Particle state
             * ---------------------------------------------
             */

            if (
                this.nebula
            ) {

                this.nebula.state =
                    "OBSERVATION_EVENT";
            }


            /*
             * ---------------------------------------------
             * Run event
             * ---------------------------------------------
             */

            await runObservationEvent(
                this.camera?.camera ||
                this.camera,
                this.particleSystem
            );


            console.log(
                "[Universe] OBSERVATION EVENT FINISHED"
            );


            /*
             * ---------------------------------------------
             * Event completed.
             *
             * The event itself returns the universe
             * to EXPLORATION.
             * ---------------------------------------------
             */

            if (
                this.nebula
            ) {

                this.nebula.state =
                    "STABLE";
            }


        } catch (error) {

            console.error(
                "[Universe] OBSERVATION EVENT ERROR:",
                error
            );


            /*
             * =================================================
             * EMERGENCY STATE RECOVERY
             * =================================================
             */

            if (
                this.nebula
            ) {

                this.nebula.state =
                    "STABLE";
            }


            setPhase(
                "EXPLORATION"
            );


        } finally {

            /*
             * =================================================
             * EVENT LOCK RELEASE
             * =================================================
             */

            this.observationEventRunning =
                false;


            /*
             * Observer must be reset after
             * the event has completely finished.
             *
             * Otherwise the old successful target
             * could immediately trigger another event.
             */

            if (
                this.observer
            ) {

                this.observer.reset();


                /*
                 * Re-attach current nebula.
                 */

                if (
                    this.nebula
                ) {

                    try {

                        this.observer.detector
                            .attach(
                                this.nebula
                            );

                    } catch (error) {

                        console.warn(
                            "[Universe] OBSERVER REATTACH ERROR:",
                            error
                        );

                    }
                }
            }


            /*
             * Reset observation completion state
             * so the next observation can happen.
             */

            STATE.observationComplete =
                false;


            STATE.observationProgress =
                0;


            STATE.observationStarted =
                false;


            console.log(
                "[Universe] OBSERVATION RUNTIME RESET"
            );
        }
    }


    /*
     * =====================================================
     * GET OBSERVATION STATE
     * =====================================================
     *
     * Useful for debugging / UI.
     */

    getObservationState() {

        return {

            eventRunning:
                this.observationEventRunning,

            observer:
                this.observer
                    ? this.observer
                        .getDebugState()
                    : null,

            nebula:
                this.nebula
                    ? {

                        state:
                            this.nebula.state,

                        score:
                            this.nebula
                                .observationScore,

                        hold:
                            this.nebula
                                .observationHold

                    }
                    : null
        };
    }


    /*
     * =====================================================
     * DISPOSE PARTICLE SYSTEM
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
            String(
                error
            );


        console.error(
            "[Universe ERROR]",
            message
        );


        /*
         * Browser guard.
         */

        if (
            typeof document ===
            "undefined"
        ) {

            return;
        }


        let box =
            document.getElementById(
                "universeError"
            );


        if (
            !box
        ) {

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