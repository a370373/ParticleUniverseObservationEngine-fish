/*
 * =========================================================
 * PARTICLE UNIVERSE — MINIMAL VISUAL TEST
 * =========================================================
 *
 * 目的：
 * 先確認：
 *
 * THREE
 *   ↓
 * Scene
 *   ↓
 * Camera
 *   ↓
 * Points
 *   ↓
 * Renderer
 *
 * 整條渲染管線正常。
 *
 * 暫時不使用：
 * - nebula-generator
 * - Base64 image
 * - ParticleSystem
 * - Observer
 * - Roaming
 * - Shuffle
 * - Observation
 *
 * =========================================================
 */


export class Universe {

    constructor(
        THREE,
        scene,
        cameraController
    ) {

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
         * CREATE STAR FIELD
         * =================================================
         */

        this.createStarField();


        /*
         * =================================================
         * CREATE DUST
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
            "[Universe] MINIMAL UNIVERSE READY"
        );
    }


    /*
     * =====================================================
     * STAR FIELD
     * =====================================================
     */

    createStarField() {

        const THREE =
            this.THREE;


        const count =
            5000;


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

            const index =
                i * 3;


            /*
             * Large spherical universe
             */

            const radius =
                200 +
                Math.random() * 1800;


            const theta =
                Math.random() *
                Math.PI *
                2;


            const phi =
                Math.acos(
                    Math.random() * 2 - 1
                );


            positions[index] =
                radius *
                Math.sin(phi) *
                Math.cos(theta);


            positions[index + 1] =
                radius *
                Math.sin(phi) *
                Math.sin(theta);


            positions[index + 2] =
                radius *
                Math.cos(phi);


            /*
             * Slightly varied brightness
             */

            const brightness =
                0.35 +
                Math.random() *
                0.65;


            colors[index] =
                brightness;


            colors[index + 1] =
                brightness;


            colors[index + 2] =
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
                    2.5,

                vertexColors:
                    true,

                transparent:
                    true,

                opacity:
                    0.9,

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
            1800;


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

            const index =
                i * 3;


            const radius =
                100 +
                Math.random() * 1000;


            const theta =
                Math.random() *
                Math.PI *
                2;


            const phi =
                Math.acos(
                    Math.random() * 2 - 1
                );


            positions[index] =
                radius *
                Math.sin(phi) *
                Math.cos(theta);


            positions[index + 1] =
                radius *
                Math.sin(phi) *
                Math.sin(theta);


            positions[index + 2] =
                radius *
                Math.cos(phi);
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
                    1.2,

                color:
                    0x6688aa,

                transparent:
                    true,

                opacity:
                    0.25,

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

        /*
         * Slowly rotate the universe.
         */

        if (
            this.stars
        ) {

            this.stars.rotation.y +=
                dt * 0.02;
        }


        if (
            this.dust
        ) {

            this.dust.rotation.y -=
                dt * 0.008;
        }
    }


    /*
     * =====================================================
     * PLACEHOLDER METHODS
     * =====================================================
     *
     * These keep the rest of the application from
     * crashing while we are testing the renderer.
     */


    async startNewCycle() {

        console.log(
            "[Universe] startNewCycle() ignored during minimal test."
        );
    }


    async shuffle() {

        console.log(
            "[Universe] shuffle() ignored during minimal test."
        );
    }


    async completeObservation() {

        console.log(
            "[Universe] completeObservation() ignored during minimal test."
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