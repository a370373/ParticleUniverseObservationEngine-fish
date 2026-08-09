import {
    CONFIG
} from "../config.js";

import {
    STATE
} from "../core/state.js";

export class AmbientController {

    constructor(camera) {

        this.camera =
            camera;

        this.time =
            0;
    }

    update(dt) {

        if (
            !STATE.ambient
        ) {
            return;
        }

        this.time += dt;

        /*
         * Automatic drifting.
         */
        this.camera.position.x +=
            Math.sin(this.time * 0.15) *
            0.006;

        this.camera.position.y +=
            Math.cos(this.time * 0.11) *
            0.005;

        this.camera.position.z +=
            Math.sin(this.time * 0.08) *
            0.008;

        /*
         * Automatic rotation.
         */
        this.camera.yaw +=
            0.0008;

        this.camera.pitch +=
            Math.sin(
                this.time * 0.08
            ) *
            0.00015;
    }

    enter() {

        STATE.ambient = true;
    }

    exit() {

        STATE.ambient = false;
    }
}

export function shouldEnterAmbient(
    idleTime
) {

    return (
        idleTime >=
        CONFIG.AMBIENT.IDLE_TIME
    );
}