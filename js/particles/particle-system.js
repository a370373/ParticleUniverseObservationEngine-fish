/*
 * =========================================================
 * PARTICLE SYSTEM
 *
 * Nebula data
 *      ↓
 * BufferGeometry
 *      ↓
 * ShaderMaterial
 *      ↓
 * THREE.Points
 *
 * This module DOES NOT generate the nebula.
 * It renders and animates already-generated particle data.
 * =========================================================
 */

export class ParticleSystem {

    constructor(
        THREE,
        nebula
    ) {

        if (!THREE) {

            throw new Error(
                "[ParticleSystem] THREE is required."
            );
        }


        if (!nebula) {

            throw new Error(
                "[ParticleSystem] Nebula data is required."
            );
        }


        console.log(
            "[ParticleSystem] CONSTRUCTOR"
        );


        this.THREE =
            THREE;


        this.data =
            nebula;


        this.geometry =
            null;


        this.material =
            null;


        this.points =
            null;


        this.createGeometry();

        this.createMaterial();

        this.createPoints();


        console.log(
            "[ParticleSystem] READY:",
            nebula.count,
            "PARTICLES"
        );
    }


    /*
     * =====================================================
     * GEOMETRY
     * =====================================================
     */

    createGeometry() {

        const THREE =
            this.THREE;


        this.geometry =
            new THREE.BufferGeometry();


        this.geometry.setAttribute(

            "position",

            new THREE.BufferAttribute(

                this.data.positions,

                3
            )
        );


        this.geometry.setAttribute(

            "color",

            new THREE.BufferAttribute(

                this.data.colors,

                3
            )
        );


        this.geometry.setAttribute(

            "aSize",

            new THREE.BufferAttribute(

                this.data.sizes,

                1
            )
        );
    }


    /*
     * =====================================================
     * MATERIAL
     * =====================================================
     */

    createMaterial() {

        const THREE =
            this.THREE;


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

                                window.devicePixelRatio ||
                                1,

                                2
                            )
                    },

                    uOpacity: {

                        value:
                            1
                    },

                    uBrightness: {

                        value:
                            1
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

                        vColor =
                            color;


                        vec3 p =
                            position;


                        /*
                         * Subtle breathing.
                         */

                        float wave =

                            sin(

                                uTime * 0.0005 +

                                p.x * 0.03 +

                                p.y * 0.02 +

                                p.z * 0.015

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
                         * Distance based particle size.
                         *
                         * Close particles become large.
                         * Distant particles become small.
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
                         * Prevent enormous particles
                         * when the camera enters the cloud.
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

                    uniform float uOpacity;

                    uniform float uBrightness;


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
                         * Soft particle glow.
                         */

                        float glow =

                            1.0 -

                            smoothstep(

                                0.05,

                                0.5,

                                d
                            );


                        /*
                         * Bright particle core.
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

                                core *
                                0.65
                            ) *

                            uOpacity;


                        vec3 finalColor =

                            vColor *

                            (
                                0.55 +

                                glow
                            ) *

                            uBrightness;


                        gl_FragColor =

                            vec4(

                                finalColor,

                                alpha
                            );
                    }
                `
            });
    }


    /*
     * =====================================================
     * POINTS
     * =====================================================
     */

    createPoints() {

        const THREE =
            this.THREE;


        this.points =
            new THREE.Points(

                this.geometry,

                this.material
            );


        /*
         * Large procedural clouds may exceed
         * the normal bounding volume.
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
         * Shader time.
         */

        this.material
            .uniforms
            .uTime
            .value =
            time;


        /*
         * Pixel ratio may change after resize.
         */

        this.material
            .uniforms
            .uPixelRatio
            .value =

            Math.min(

                window.devicePixelRatio ||
                1,

                2
            );


        const positionAttribute =
            this.geometry
                .attributes
                .position;


        if (!positionAttribute) {

            return;
        }


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
         * NORMAL PARTICLE LIFE
         * =================================================
         */

        if (
            state === "STABLE" ||
            state === "SUMMONING"
        ) {

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


                positionArray[n] =

                    baseX +

                    drift[n] *

                    Math.sin(

                        time * 0.0004 +

                        phase[i]
                    );


                positionArray[n + 1] =

                    baseY +

                    drift[n + 1] *

                    Math.cos(

                        time * 0.00035 +

                        phase[i]
                    );


                positionArray[n + 2] =

                    baseZ +

                    drift[n + 2] *

                    Math.sin(

                        time * 0.0003 +

                        phase[i]
                    );
            }


            positionAttribute
                .needsUpdate =
                true;
        }
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
            clamp(
                progress,
                0,
                1
            );


        /*
         * 1 → original cloud
         *
         * 0 → singularity
         */

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
            clamp(
                progress,
                0,
                1
            );


        /*
         * Explosion strength.
         *
         * Strongest at the beginning.
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


            /*
             * Always derive the explosion
             * direction from the original
             * particle position.
             */

            const x =
                base[n];


            const y =
                base[n + 1];


            const z =
                base[n + 2];


            const length =

                Math.sqrt(

                    x * x +

                    y * y +

                    z * z

                ) || 1;


            positionArray[n] =

                x +

                (
                    x /
                    length
                ) *

                strength;


            positionArray[n + 1] =

                y +

                (
                    y /
                    length
                ) *

                strength;


            positionArray[n + 2] =

                z +

                (
                    z /
                    length
                ) *

                strength;
        }


        positionAttribute
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * SET OPACITY
     * =====================================================
     */

    setOpacity(
        value
    ) {

        if (
            !this.material
        ) {

            return;
        }


        this.material
            .uniforms
            .uOpacity
            .value =

            clamp(
                value,
                0,
                1
            );
    }


    /*
     * =====================================================
     * SET BRIGHTNESS
     * =====================================================
     */

    setBrightness(
        value
    ) {

        if (
            !this.material
        ) {

            return;
        }


        this.material
            .uniforms
            .uBrightness
            .value =

            Math.max(
                0,
                value
            );
    }


    /*
     * =====================================================
     * RESET
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


        this.geometry =
            null;


        this.material =
            null;


        this.points =
            null;


        this.data =
            null;


        console.log(
            "[ParticleSystem] DISPOSED"
        );
    }
}


/*
 * =========================================================
 * UTILITY
 * =========================================================
 */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}