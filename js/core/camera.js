import { CONFIG } from "../config.js";

export class CameraController {

    constructor(THREE) {

        this.THREE = THREE;

        /*
         * =====================================================
         * CAMERA STATE
         * =====================================================
         */

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

        this.keys =
            new Set();

        this.zoomVelocity = 0;

        this.friction =
            CONFIG.CAMERA.FRICTION;

        /*
         * TRUE THREE CAMERA
         *
         * CameraController is the single owner.
         */

        this.camera = null;
    }


    /*
     * =====================================================
     * CREATE CAMERA
     * =====================================================
     */

    createCamera() {

        this.camera =
            new this.THREE.PerspectiveCamera(
                CONFIG.CAMERA.FOV,
                Math.max(
                    1,
                    window.innerWidth
                ) /
                Math.max(
                    1,
                    window.innerHeight
                ),
                0.001,
                1000000
            );

        this.camera.position.copy(
            this.position
        );

        this.updateLookDirection();

        return this.camera;
    }


    /*
     * =====================================================
     * RESIZE
     * =====================================================
     */

    resize() {

        if (!this.camera) {
            return;
        }

        const width =
            Math.max(
                1,
                window.innerWidth
            );

        const height =
            Math.max(
                1,
                window.innerHeight
            );

        this.camera.aspect =
            width / height;

        this.camera.updateProjectionMatrix();
    }


    /*
     * =====================================================
     * ROTATE
     * =====================================================
     */

    rotate(
        dx,
        dy
    ) {

        if (
            !Number.isFinite(dx) ||
            !Number.isFinite(dy)
        ) {
            return;
        }

        this.yaw -=
            dx *
            CONFIG.CAMERA.ROTATION_SPEED;

        this.pitch -=
            dy *
            CONFIG.CAMERA.ROTATION_SPEED;

        this.pitch =
            Math.max(
                -Math.PI * 0.4999,
                Math.min(
                    Math.PI * 0.4999,
                    this.pitch
                )
            );

        this.updateLookDirection();
    }


    /*
     * =====================================================
     * ZOOM
     *
     * Zoom follows the camera's current forward vector.
     *
     * Positive amount:
     * move forward/backward according to the caller.
     * =====================================================
     */

    zoom(
        amount
    ) {

        if (
            !Number.isFinite(amount)
        ) {
            return;
        }

        const forward =
            this.getForward();

        /*
         * Move along camera direction.
         */

        this.position.addScaledVector(
            forward,
            -amount
        );

        this.validatePosition();

        this.syncCameraPosition();
    }


    /*
     * =====================================================
     * SET POSITION
     *
     * Universe should use this instead of directly
     * modifying camera.position.
     * =====================================================
     */

    setPosition(
        x,
        y,
        z
    ) {

        if (
            Number.isFinite(x) &&
            Number.isFinite(y) &&
            Number.isFinite(z)
        ) {

            this.position.set(
                x,
                y,
                z
            );
        }

        this.validatePosition();

        this.syncCameraPosition();
    }


    /*
     * =====================================================
     * LOOK AT POINT
     * =====================================================
     */

    lookAtPoint(
        x,
        y,
        z
    ) {

        if (
            !this.camera
        ) {
            return;
        }

        const target =
            new this.THREE.Vector3(
                Number.isFinite(Number(x))
                    ? Number(x)
                    : 0,

                Number.isFinite(Number(y))
                    ? Number(y)
                    : 0,

                Number.isFinite(Number(z))
                    ? Number(z)
                    : 0
            );

        const direction =
            target
                .clone()
                .sub(this.position);

        if (
            direction.lengthSq() <
            0.000001
        ) {

            return;
        }

        direction.normalize();

        /*
         * Coordinate convention:
         *
         * forward =
         *
         * (
         *     sin(yaw),
         *     sin(pitch),
         *    -cos(yaw)
         * )
         */

        this.yaw =
            Math.atan2(
                direction.x,
                -direction.z
            );

        this.pitch =
            Math.asin(
                Math.max(
                    -1,
                    Math.min(
                        1,
                        direction.y
                    )
                )
            );

        this.pitch =
            Math.max(
                -Math.PI * 0.4999,
                Math.min(
                    Math.PI * 0.4999,
                    this.pitch
                )
            );

        this.updateLookDirection();
    }


    /*
     * =====================================================
     * SYNC CAMERA POSITION
     * =====================================================
     */

    syncCameraPosition() {

        if (
            !this.camera
        ) {
            return;
        }

        this.camera.position.copy(
            this.position
        );
    }


    /*
     * =====================================================
     * UPDATE LOOK DIRECTION
     * =====================================================
     */

    updateLookDirection() {

        if (
            !this.camera
        ) {
            return;
        }

        const forward =
            this.getForward();

        const target =
            this.position
                .clone()
                .add(forward);

        this.camera.lookAt(
            target
        );
    }


    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    update(
        dt
    ) {

        if (
            !this.camera
        ) {
            return;
        }

        if (
            !Number.isFinite(dt) ||
            dt <= 0
        ) {

            dt =
                1 / 60;
        }


        /*
         * =================================================
         * INPUT
         * =================================================
         */

        const localDirection =
            new this.THREE.Vector3();


        /*
         * W / UP
         *
         * Forward
         */

        if (
            this.keys.has("w") ||
            this.keys.has("arrowup")
        ) {

            localDirection.z -= 1;
        }


        /*
         * S / DOWN
         *
         * Backward
         */

        if (
            this.keys.has("s") ||
            this.keys.has("arrowdown")
        ) {

            localDirection.z += 1;
        }


        /*
         * A / LEFT
         *
         * Left
         */

        if (
            this.keys.has("a") ||
            this.keys.has("arrowleft")
        ) {

            localDirection.x -= 1;
        }


        /*
         * D / RIGHT
         *
         * Right
         */

        if (
            this.keys.has("d") ||
            this.keys.has("arrowright")
        ) {

            localDirection.x += 1;
        }


        /*
         * =================================================
         * CONVERT LOCAL MOVEMENT TO WORLD MOVEMENT
         * =================================================
         */

        if (
            localDirection.lengthSq() >
            0
        ) {

            localDirection.normalize();

            /*
             * Horizontal forward vector.
             */

            const forward =
                new this.THREE.Vector3(
                    Math.sin(this.yaw),
                    0,
                    -Math.cos(this.yaw)
                );


            /*
             * Horizontal right vector.
             */

            const right =
                new this.THREE.Vector3(
                    Math.cos(this.yaw),
                    0,
                    Math.sin(this.yaw)
                );


            const worldDirection =
                new this.THREE.Vector3();

            worldDirection
                .addScaledVector(
                    forward,
                    -localDirection.z
                );

            worldDirection
                .addScaledVector(
                    right,
                    localDirection.x
                );

            if (
                worldDirection.lengthSq() >
                0
            ) {

                worldDirection.normalize();

                const speed =
                    CONFIG.CAMERA.MOVE_SPEED *
                    dt *
                    60;

                this.velocity.addScaledVector(
                    worldDirection,
                    speed
                );
            }
        }


        /*
         * =================================================
         * FRICTION
         * =================================================
         */

        this.velocity.multiplyScalar(
            Math.pow(
                this.friction,
                dt * 60
            )
        );


        /*
         * =================================================
         * POSITION
         * =================================================
         */

        this.position.add(
            this.velocity
        );


        /*
         * =================================================
         * SAFETY
         * =================================================
         */

        this.validatePosition();


        /*
         * =================================================
         * APPLY
         * =================================================
         */

        this.syncCameraPosition();

        this.updateLookDirection();
    }


    /*
     * =====================================================
     * POSITION SAFETY
     * =====================================================
     */

    validatePosition() {

        if (
            !Number.isFinite(
                this.position.x
            ) ||
            !Number.isFinite(
                this.position.y
            ) ||
            !Number.isFinite(
                this.position.z
            )
        ) {

            this.position.set(
                0,
                0,
                35
            );

            this.velocity.set(
                0,
                0,
                0
            );

            return;
        }


        if (
            !Number.isFinite(
                this.velocity.x
            ) ||
            !Number.isFinite(
                this.velocity.y
            ) ||
            !Number.isFinite(
                this.velocity.z
            )
        ) {

            this.velocity.set(
                0,
                0,
                0
            );
        }
    }


    /*
     * =====================================================
     * FORWARD
     * =====================================================
     */

    getForward() {

        return new this.THREE.Vector3(
            Math.sin(this.yaw),
            Math.sin(this.pitch),
            -Math.cos(this.yaw)
        ).normalize();
    }


    /*
     * =====================================================
     * GET CAMERA
     *
     * Useful for systems that need the REAL THREE.Camera.
     * =====================================================
     */

    getCamera() {

        return this.camera;
    }
}