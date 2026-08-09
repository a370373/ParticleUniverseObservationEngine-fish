/*
 * =========================================================
 * PARTICLE UNIVERSE
 * MINIMAL VISUAL TEST
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
         * CREATE VISIBLE STARS
         * =================================================
         */

        this.createStars();


        /*
         * =================================================
         * CREATE VISIBLE DUST
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
     * STARS
     * =====================================================
     */

    createStars() {

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
             * Put stars directly
             * inside the visible area.
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
                0.5 +
                Math.random() *
                0.5;


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
     * DUST
     * =====================================================
     */

    createDust() {

        const THREE =
            this.THREE;


        const count =
            1200;


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
                1300;


            positions[n + 1] =
                (Math.random() - 0.5) *
                750;


            positions[n + 2] =
                -120 -
                Math.random() *
                1100;
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
                    5,

                color:
                    0x8899ff,

                transparent:
                    true,

                opacity:
                    0.2,

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
     * PLACEHOLDERS
     * =====================================================
     */

    async startNewCycle() {

        console.log(
            "[Universe] startNewCycle TEST MODE"
        );
    }


    async shuffle() {

        console.log(
            "[Universe] shuffle TEST MODE"
        );
    }


    async completeObservation() {

        console.log(
            "[Universe] observation TEST MODE"
        );
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