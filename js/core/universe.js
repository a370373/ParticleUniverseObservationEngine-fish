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
 * 6. 接收 Observation Complete
 * 7. 執行 Observation Event
 * 8. Shuffle
 * 9. Runtime Update
 *
 * Observation:
 *
 * similarity.js
 *      ↓
 * ObservationDetector
 *      ↓
 * Observer
 *      ↓
 * Observer.update() => completed
 *      ↓
 * Universe.completeObservation()
 *      ↓
 * observation-event.js
 *
 * Universe 不負責：
 *
 * - Similarity 計算
 * - HOLD Timer
 * - Target 判定
 * - Observation 判定
 *
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
         * CORE
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


            if (
                this.stars
            ) {

                this.scene.add(
                    this.stars
                );
            }


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


            if (
                this.dust
            ) {

                this.scene.add(
                    this.dust
                );
            }


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
         * Observer is created once.
         *
         * Universe provides the current Nebula
         * through a provider callback.
         * =================================================
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

                    }
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


            console.warn(
                "[Universe] OBSERVER DISABLED"
            );
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

            return false;
        }


        /*
         * =================================================
         * NEW CYCLE
         * =================================================
         */

        const currentCycle =
            ++this.cycleId;


        /*
         * =================================================
         * CANCEL OLD TIMER
         * =================================================
         */

        this.clearSummonTimer();


        /*
         * =================================================
         * RESET EVENT
         * =================================================
         *
         * IMPORTANT:
         *
         * A new cycle invalidates the previous observation
         * event state.
         * =================================================
         */

        this.observationEventRunning =
            false;


        /*
         * =================================================
         * RESET OBSERVER
         * =================================================
         */

        if (
            this.observer &&
            typeof this.observer.reset ===
                "function"
        ) {

            try {

                this.observer.reset();

            } catch (error) {

                console.warn(
                    "[Universe] OBSERVER RESET ERROR:",
                    error
                );
            }
        }


        /*
         * =================================================
         * RESET GLOBAL STATE
         * =================================================
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

        STATE.shuffle =
            false;

        STATE.explosion =
            false;

        STATE.activeNebula =
            null;


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

        let source =
            null;


        try {

            source =
                getRandomImage();

        } catch (error) {

            console.error(
                "[Universe] IMAGE ERROR:",
                error
            );


            setPhase(
                "ERROR"
            );


            this.showError(
                error
            );


            return false;
        }


        if (
            source
        ) {

            console.log(
                "[Universe] IMAGE FOUND"
            );

        } else {

            console.warn(
                "[Universe] NO IMAGE - PROCEDURAL FALLBACK"
            );
        }


        /*
         * =================================================
         * GENERATE NEBULA
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
                "[Universe] NEBULA ERROR:",
                error
            );


            if (
                currentCycle ===
                this.cycleId
            ) {

                setPhase(
                    "ERROR"
                );


                this.showError(
                    error
                );
            }


            return false;
        }


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


            return false;
        }


        /*
         * =================================================
         * VALIDATION
         * =================================================
         */

        if (
            !nebula
        ) {

            const error =
                new Error(
                    "generateNebula() returned null."
                );


            console.error(
                "[Universe]",
                error.message
            );


            setPhase(
                "ERROR"
            );


            this.showError(
                error
            );


            return false;
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


        STATE.activeNebula =
            nebula;


        /*
         * =================================================
         * INITIAL NEBULA STATE
         * =================================================
         */

        this.nebula.state =
            "SUMMONING";


        this.nebula.observationScore =
            0;

        this.nebula.observationHold =
            0;


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
                "[Universe] PARTICLE SYSTEM ERROR:",
                error
            );


            this.particleSystem =
                null;


            setPhase(
                "ERROR"
            );


            this.showError(
                error
            );


            return false;
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


            console.error(
                "[Universe]",
                error.message
            );


            this.particleSystem =
                null;


            setPhase(
                "ERROR"
            );


            this.showError(
                error
            );


            return false;
        }


        /*
         * =================================================
         * ADD PARTICLES
         * =================================================
         */

        try {

            this.scene.add(
                this.particleSystem.points
            );

        } catch (error) {

            console.error(
                "[Universe] PARTICLE ADD ERROR:",
                error
            );


            this.disposeParticleSystem();


            setPhase(
                "ERROR"
            );


            this.showError(
                error
            );


            return false;
        }


        console.log(
            "[Universe] PARTICLES ADDED:",
            nebula.count
        );


        /*
         * =================================================
         * CAMERA
         * =================================================
         */

        this.initializeCameraDistance(
            nebula
        );


        /*
         * =================================================
         * OBSERVER
         * =================================================
         */

        this.attachObserver(
            nebula
        );


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
                     * OLD CYCLE PROTECTION
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
                     * OLD NEBULA PROTECTION
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
                     * EVENT PROTECTION
                     * -------------------------------------
                     */

                    if (
                        this.observationEventRunning
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


        return true;
    }


    /*
     * =====================================================
     * INITIAL CAMERA DISTANCE
     * =====================================================
     */

    initializeCameraDistance(
        nebula
    ) {

        const observation =
            nebula?.observation;


        const targetDistance =
            Number(
                observation?.distance
            );


        if (
            !Number.isFinite(
                targetDistance
            )
        ) {

            return;
        }


        const cameraObject =
            this.camera?.camera ||
            this.camera;


        if (
            !cameraObject ||
            !cameraObject.position
        ) {

            return;
        }


        /*
         * Only initialize once.
         */

        if (
            this.camera &&
            this.camera
                .__particleUniverseInitialised
        ) {

            return;
        }


        const center =
            this.normalizeVector3(
                nebula?.center
            );


        /*
         * Preserve current camera direction.
         */

        let dx =
            cameraObject.position.x -
            center.x;

        let dy =
            cameraObject.position.y -
            center.y;

        let dz =
            cameraObject.position.z -
            center.z;


        const length =
            Math.sqrt(
                dx * dx +
                dy * dy +
                dz * dz
            );


        if (
            length <
            0.000001
        ) {

            dx = 0;
            dy = 0;
            dz = 1;

        } else {

            dx /=
                length;

            dy /=
                length;

            dz /=
                length;
        }


        const distance =
            Math.abs(
                targetDistance
            );


        cameraObject.position.set(

            center.x +
            dx *
            distance,

            center.y +
            dy *
            distance,

            center.z +
            dz *
            distance

        );


        if (
            this.camera
        ) {

            this.camera
                .__particleUniverseInitialised =
                true;
        }


        console.log(
            "[Universe] INITIAL CAMERA DISTANCE:",
            distance
        );
    }


    /*
     * =====================================================
     * ATTACH OBSERVER
     * =====================================================
     */

    attachObserver(
        nebula
    ) {

        if (
            !this.observer ||
            !nebula
        ) {

            return false;
        }


        try {

            /*
             * Preferred API.
             */

            if (
                typeof this.observer.attach ===
                "function"
            ) {

                const attached =
                    this.observer.attach(
                        nebula
                    );


                if (
                    attached !== false
                ) {

                    console.log(
                        "[Universe] OBSERVER ATTACHED"
                    );


                    return true;
                }
            }


            /*
             * Current compatibility path.
             */

            if (
                this.observer.detector &&
                typeof this.observer.detector.attach ===
                    "function"
            ) {

                this.observer.detector.attach(
                    nebula
                );


                console.log(
                    "[Universe] OBSERVER DETECTOR ATTACHED"
                );


                return true;
            }


            console.warn(
                "[Universe] OBSERVER HAS NO ATTACH API"
            );


            return false;

        } catch (error) {

            console.error(
                "[Universe] OBSERVER ATTACH ERROR:",
                error
            );


            return false;
        }
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
         */

        if (
            this.nebula.state ===
                "STABLE" &&

            !STATE.observationEvent &&

            !STATE.observationLocked &&

            !this.observationEventRunning
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


                default:

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
         * - Similarity
         * - HOLD
         * - Timeout
         * - Observation completion
         *
         * Universe only consumes the result.
         * =================================================
         */

        if (
            this.observer &&

            this.nebula.state ===
                "STABLE" &&

            !this.observationEventRunning &&

            !STATE.observationEvent &&

            !STATE.observationLocked
        ) {

            try {

                if (
                    typeof this.observer.update ===
                    "function"
                ) {

                    const result =
                        this.observer.update(
                            performance.now()
                        );


                    /*
                     * -----------------------------------------
                     * OBSERVATION COMPLETE
                     * -----------------------------------------
                     */

                    if (
                        result &&
                        result.completed ===
                            true &&

                        !this.observationEventRunning
                    ) {

                        console.log(
                            "[Universe] OBSERVATION COMPLETE RECEIVED"
                        );


                        /*
                         * Immediately start event.
                         */

                        this.completeObservation()
                            .catch(
                                error => {

                                    console.error(
                                        "[Universe] COMPLETE OBSERVATION ERROR:",
                                        error
                                    );

                                }
                            );
                    }
                }

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

            return false;
        }


        /*
         * Never shuffle during observation/event.
         */

        if (
            STATE.observationEvent ||
            STATE.observationLocked ||
            STATE.controlsLocked ||
            this.observationEventRunning
        ) {

            return false;
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
             * Make sure current Nebula still exists.
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


            console.log(
                "[Universe] SHUFFLE COMPLETE"
            );


            return true;

        } catch (error) {

            console.error(
                "[Universe] SHUFFLE ERROR:",
                error
            );


            if (
                this.nebula
            ) {

                this.nebula.state =
                    "STABLE";
            }


            setPhase(
                "EXPLORATION"
            );


            return false;

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

        /*
         * =================================================
         * VALIDATION
         * =================================================
         */

        if (
            !this.particleSystem ||
            !this.nebula
        ) {

            console.warn(
                "[Universe] OBSERVATION WITHOUT NEBULA"
            );


            return false;
        }


        /*
         * =================================================
         * DUPLICATE PROTECTION
         * =================================================
         */

        if (
            this.observationEventRunning
        ) {

            return false;
        }


        /*
         * =================================================
         * LOCK EVENT
         * =================================================
         */

        this.observationEventRunning =
            true;


        STATE.observationEvent =
            true;

        STATE.observationLocked =
            true;

        STATE.controlsLocked =
            true;


        setPhase(
            "OBSERVATION_EVENT"
        );


        console.log(
            "[Universe] OBSERVATION EVENT START"
        );


        try {

            /*
             * ---------------------------------------------
             * Nebula state
             * ---------------------------------------------
             */

            this.nebula.state =
                "OBSERVATION_EVENT";


            /*
             * ---------------------------------------------
             * Pause Observer
             * ---------------------------------------------
             */

            if (
                this.observer &&
                typeof this.observer.pause ===
                    "function"
            ) {

                try {

                    this.observer.pause();

                } catch (error) {

                    console.warn(
                        "[Universe] OBSERVER PAUSE ERROR:",
                        error
                    );
                }
            }


            /*
             * ---------------------------------------------
             * Stop summon timer if still alive.
             * ---------------------------------------------
             */

            this.clearSummonTimer();


            /*
             * ---------------------------------------------
             * Execute Event
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
             * Restore Nebula
             * ---------------------------------------------
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


            return true;

        } catch (error) {

            console.error(
                "[Universe] OBSERVATION EVENT ERROR:",
                error
            );


            if (
                this.nebula
            ) {

                this.nebula.state =
                    "STABLE";
            }


            setPhase(
                "EXPLORATION"
            );


            return false;

        } finally {

            /*
             * =================================================
             * RELEASE EVENT LOCK
             * =================================================
             */

            this.observationEventRunning =
                false;


            STATE.observationEvent =
                false;

            STATE.observationLocked =
                false;

            STATE.controlsLocked =
                false;


            /*
             * =================================================
             * RESET OBSERVER
             * =================================================
             */

            if (
                this.observer &&
                typeof this.observer.reset ===
                    "function"
            ) {

                try {

                    this.observer.reset();

                } catch (error) {

                    console.warn(
                        "[Universe] OBSERVER RESET ERROR:",
                        error
                    );
                }
            }


            /*
             * =================================================
             * REATTACH CURRENT NEBULA
             * =================================================
             */

            if (
                this.nebula
            ) {

                this.attachObserver(
                    this.nebula
                );
            }


            /*
             * =================================================
             * RESET OBSERVATION STATE
             * =================================================
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
     */

    getObservationState() {

        return {

            eventRunning:
                this.observationEventRunning,


            observer:
                this.observer &&
                typeof this.observer.getDebugState ===
                    "function"

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


        const particleSystem =
            this.particleSystem;


        this.particleSystem =
            null;


        try {

            if (
                particleSystem.points
            ) {

                this.scene.remove(
                    particleSystem.points
                );
            }

        } catch (error) {

            console.warn(
                "[Universe] PARTICLE REMOVE ERROR:",
                error
            );
        }


        try {

            if (
                typeof particleSystem.dispose ===
                    "function"
            ) {

                particleSystem.dispose();

            } else {

                particleSystem.geometry
                    ?.dispose();

                particleSystem.material
                    ?.dispose();
            }

        } catch (error) {

            console.warn(
                "[Universe] PARTICLE DISPOSE ERROR:",
                error
            );
        }
    }


    /*
     * =====================================================
     * CLEAR SUMMON TIMER
     * =====================================================
     */

    clearSummonTimer() {

        if (
            this.summonTimer
        ) {

            clearTimeout(
                this.summonTimer
            );


            this.summonTimer =
                null;
        }
    }


    /*
     * =====================================================
     * VECTOR
     * =====================================================
     */

    normalizeVector3(
        value
    ) {

        return {

            x:
                Number.isFinite(
                    Number(
                        value?.x
                    )
                )
                    ? Number(
                        value.x
                    )
                    : 0,

            y:
                Number.isFinite(
                    Number(
                        value?.y
                    )
                )
                    ? Number(
                        value.y
                    )
                    : 0,

            z:
                Number.isFinite(
                    Number(
                        value?.z
                    )
                )
                    ? Number(
                        value.z
                    )
                    : 0
        };
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