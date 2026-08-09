/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVER
 *
 * Observation Validator
 *
 * 負責：
 *
 * 1. 取得 Camera 狀態
 * 2. 取得 Nebula 隱藏觀測參數
 * 3. 比對：
 *      yaw
 *      pitch
 *      roll
 *      distance
 *      position
 *      scale
 *
 * 4. 判斷是否進入觀測容許範圍
 * 5. 必須持續保持約 2 秒
 * 6. 成功後回傳 completed
 *
 * 注意：
 *
 * Observer 不負責：
 *
 * - 音樂
 * - 粒子坍縮
 * - 爆炸
 * - Shuffle
 *
 * 那些交給 Universe / Observation Event。
 * =========================================================
 */

import {
    STATE
} from "../core/state.js";

import {
    CONFIG
} from "../config.js";


export class Observer {

    constructor(
        THREE,
        cameraController,
        nebulaProvider
    ) {

        console.log(
            "[Observer] CONSTRUCTOR"
        );


        this.THREE =
            THREE;

        this.cameraController =
            cameraController;

        this.nebulaProvider =
            nebulaProvider;


        /*
         * =================================================
         * OBSERVATION STATE
         * =================================================
         */

        this.started =
            false;

        this.completed =
            false;

        this.failed =
            false;

        this.ambient =
            false;


        /*
         * =================================================
         * HOLD TIMER
         * =================================================
         */

        this.holdStart =
            null;

        this.holdDuration =
            this.getHoldDuration();


        /*
         * =================================================
         * LAST RESULT
         * =================================================
         */

        this.lastScore =
            0;

        this.lastDistanceScore =
            0;

        this.lastRotationScore =
            0;

        this.lastPositionScore =
            0;

        this.lastScaleScore =
            0;


        /*
         * =================================================
         * DEBUG
         * =================================================
         */

        this.lastDebugTime =
            0;


        console.log(
            "[Observer] READY"
        );
    }


    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    update(
        now
    ) {

        /*
         * -------------------------------------------------
         * Safety
         * -------------------------------------------------
         */

        if (
            this.completed
        ) {

            return {

                completed:
                    false,

                failed:
                    false,

                observing:
                    false,

                score:
                    1
            };
        }


        if (
            this.ambient
        ) {

            this.resetHold();


            return {

                completed:
                    false,

                failed:
                    false,

                observing:
                    false,

                score:
                    0
            };
        }


        if (
            STATE.ambient
        ) {

            this.resetHold();


            return {

                completed:
                    false,

                failed:
                    false,

                observing:
                    false,

                score:
                    0
            };
        }


        /*
         * -------------------------------------------------
         * Nebula
         * -------------------------------------------------
         */

        const nebula =
            this.getNebula();


        if (
            !nebula
        ) {

            this.resetHold();


            return {

                completed:
                    false,

                failed:
                    false,

                observing:
                    false,

                score:
                    0
            };
        }


        /*
         * Observation only exists
         * after summoning.
         */

        if (
            nebula.state !==
            "STABLE"
        ) {

            this.resetHold();


            return {

                completed:
                    false,

                failed:
                    false,

                observing:
                    false,

                score:
                    0
            };
        }


        /*
         * -------------------------------------------------
         * Camera
         * -------------------------------------------------
         */

        const cameraState =
            this.getCameraState();


        if (
            !cameraState
        ) {

            this.resetHold();


            return {

                completed:
                    false,

                failed:
                    false,

                observing:
                    false,

                score:
                    0
            };
        }


        /*
         * -------------------------------------------------
         * Target
         * -------------------------------------------------
         */

        const target =
            nebula.observation;


        if (
            !target
        ) {

            this.resetHold();


            return {

                completed:
                    false,

                failed:
                    false,

                    observing:
                    false,

                score:
                    0
            };
        }


        /*
         * -------------------------------------------------
         * SCORE
         * -------------------------------------------------
         */

        const result =
            this.calculateObservation(
                cameraState,
                target
            );


        this.lastScore =
            result.score;

        this.lastDistanceScore =
            result.distanceScore;

        this.lastRotationScore =
            result.rotationScore;

        this.lastPositionScore =
            result.positionScore;

        this.lastScaleScore =
            result.scaleScore;


        /*
         * -------------------------------------------------
         * OBSERVATION FOUND
         * -------------------------------------------------
         */

        if (
            result.valid
        ) {

            if (
                this.holdStart ===
                null
            ) {

                this.holdStart =
                    now;

                console.log(
                    "[Observer] TARGET ACQUIRED"
                );
            }


            const held =
                now -
                this.holdStart;


            const progress =
                Math.max(
                    0,
                    Math.min(
                        1,
                        held /
                        this.holdDuration
                    )
                );


            /*
             * Optional global observation progress.
             */

            STATE.observationProgress =
                progress;


            /*
             * -------------------------------------------------
             * SUCCESS
             * -------------------------------------------------
             */

            if (
                held >=
                this.holdDuration
            ) {

                this.completed =
                    true;

                this.failed =
                    false;

                STATE.observationProgress =
                    1;


                console.log(
                    "[Observer] OBSERVATION COMPLETE"
                );


                return {

                    completed:
                        true,

                    failed:
                        false,

                    observing:
                        true,

                    score:
                        result.score,

                    progress:
                        1
                };
            }


            return {

                completed:
                    false,

                failed:
                    false,

                observing:
                    true,

                score:
                    result.score,

                progress:
                    progress
            };
        }


        /*
         * -------------------------------------------------
         * TARGET LOST
         * -------------------------------------------------
         */

        if (
            this.holdStart !==
            null
        ) {

            this.holdStart =
                null;

            STATE.observationProgress =
                0;

            console.log(
                "[Observer] TARGET LOST"
            );
        }


        /*
         * -------------------------------------------------
         * FAILURE TIMER
         *
         * Minimum 3 minutes.
         * The actual timeout is configurable.
         * -------------------------------------------------
         */

        if (
            this.started &&
            this.hasObservationTimedOut(
                now
            )
        ) {

            this.failed =
                true;


            console.log(
                "[Observer] OBSERVATION TIMEOUT"
            );


            return {

                completed:
                    false,

                failed:
                    true,

                observing:
                    false,

                score:
                    result.score
            };
        }


        return {

            completed:
                false,

            failed:
                false,

            observing:
                false,

            score:
                result.score
        };
    }


    /*
     * =====================================================
     * CAMERA STATE
     * =====================================================
     */

    getCameraState() {

        const controller =
            this.cameraController;


        if (
            !controller
        ) {

            return null;
        }


        /*
         * Try common camera controller
         * structures without forcing
         * a specific implementation.
         */

        const camera =
            controller.camera ||
            controller;


        if (
            !camera
        ) {

            return null;
        }


        const position =
            camera.position;


        if (
            !position
        ) {

            return null;
        }


        /*
         * Camera rotation.
         */

        const rotation =
            camera.rotation ||
            null;


        /*
         * Scale.
         *
         * The observer primarily uses
         * camera distance, but nebula
         * scale is included in the target.
         */

        return {

            position: {

                x:
                    Number(
                        position.x
                    ) || 0,

                y:
                    Number(
                        position.y
                    ) || 0,

                z:
                    Number(
                        position.z
                    ) || 0
            },


            rotation: {

                x:
                    Number(
                        rotation?.x
                    ) || 0,

                y:
                    Number(
                        rotation?.y
                    ) || 0,

                z:
                    Number(
                        rotation?.z
                    ) || 0
            },


            distance:
                this.calculateDistance(
                    position
                )
        };
    }


    /*
     * =====================================================
     * CALCULATE OBSERVATION
     * =====================================================
     */

    calculateObservation(
        camera,
        target
    ) {

        /*
         * =================================================
         * TARGET ROTATION
         * =================================================
         */

        const rotationScore =
            this.rotationScore(
                camera.rotation,
                target
            );


        /*
         * =================================================
         * TARGET DISTANCE
         * =================================================
         */

        const distanceScore =
            this.distanceScore(
                camera.distance,
                target.distance
            );


        /*
         * =================================================
         * TARGET POSITION
         * =================================================
         */

        const positionScore =
            this.positionScore(
                camera.position,
                target.position
            );


        /*
         * =================================================
         * SCALE
         * =================================================
         *
         * Scale is mostly a property
         * of the particle cloud.
         *
         * If camera controller exposes
         * zoom/scale, use it.
         *
         * Otherwise give a neutral score.
         * =================================================
         */

        const scaleScore =
            this.scaleScore(
                target
            );


        /*
         * =================================================
         * WEIGHTED SCORE
         * =================================================
         */

        const score =

            rotationScore * 0.40 +

            distanceScore * 0.30 +

            positionScore * 0.20 +

            scaleScore * 0.10;


        /*
         * =================================================
         * THRESHOLD
         * =================================================
         */

        const threshold =
            this.getSimilarityThreshold();


        const valid =
            score >= threshold &&
            rotationScore >= 0.70 &&
            distanceScore >= 0.70;


        return {

            valid,

            score,

            rotationScore,

            distanceScore,

            positionScore,

            scaleScore
        };
    }


    /*
     * =====================================================
     * ROTATION SCORE
     * =====================================================
     */

    rotationScore(
        rotation,
        target
    ) {

        if (
            !rotation ||
            !target
        ) {

            return 0;
        }


        const yaw =
            this.angleDifference(
                rotation.y,
                target.yaw || 0
            );


        const pitch =
            this.angleDifference(
                rotation.x,
                target.pitch || 0
            );


        const roll =
            this.angleDifference(
                rotation.z,
                target.roll || 0
            );


        /*
         * Allowed rotation error:
         *
         * approximately ±3~5%.
         *
         * Convert this into an angular
         * tolerance while retaining
         * usable gameplay.
         */

        const yawTolerance =
            this.getRotationTolerance(
                target.yaw
            );


        const pitchTolerance =
            this.getRotationTolerance(
                target.pitch
            );


        const rollTolerance =
            this.getRotationTolerance(
                target.roll
            );


        const yawScore =
            this.errorScore(
                yaw,
                yawTolerance
            );


        const pitchScore =
            this.errorScore(
                pitch,
                pitchTolerance
            );


        const rollScore =
            this.errorScore(
                roll,
                rollTolerance
            );


        return (

            yawScore * 0.45 +

            pitchScore * 0.35 +

            rollScore * 0.20
        );
    }


    /*
     * =====================================================
     * DISTANCE SCORE
     * =====================================================
     */

    distanceScore(
        current,
        target
    ) {

        if (
            !Number.isFinite(
                current
            ) ||
            !Number.isFinite(
                target
            )
        ) {

            return 0;
        }


        const denominator =
            Math.max(
                0.001,
                Math.abs(
                    target
                )
            );


        const error =
            Math.abs(
                current -
                target
            ) /
            denominator;


        /*
         * User specification:
         *
         * approximately ±5~10%.
         */

        const tolerance =
            this.getDistanceTolerance();


        return this.errorScore(
            error,
            tolerance
        );
    }


    /*
     * =====================================================
     * POSITION SCORE
     * =====================================================
     */

    positionScore(
        position,
        target
    ) {

        if (
            !position ||
            !target
        ) {

            return 0;
        }


        const dx =
            position.x -
            (target.x || 0);


        const dy =
            position.y -
            (target.y || 0);


        const dz =
            position.z -
            (target.z || 0);


        const error =
            Math.sqrt(
                dx * dx +
                dy * dy +
                dz * dz
            );


        /*
         * Position tolerance is relative
         * to the observation distance.
         */

        const reference =
            Math.max(
                1,
                Math.abs(
                    target.distance ||
                    100
                )
            );


        const normalized =
            error /
            reference;


        const tolerance =
            this.getPositionTolerance();


        return this.errorScore(
            normalized,
            tolerance
        );
    }


    /*
     * =====================================================
     * SCALE SCORE
     * =====================================================
     */

    scaleScore(
        target
    ) {

        /*
         * The actual particle scale
         * is controlled by the nebula.
         *
         * For now:
         *
         * if target.scale exists,
         * it is considered valid.
         *
         * Camera zoom is primarily
         * represented through distance.
         */

        if (
            Number.isFinite(
                target?.scale
            )
        ) {

            return 1;
        }


        return 0.5;
    }


    /*
     * =====================================================
     * ERROR → SCORE
     * =====================================================
     */

    errorScore(
        error,
        tolerance
    ) {

        if (
            error <= 0
        ) {

            return 1;
        }


        if (
            error >= tolerance
        ) {

            return 0;
        }


        return (
            1 -
            (
                error /
                tolerance
            )
        );
    }


    /*
     * =====================================================
     * ANGLE DIFFERENCE
     * =====================================================
     */

    angleDifference(
        a,
        b
    ) {

        let diff =
            a -
            b;


        while (
            diff >
            Math.PI
        ) {

            diff -=
                Math.PI * 2;
        }


        while (
            diff <
            -Math.PI
        ) {

            diff +=
                Math.PI * 2;
        }


        return Math.abs(
            diff
        );
    }


    /*
     * =====================================================
     * DISTANCE
     * =====================================================
     */

    calculateDistance(
        position
    ) {

        return Math.sqrt(

            position.x *
            position.x +

            position.y *
            position.y +

            position.z *
            position.z
        );
    }


    /*
     * =====================================================
     * RESET
     * =====================================================
     */

    reset() {

        this.started =
            true;

        this.completed =
            false;

        this.failed =
            false;

        this.holdStart =
            null;

        this.lastScore =
            0;

        this.lastDistanceScore =
            0;

        this.lastRotationScore =
            0;

        this.lastPositionScore =
            0;

        this.lastScaleScore =
            0;

        STATE.observationProgress =
            0;

        console.log(
            "[Observer] RESET"
        );
    }


    /*
     * =====================================================
     * HOLD RESET
     * =====================================================
     */

    resetHold() {

        if (
            this.holdStart !==
            null
        ) {

            this.holdStart =
                null;
        }


        STATE.observationProgress =
            0;
    }


    /*
     * =====================================================
     * GET NEBULA
     * =====================================================
     */

    getNebula() {

        try {

            if (
                typeof this.nebulaProvider ===
                "function"
            ) {

                return this.nebulaProvider();
            }

        } catch (error) {

            console.error(
                "[Observer] NEBULA PROVIDER ERROR:",
                error
            );
        }


        return null;
    }


    /*
     * =====================================================
     * CONFIG HELPERS
     * =====================================================
     */

    getHoldDuration() {

        const value =
            CONFIG?.OBSERVATION
                ?.HOLD_TIME;


        if (
            Number.isFinite(
                value
            )
        ) {

            return Math.max(
                500,
                value
            );
        }


        /*
         * Specification:
         *
         * approximately 2 seconds.
         */

        return 2000;
    }


    getSimilarityThreshold() {

        const value =
            CONFIG?.OBSERVATION
                ?.SIMILARITY_THRESHOLD;


        if (
            Number.isFinite(
                value
            )
        ) {

            return Math.max(
                0,
                Math.min(
                    1,
                    value
                )
            );
        }


        /*
         * Default:
         * fairly strict observation.
         */

        return 0.86;
    }


    getRotationTolerance(
        angle
    ) {

        /*
         * Approximately 3~5%.
         *
         * Keep this intentionally
         * forgiving enough for human
         * mouse/touch movement.
         */

        const base =
            Math.PI *
            0.045;


        return Math.max(
            0.06,
            base
        );
    }


    getDistanceTolerance() {

        /*
         * 5~10%.
         */

        return 0.08;
    }


    getPositionTolerance() {

        /*
         * Approximately ±5%.
         */

        return 0.05;
    }


    /*
     * =====================================================
     * TIMEOUT
     * =====================================================
     */

    hasObservationTimedOut(
        now
    ) {

        /*
         * Observation timeout begins
         * from the first reset/start.
         */

        if (
            !this.started
        ) {

            this.started =
                true;

            this.observationStart =
                now;

            return false;
        }


        if (
            !this.observationStart
        ) {

            this.observationStart =
                now;

            return false;
        }


        const configured =
            CONFIG?.OBSERVATION
                ?.MAX_TIME;


        const minimum =
            3 *
            60 *
            1000;


        const timeout =
            Math.max(
                minimum,
                Number.isFinite(
                    configured
                )
                    ? configured
                    : minimum
            );


        return (
            now -
            this.observationStart >=
            timeout
        );
    }
}