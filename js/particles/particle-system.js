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
 * Runtime states:
 *
 * STABLE
 * SUMMONING
 * SHUFFLE
 * COLLAPSING
 * SINGULARITY
 * EXPLOSION
 *
 * This module DOES NOT generate the nebula.
 * It renders and animates already-generated particle data.
 *
 * Important:
 * Geometry positions are runtime positions.
 * data.positions are the current logical base positions.
 *
 * Event animation owns the geometry while an event state
 * is active, preventing update() from overwriting it.
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


        /*
         * =================================================
         * RUNTIME ARRAYS
         * =================================================
         *
         * These arrays are intentionally separate from
         * the THREE BufferAttribute array.
         */

        this.shuffleTargets =
            null;


        this.explosionDirections =
            null;


        this.explosionStrength =
            1;


        this.originalPositions =
            null;


        this.createGeometry();

        this.createMaterial();

        this.createPoints();

        this.prepareRuntimeData();


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


        /*
         * Position
         */

        this.geometry.setAttribute(

            "position",

            new THREE.BufferAttribute(

                this.data.positions,

                3
            )
        );


        /*
         * Color
         */

        if (
            this.data.colors
        ) {

            this.geometry.setAttribute(

                "color",

                new THREE.BufferAttribute(

                    this.data.colors,

                    3
                )
            );

        } else {

            /*
             * Safe fallback.
             */

            const colors =
                new Float32Array(
                    this.data.count * 3
                );


            for (
                let i = 0;
                i < this.data.count;
                i++
            ) {

                const n =
                    i * 3;


                colors[n] =
                    1;

                colors[n + 1] =
                    1;

                colors[n + 2] =
                    1;
            }


            this.data.colors =
                colors;


            this.geometry.setAttribute(

                "color",

                new THREE.BufferAttribute(
                    colors,
                    3
                )
            );
        }


        /*
         * Particle size
         */

        if (
            this.data.sizes
        ) {

            this.geometry.setAttribute(

                "aSize",

                new THREE.BufferAttribute(

                    this.data.sizes,

                    1
                )
            );

        } else {

            const sizes =
                new Float32Array(
                    this.data.count
                );


            for (
                let i = 0;
                i < this.data.count;
                i++
            ) {

                sizes[i] =
                    1.5;
            }


            this.data.sizes =
                sizes;


            this.geometry.setAttribute(

                "aSize",

                new THREE.BufferAttribute(
                    sizes,
                    1
                )
            );
        }
    }


    /*
     * =====================================================
     * RUNTIME DATA
     * =====================================================
     */

    prepareRuntimeData() {

        const count =
            Number.isFinite(
                this.data.count
            )
                ? this.data.count
                : 0;


        /*
         * Preserve the original generated nebula.
         *
         * This is used for reset / explosion direction.
         */

        this.originalPositions =
            new Float32Array(
                count * 3
            );


        this.originalPositions.set(
            this.data.positions
        );


        /*
         * Guarantee optional arrays.
         */

        if (
            !this.data.drift
        ) {

            this.data.drift =
                new Float32Array(
                    count * 3
                );
        }


        if (
            !this.data.phase
        ) {

            this.data.phase =
                new Float32Array(
                    count
                );


            for (
                let i = 0;
                i < count;
                i++
            ) {

                this.data.phase[i] =
                    Math.random() *
                    Math.PI *
                    2;
            }
        }


        /*
         * Default state.
         */

        if (
            !this.data.state
        ) {

            this.data.state =
                "STABLE";
        }
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
                         * when camera enters cloud.
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
     *
     * IMPORTANT:
     *
     * Event states are excluded here.
     *
     * This prevents:
     *
     * collapse()
     *      ↓
     * update()
     *      ↓
     * particles jump back
     *
     * The event animation owns the geometry
     * while an event is active.
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


        if (
            !positionAttribute
        ) {

            return;
        }


        /*
         * Event states own the geometry.
         */

        const state =
            this.data.state;


        if (
            state === "SHUFFLE" ||
            state === "COLLAPSING" ||
            state === "SINGULARITY" ||
            state === "EXPLOSION"
        ) {

            return;
        }


        /*
         * =================================================
         * NORMAL PARTICLE LIFE
         * =================================================
         */

        if (
            state !== "STABLE" &&
            state !== "SUMMONING"
        ) {

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


        const count =
            this.data.count;


        for (
            let i = 0;
            i < count;
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


            const particlePhase =
                phase[i] || 0;


            positionArray[n] =

                baseX +

                drift[n] *

                Math.sin(

                    time * 0.0004 +

                    particlePhase
                );


            positionArray[n + 1] =

                baseY +

                drift[n + 1] *

                Math.cos(

                    time * 0.00035 +

                    particlePhase
                );


            positionArray[n + 2] =

                baseZ +

                drift[n + 2] *

                Math.sin(

                    time * 0.0003 +

                    particlePhase
                );
        }


        positionAttribute
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * BEGIN SHUFFLE
     * =====================================================
     *
     * Creates a target position for every particle.
     *
     * particle-shuffle.js can use:
     *
     * particleSystem.beginShuffle()
     *
     * then interpolate geometry externally.
     */

    beginShuffle() {

        if (
            !this.geometry ||
            !this.data
        ) {

            return null;
        }


        const count =
            this.data.count;


        const positions =
            this.geometry
                .attributes
                .position
                .array;


        this.shuffleTargets =
            new Float32Array(
                count * 3
            );


        /*
         * Current visible positions become
         * the starting point for the shuffle.
         */

        this.shuffleStartPositions =
            new Float32Array(
                positions
            );


        /*
         * Generate random spherical targets.
         */

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const n =
                i * 3;


            let x =
                Math.random() * 2 - 1;

            let y =
                Math.random() * 2 - 1;

            let z =
                Math.random() * 2 - 1;


            const length =
                Math.sqrt(

                    x * x +

                    y * y +

                    z * z

                ) || 1;


            const radius =
                0.5 +
                Math.random() * 3;


            x =
                x /
                length *
                radius;


            y =
                y /
                length *
                radius;


            z =
                z /
                length *
                radius;


            this.shuffleTargets[n] =
                positions[n] + x;


            this.shuffleTargets[n + 1] =
                positions[n + 1] + y;


            this.shuffleTargets[n + 2] =
                positions[n + 2] + z;
        }


        this.data.state =
            "SHUFFLE";


        return {

            start:
                this.shuffleStartPositions,

            target:
                this.shuffleTargets
        };
    }


    /*
     * =====================================================
     * APPLY SHUFFLE
     * =====================================================
     */

    applyShuffle(
        progress
    ) {

        if (
            !this.geometry ||
            !this.shuffleTargets ||
            !this.shuffleStartPositions
        ) {

            return;
        }


        const p =
            clamp(
                progress,
                0,
                1
            );


        const positions =
            this.geometry
                .attributes
                .position
                .array;


        const start =
            this.shuffleStartPositions;


        const target =
            this.shuffleTargets;


        /*
         * Smooth interpolation.
         */

        const eased =
            easeInOut(
                p
            );


        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            positions[n] =

                lerp(
                    start[n],
                    target[n],
                    eased
                );


            positions[n + 1] =

                lerp(
                    start[n + 1],
                    target[n + 1],
                    eased
                );


            positions[n + 2] =

                lerp(
                    start[n + 2],
                    target[n + 2],
                    eased
                );
        }


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * COMPLETE SHUFFLE
     * =====================================================
     *
     * The shuffled arrangement becomes the new runtime
     * base position.
     *
     * The image source itself is NOT changed.
     */

    finishShuffle() {

        if (
            !this.geometry ||
            !this.data
        ) {

            return;
        }


        const positions =
            this.geometry
                .attributes
                .position
                .array;


        /*
         * Copy current visible arrangement into
         * logical base positions.
         */

        this.data.positions =
            new Float32Array(
                positions
            );


        /*
         * Keep original generated positions untouched.
         */

        this.data.state =
            "STABLE";


        this.shuffleTargets =
            null;


        this.shuffleStartPositions =
            null;


        console.log(
            "[ParticleSystem] SHUFFLE COMMITTED"
        );
    }


    /*
     * =====================================================
     * COLLAPSE
     * =====================================================
     *
     * progress:
     *
     * 0 = normal cloud
     * 1 = singularity
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
         * Event owns geometry.
         */

        if (
            p < 1
        ) {

            this.data.state =
                "COLLAPSING";

        } else {

            this.data.state =
                "SINGULARITY";
        }


        /*
         * Smooth collapse.
         */

        const eased =
            easeInCubic(
                p
            );


        const power =
            1 -
            eased;


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
     * FORCE SINGULARITY
     * =====================================================
     */

    setSingularity() {

        if (
            !this.geometry ||
            !this.data
        ) {

            return;
        }


        const positions =
            this.geometry
                .attributes
                .position
                .array;


        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            positions[n] =
                0;


            positions[n + 1] =
                0;


            positions[n + 2] =
                0;
        }


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;


        this.data.state =
            "SINGULARITY";
    }


    /*
     * =====================================================
     * PREPARE EXPLOSION
     * =====================================================
     *
     * Generates stable randomised explosion directions.
     *
     * This is intentionally calculated once per event,
     * rather than every frame.
     */

    prepareExplosion(
        strength = 1
    ) {

        if (
            !this.data
        ) {

            return;
        }


        const count =
            this.data.count;


        this.explosionDirections =
            new Float32Array(
                count * 3
            );


        this.explosionStrength =
            Math.max(
                0.1,
                strength
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const n =
                i * 3;


            /*
             * Mostly radial direction based on
             * the original particle position.
             */

            let x =
                this.originalPositions[n];


            let y =
                this.originalPositions[n + 1];


            let z =
                this.originalPositions[n + 2];


            const originalLength =
                Math.sqrt(

                    x * x +

                    y * y +

                    z * z

                );


            if (
                originalLength <
                0.000001
            ) {

                x =
                    Math.random() * 2 - 1;

                y =
                    Math.random() * 2 - 1;

                z =
                    Math.random() * 2 - 1;
            }


            /*
             * Add randomness so the explosion
             * does not look like a perfect sphere.
             */

            x +=
                (
                    Math.random() -
                    0.5
                ) *
                0.35;


            y +=
                (
                    Math.random() -
                    0.5
                ) *
                0.35;


            z +=
                (
                    Math.random() -
                    0.5
                ) *
                0.35;


            const length =
                Math.sqrt(

                    x * x +

                    y * y +

                    z * z

                ) || 1;


            this.explosionDirections[n] =
                x / length;


            this.explosionDirections[n + 1] =
                y / length;


            this.explosionDirections[n + 2] =
                z / length;
        }


        this.data.state =
            "EXPLOSION";
    }


    /*
     * =====================================================
     * EXPLOSION
     * =====================================================
     *
     * progress:
     *
     * 0 = singularity
     * 1 = maximum explosion
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


        if (
            !this.explosionDirections
        ) {

            this.prepareExplosion(
                1
            );
        }


        const positionAttribute =
            this.geometry
                .attributes
                .position;


        const positionArray =
            positionAttribute.array;


        const p =
            clamp(
                progress,
                0,
                1
            );


        this.data.state =
            "EXPLOSION";


        /*
         * Strong acceleration at the beginning,
         * then particles continue outward.
         */

        const eased =
            easeOutCubic(
                p
            );


        /*
         * Determine explosion radius from
         * the original nebula size.
         */

        let maxRadius =
            1;


        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            const x =
                this.originalPositions[n];


            const y =
                this.originalPositions[n + 1];


            const z =
                this.originalPositions[n + 2];


            const radius =
                Math.sqrt(

                    x * x +

                    y * y +

                    z * z

                );


            if (
                radius >
                maxRadius
            ) {

                maxRadius =
                    radius;
            }
        }


        /*
         * Explosion reaches beyond the original cloud.
         */

        const explosionRadius =
            maxRadius *
            (
                2.2 *
                this.explosionStrength
            );


        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            const directionX =
                this.explosionDirections[n];


            const directionY =
                this.explosionDirections[n + 1];


            const directionZ =
                this.explosionDirections[n + 2];


            const randomScale =
                0.75 +
                (
                    (
                        Math.sin(
                            i * 12.9898
                        ) *
                        43758.5453
                    ) %
                    0.25
                );


            const distance =
                explosionRadius *
                eased *
                (
                    0.85 +
                    Math.abs(
                        randomScale
                    )
                );


            positionArray[n] =

                directionX *
                distance;


            positionArray[n + 1] =

                directionY *
                distance;


            positionArray[n + 2] =

                directionZ *
                distance;
        }


        positionAttribute
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * END EXPLOSION
     * =====================================================
     */

    finishExplosion() {

        if (
            !this.data
        ) {

            return;
        }


        this.explosionDirections =
            null;


        this.data.state =
            "STABLE";
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
     *
     * Restores the originally generated nebula.
     *
     * This is mainly for recovery/debugging.
     * A normal observation cycle should instead
     * generate a new nebula.
     */

    resetPositions() {

        if (
            !this.geometry ||
            !this.data ||
            !this.originalPositions
        ) {

            return;
        }


        const positionAttribute =
            this.geometry
                .attributes
                .position;


        /*
         * Restore original logical base.
         */

        this.data.positions =
            new Float32Array(
                this.originalPositions
            );


        /*
         * Restore visible positions.
         */

        positionAttribute
            .array
            .set(
                this.originalPositions
            );


        positionAttribute
            .needsUpdate =
            true;


        /*
         * Clear event data.
         */

        this.shuffleTargets =
            null;


        this.shuffleStartPositions =
            null;


        this.explosionDirections =
            null;


        this.data.state =
            "STABLE";


        console.log(
            "[ParticleSystem] POSITIONS RESET"
        );
    }


    /*
     * =====================================================
     * GET STATE
     * =====================================================
     */

    getState() {

        return this.data?.state ||
            "UNKNOWN";
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


        this.shuffleTargets =
            null;


        this.shuffleStartPositions =
            null;


        this.explosionDirections =
            null;


        this.originalPositions =
            null;


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


/*
 * =========================================================
 * LERP
 * =========================================================
 */

function lerp(
    a,
    b,
    t
) {

    return (

        a +

        (
            b -
            a
        ) *

        t

    );
}


/*
 * =========================================================
 * EASING
 * =========================================================
 */

function easeInCubic(
    t
) {

    return (
        t *
        t *
        t
    );
}


function easeOutCubic(
    t
) {

    return (

        1 -

        Math.pow(
            1 - t,
            3
        )

    );
}


function easeInOut(
    t
) {

    return (

        t < 0.5

            ? 2 * t * t

            : 1 -
              Math.pow(
                  -2 * t + 2,
                  2
              ) / 2

    );
}