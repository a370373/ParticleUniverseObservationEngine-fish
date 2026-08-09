/*
 * =========================================================
 * PARTICLE UNIVERSE
 * =========================================================
 *
 * Robust Universe Controller
 *
 * Responsibilities:
 *
 * 1. Load Universe dependencies
 * 2. Create background stars / dust
 * 3. Load Base64 image
 * 4. Generate particle nebula
 * 5. Create ParticleSystem
 * 6. Handle summoning phase
 * 7. Handle exploration
 * 8. Handle shuffle
 * 9. Handle observation completion
 * 10. Safely dispose old particle systems
 *
 * =========================================================
 */

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
         * -------------------------------------------------
         * PARTICLE STATE
         * -------------------------------------------------
         */

        this.particleSystem =
            null;

        this.nebula =
            null;

        /*
         * -------------------------------------------------
         * BACKGROUND
         * -------------------------------------------------
         */

        this.stars =
            null;

        this.dust =
            null;

        /*
         * -------------------------------------------------
         * CYCLE
         * -------------------------------------------------
         */

        this.cycleId =
            0;

        this.summonTimer =
            null;

        this.summonStart =
            0;

        this.summonDuration =
            6500;

        /*
         * -------------------------------------------------
         * INITIALIZATION
         * -------------------------------------------------
         */

        this.ready =
            false;

        this.loading =
            true;

        this.failed =
            false;

        this.dependencies =
            null;

        /*
         * -------------------------------------------------
         * START INITIALIZATION
         * -------------------------------------------------
         */

        this.initialize()
            .catch(
                error => {

                    this.loading =
                        false;

                    this.failed =
                        true;

                    console.error(
                        "[Universe] INITIALIZATION FAILED:",
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
     * INITIALIZE
     * =====================================================
     */

    async initialize() {

        console.log(
            "[Universe] Initializing..."
        );


        /*
         * -------------------------------------------------
         * MODULE LOADER
         * -------------------------------------------------
         */

        const load =
            async (
                name,
                path
            ) => {

                try {

                    console.log(
                        "[Universe] Loading:",
                        name
                    );

                    const module =
                        await import(path);

                    console.log(
                        "[Universe] Loaded:",
                        name
                    );

                    return module;

                } catch (error) {

                    console.error(
                        "[Universe] Failed:",
                        name,
                        path,
                        error
                    );

                    throw new Error(
                        "[Universe] Failed to load " +
                        name +
                        " (" +
                        path +
                        "): " +
                        (
                            error?.message ||
                            String(error)
                        )
                    );
                }
            };


        /*
         * -------------------------------------------------
         * LOAD MODULES
         * -------------------------------------------------
         */

        const nebulaModule =
            await load(
                "nebula-generator",
                "../particles/nebula-generator.js"
            );


        const particleModule =
            await load(
                "particle-system",
                "../particles/particle-system.js"
            );


        const starsModule =
            await load(
                "stars",
                "../universe/stars.js"
            );


        const imageModule =
            await load(
                "image-library",
                "../media/image-library.js"
            );


        const stateModule =
            await load(
                "state",
                "./state.js"
            );


        const configModule =
            await load(
                "config",
                "../config.js"
            );


        const observationModule =
            await load(
                "observation-event",
                "../observation/observation-event.js"
            );


        const shuffleModule =
            await load(
                "particle-shuffle",
                "../particles/particle-shuffle.js"
            );


        /*
         * =================================================
         * VERIFY EXPORTS
         * =================================================
         */

        if (
            typeof nebulaModule.generateNebula !==
            "function"
        ) {

            throw new Error(
                "nebula-generator.js does not export generateNebula."
            );
        }


        if (
            typeof particleModule.ParticleSystem !==
            "function"
        ) {

            throw new Error(
                "particle-system.js does not export ParticleSystem."
            );
        }


        if (
            typeof starsModule.createStars !==
            "function"
        ) {

            throw new Error(
                "stars.js does not export createStars."
            );
        }


        if (
            typeof starsModule.createDust !==
            "function"
        ) {

            throw new Error(
                "stars.js does not export createDust."
            );
        }


        if (
            typeof imageModule.getRandomImage !==
            "function"
        ) {

            throw new Error(
                "image-library.js does not export getRandomImage."
            );
        }


        if (
            !stateModule.STATE
        ) {

            throw new Error(
                "state.js does not export STATE."
            );
        }


        if (
            typeof stateModule.setPhase !==
            "function"
        ) {

            throw new Error(
                "state.js does not export setPhase."
            );
        }


        if (
            !configModule.CONFIG
        ) {

            throw new Error(
                "config.js does not export CONFIG."
            );
        }


        if (
            typeof observationModule.runObservationEvent !==
            "function"
        ) {

            throw new Error(
                "observation-event.js does not export runObservationEvent."
            );
        }


        if (
            typeof shuffleModule.shuffleParticles !==
            "function"
        ) {

            throw new Error(
                "particle-shuffle.js does not export shuffleParticles."
            );
        }


        console.log(
            "[Universe] All dependencies verified."
        );


        /*
         * =================================================
         * STORE DEPENDENCIES
         * =================================================
         */

        this.dependencies = {

            generateNebula:
                nebulaModule.generateNebula,

            ParticleSystem:
                particleModule.ParticleSystem,

            createStars:
                starsModule.createStars,

            createDust:
                starsModule.createDust,

            getRandomImage:
                imageModule.getRandomImage,

            STATE:
                stateModule.STATE,

            setPhase:
                stateModule.setPhase,

            CONFIG:
                configModule.CONFIG,

            runObservationEvent:
                observationModule.runObservationEvent,

            shuffleParticles:
                shuffleModule.shuffleParticles
        };


        /*
         * =================================================
         * CREATE BACKGROUND
         * =================================================
         */

        this.createBackground();


        /*
         * =================================================
         * MARK READY
         * =================================================
         */

        this.loading =
            false;

        this.ready =
            true;

        this.failed =
            false;


        console.log(
            "[Universe] Universe READY."
        );


        /*
         * =================================================
         * FIRST CYCLE
         * =================================================
         */

        await this.startNewCycle();
    }


    /*
     * =====================================================
     * CREATE BACKGROUND
     * =====================================================
     */

    createBackground() {

        if (
            !this.dependencies
        ) {

            throw new Error(
                "Universe dependencies unavailable."
            );
        }


        const {
            createStars,
            createDust,
            CONFIG
        } =
            this.dependencies;


        /*
         * -------------------------------------------------
         * REMOVE OLD BACKGROUND
         * -------------------------------------------------
         */

        if (
            this.stars
        ) {

            try {

                this.scene.remove(
                    this.stars
                );

            } catch (_) {}
        }


        if (
            this.dust
        ) {

            try {

                this.scene.remove(
                    this.dust
                );

            } catch (_) {}
        }


        /*
         * -------------------------------------------------
         * STAR COUNT
         * -------------------------------------------------
         */

        const starCount =
            CONFIG?.PARTICLES?.STARS ||
            4500;


        const dustCount =
            CONFIG?.PARTICLES?.DUST ||
            1800;


        /*
         * -------------------------------------------------
         * CREATE STARS
         * -------------------------------------------------
         */

        try {

            this.stars =
                createStars(
                    this.THREE,
                    starCount
                );

            this.scene.add(
                this.stars
            );

            console.log(
                "[Universe] Stars created:",
                starCount
            );

        } catch (error) {

            console.error(
                "[Universe] Star creation failed:",
                error
            );

            this.stars =
                null;
        }


        /*
         * -------------------------------------------------
         * CREATE DUST
         * -------------------------------------------------
         */

        try {

            this.dust =
                createDust(
                    this.THREE,
                    dustCount
                );

            this.scene.add(
                this.dust
            );

            console.log(
                "[Universe] Dust created:",
                dustCount
            );

        } catch (error) {

            console.error(
                "[Universe] Dust creation failed:",
                error
            );

            this.dust =
                null;
        }


        /*
         * -------------------------------------------------
         * BACKGROUND STATUS
         * -------------------------------------------------
         */

        if (
            !this.stars &&
            !this.dust
        ) {

            console.warn(
                "[Universe] No background objects created."
            );

        } else {

            console.log(
                "[Universe] Background ONLINE."
            );
        }
    }


    /*
     * =====================================================
     * START NEW CYCLE
     * =====================================================
     */

    async startNewCycle() {

        /*
         * -------------------------------------------------
         * READY CHECK
         * -------------------------------------------------
         */

        if (
            !this.ready ||
            !this.dependencies
        ) {

            console.warn(
                "[Universe] Cycle ignored: Universe not ready."
            );

            return;
        }


        const {
            generateNebula,
            ParticleSystem,
            getRandomImage,
            setPhase
        } =
            this.dependencies;


        /*
         * -------------------------------------------------
         * NEW CYCLE ID
         * -------------------------------------------------
         */

        const currentCycle =
            ++this.cycleId;


        /*
         * -------------------------------------------------
         * CANCEL OLD TIMER
         * -------------------------------------------------
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
         * -------------------------------------------------
         * PHASE
         * -------------------------------------------------
         */

        setPhase(
            "SUMMONING"
        );


        /*
         * -------------------------------------------------
         * GET IMAGE
         * -------------------------------------------------
         */

        let source = null;


        try {

            source =
                getRandomImage();

        } catch (error) {

            console.error(
                "[Universe] Image library error:",
                error
            );
        }


        /*
         * -------------------------------------------------
         * NO IMAGE
         * -------------------------------------------------
         */

        if (
            !source
        ) {

            console.warn(
                "[Universe] No Base64 image available."
            );


            /*
             * Keep background alive.
             */

            setPhase(
                "EXPLORATION"
            );


            return;
        }


        console.log(
            "[Universe] Image source found."
        );


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
                "[Universe] Nebula generation failed:",
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


        /*
         * -------------------------------------------------
         * CHECK CYCLE
         * -------------------------------------------------
         */

        if (
            currentCycle !==
            this.cycleId
        ) {

            console.log(
                "[Universe] Ignoring obsolete cycle."
            );

            return;
        }


        if (
            !nebula
        ) {

            console.error(
                "[Universe] generateNebula returned null."
            );

            setPhase(
                "EXPLORATION"
            );

            return;
        }


        /*
         * -------------------------------------------------
         * SAVE NEBULA
         * -------------------------------------------------
         */

        this.nebula =
            nebula;


        /*
         * -------------------------------------------------
         * REMOVE OLD PARTICLES
         * -------------------------------------------------
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


            this.showError(
                error
            );


            return;
        }


        /*
         * -------------------------------------------------
         * VALIDATE POINTS
         * -------------------------------------------------
         */

        if (
            !this.particleSystem.points
        ) {

            const error =
                new Error(
                    "ParticleSystem.points is missing."
                );


            this.particleSystem =
                null;


            this.showError(
                error
            );


            return;
        }


        /*
         * -------------------------------------------------
         * ADD TO SCENE
         * -------------------------------------------------
         */

        this.scene.add(
            this.particleSystem.points
        );


        console.log(
            "[Universe] ParticleSystem added to scene."
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


            /*
             * Rotation
             */

            this.particleSystem
                .points
                .rotation.set(

                    Number(
                        observation.pitch
                    ) || 0,

                    Number(
                        observation.yaw
                    ) || 0,

                    Number(
                        observation.roll
                    ) || 0
                );


            /*
             * Position
             */

            if (
                observation.position &&
                typeof observation.position.x ===
                "number"
            ) {

                this.particleSystem
                    .points
                    .position.copy(
                        observation.position
                    );
            }


            /*
             * Scale
             */

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
        }


        /*
         * =================================================
         * CAMERA SAFETY
         * =================================================
         */

        try {

            const distance =
                nebula?.observation?.distance;


            if (
                Number.isFinite(
                    distance
                ) &&
                this.camera &&
                this.camera.camera
            ) {

                this.camera.camera.position.z =
                    distance;

                console.log(
                    "[Universe] Camera distance:",
                    distance
                );
            }

        } catch (error) {

            console.warn(
                "[Universe] Camera setup skipped:",
                error
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


        console.log(
            "[Universe] SUMMONING..."
        );


        this.summonTimer =
            setTimeout(
                () => {

                    /*
                     * Old cycle?
                     */

                    if (
                        currentCycle !==
                        this.cycleId
                    ) {

                        return;
                    }


                    /*
                     * Different nebula?
                     */

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
                        "[Universe] Nebula STABLE."
                    );

                },
                this.summonDuration
            );


        console.log(
            "[Universe] Nebula ready:",
            nebula.count || 0,
            "particles"
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
         * -------------------------------------------------
         * STARS
         * -------------------------------------------------
         */

        if (
            this.stars &&
            this.stars.rotation
        ) {

            this.stars.rotation.y +=
                dt * 0.003;
        }


        /*
         * -------------------------------------------------
         * DUST
         * -------------------------------------------------
         */

        if (
            this.dust &&
            this.dust.rotation
        ) {

            this.dust.rotation.y -=
                dt * 0.0015;
        }


        /*
         * -------------------------------------------------
         * PARTICLES
         * -------------------------------------------------
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
                    "[Universe] Particle update failed:",
                    error
                );
            }
        }


        /*
         * -------------------------------------------------
         * NO NEBULA
         * -------------------------------------------------
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


                default:

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
            !this.dependencies
        ) {

            return;
        }


        const {
            STATE,
            setPhase,
            CONFIG,
            shuffleParticles
        } =
            this.dependencies;


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


            if (
                this.nebula
            ) {

                this.nebula.state =
                    "STABLE";
            }


            setPhase(
                "EXPLORATION"
            );


        } catch (error) {

            console.error(
                "[Universe] Shuffle failed:",
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
            !this.dependencies
        ) {

            return;
        }


        const {
            STATE,
            runObservationEvent
        } =
            this.dependencies;


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


        /*
         * -------------------------------------------------
         * REMOVE FROM SCENE
         * -------------------------------------------------
         */

        try {

            if (
                this.particleSystem.points
            ) {

                this.scene.remove(
                    this.particleSystem.points
                );
            }

        } catch (_) {}


        /*
         * -------------------------------------------------
         * DISPOSE
         * -------------------------------------------------
         */

        try {

            if (
                typeof this.particleSystem.dispose ===
                "function"
            ) {

                this.particleSystem.dispose();

            } else {

                this.particleSystem.geometry
                    ?.dispose();

                this.particleSystem.material
                    ?.dispose();
            }

        } catch (error) {

            console.warn(
                "[Universe] Particle dispose warning:",
                error
            );
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


            box.style.border =
                "1px solid rgba(255,255,255,0.2)";


            box.style.borderRadius =
                "8px";


            document.body.appendChild(
                box
            );
        }


        box.textContent =
            "[UNIVERSE ERROR]\n" +
            message;
    }


    /*
     * =====================================================
     * CLEANUP
     * =====================================================
     */

    dispose() {

        /*
         * Cancel timer.
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
         * Dispose particles.
         */

        this.disposeParticleSystem();


        /*
         * Remove stars.
         */

        if (
            this.stars
        ) {

            try {

                this.scene.remove(
                    this.stars
                );

            } catch (_) {}
        }


        /*
         * Remove dust.
         */

        if (
            this.dust
        ) {

            try {

                this.scene.remove(
                    this.dust
                );

            } catch (_) {}
        }


        this.stars =
            null;

        this.dust =
            null;

        this.nebula =
            null;

        this.ready =
            false;

        this.loading =
            false;
    }
}