/*
 * =========================================================
 * PARTICLE UNIVERSE
 * =========================================================
 *
 * This version intentionally uses dynamic imports so that
 * dependency loading errors can be identified instead of
 * appearing as an opaque failure of universe.js itself.
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

        this.ready =
            false;

        this.loading =
            true;

        this.dependencies =
            null;

        /*
         * -------------------------------------------------
         * Load dependencies asynchronously.
         * -------------------------------------------------
         */

        this.initialize()
            .catch(
                error => {

                    this.loading =
                        false;

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
            "[Universe] Loading dependencies..."
        );


        /*
         * -------------------------------------------------
         * LOAD EACH MODULE SEPARATELY
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
                        name,
                        path
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
         * -------------------------------------------------
         * VERIFY EXPORTS
         * -------------------------------------------------
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
            typeof stateModule.setPhase !==
            "function"
        ) {

            throw new Error(
                "state.js does not export setPhase."
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


        /*
         * -------------------------------------------------
         * STORE DEPENDENCIES
         * -------------------------------------------------
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
         * -------------------------------------------------
         * BACKGROUND
         * -------------------------------------------------
         */

        this.stars =
            this.dependencies.createStars(
                this.THREE,
                this.dependencies.CONFIG
                    .PARTICLES
                    .STARS
            );


        this.dust =
            this.dependencies.createDust(
                this.THREE,
                this.dependencies.CONFIG
                    .PARTICLES
                    .DUST
            );


        this.scene.add(
            this.stars
        );

        this.scene.add(
            this.dust
        );


        /*
         * -------------------------------------------------
         * READY
         * -------------------------------------------------
         */

        this.loading =
            false;

        this.ready =
            true;


        console.log(
            "[Universe] Dependencies ready."
        );


        /*
         * -------------------------------------------------
         * FIRST CYCLE
         * -------------------------------------------------
         */

        await this.startNewCycle();
    }


    /*
     * =====================================================
     * START NEW CYCLE
     * =====================================================
     */

    async startNewCycle() {

        if (
            !this.ready ||
            !this.dependencies
        ) {

            console.warn(
                "[Universe] startNewCycle ignored: not ready."
            );

            return;
        }


        const {

            generateNebula,
            ParticleSystem,
            getRandomImage,
            setPhase,
            CONFIG

        } =
            this.dependencies;


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
         * -------------------------------------------------
         * IMAGE
         * -------------------------------------------------
         */

        const source =
            getRandomImage();


        if (!source) {

            const error =
                new Error(
                    "No Base64 image is available."
                );

            console.error(
                "[Universe]",
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
            "[Universe] Image source found."
        );


        /*
         * -------------------------------------------------
         * GENERATE NEBULA
         * -------------------------------------------------
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
         * Ignore obsolete cycle.
         */

        if (
            currentCycle !==
            this.cycleId
        ) {

            return;
        }


        this.nebula =
            nebula;


        /*
         * -------------------------------------------------
         * REMOVE OLD PARTICLES
         * -------------------------------------------------
         */

        this.disposeParticleSystem();


        /*
         * -------------------------------------------------
         * CREATE PARTICLES
         * -------------------------------------------------
         */

        try {

            this.particleSystem =
                new ParticleSystem(
                    this.THREE,
                    nebula
                );

        } catch (error) {

            console.error(
                "[Universe] ParticleSystem failed:",
                error
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


        /*
         * -------------------------------------------------
         * OBSERVATION ORIENTATION
         * -------------------------------------------------
         */

        if (
            nebula.observation
        ) {

            this.particleSystem
                .points
                .rotation.set(

                    nebula.observation.pitch,
                    nebula.observation.yaw,
                    nebula.observation.roll
                );


            if (
                nebula.observation.position
            ) {

                this.particleSystem
                    .points
                    .position.copy(
                        nebula.observation.position
                    );
            }


            if (
                Number.isFinite(
                    nebula.observation.scale
                )
            ) {

                this.particleSystem
                    .points
                    .scale.setScalar(
                        nebula.observation.scale
                    );
            }
        }


        /*
         * -------------------------------------------------
         * SUMMONING
         * -------------------------------------------------
         */

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


                    console.log(
                        "[Universe] Nebula stable."
                    );

                },
                this.summonDuration
            );


        console.log(
            "[Universe] Nebula ready:",
            nebula.count,
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
         * Universe is allowed to render
         * even while dependency loading.
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
         * Natural rotation.
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