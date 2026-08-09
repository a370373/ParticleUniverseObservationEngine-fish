import { CONFIG } from "../config.js";

export class CameraController {

    constructor(THREE) {

        this.THREE = THREE;

        this.position =
            new THREE.Vector3(
                0,
                0,
                35
            );

        this.yaw = 0;
        this.pitch = 0;

        this.velocity =
            new THREE.Vector3();

        this.keys = new Set();

        this.zoomVelocity = 0;

        this.friction =
            CONFIG.CAMERA.FRICTION;
    }

    createCamera() {

        this.camera =
            new this.THREE.PerspectiveCamera(
                CONFIG.CAMERA.FOV,
                window.innerWidth /
                window.innerHeight,
                0.001,
                Infinity
            );

        this.camera.position.copy(
            this.position
        );

        return this.camera;
    }

    resize() {

        if (!this.camera) {
            return;
        }

        this.camera.aspect =
            window.innerWidth /
            window.innerHeight;

        this.camera.updateProjectionMatrix();
    }

    rotate(dx, dy) {

        this.yaw -=
            dx * CONFIG.CAMERA.ROTATION_SPEED;

        this.pitch -=
            dy * CONFIG.CAMERA.ROTATION_SPEED;

        /*
         * Not clamped to ±90 degrees.
         *
         * This allows full 360-degree exploration.
         */
        this.pitch =
            Math.max(
                -Math.PI * 0.4999,
                Math.min(
                    Math.PI * 0.4999,
                    this.pitch
                )
            );
    }

    zoom(amount) {

        /*
         * No artificial minimum / maximum
         * distance is imposed.
         */
        this.position.z += amount;
    }

    update(dt) {

        if (!this.camera) {
            return;
        }

        const direction =
            new this.THREE.Vector3();

        if (
            this.keys.has("w") ||
            this.keys.has("arrowup")
        ) {
            direction.z -= 1;
        }

        if (
            this.keys.has("s") ||
            this.keys.has("arrowdown")
        ) {
            direction.z += 1;
        }

        if (
            this.keys.has("a") ||
            this.keys.has("arrowleft")
        ) {
            direction.x -= 1;
        }

        if (
            this.keys.has("d") ||
            this.keys.has("arrowright")
        ) {
            direction.x += 1;
        }

        if (direction.lengthSq() > 0) {

            direction.normalize();

            const speed =
                CONFIG.CAMERA.MOVE_SPEED *
                dt *
                60;

            this.velocity.addScaledVector(
                direction,
                speed
            );
        }

        this.velocity.multiplyScalar(
            Math.pow(
                this.friction,
                dt * 60
            )
        );

        this.position.add(
            this.velocity
        );

        this.camera.position.copy(
            this.position
        );

        const look =
            new this.THREE.Vector3(
                Math.sin(this.yaw),
                Math.sin(this.pitch),
                -Math.cos(this.yaw)
            );

        const target =
            this.position.clone()
                .add(look);

        this.camera.lookAt(target);
    }

    getForward() {

        return new this.THREE.Vector3(
            Math.sin(this.yaw),
            Math.sin(this.pitch),
            -Math.cos(this.yaw)
        ).normalize();
    }
}