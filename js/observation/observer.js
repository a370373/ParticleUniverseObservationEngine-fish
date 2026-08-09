import {
    CONFIG
} from "../config.js";

import {
    calculateObservationScore
} from "./similarity.js";

export class Observer {

    constructor(
        THREE,
        camera,
        getNebula
    ) {

        this.THREE = THREE;
        this.camera = camera;
        this.getNebula = getNebula;

        this.holdStart = null;

        this.failureDeadline =
            performance.now() +
            randomFailureTime();

        this.enabled = true;
    }

    update(now) {

        const nebula =
            this.getNebula();

        if (
            !nebula ||
            !this.enabled
        ) {
            return {
                completed: false,
                failed: false,
                score: 0
            };
        }

        if (
            nebula.state !== "STABLE"
        ) {
            return {
                completed: false,
                failed: false,
                score: 0
            };
        }

        const score =
            calculateObservationScore(
                this.camera,
                nebula,
                this.THREE
            );

        /*
         * Ambient mode cannot complete observation.
         */
        if (this.ambient) {
            this.holdStart = null;

            return {
                completed: false,
                failed: false,
                score
            };
        }

        if (
            score >=
            CONFIG.OBSERVATION
                .SIMILARITY_THRESHOLD
        ) {

            if (
                this.holdStart === null
            ) {

                this.holdStart =
                    now;
            }

            const held =
                now -
                this.holdStart;

            if (
                held >=
                CONFIG.OBSERVATION
                    .HOLD_TIME
            ) {

                this.enabled = false;

                return {
                    completed: true,
                    failed: false,
                    score
                };
            }

        } else {

            this.holdStart =
                null;
        }

        if (
            now >=
            this.failureDeadline
        ) {

            this.failureDeadline =
                now +
                randomFailureTime();

            return {
                completed: false,
                failed: true,
                score
            };
        }

        return {
            completed: false,
            failed: false,
            score
        };
    }

    setAmbient(value) {
        this.ambient = value;
    }

    reset() {

        this.enabled = true;

        this.holdStart =
            null;

        this.failureDeadline =
            performance.now() +
            randomFailureTime();
    }
}

function randomFailureTime() {

    const min =
        CONFIG.OBSERVATION
            .MIN_FAILURE_TIME;

    const max =
        CONFIG.OBSERVATION
            .MAX_FAILURE_TIME;

    return min +
        Math.random() *
        (max - min);
}