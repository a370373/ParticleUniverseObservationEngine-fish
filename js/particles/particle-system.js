/*
 * =========================================================
 * PARTICLE UNIVERSE
 * PARTICLE SYSTEM
 *
 * Nebula Data
 *      ↓
 * BufferGeometry
 *      ↓
 * ShaderMaterial
 *      ↓
 * THREE.Points
 *
 * STATES
 * ---------------------------------------------------------
 *
 * SUMMONING
 * STABLE
 * SHUFFLE
 * COLLAPSING
 * SINGULARITY
 * EXPLOSION
 *
 * IMPORTANT
 * ---------------------------------------------------------
 *
 * CAMERA IS NOT TOUCHED HERE.
 *
 * This system ONLY controls particles.
 *
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
         * ORIGINAL NEBULA
         * =================================================
         */

        this.originalPositions =
            null;


        /*
         * =================================================
         * SUMMONING
         * =================================================
         */

        this.summonStartPositions =
            null;

        this.summonStartTime =
            0;

        this.summonDuration =
            4200;

        this.summonPrepared =
            false;


        /*
         * =================================================
         * SHUFFLE
         * =================================================
         */

        this.shuffleStartPositions =
            null;

        this.shuffleTargets =
            null;


        /*
         * =================================================
         * EXPLOSION
         * =================================================
         */

        this.explosionDirections =
            null;

        this.explosionStrength =
            1;

        this.explosionRadius =
            1;


        /*
         * =================================================
         * INITIALIZATION
         * =================================================
         */

        this.prepareData();

        this.createGeometry();

        this.createMaterial();

        this.createPoints();

        this.prepareRuntimeData();


        /*
         * Automatically prepare
         * the opening animation.
         */

        this.prepareSummoning();


        console.log(
            "[ParticleSystem] READY:",
            this.data.count,
            "PARTICLES"
        );
    }


    /*
     * =====================================================
     * PREPARE DATA
     * =====================================================
     */

    prepareData() {

        if (
            !Number.isFinite(
                this.data.count
            )
        ) {

            if (
                this.data.positions
            ) {

                this.data.count =
                    Math.floor(
                        this.data.positions.length /
                        3
                    );

            } else {

                this.data.count =
                    0;
            }
        }


        const count =
            this.data.count;


        if (
            count <= 0
        ) {

            throw new Error(
                "[ParticleSystem] Nebula contains no particles."
            );
        }


        if (
            !this.data.positions
        ) {

            throw new Error(
                "[ParticleSystem] Nebula positions are required."
            );
        }


        if (
            this.data.positions.length <
            count * 3
        ) {

            throw new Error(
                "[ParticleSystem] Invalid position array."
            );
        }


        /*
         * Colors
         */

        if (
            !this.data.colors ||
            this.data.colors.length <
            count * 3
        ) {

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


                colors[n] =
                    1;

                colors[n + 1] =
                    1;

                colors[n + 2] =
                    1;
            }


            this.data.colors =
                colors;
        }


        /*
         * Sizes
         */

        if (
            !this.data.sizes ||
            this.data.sizes.length <
            count
        ) {

            const sizes =
                new Float32Array(
                    count
                );


            for (
                let i = 0;
                i < count;
                i++
            ) {

                sizes[i] =
                    1.5;
            }


            this.data.sizes =
                sizes;
        }


        /*
         * Drift
         */

        if (
            !this.data.drift ||
            this.data.drift.length <
            count * 3
        ) {

            this.data.drift =
                new Float32Array(
                    count * 3
                );
        }


        /*
         * Phase
         */

        if (
            !this.data.phase ||
            this.data.phase.length <
            count
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
         * State
         */

        if (
            typeof this.data.state !==
            "string"
        ) {

            this.data.state =
                "SUMMONING";
        }
    }


    /*
     * =====================================================
     * CREATE GEOMETRY
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

                new Float32Array(
                    this.data.positions
                ),

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
     * CREATE MATERIAL
     * =====================================================
     */

    createMaterial() {

        const THREE =
            this.THREE;


        const pixelRatio =
            typeof window !== "undefined"

                ? Math.min(
                    window.devicePixelRatio || 1,
                    2
                )

                : 1;


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
                        value: 0
                    },

                    uPixelRatio: {
                        value: pixelRatio
                    },

                    uOpacity: {
                        value: 0
                    },

                    uBrightness: {
                        value: 1
                    }
                },


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


                        vec4 mv =

                            modelViewMatrix *

                            vec4(
                                p,
                                1.0
                            );


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


                        float glow =

                            1.0 -

                            smoothstep(
                                0.05,
                                0.5,
                                d
                            );


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
     * CREATE POINTS
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


        this.points.frustumCulled =
            false;
    }


    /*
     * =====================================================
     * RUNTIME DATA
     * =====================================================
     */

    prepareRuntimeData() {

        const count =
            this.data.count;


        this.originalPositions =
            new Float32Array(
                count * 3
            );


        this.originalPositions.set(
            this.data.positions
        );


        const positions =
            this.geometry
                .attributes
                .position
                .array;


        positions.set(
            this.originalPositions
        );


        this.shuffleStartPositions =
            null;

        this.shuffleTargets =
            null;

        this.explosionDirections =
            null;

        this.explosionStrength =
            1;

        this.explosionRadius =
            1;


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * PREPARE SUMMONING
     * =====================================================
     *
     * Every particle receives a distant
     * starting position.
     *
     * This is the important part that
     * prevents the nebula from appearing
     * instantly.
     */

    prepareSummoning(
        duration = 4200
    ) {

        if (
            !this.geometry ||
            !this.data ||
            !this.originalPositions
        ) {

            return;
        }


        const count =
            this.data.count;


        this.summonStartPositions =
            new Float32Array(
                count * 3
            );


        const positions =
            this.geometry
                .attributes
                .position
                .array;


        /*
         * Determine nebula radius.
         */

        let radius =
            1;


        for (
            let i = 0;
            i < count;
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


            radius =
                Math.max(
                    radius,
                    Math.sqrt(
                        x * x +
                        y * y +
                        z * z
                    )
                );
        }


        /*
         * Starting distance.
         *
         * Large enough to create the
         * "particles entering the universe"
         * effect.
         */

        const far =
            Math.max(
                180,
                radius * 4.5
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const n =
                i * 3;


            /*
             * Random direction.
             */

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


            x /=
                length;

            y /=
                length;

            z /=
                length;


            /*
             * Different particles begin
             * at different distances.
             */

            const distance =
                far *
                (
                    0.65 +
                    Math.random() * 0.75
                );


            /*
             * Slightly offset the
             * incoming stream.
             */

            const spread =
                radius *
                (
                    0.5 +
                    Math.random() * 1.8
                );


            this.summonStartPositions[n] =

                x * distance +

                (
                    Math.random() - 0.5
                ) *
                spread;


            this.summonStartPositions[n + 1] =

                y * distance +

                (
                    Math.random() - 0.5
                ) *
                spread;


            this.summonStartPositions[n + 2] =

                z * distance +

                (
                    Math.random() - 0.5
                ) *
                spread;
        }


        /*
         * Start hidden.
         */

        positions.set(
            this.summonStartPositions
        );


        this.summonDuration =
            Math.max(
                500,
                Number(duration) || 4200
            );


        this.summonStartTime =
            null;


        this.summonPrepared =
            true;


        this.data.state =
            "SUMMONING";


        this.setOpacity(
            0
        );


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;


        console.log(
            "[ParticleSystem] SUMMONING PREPARED"
        );
    }


    /*
     * =====================================================
     * START SUMMONING
     * =====================================================
     */

    startSummoning(
        time = 0,
        duration = null
    ) {

        if (
            duration !== null
        ) {

            this.summonDuration =
                Math.max(
                    500,
                    Number(duration) || 4200
                );
        }


        if (
            !this.summonPrepared
        ) {

            this.prepareSummoning(
                this.summonDuration
            );
        }


        this.summonStartTime =
            Number.isFinite(time)
                ? time
                : 0;


        this.data.state =
            "SUMMONING";


        this.setOpacity(
            0
        );


        console.log(
            "[ParticleSystem] SUMMONING START"
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
            !this.geometry ||
            !this.material ||
            !this.data
        ) {

            return;
        }


        const safeTime =
            Number.isFinite(time)
                ? time
                : 0;


        this.material
            .uniforms
            .uTime
            .value =
            safeTime;


        this.material
            .uniforms
            .uPixelRatio
            .value =

            typeof window !== "undefined"

                ? Math.min(
                    window.devicePixelRatio || 1,
                    2
                )

                : 1;


        /*
         * =================================================
         * SUMMONING
         * =================================================
         */

        if (
            this.data.state ===
            "SUMMONING"
        ) {

            this.updateSummoning(
                safeTime
            );

            return;
        }


        /*
         * =================================================
         * EVENT STATES
         * =================================================
         */

        if (
            this.data.state ===
            "SHUFFLE"

            ||

            this.data.state ===
            "COLLAPSING"

            ||

            this.data.state ===
            "SINGULARITY"

            ||

            this.data.state ===
            "EXPLOSION"
        ) {

            return;
        }


        /*
         * =================================================
         * STABLE
         * =================================================
         */

        if (
            this.data.state !==
            "STABLE"
        ) {

            return;
        }


        const positionAttribute =
            this.geometry
                .attributes
                .position;


        const positions =
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


            const particlePhase =
                phase[i] || 0;


            positions[n] =

                base[n] +

                drift[n] *

                Math.sin(
                    safeTime * 0.0004 +
                    particlePhase
                );


            positions[n + 1] =

                base[n + 1] +

                drift[n + 1] *

                Math.cos(
                    safeTime * 0.00035 +
                    particlePhase
                );


            positions[n + 2] =

                base[n + 2] +

                drift[n + 2] *

                Math.sin(
                    safeTime * 0.0003 +
                    particlePhase
                );
        }


        positionAttribute
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * UPDATE SUMMONING
     * =====================================================
     */

    updateSummoning(
        time
    ) {

        if (
            !this.summonPrepared ||
            !this.summonStartPositions
        ) {

            this.prepareSummoning(
                this.summonDuration
            );
        }


        if (
            this.summonStartTime === null
        ) {

            this.summonStartTime =
                time;
        }


        const elapsed =
            time -
            this.summonStartTime;


        const progress =
            clamp(
                elapsed /
                this.summonDuration,
                0,
                1
            );


        /*
         * Smooth acceleration and
         * deceleration.
         */

        const eased =
            easeInOutCubic(
                progress
            );


        /*
         * Slight stagger.
         *
         * Particles do not all arrive
         * simultaneously.
         */

        const positions =
            this.geometry
                .attributes
                .position
                .array;


        const start =
            this.summonStartPositions;


        const target =
            this.originalPositions;


        const count =
            this.data.count;


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const n =
                i * 3;


            /*
             * Deterministic particle delay.
             */

            const seed =
                hash01(
                    i
                );


            const delay =
                seed *
                0.42;


            const local =
                clamp(
                    (
                        progress -
                        delay
                    ) /
                    (
                        1 -
                        delay
                    ),
                    0,
                    1
                );


            const localEase =
                easeInOutCubic(
                    local
                );


            /*
             * Incoming particle.
             */

            positions[n] =

                lerp(
                    start[n],
                    target[n],
                    localEase
                );


            positions[n + 1] =

                lerp(
                    start[n + 1],
                    target[n + 1],
                    localEase
                );


            positions[n + 2] =

                lerp(
                    start[n + 2],
                    target[n + 2],
                    localEase
                );
        }


        /*
         * Fade in.
         */

        const opacity =
            smoothStep(
                0,
                0.72,
                progress
            );


        this.setOpacity(
            opacity
        );


        /*
         * Subtle brightness bloom
         * near the end.
         */

        const brightness =
            0.75 +
            smoothStep(
                0.45,
                1,
                progress
            ) *
            0.25;


        this.setBrightness(
            brightness
        );


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;


        /*
         * Finish.
         */

        if (
            progress >= 1
        ) {

            this.finishSummoning();
        }
    }


    /*
     * =====================================================
     * FINISH SUMMONING
     * =====================================================
     */

    finishSummoning() {

        if (
            !this.geometry ||
            !this.data
        ) {

            return;
        }


        /*
         * Exact final position.
         */

        this.geometry
            .attributes
            .position
            .array
            .set(
                this.originalPositions
            );


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;


        this.setOpacity(
            1
        );


        this.setBrightness(
            1
        );


        this.summonPrepared =
            false;


        this.summonStartPositions =
            null;


        this.summonStartTime =
            null;


        this.data.state =
            "STABLE";


        console.log(
            "[ParticleSystem] SUMMONING COMPLETE"
        );
    }


    /*
     * =====================================================
     * SHUFFLE
     * =====================================================
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


        this.shuffleStartPositions =
            new Float32Array(
                positions
            );


        this.shuffleTargets =
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


            x /=
                length;

            y /=
                length;

            z /=
                length;


            const distance =
                0.5 +
                Math.random() * 3;


            this.shuffleTargets[n] =

                positions[n] +
                x * distance;


            this.shuffleTargets[n + 1] =

                positions[n + 1] +
                y * distance;


            this.shuffleTargets[n + 2] =

                positions[n + 2] +
                z * distance;
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
            !this.shuffleStartPositions ||
            !this.shuffleTargets
        ) {

            return;
        }


        const p =
            clamp(
                progress,
                0,
                1
            );


        const eased =
            easeInOutCubic(
                p
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
     * FINISH SHUFFLE
     * =====================================================
     */

    finishShuffle() {

        if (
            !this.geometry ||
            !this.data
        ) {

            return;
        }


        this.resetVisibleToBase();


        this.shuffleStartPositions =
            null;

        this.shuffleTargets =
            null;


        this.data.state =
            "STABLE";
    }


    /*
     * =====================================================
     * RESET
     * =====================================================
     */

    resetVisibleToBase() {

        if (
            !this.geometry ||
            !this.data
        ) {

            return;
        }


        this.geometry
            .attributes
            .position
            .array
            .set(
                this.data.positions
            );


        this.geometry
            .attributes
            .position
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


        const p =
            clamp(
                progress,
                0,
                1
            );


        const eased =
            easeInCubic(
                p
            );


        const power =
            1 -
            eased;


        const positions =
            this.geometry
                .attributes
                .position
                .array;


        const base =
            this.originalPositions;


        this.data.state =

            p >= 1

                ? "SINGULARITY"

                : "COLLAPSING";


        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            positions[n] =
                base[n] *
                power;


            positions[n + 1] =
                base[n + 1] *
                power;


            positions[n + 2] =
                base[n + 2] *
                power;
        }


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * SINGULARITY
     * =====================================================
     */

    setSingularity() {

        if (
            !this.geometry ||
            !this.data
        ) {

            return;
        }


        this.geometry
            .attributes
            .position
            .array
            .fill(
                0
            );


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
     */

    prepareExplosion(
        strength = 1
    ) {

        if (
            !this.data ||
            !this.originalPositions
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
                Number(strength) || 1
            );


        let maxRadius =
            1;


        for (
            let i = 0;
            i < count;
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


            maxRadius =
                Math.max(
                    maxRadius,
                    Math.sqrt(
                        x * x +
                        y * y +
                        z * z
                    )
                );
        }


        this.explosionRadius =
            maxRadius * 2.2;


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const n =
                i * 3;


            let x =
                this.originalPositions[n];

            let y =
                this.originalPositions[n + 1];

            let z =
                this.originalPositions[n + 2];


            const length =
                Math.sqrt(
                    x * x +
                    y * y +
                    z * z
                );


            if (
                length < 0.000001
            ) {

                x =
                    Math.random() * 2 - 1;

                y =
                    Math.random() * 2 - 1;

                z =
                    Math.random() * 2 - 1;
            }


            x +=
                (
                    Math.random() -
                    0.5
                ) * 0.35;

            y +=
                (
                    Math.random() -
                    0.5
                ) * 0.35;

            z +=
                (
                    Math.random() -
                    0.5
                ) * 0.35;


            const directionLength =
                Math.sqrt(
                    x * x +
                    y * y +
                    z * z
                ) || 1;


            this.explosionDirections[n] =
                x /
                directionLength;

            this.explosionDirections[n + 1] =
                y /
                directionLength;

            this.explosionDirections[n + 2] =
                z /
                directionLength;
        }


        this.data.state =
            "EXPLOSION";
    }


    /*
     * =====================================================
     * EXPLODE
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


        if (
            !this.explosionDirections
        ) {

            this.prepareExplosion(
                1
            );
        }


        const p =
            clamp(
                progress,
                0,
                1
            );


        const eased =
            easeOutCubic(
                p
            );


        const positions =
            this.geometry
                .attributes
                .position
                .array;


        const directions =
            this.explosionDirections;


        this.data.state =
            "EXPLOSION";


        const radius =
            this.explosionRadius *
            this.explosionStrength;


        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n =
                i * 3;


            const randomSeed =
                Math.sin(
                    i * 12.9898
                ) *
                43758.5453;


            const variation =
                0.85 +

                (
                    Math.abs(
                        randomSeed -
                        Math.floor(
                            randomSeed
                        )
                    ) *
                    0.35
                );


            const distance =
                radius *
                eased *
                variation;


            positions[n] =
                directions[n] *
                distance;

            positions[n + 1] =
                directions[n + 1] *
                distance;

            positions[n + 2] =
                directions[n + 2] *
                distance;
        }


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;
    }


    /*
     * =====================================================
     * FINISH EXPLOSION
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

        this.explosionStrength =
            1;

        this.explosionRadius =
            1;


        this.resetVisibleToBase();


        this.data.state =
            "STABLE";


        this.setOpacity(
            1
        );


        this.setBrightness(
            1
        );
    }


    /*
     * =====================================================
     * OPACITY
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
                Number(value) || 0,
                0,
                1
            );
    }


    /*
     * =====================================================
     * BRIGHTNESS
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
                Number(value) || 0
            );
    }


    /*
     * =====================================================
     * RESET POSITIONS
     * =====================================================
     */

    resetPositions() {

        if (
            !this.geometry ||
            !this.data ||
            !this.originalPositions
        ) {

            return;
        }


        this.data.positions =
            new Float32Array(
                this.originalPositions
            );


        this.geometry
            .attributes
            .position
            .array
            .set(
                this.originalPositions
            );


        this.geometry
            .attributes
            .position
            .needsUpdate =
            true;


        this.summonStartPositions =
            null;

        this.summonStartTime =
            null;

        this.summonPrepared =
            false;


        this.shuffleStartPositions =
            null;

        this.shuffleTargets =
            null;


        this.explosionDirections =
            null;

        this.explosionStrength =
            1;

        this.explosionRadius =
            1;


        this.data.state =
            "STABLE";


        this.setOpacity(
            1
        );


        this.setBrightness(
            1
        );
    }


    /*
     * =====================================================
     * STATE
     * =====================================================
     */

    getState() {

        return (
            this.data?.state ||
            "UNKNOWN"
        );
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


        this.summonStartPositions =
            null;

        this.shuffleStartPositions =
            null;

        this.shuffleTargets =
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


function easeInOutCubic(
    t
) {

    return (

        t < 0.5

            ? 4 *
              t *
              t *
              t

            : 1 -
              Math.pow(
                  -2 * t + 2,
                  3
              ) /
              2
    );
}


function smoothStep(
    edge0,
    edge1,
    x
) {

    const t =
        clamp(
            (
                x -
                edge0
            ) /
            (
                edge1 -
                edge0
            ),
            0,
            1
        );


    return (
        t *
        t *
        (
            3 -
            2 * t
        )
    );
}


function hash01(
    value
) {

    const x =
        Math.sin(
            value *
            12.9898 +
            78.233
        ) *
        43758.5453;


    return (
        x -
        Math.floor(x)
    );
}