/*
 * =========================================================
 * PARTICLE UNIVERSE
 * =========================================================
 *
 * Robust Universe Controller
 *
 * =========================================================
 */

export class Universe {

    constructor(
        THREE,
        scene,
        cameraController
    ) {

        console.log(
            "[Universe] CONSTRUCTOR START"
        );


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


        console.log(
            "[Universe] STARTING INITIALIZATION"
        );


        /*
         * -------------------------------------------------
         * ASYNC INITIALIZATION
         * -------------------------------------------------
         */

        this.initialize()
            .then(
                () => {

                    console.log(
                        "[Universe] INITIALIZE COMPLETE"
                    );

                }
            )
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
            "[Universe] INITIALIZE ENTERED"
        );


        console.log(
            "[Universe] Loading dependencies..."
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

                console.log(
                    "[Universe] Loading:",
                    name,
                    path
                );


                try {

                    const module =
                        await import(path);


                    console.log(
                        "[Universe] Loaded:",
                        name
                    );


                    return module;

                } catch (error) {

                    console.error(
                        "[Universe] FAILED:",
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
         * =================================================
         * LOAD MODULES
         * =================================================
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


        console.log(
            "[Universe] ALL DEPENDENCIES LOADED"
        );


        /*
         * =================================================
         * VERIFY EXPORTS
         * =================================================
         */

        console.log(
            "[Universe] VERIFYING EXPORTS"
        );


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
            "[Universe] EXPORTS VERIFIED"
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


        console.log(
            "[Universe] DEPENDENCIES STORED"
        );


        /*
         * =================================================
         * CREATE BACKGROUND
         * =================================================
         */

        this.createBackground();


        /*
         * =================================================
         * READY
         * =================================================
         */

        this.loading =
            false;

        this.ready =
            true;

        this.failed =
            false;


        console.log(
            "[Universe] UNIVERSE READY"
        );


        /*
         * =================================================
         * START FIRST CYCLE
         * =================================================
         */

        console.log(
            "[Universe] STARTING FIRST CYCLE"
        );


        await this.startNewCycle();


        console.log(
            "[Universe] FIRST CYCLE COMPLETE"
        );
    }


    /*
     * =====================================================
     * CREATE BACKGROUND
     * =====================================================
     */

    createBackground() {

        console.log(
            "[Universe] CREATING BACKGROUND"
        );


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


        const starCount =
            CONFIG?.PARTICLES?.STARS ||
            4500;


        const dustCount =
            CONFIG?.PARTICLES?.DUST ||
            1800;


        /*
         * -------------------------------------------------
         * STARS
         * -------------------------------------------------
         */

        try {

            this.stars =
                createStars(
                    this.THREE,
                    starCount
                );


            if (
                this.stars
            ) {

                this.scene.add(
                    this.stars
                );
            }


            console.log(
                "[Universe] STARS CREATED:",
                starCount
            );

        } catch (error) {

            console.error(
                "[Universe] STARS FAILED:",
                error
            );


            this.stars =
                null;
        }


        /*
         * -------------------------------------------------
         * DUST
         * -------------------------------------------------
         */

        try {

            this.dust =
                createDust(
                    this.THREE,
                    dustCount
                );


            if (
                this.dust
            ) {

                this.scene.add(
                    this.dust
                );
            }


            console.log(
                "[Universe] DUST CREATED:",
                dustCount
            );

        } catch (error) {

            console.error(
                "[Universe] DUST FAILED:",
                error
            );


            this.dust =
                null;
        }


        console.log(
            "[Universe] BACKGROUND READY"
        );
    }


    /*
     * =====================================================
     * START NEW CYCLE
     * =====================================================
     */

    async startNewCycle() {

        console.log(
            "[Universe] startNewCycle()"
        );


        if (
            !this.ready ||
            !this.dependencies
        ) {

            console.warn(
                "[Universe] Cycle ignored: not ready."
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


        const currentCycle =
            ++this.cycleId;


        /*
         * -------------------------------------------------
         * CANCEL TIMER
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


        console.log(
            "[Universe] PHASE: SUMMONING"
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
                "[Universe] getRandomImage FAILED:",
                error
            );
        }


        if (
            !source
        ) {

            console.warn(
                "[Universe] NO IMAGE SOURCE"
            );


            /*
             * Do NOT destroy background.
             */

            setPhase(
                "EXPLORATION"
            );


            return;
        }


        console.log(
            "[Universe] IMAGE SOURCE FOUND"
        );


        /*
         * =================================================
         * GENERATE NEBULA
         * =================================================
         */

        let nebula;


        try {

            console.log(
                "[Universe] GENERATING NEBULA..."
            );


            nebula =
                await generateNebula(
                    this.THREE,
                    source
                );


            console.log(
                "[Universe] NEBULA GENERATED"
            );

        } catch (error) {

            console.error(
                "[Universe] NEBULA GENERATION FAILED:",
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
         * CYCLE CHECK
         * -------------------------------------------------
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

            throw new Error(
                "generateNebula returned null."
            );
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
         * CREATE PARTICLES
         * =================================================
         */

        try {

            console.log(
                "[Universe] CREATING PARTICLE SYSTEM"
            );


            this.particleSystem =
                new ParticleSystem(
                    this.THREE,
                    nebula
                );


            console.log(
                "[Universe] PARTICLE SYSTEM CREATED"
            );

        } catch (error) {

            console.error(
                "[Universe] PARTICLE SYSTEM FAILED:",
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
         * ADD PARTICLES
         * -------------------------------------------------
         */

        if (
            !this.particleSystem.points
        ) {

            throw new Error(
                "ParticleSystem.points is missing."
            );
        }


        this.scene.add(
            this.particleSystem.points
        );


        console.log(
            "[Universe] PARTICLES ADDED TO SCENE"
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
                        "[Universe] Position setup failed:",
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
        }


        /*
         * =================================================
         * CAMERA
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
                    "[Universe] CAMERA DISTANCE:",
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
            "[Universe] NEBULA SUMMONING"
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
         * PARTICLE SYSTEM
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
                    "[Universe] PARTICLE UPDATE ERROR:",
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
         * ROTATION
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
     * OBSERVATION
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
     * DISPOSE PARTICLES
     * =====================================================
     */

    disposeParticleSystem() {

        if (
            !this.particleSystem
        ) {

            return;
        }


        try {

            if (
                this.particleSystem.points
            ) {

                this.scene.remove(
                    this.particleSystem.points
                );
            }

        } catch (_) {}


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
                "[Universe] Dispose warning:",
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
     * DISPOSE UNIVERSE
     * =====================================================
     */

    dispose() {

        if (
            this.summonTimer
        ) {

            clearTimeout(
                this.summonTimer
            );

            this.summonTimer =
                null;
        }


        this.disposeParticleSystem();


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


        this.stars =
            null;

        this.dust =
            null;

        this.nebula =
            null;

        this.dependencies =
            null;

        this.ready =
            false;

        this.loading =
            false;
    }
}