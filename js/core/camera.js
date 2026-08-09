import { CONFIG } from "../config.js";


export class CameraController {

    constructor(THREE) {

        this.THREE =
            THREE;


        /*
         * =================================================
         * CAMERA POSITION
         * =================================================
         *
         * CameraController 是 Camera position
         * 的唯一狀態來源。
         *
         * 不要讓其他模組只修改：
         *
         * this.camera.position
         *
         * 如果需要修改鏡頭位置，
         * 請使用 setPosition()。
         * =================================================
         */

        this.position =
            new THREE.Vector3(
                0,
                0,
                35
            );


        /*
         * =================================================
         * ROTATION
         * =================================================
         */

        this.yaw =
            0;

        this.pitch =
            0;


        /*
         * =================================================
         * MOVEMENT
         * =================================================
         */

        this.velocity =
            new THREE.Vector3();


        this.keys =
            new Set();


        this.zoomVelocity =
            0;


        /*
         * =================================================
         * FRICTION
         * =================================================
         */

        this.friction =
            CONFIG.CAMERA.FRICTION;


        /*
         * =================================================
         * INITIALIZATION STATE
         * =================================================
         */

        this.__created =
            false;
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

                window.innerWidth /
                window.innerHeight,

                0.001,

                Infinity

            );


        /*
         * =================================================
         * INITIAL POSITION
         * =================================================
         */

        this.camera.position.copy(
            this.position
        );


        /*
         * =================================================
         * INITIAL LOOK
         * =================================================
         *
         * yaw = 0
         * pitch = 0
         *
         * => looking toward -Z
         * =================================================
         */

        const look =
            this.getForward();


        const target =
            this.position.clone()
                .add(look);


        this.camera.lookAt(
            target
        );


        this.__created =
            true;


        return this.camera;
    }


    /*
     * =====================================================
     * SET POSITION
     * =====================================================
     *
     * IMPORTANT:
     *
     * This is the correct way for Universe / other
     * systems to reposition the camera.
     *
     * It updates BOTH:
     *
     * 1. CameraController.position
     * 2. THREE.Camera.position
     *
     * Therefore the next update() will NOT overwrite it.
     * =====================================================
     */

    setPosition(
        x,
        y,
        z
    ) {

        this.position.set(
            Number(x) || 0,
            Number(y) || 0,
            Number(z) || 0
        );


        if (
            this.camera
        ) {

            this.camera.position.copy(
                this.position
            );


            this.updateLookAt();
        }
    }


    /*
     * =====================================================
     * SET VECTOR POSITION
     * =====================================================
     */

    setPositionVector(
        vector
    ) {

        if (
            !vector
        ) {

            return;
        }


        this.setPosition(
            vector.x,
            vector.y,
            vector.z
        );
    }


    /*
     * =====================================================
     * GET POSITION
     * =====================================================
     */

    getPosition() {

        return this.position.clone();
    }


    /*
     * =====================================================
     * UPDATE LOOK AT
     * =====================================================
     */

    updateLookAt() {

        if (
            !this.camera
        ) {

            return;
        }


        const look =
            this.getForward();


        const target =
            this.position.clone()
                .add(look);


        this.camera.lookAt(
            target
        );
    }


    /*
     * =====================================================
     * RESIZE
     * =====================================================
     */

    resize() {

        if (
            !this.camera
        ) {

            return;
        }


        this.camera.aspect =
            window.innerWidth /
            window.innerHeight;


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

        this.yaw -=
            dx *
            CONFIG.CAMERA.ROTATION_SPEED;


        this.pitch -=
            dy *
            CONFIG.CAMERA.ROTATION_SPEED;


        /*
         * =================================================
         * PITCH LIMIT
         * =================================================
         *
         * Prevents the camera from reaching exactly
         * straight up / straight down.
         *
         * Horizontal yaw remains unlimited.
         * =================================================
         */

        this.pitch =
            Math.max(

                -Math.PI * 0.4999,

                Math.min(
                    Math.PI * 0.4999,
                    this.pitch
                )

            );


        /*
         * Update immediately.
         */

        this.updateLookAt();
    }


    /*
     * =====================================================
     * ZOOM
     * =====================================================
     */

    zoom(
        amount
    ) {

        /*
         * =================================================
         * IMPORTANT
         * =================================================
         *
         * Zoom modifies the controller's position,
         * not just THREE.Camera.position.
         *
         * Therefore the next update() will preserve it.
         * =================================================
         */

        this.position.z +=
            amount;


        if (
            this.camera
        ) {

            this.camera.position.copy(
                this.position
            );


            this.updateLookAt();
        }
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


        /*
         * =================================================
         * MOVEMENT DIRECTION
         * =================================================
         */

        const direction =
            new this.THREE.Vector3();


        /*
         * FORWARD
         */

        if (
            this.keys.has("w") ||
            this.keys.has("arrowup")
        ) {

            direction.z -= 1;
        }


        /*
         * BACKWARD
         */

        if (
            this.keys.has("s") ||
            this.keys.has("arrowdown")
        ) {

            direction.z += 1;
        }


        /*
         * LEFT
         */

        if (
            this.keys.has("a") ||
            this.keys.has("arrowleft")
        ) {

            direction.x -= 1;
        }


        /*
         * RIGHT
         */

        if (
            this.keys.has("d") ||
            this.keys.has("arrowright")
        ) {

            direction.x += 1;
        }


        /*
         * =================================================
         * APPLY MOVEMENT
         * =================================================
         */

        if (
            direction.lengthSq() >
            0
        ) {

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
         * SYNC THREE CAMERA
         * =================================================
         */

        this.camera.position.copy(
            this.position
        );


        /*
         * =================================================
         * LOOK DIRECTION
         * =================================================
         */

        this.updateLookAt();
    }


    /*
     * =====================================================
     * FORWARD VECTOR
     * =====================================================
     */

    getForward() {

        return new this.THREE.Vector3(

            Math.sin(
                this.yaw
            ),

            Math.sin(
                this.pitch
            ),

            -Math.cos(
                this.yaw
            )

        ).normalize();
    }


    /*
     * =====================================================
     * DEBUG STATE
     * =====================================================
     */

    getDebugState() {

        return {

            position: {

                x:
                    this.position.x,

                y:
                    this.position.y,

                z:
                    this.position.z

            },

            yaw:
                this.yaw,

            pitch:
                this.pitch,

            velocity: {

                x:
                    this.velocity.x,

                y:
                    this.velocity.y,

                z:
                    this.velocity.z

            },

            created:
                this.__created

        };
    }
}