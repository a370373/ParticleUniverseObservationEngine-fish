/*
 * =========================================================
 * PARTICLE UNIVERSE
 * OBSERVATION DETECTOR
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


    update(
        nebula = null
    ) {

        /*
         * Automatically switch target nebula.
         */

        if (
            nebula !== null
        ) {

            if (
                nebula !==
                this.currentNebula
            ) {

                this.attach(
                    nebula
                );

            } else {

                this.active =
                    true;
            }
        }


        if (
            !this.active ||
            !this.currentNebula
        ) {

            return this.invalidResult();
        }


        const currentNebula =
            this.currentNebula;


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


        const result =
            calculateObservationScore(
                camera,
                currentNebula
            );


        this.lastScore =
            Number.isFinite(
                Number(
                    result?.score
                )
            )
                ? Number(
                    result.score
                )
                : 0;


        this.lastResult =
            result;


        currentNebula.observationScore =
            this.lastScore;


        return result;
    }


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

            geometryScore:
                0,

            imageSimilarityScore:
                0,

            imageSimilarityAvailable:
                false,

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
                Infinity,

            cameraDistance:
                0,

            targetDistance:
                0,

            actualScale:
                1,

            targetScale:
                1
        };
    }


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