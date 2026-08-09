/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVER
 *
 * Observation Controller
 *
 * Flow:
 *
 * similarity.js
 *      ↓
 * ObservationDetector
 *      ↓
 * Observer
 *      ↓
 * STATE.observationComplete
 *      ↓
 * Universe
 *      ↓
 * observation-event.js
 *
 * Observer ONLY owns:
 * - observation window
 * - hold timer
 * - completion
 * - timeout
 *
 * Observer does NOT own:
 * - audio
 * - collapse
 * - explosion
 * - shuffle
 * - camera animation
 * - observation event
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

        this.detector =
            new ObservationDetector(
                cameraController
            );

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

        if (
            this.completed
        ) {

            return this.result(
                true,
                false,
                false,
                1
            );
        }


        if (
            this.failed
        ) {

            return this.result(
                false,
                true,
                false,
                0
            );
        }


        /*
         * Global event/control lock.
         */

        if (
            STATE.observationEvent ||
            STATE.observationLocked ||
            STATE.controlsLocked
        ) {

            this.resetHold();

            return this.result(
                false,
                false,
                false,
                0
            );
        }


        const nebula =
            this.getNebula();


        if (
            !nebula
        ) {

            this.resetHold();

            return this.result(
                false,
                false,
                false,
                0
            );
        }


        /*
         * Only stable nebula can be observed.
         */

        if (
            nebula.state !==
            "STABLE"
        ) {

            this.resetHold();

            return this.result(
                false,
                false,
                false,
                0
            );
        }


        /*
         * Start observation window.
         */

        if (
            !this.started
        ) {

            this.started =
                true;

            this.failed =
                false;

            this.completed =
                false;

            this.observationStart =
                now;

            STATE.observationStarted =
                true;

            console.log(
                "[Observer] OBSERVATION STARTED"
            );
        }


        /*
         * Timeout is checked independently
         * from detector validity.
         */

        if (
            this.hasObservationTimedOut(
                now
            )
        ) {

            return this.timeout();
        }


        /*
         * Detector.
         */

        let result;

        try {

            result =
                this.detector.update(
                    nebula
                );

        } catch (error) {

            console.error(
                "[Observer] DETECTOR ERROR:",
                error
            );

            this.resetHold();

            return this.result(
                false,
                false,
                false,
                0
            );
        }


        /*
         * Invalid detector result.
         */

        if (
            !result ||
            typeof result !==
            "object"
        ) {

            this.resetHold();

            return this.result(
                false,
                false,
                false,
                0
            );
        }


        /*
         * Score.
         */

        this.lastScore =
            Number.isFinite(
                Number(
                    result.score
                )
            )
                ? Number(
                    result.score
                )
                : 0;

        this.lastResult =
            result;

        nebula.observationScore =
            this.lastScore;


        /*
         * Target acquired.
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
                Math.max(
                    0,
                    now -
                    this.holdStart
                );


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
             * Hold complete.
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


            return this.result(
                false,
                false,
                true,
                progress
            );
        }


        /*
         * Target lost.
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


        return this.result(
            false,
            false,
            false,
            0
        );
    }


    /*
     * =====================================================
     * RESULT
     * =====================================================
     */

    result(
        completed,
        failed,
        observing,
        progress
    ) {

        return {

            completed:
                completed,

            failed:
                failed,

            observing:
                observing,

            score:
                this.lastScore,

            progress:
                progress
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

            return this.result(
                true,
                false,
                false,
                1
            );
        }


        this.completed =
            true;

        this.failed =
            false;

        this.holdStart =
            0;


        STATE.observationComplete =
            true;

        STATE.observationProgress =
            1;

        STATE.observationStarted =
            true;


        if (
            nebula
        ) {

            nebula.observationScore =
                this.lastScore;

            nebula.observationHold =
                this.holdDuration;
        }


        console.log(
            "[Observer] OBSERVATION COMPLETE"
        );


        return this.result(
            true,
            false,
            false,
            1
        );
    }


    /*
     * =====================================================
     * TIMEOUT
     * =====================================================
     */

    timeout() {

        if (
            this.failed
        ) {

            return this.result(
                false,
                true,
                false,
                0
            );
        }


        this.failed =
            true;

        this.holdStart =
            0;


        STATE.observationProgress =
            0;

        STATE.observationStarted =
            false;


        console.warn(
            "[Observer] OBSERVATION TIMEOUT"
        );


        return this.result(
            false,
            true,
            false,
            0
        );
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


        try {

            this.detector?.reset?.();

        } catch (error) {

            console.warn(
                "[Observer] DETECTOR RESET ERROR:",
                error
            );
        }


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
            Number(
                CONFIG?.OBSERVATION
                    ?.MAX_TIME
            );


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

        const number =
            Number(
                CONFIG?.OBSERVATION
                    ?.HOLD_TIME
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return Math.max(
                500,
                number
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

            observationStart:
                this.observationStart,

            holdStart:
                this.holdStart,

            holdDuration:
                this.holdDuration,

            score:
                this.lastScore,

            result:
                this.lastResult,

            detector:
                this.detector &&
                typeof this.detector
                    .getDebugState ===
                "function"

                    ? this.detector
                        .getDebugState()

                    : null
        };
    }
}