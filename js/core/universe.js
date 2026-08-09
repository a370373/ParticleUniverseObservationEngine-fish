/*
 * =========================================================
 * PARTICLE UNIVERSE
 * VISUAL BOOT TEST
 * =========================================================
 */

export class Universe {

    constructor(
        THREE,
        scene,
        cameraController
    ) {

        console.log(
            "[Universe] CONSTRUCTOR START"
        );

        this.THREE =
            THREE;

        this.scene =
            scene;

        this.camera =
            cameraController;

        this.stars =
            null;

        this.dust =
            null;

        this.nebula =
            null;

        this.particleSystem =
            null;

        this.ready =
            false;


        /*
         * =================================================
         * CAMERA DEBUG
         * =================================================
         */

        if (
            this.camera &&
            this.camera.camera
        ) {

            console.log(
                "[Universe] CAMERA POSITION:",
                this.camera.camera.position.x,
                this.camera.camera.position.y,
                this.camera.camera.position.z
            );

        } else {

            console.warn(
                "[Universe] CAMERA CONTROLLER INVALID"
            );
        }


        /*
         * =================================================
         * STARS
         * =================================================
         */

        this.createStars();


        /*
         * =================================================
         * DUST
         * =================================================
         */

        this.createDust();


        /*
         * =================================================
         * READY
         * =================================================
         */

        this.ready =
            true;

        console.log(
            "[Universe] READY"
        );
    }


    /*
     * =====================================================
     * CREATE STARS
     * =====================================================
     */

    createStars() {

        console.log(
            "[Universe] CREATING STARS"
        );


        const THREE =
            this.THREE;


        const count =
            4000;


        const geometry =
            new THREE.BufferGeometry();


        const positions =
            new Float32Array(
                count * 3
            );


        const colors =
            new Float32Array(
                count * 3
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const n =
                i * 3;


            /*
             * Camera looks toward -Z.
             *
             * Therefore stars are placed
             * directly in front of camera.
             */

            positions[n] =
                (Math.random() - 0.5) *
                1600;


            positions[n + 1] =
                (Math.random() - 0.5) *
                900;


            positions[n + 2] =
                -100 -
                Math.random() *
                1400;


            const brightness =
                0.65 +
                Math.random() *
                0.35;


            colors[n] =
                brightness;

            colors[n + 1] =
                brightness;

            colors[n + 2] =
                brightness;
        }


        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );


        geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(
                colors,
                3
            )
        );


        const material =
            new THREE.PointsMaterial({

                size:
                    3,

                vertexColors:
                    true,

                transparent:
                    true,

                opacity:
                    1,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending
            });


        this.stars =
            new THREE.Points(
                geometry,
                material
            );


        this.scene.add(
            this.stars
        );


        console.log(
            "[Universe] STARS ADDED:",
            count
        );
    }


    /*
     * =====================================================
     * CREATE DUST
     * =====================================================
     */

    createDust() {

        console.log(
            "[Universe] CREATING DUST"
        );


        const THREE =
            this.THREE;


        const count =
            1500;


        const geometry =
            new THREE.BufferGeometry();


        const positions =
            new Float32Array(
                count * 3
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const n =
                i * 3;


            positions[n] =
                (Math.random() - 0.5) *
                1400;


            positions[n + 1] =
                (Math.random() - 0.5) *
                800;


            positions[n + 2] =
                -150 -
                Math.random() *
                1200;
        }


        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );


        const material =
            new THREE.PointsMaterial({

                size:
                    4,

                color:
                    0xffffff,

                transparent:
                    true,

                opacity:
                    0.18,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending
            });


        this.dust =
            new THREE.Points(
                geometry,
                material
            );


        this.scene.add(
            this.dust
        );


        console.log(
            "[Universe] DUST ADDED:",
            count
        );
    }


    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    update(
        time,
        dt
    ) {

        if (
            this.stars
        ) {

            this.stars.rotation.y +=
                dt * 0.01;
        }


        if (
            this.dust
        ) {

            this.dust.rotation.y -=
                dt * 0.005;
        }
    }


    /*
     * =====================================================
     * REAL API
     * =====================================================
     */

    async startNewCycle() {

        console.log(
            "[Universe] START NEW CYCLE"
        );

        /*
         * Particle generation will be
         * reconnected after the visual
         * pipeline is confirmed.
         */

        return;
    }


    async shuffle() {

        console.log(
            "[Universe] SHUFFLE"
        );

        return;
    }


    async completeObservation() {

        console.log(
            "[Universe] COMPLETE OBSERVATION"
        );

        return;
    }


    disposeParticleSystem() {

        if (
            !this.particleSystem
        ) {

            return;
        }


        try {

            this.scene.remove(
                this.particleSystem.points
            );

        } catch (_) {}


        try {

            this.particleSystem.dispose();

        } catch (_) {}


        this.particleSystem =
            null;
    }
}