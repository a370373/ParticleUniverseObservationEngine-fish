/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVER
 *
 * Observation Controller
 *
 * 負責：
 *
 * 1. 取得 Nebula
 * 2. 呼叫 ObservationDetector
 * 3. 維持 HOLD
 * 4. Observation Complete
 * 5. Observation Timeout
 *
 * Observer 不負責：
 *
 * - Audio
 * - Collapse
 * - Explosion
 * - Shuffle
 * - Camera animation
 * - Observation Event
 *
 * Universe / Observation Event
 * 負責後續事件。
 * =========================================================
 */

import {
    STATE
} from "../core/state.js";

import {
    CONFIG
} from "../config.js";

import {
    ObservationDetector
} from "./observation-detector.js";


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
         * DETECTOR
         * =================================================
         */

        this.detector =
            new ObservationDetector(
                cameraController
            );


        /*
         * =================================================
         * STATE
         * =================================================
         */

        this.started =
            false;


        this.completed =
            false;


        this.failed =
            false;


        this.observationStart =
            0;


        this.holdStart =
            0;


        this.holdDuration =
            this.getHoldDuration();


        /*
         * =================================================
         * DEBUG
         * =================================================
         */

        this.lastScore =
            0;


        this.lastResult =
            null;


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
        now = performance.now()
    ) {

        /*
         * -------------------------------------------------
         * Already completed
         * -------------------------------------------------
         */

        if (
            this.completed
        ) {

            return {

                completed:
                    true,

                failed:
                    false,

                observing:
                    false,

                score:
                    1,

                progress:
                    1
            };
        }


        /*
         * -------------------------------------------------
         * Major event lock
         * -------------------------------------------------
         */

        if (
            STATE.observationEvent ||
            STATE.observationLocked ||
            STATE.controlsLocked
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
                    0,

                progress:
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
                    0,

                progress:
                    0
            };
        }


        /*
         * -------------------------------------------------
         * Stable only
         * -------------------------------------------------
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
                    0,

                progress:
                    0
            };
        }


        /*
         * -------------------------------------------------
         * Start timeout timer
         * -------------------------------------------------
         */

        if (
            !this.started
        ) {

            this.started =
                true;


            this.observationStart =
                now;


            STATE.observationStarted =
                true;
        }


        /*
         * -------------------------------------------------
         * Detector
         *
         * similarity.js
         *      ↓
         * Detector
         *      ↓
         * Observer
         * -------------------------------------------------
         */

        const result =
            this.detector.update(
                nebula
            );


        this.lastScore =
            result.score;


        this.lastResult =
            result;


        /*
         * -------------------------------------------------
         * TARGET VALID
         * -------------------------------------------------
         */

        if (
            result.valid
        ) {

            if (
                this.holdStart ===
                0
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


            nebula.observationHold =
                held;


            STATE.observationProgress =
                progress;


            /*
             * -------------------------------------------------
             * COMPLETE
             * -------------------------------------------------
             */

            if (
                held >=
                this.holdDuration
            ) {

                return this.complete(
                    result,
                    nebula
                );
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
            0
        ) {

            console.log(
                "[Observer] TARGET LOST"
            );
        }


        this.resetHold();


        /*
         * -------------------------------------------------
         * TIMEOUT
         * -------------------------------------------------
         */

        if (
            this.hasObservationTimedOut(
                now
            )
        ) {

            this.failed =
                true;


            STATE.observationProgress =
                0;


            console.warn(
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
                    result.score,

                progress:
                    0
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
                result.score,

            progress:
                0
        };
    }


    /*
     * =====================================================
     * COMPLETE
     * =====================================================
     */

    complete(
        result,
        nebula
    ) {

        if (
            this.completed
        ) {

            return {

                completed:
                    true,

                failed:
                    false,

                observing:
                    false,

                score:
                    1,

                progress:
                    1
            };
        }


        this.completed =
            true;


        this.failed =
            false;


        this.holdStart =
            0;


        STATE.observationProgress =
            1;


        STATE.observationComplete =
            true;


        if (
            nebula
        ) {

            nebula.observationScore =
                1;


            nebula.observationHold =
                this.holdDuration;
        }


        console.log(
            "[Observer] OBSERVATION COMPLETE"
        );


        /*
         * IMPORTANT
         * -------------------------------------------------
         *
         * Observer does NOT call:
         *
         * universe.completeObservation()
         *
         * Observer only marks observation complete.
         *
         * Universe should detect:
         *
         * STATE.observationComplete
         *
         * and start observation-event.js.
         */


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


    /*
     * =====================================================
     * RESET
     * =====================================================
     */

    reset() {

        this.started =
            false;


        this.completed =
            false;


        this.failed =
            false;


        this.observationStart =
            0;


        this.holdStart =
            0;


        this.lastScore =
            0;


        this.lastResult =
            null;


        STATE.observationStarted =
            false;


        STATE.observationComplete =
            false;


        STATE.observationProgress =
            0;


        this.detector.reset();


        console.log(
            "[Observer] RESET"
        );
    }


    /*
     * =====================================================
     * RESET HOLD
     * =====================================================
     */

    resetHold() {

        this.holdStart =
            0;


        STATE.observationProgress =
            0;


        const nebula =
            this.getNebula();


        if (
            nebula
        ) {

            nebula.observationHold =
                0;
        }
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
     * TIMEOUT
     * =====================================================
     */

    hasObservationTimedOut(
        now
    ) {

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
                    Number(
                        configured
                    )
                )
                    ? Number(
                        configured
                    )
                    : minimum
            );


        return (
            now -
            this.observationStart
        ) >=
        timeout;
    }


    /*
     * =====================================================
     * HOLD DURATION
     * =====================================================
     */

    getHoldDuration() {

        const value =
            CONFIG?.OBSERVATION
                ?.HOLD_TIME;


        if (
            Number.isFinite(
                Number(
                    value
                )
            )
        ) {

            return Math.max(
                500,
                Number(
                    value
                )
            );
        }


        return 2000;
    }


    /*
     * =====================================================
     * DEBUG
     * =====================================================
     */

    getDebugState() {

        return {

            started:
                this.started,

            completed:
                this.completed,

            failed:
                this.failed,

            holdStart:
                this.holdStart,

            holdDuration:
                this.holdDuration,

            score:
                this.lastScore,

            result:
                this.lastResult,

            detector:
                this.detector
                    .getDebugState()
        };
    }
}