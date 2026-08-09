/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION DETECTOR
 *
 * Observation Validator
 *
 * 負責：
 *
 * Camera
 *   ↓
 * Nebula
 *   ↓
 * similarity.js
 *   ↓
 * Observation Result
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * Detector 不自己計算 Rotation / Distance / Position /
 * Scale。
 *
 * 所有 similarity calculation 都交給：
 *
 * similarity.js
 *
 * Detector 不負責：
 *
 * - Hold
 * - Timeout
 * - Observation Event
 * - Audio
 * - Particle
 * - STATE
 * =========================================================
 */

import {
    calculateObservationScore
} from "./similarity.js";


export class ObservationDetector {

    constructor(
        cameraController
    ) {

        console.log(
            "[ObservationDetector] CONSTRUCTOR"
        );


        this.cameraController =
            cameraController;


        this.currentNebula =
            null;


        this.lastScore =
            0;


        this.lastResult =
            null;


        this.active =
            false;


        console.log(
            "[ObservationDetector] READY"
        );
    }


    /*
     * =====================================================
     * ATTACH
     * =====================================================
     */

    attach(
        nebula
    ) {

        if (
            !nebula
        ) {

            this.reset();

            console.warn(
                "[ObservationDetector] ATTACH FAILED"
            );

            return false;
        }


        this.currentNebula =
            nebula;


        this.active =
            true;


        this.lastScore =
            0;


        this.lastResult =
            null;


        nebula.observationScore =
            0;


        nebula.observationHold =
            0;


        console.log(
            "[ObservationDetector] ATTACHED"
        );


        return true;
    }


    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    update(
        nebula = null
    ) {

        /*
         * Observer may provide the current
         * nebula directly.
         *
         * This removes the dependency on
         * manually calling attach() every frame.
         */

        if (
            nebula
        ) {

            if (
                nebula !==
                this.currentNebula
            ) {

                this.attach(
                    nebula
                );

            } else {

                this.currentNebula =
                    nebula;

                this.active =
                    true;
            }
        }


        /*
         * No target.
         */

        if (
            !this.active ||
            !this.currentNebula
        ) {

            return this.invalidResult();
        }


        const currentNebula =
            this.currentNebula;


        /*
         * Only STABLE nebula can be observed.
         */

        if (
            currentNebula.state !==
            "STABLE"
        ) {

            return this.invalidResult();
        }


        const camera =
            this.getCamera();


        if (
            !camera
        ) {

            return this.invalidResult();
        }


        /*
         * =================================================
         * SINGLE SCORE SOURCE
         * =================================================
         */

        const result =
            calculateObservationScore(
                camera,
                currentNebula
            );


        this.lastScore =
            result.score;


        this.lastResult =
            result;


        currentNebula.observationScore =
            result.score;


        return result;
    }


    /*
     * =====================================================
     * RESET
     * =====================================================
     */

    reset() {

        this.currentNebula =
            null;


        this.active =
            false;


        this.lastScore =
            0;


        this.lastResult =
            null;
    }


    /*
     * =====================================================
     * CAMERA
     * =====================================================
     */

    getCamera() {

        if (
            this.cameraController?.camera
        ) {

            return this
                .cameraController
                .camera;
        }


        return this.cameraController ||
            null;
    }


    /*
     * =====================================================
     * INVALID RESULT
     * =====================================================
     */

    invalidResult() {

        this.lastScore =
            0;


        this.lastResult =
            null;


        return {

            valid:
                false,

            score:
                0,

            rotationScore:
                0,

            distanceScore:
                0,

            positionScore:
                0,

            scaleScore:
                0,

            yawError:
                Infinity,

            pitchError:
                Infinity,

            rollError:
                Infinity,

            distanceError:
                Infinity,

            positionError:
                Infinity,

            scaleError:
                Infinity
        };
    }


    /*
     * =====================================================
     * DEBUG
     * =====================================================
     */

    getDebugState() {

        return {

            active:
                this.active,

            score:
                this.lastScore,

            result:
                this.lastResult,

            nebula:
                this.currentNebula
        };
    }
}