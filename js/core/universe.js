/*
 * =========================================================
 * PARTICLE UNIVERSE
 * UNIVERSE RUNTIME V2
 *
 * CAMERA OWNERSHIP
 *
 * CameraController owns the THREE.Camera.
 *
 * Universe NEVER directly controls:
 *
 *     camera.position
 *     camera.rotation
 *
 * Universe communicates through:
 *
 *     cameraController.getForward()
 *     cameraController.setPosition()
 *     cameraController.lookAtPoint()
 *
 * Observer receives the REAL THREE.Camera.
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

        /*
         * IMPORTANT:
         *
         * This is CameraController.
         *
         * The REAL THREE.Camera is:
         *
         * this.cameraController.camera
         */

        this.cameraController =
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

            this.createBackground();

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
         */

        this.createObserver();


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
     * BACKGROUND
     * =====================================================
     */

    createBackground() {

        console.log(
            "[Universe] CREATING STARS"
        );


        this.stars =
            createStars(
                this.THREE,
                CONFIG.PARTICLES.STARS
            );


        if (
            this.stars
        ) {

            this.stars.visible =
                true;

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
                this.THREE,
                CONFIG.PARTICLES.DUST
            );


        if (
            this.dust
        ) {

            this.dust.visible =
                true;

            this.scene.add(
                this.dust
            );
        }


        console.log(
            "[Universe] DUST CREATED"
        );
    }


    /*
     * =====================================================
     * OBSERVER
     * =====================================================
     */

    createObserver() {

        try {

            console.log(
                "[Universe] CREATING OBSERVER"
            );


            /*
             * Observer receives the REAL THREE.Camera.
             */

            const camera =
                this.getThreeCamera();


            if (
                !camera
            ) {

                console.warn(
                    "[Universe] REAL THREE CAMERA NOT AVAILABLE"
                );
            }


            this.observer =
                new Observer(
                    this.THREE,
                    camera,
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
    }


    /*
     * =====================================================
     * GET REAL THREE CAMERA
     * =====================================================
     */

    getThreeCamera() {

        if (
            !this.cameraController
        ) {

            return null;
        }


        /*
         * Preferred API.
         */

        if (
            typeof this.cameraController.getCamera ===
            "function"
        ) {

            const camera =
                this.cameraController.getCamera();

            if (
                camera
            ) {

                return camera;
            }
        }


        /*
         * Direct owned camera reference.
         */

        if (
            this.cameraController.camera
        ) {

            return this.cameraController.camera;
        }


        /*
         * Compatibility fallback.
         */

        if (
            this.cameraController.isCamera
        ) {

            return this.cameraController;
        }


        return null;
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
         * INITIAL STATE
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
         * VISIBILITY SAFETY
         * =================================================
 */

        this.prepareParticleVisibility();


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
         * CAMERA DIAGNOSTICS
         * =================================================
 */

        this.validateCameraVisibility();


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


                    if (
                        this.observationEventRunning
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


        return true;
    }


    /*
     * =====================================================
     * PREPARE PARTICLE VISIBILITY
     * =====================================================
     */

    prepareParticleVisibility() {

        const points =
            this.particleSystem?.points;


        if (
            !points
        ) {

            console.error(
                "[Universe] VISIBILITY: NO POINTS"
            );

            return false;
        }


        points.visible =
            true;


        if (
            points.material
        ) {

            points.material.visible =
                true;

            points.material.transparent =
                true;

            if (
                Number(points.material.opacity) <=
                0
            ) {

                points.material.opacity =
                    1;
            }

            points.material.needsUpdate =
                true;
        }


        if (
            points.geometry
        ) {

            points.geometry.computeBoundingBox?.();

            points.geometry.computeBoundingSphere?.();
        }


        /*
         * Make sure object position is valid.
         */

        if (
            !Number.isFinite(
                points.position.x
            ) ||
            !Number.isFinite(
                points.position.y
            ) ||
            !Number.isFinite(
                points.position.z
            )
        ) {

            console.error(
                "[Universe] VISIBILITY: INVALID POINT POSITION"
            );


            points.position.set(
                0,
                0,
                0
            );
        }


        /*
         * Make sure scale is valid.
         */

        if (
            !Number.isFinite(
                points.scale.x
            ) ||
            !Number.isFinite(
                points.scale.y
            ) ||
            !Number.isFinite(
                points.scale.z
            )
        ) {

            points.scale.set(
                1,
                1,
                1
            );
        }


        if (
            points.scale.lengthSq() ===
            0
        ) {

            points.scale.set(
                1,
                1,
                1
            );
        }


        console.log(
            "[Universe] VISIBILITY CHECK:",
            {
                visible:
                    points.visible,

                material:
                    !!points.material,

                geometry:
                    !!points.geometry,

                vertexCount:
                    points.geometry
                        ?.attributes
                        ?.position
                        ?.count ?? 0
            }
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

        const controller =
            this.cameraController;


        if (
            !controller
        ) {

            console.warn(
                "[Universe] CAMERA CONTROLLER MISSING"
            );

            return false;
        }


        if (
            typeof controller.setPosition !==
                "function" ||
            typeof controller.lookAtPoint !==
                "function"
        ) {

            console.warn(
                "[Universe] CAMERA CONTROLLER API INCOMPLETE"
            );

            return false;
        }


        /*
         * =================================================
         * FIND NEBULA CENTER
         * =================================================
 */

        const center =
            this.normalizeVector3(
                nebula?.center
            );


        /*
         * =================================================
         * DETERMINE RADIUS
         * =================================================
 */

        let radius =
            this.getParticleRadius();


        if (
            !Number.isFinite(radius) ||
            radius <= 0
        ) {

            radius =
                10;
        }


        /*
         * =================================================
         * OPTIONAL CONFIG DISTANCE
         * =================================================
 */

        const configuredDistance =
            Number(
                nebula?.observation?.distance
            );


        /*
         * Never blindly trust configured distance.
         */

        const safeDistance =
            Number.isFinite(
                configuredDistance
            )
                ? Math.max(
                    Math.abs(
                        configuredDistance
                    ),
                    radius * 2.5,
                    8
                )
                : Math.max(
                    radius * 2.5,
                    8
                );


        /*
         * =================================================
         * CURRENT FORWARD
         * =================================================
 */

        let forward =
            null;


        if (
            typeof controller.getForward ===
            "function"
        ) {

            try {

                forward =
                    controller.getForward();

            } catch (error) {

                console.warn(
                    "[Universe] CAMERA FORWARD ERROR:",
                    error
                );
            }
        }


        if (
            !forward ||
            !Number.isFinite(forward.x) ||
            !Number.isFinite(forward.y) ||
            !Number.isFinite(forward.z)
        ) {

            forward =
                new this.THREE.Vector3(
                    0,
                    0,
                    -1
                );
        }


        forward.normalize();


        /*
         * =================================================
         * CAMERA POSITION
         * =================================================
 */

        const position =
            new this.THREE.Vector3(
                center.x -
                    forward.x *
                    safeDistance,

                center.y -
                    forward.y *
                    safeDistance,

                center.z -
                    forward.z *
                    safeDistance
            );


        /*
         * =================================================
         * CONTROLLER
         * =================================================
 */

        controller.setPosition(
            position.x,
            position.y,
            position.z
        );


        controller.lookAtPoint(
            center.x,
            center.y,
            center.z
        );


        console.log(
            "[Universe] CAMERA INITIALIZED:",
            {
                center,
                radius,
                configuredDistance,
                distance:
                    safeDistance
            }
        );


        return true;
    }


    /*
     * =====================================================
     * PARTICLE RADIUS
     * =====================================================
 */

    getParticleRadius() {

        const points =
            this.particleSystem?.points;

        const geometry =
            points?.geometry;


        if (
            !geometry
        ) {

            return 10;
        }


        try {

            geometry.computeBoundingSphere?.();


            const sphere =
                geometry.boundingSphere;


            if (
                sphere &&
                Number.isFinite(
                    sphere.radius
                ) &&
                sphere.radius > 0
            ) {

                return Math.max(
                    sphere.radius,
                    1
                );
            }

        } catch (error) {

            console.warn(
                "[Universe] BOUNDS ERROR:",
                error
            );
        }


        return 10;
    }


    /*
     * =====================================================
     * CAMERA VISIBILITY VALIDATION
     * =====================================================
 */

    validateCameraVisibility() {

        const camera =
            this.getThreeCamera();

        const points =
            this.particleSystem?.points;


        if (
            !camera
        ) {

            console.error(
                "[Universe] CAMERA VISIBILITY FAILED: NO CAMERA"
            );

            return false;
        }


        if (
            !points
        ) {

            console.error(
                "[Universe] CAMERA VISIBILITY FAILED: NO POINTS"
            );

            return false;
        }


        console.log(
            "[Universe] CAMERA STATE:",
            {
                position: {
                    x:
                        camera.position.x,

                    y:
                        camera.position.y,

                    z:
                        camera.position.z
                },

                rotation: {
                    x:
                        camera.rotation.x,

                    y:
                        camera.rotation.y,

                    z:
                        camera.rotation.z
                },

                visible:
                    points.visible,

                radius:
                    this.getParticleRadius()
            }
        );


        return true;
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
         * STABLE MOTION
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


                    if (
                        result &&
                        result.completed ===
                            true &&

                        !this.observationEventRunning
                    ) {

                        console.log(
                            "[Universe] OBSERVATION COMPLETE RECEIVED"
                        );


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

        if (
            !this.particleSystem ||
            !this.nebula
        ) {

            console.warn(
                "[Universe] OBSERVATION WITHOUT NEBULA"
            );


            return false;
        }


        if (
            this.observationEventRunning
        ) {

            return false;
        }


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

            this.nebula.state =
                "OBSERVATION_EVENT";


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


            this.clearSummonTimer();


            /*
             * ObservationEvent receives
             * the REAL THREE.Camera.
             */

            await runObservationEvent(
                this.getThreeCamera(),
                this.particleSystem
            );


            console.log(
                "[Universe] OBSERVATION EVENT FINISHED"
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

            this.observationEventRunning =
                false;


            STATE.observationEvent =
                false;

            STATE.observationLocked =
                false;

            STATE.controlsLocked =
                false;


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


            if (
                this.nebula
            ) {

                this.attachObserver(
                    this.nebula
                );
            }


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
     * DISPOSE
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
     * CLEAR TIMER
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