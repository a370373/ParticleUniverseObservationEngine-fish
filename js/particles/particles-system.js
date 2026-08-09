export class ParticleSystem {

    constructor(
        THREE,
        nebula
    ) {

        this.THREE =
            THREE;

        this.data =
            nebula;


        /*
         * =================================================
         * GEOMETRY
         * =================================================
         */

        this.geometry =
            new THREE.BufferGeometry();


        this.geometry.setAttribute(

            "position",

            new THREE.BufferAttribute(

                nebula.positions,

                3
            )
        );


        this.geometry.setAttribute(

            "color",

            new THREE.BufferAttribute(

                nebula.colors,

                3
            )
        );


        this.geometry.setAttribute(

            "aSize",

            new THREE.BufferAttribute(

                nebula.sizes,

                1
            )
        );


        /*
         * =================================================
         * MATERIAL
         * =================================================
         */

        this.material =
            new THREE.ShaderMaterial({

                transparent:
                    true,

                depthWrite:
                    false,

                depthTest:
                    true,

                vertexColors:
                    true,

                blending:
                    THREE.AdditiveBlending,


                uniforms: {

                    uTime: {

                        value:
                            0
                    },


                    uPixelRatio: {

                        value:

                            Math.min(

                                window.devicePixelRatio || 1,

                                2
                            )
                    }
                },


                /*
                 * =================================================
                 * VERTEX SHADER
                 * =================================================
                 */

                vertexShader: `

                    attribute float aSize;

                    varying vec3 vColor;

                    uniform float uTime;

                    uniform float uPixelRatio;


                    void main() {

                        vColor = color;


                        vec3 p =
                            position;


                        /*
                         * Very subtle particle breathing.
                         */

                        float wave =

                            sin(

                                uTime * 0.0005 +

                                p.x * 0.03 +

                                p.y * 0.02

                            );


                        vec3 direction =

                            normalize(

                                p +

                                vec3(
                                    0.001
                                )
                            );


                        p +=

                            direction *

                            wave *

                            0.015;


                        /*
                         * Model → View.
                         */

                        vec4 mv =

                            modelViewMatrix *

                            vec4(
                                p,
                                1.0
                            );


                        /*
                         * Distance based size.
                         */

                        float distanceScale =

                            70.0 /

                            max(
                                0.5,
                                -mv.z
                            );


                        gl_PointSize =

                            aSize *

                            uPixelRatio *

                            distanceScale;


                        /*
                         * Avoid absurdly huge
                         * points when extremely close.
                         */

                        gl_PointSize =

                            min(
                                gl_PointSize,
                                64.0
                            );


                        gl_Position =

                            projectionMatrix *

                            mv;
                    }
                `,


                /*
                 * =================================================
                 * FRAGMENT SHADER
                 * =================================================
                 */

                fragmentShader: `

                    varying vec3 vColor;


                    void main() {

                        vec2 uv =

                            gl_PointCoord -

                            vec2(
                                0.5
                            );


                        float d =

                            length(
                                uv
                            );


                        if (
                            d > 0.5
                        ) {

                            discard;
                        }


                        /*
                         * Soft circular glow.
                         */

                        float glow =

                            1.0 -

                            smoothstep(

                                0.05,

                                0.5,

                                d
                            );


                        /*
                         * Slight center brightness.
                         */

                        float core =

                            1.0 -

                            smoothstep(

                                0.0,

                                0.22,

                                d
                            );


                        float alpha =

                            glow *

                            (
                                0.35 +
                                core * 0.65
                            );


                        vec3 finalColor =

                            vColor *

                            (
                                0.55 +
                                glow
                            );


                        gl_FragColor =

                            vec4(

                                finalColor,

                                alpha
                            );
                    }
                `
            });


        /*
         * =================================================
         * POINTS
         * =================================================
         */

        this.points =
            new THREE.Points(
                this.geometry,
                this.material
            );


        /*
         * Frustum culling can incorrectly remove
         * large deformed particle clouds.
         *
         * Keep it visible.
         */

        this.points.frustumCulled =
            false;
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
            !this.geometry ||
            !this.material ||
            !this.data
        ) {

            return;
        }


        /*
         * Shader animation.
         */

        this.material
            .uniforms
            .uTime
            .value =
            time;


        const positionAttribute =
            this.geometry
                .attributes
                .position;


        const positionArray =
            positionAttribute.array;


        const base =
            this.data.positions;


        const drift =
            this.data.drift;


        const phase =
            this.data.phase;


        const state =
            this.data.state;


        /*
         * =================================================
         * ORGANIC PARTICLE MOTION
         *
         * IMPORTANT:
         *
         * We calculate from the original position
         * every frame rather than repeatedly adding
         * drift to the current position.
         *
         * This prevents infinite numerical drift.
         * =================================================
         */

        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            const baseX =
                base[n];


            const baseY =
                base[n + 1];


            const baseZ =
                base[n + 2];


            let x =
                baseX;


            let y =
                baseY;


            let z =
                baseZ;


            if (
                state === "STABLE" ||
                state === "SUMMONING"
            ) {

                x +=

                    drift[n] *

                    Math.sin(

                        time * 0.0004 +

                        phase[i]
                    );


                y +=

                    drift[n + 1] *

                    Math.cos(

                        time * 0.00035 +

                        phase[i]
                    );


                z +=

                    drift[n + 2] *

                    Math.sin(

                        time * 0.0003 +

                        phase[i]
                    );
            }


            positionArray[n] =
                x;


            positionArray[n + 1] =
                y;


            positionArray[n + 2] =
                z;
        }


        positionAttribute
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * COLLAPSE
     * =====================================================
     */

    applyCollapse(
        progress
    ) {

        if (
            !this.geometry ||
            !this.data
        ) {

            return;
        }


        const positionAttribute =
            this.geometry
                .attributes
                .position;


        const positionArray =
            positionAttribute.array;


        const base =
            this.data.positions;


        const p =
            Math.max(
                0,
                Math.min(
                    1,
                    progress
                )
            );


        const power =
            1 - p;


        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            positionArray[n] =

                base[n] *

                power;


            positionArray[n + 1] =

                base[n + 1] *

                power;


            positionArray[n + 2] =

                base[n + 2] *

                power;
        }


        positionAttribute
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * EXPLOSION
     * =====================================================
     */

    explode(
        progress
    ) {

        if (
            !this.geometry
        ) {

            return;
        }


        const positionAttribute =
            this.geometry
                .attributes
                .position;


        const positionArray =
            positionAttribute.array;


        const p =
            Math.max(
                0,
                Math.min(
                    1,
                    progress
                )
            );


        /*
         * Explosion strength.
         */

        const strength =
            0.4 *
            (1 - p);


        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            const x =
                positionArray[n];


            const y =
                positionArray[n + 1];


            const z =
                positionArray[n + 2];


            const length =

                Math.sqrt(

                    x * x +

                    y * y +

                    z * z

                ) || 1;


            positionArray[n] +=

                (
                    x / length
                ) *

                strength;


            positionArray[n + 1] +=

                (
                    y / length
                ) *

                strength;


            positionArray[n + 2] +=

                (
                    z / length
                ) *

                strength;
        }


        positionAttribute
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * RESET TO ORIGINAL POSITIONS
     * =====================================================
     */

    resetPositions() {

        if (
            !this.geometry ||
            !this.data
        ) {

            return;
        }


        const positionAttribute =
            this.geometry
                .attributes
                .position;


        positionAttribute.array.set(
            this.data.positions
        );


        positionAttribute
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * DISPOSE
     * =====================================================
     */

    dispose() {

        try {

            this.geometry?.dispose();

        } catch (_) {}


        try {

            this.material?.dispose();

        } catch (_) {}
    }
}