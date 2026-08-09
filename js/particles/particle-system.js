/*

* =========================================================
* PARTICLE UNIVERSE
* PARTICLE SYSTEM
* 
* Nebula Data
*  ↓
* BufferGeometry
*  ↓
* ShaderMaterial
*  ↓
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
* IMPORTANT
* ---
* data.positions
*  = logical/base nebula positions
* 
* geometry.position
*  = visible/runtime particle positions
* 
* Event animations control geometry.position directly.
* 
* update() NEVER overwrites geometry positions while
* an event state is active.
* 
* This module does NOT generate nebula data.
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
     *
     * Immutable runtime snapshot.
     *
     * This is NEVER modified by shuffle,
     * collapse or explosion.
     */

    this.originalPositions =
        null;


    /*
     * =================================================
     * SHUFFLE DATA
     * =================================================
     */

    this.shuffleStartPositions =
        null;


    this.shuffleTargets =
        null;


    /*
     * =================================================
     * EXPLOSION DATA
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

    /*
     * Count
     */

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


    /*
     * Positions are mandatory.
     */

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
            "STABLE";
    }
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
 * RUNTIME DATA
 * =====================================================
 */

prepareRuntimeData() {

    const count =
        this.data.count;


    /*
     * Snapshot original generated nebula.
     */

    this.originalPositions =
        new Float32Array(
            count * 3
        );


    this.originalPositions.set(
        this.data.positions
    );


    /*
     * Ensure visible positions
     * start exactly at the original data.
     */

    const positions =
        this.geometry
            .attributes
            .position
            .array;


    positions.set(
        this.originalPositions
    );


    /*
     * Event data starts empty.
     */

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
 * MATERIAL
 * =====================================================
 */

createMaterial() {

    const THREE =
        this.THREE;


    const pixelRatio =
        typeof window !==
        "undefined"

            ? Math.min(
                window.devicePixelRatio ||
                1,
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

                    value:
                        0
                },

                uPixelRatio: {

                    value:
                        pixelRatio
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
                     * Subtle nebula breathing.
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
        Number.isFinite(time)
            ? time
            : 0;


    /*
     * Pixel ratio.
     */

    this.material
        .uniforms
        .uPixelRatio
        .value =

        typeof window !==
        "undefined"

            ? Math.min(
                window.devicePixelRatio ||
                1,
                2
            )

            : 1;


    /*
     * Event states own geometry.
     */

    const state =
        this.data.state;


    if (
        state ===
        "SHUFFLE" ||

        state ===
        "COLLAPSING" ||

        state ===
        "SINGULARITY" ||

        state ===
        "EXPLOSION"
    ) {

        return;
    }


    /*
     * Only normal states update
     * from logical base positions.
     */

    if (
        state !==
        "STABLE" &&

        state !==
        "SUMMONING"
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

                time * 0.0004 +

                particlePhase

            );


        positions[n + 1] =

            base[n + 1] +

            drift[n + 1] *

            Math.cos(

                time * 0.00035 +

                particlePhase

            );


        positions[n + 2] =

            base[n + 2] +

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

            x *
            distance;


        this.shuffleTargets[n + 1] =

            positions[n + 1] +

            y *
            distance;


        this.shuffleTargets[n + 2] =

            positions[n + 2] +

            z *
            distance;
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
        easeInOut(
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
 *
 * IMPORTANT:
 *
 * Shuffle is temporary.
 *
 * It does NOT modify data.positions.
 *
 * This keeps the generated nebula intact.
 */

finishShuffle() {

    if (
        !this.geometry ||
        !this.data
    ) {

        return;
    }


    /*
     * Return to logical base.
     *
     * The shuffle is visual only.
     */

    this.resetVisibleToBase();


    this.shuffleStartPositions =
        null;


    this.shuffleTargets =
        null;


    this.data.state =
        "STABLE";


    console.log(
        "[ParticleSystem] SHUFFLE COMPLETE"
    );
}


/*
 * =====================================================
 * RESET VISIBLE TO BASE
 * =====================================================
 */

resetVisibleToBase() {

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


    positionAttribute
        .array
        .set(
            this.data.positions
        );


    positionAttribute
        .needsUpdate =
        true;
}


/*
 * =====================================================
 * COLLAPSE
 * =====================================================
 *
 * 0 = normal
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
        this.data.positions;


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
 * SET SINGULARITY
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


    positions.fill(
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
            Number(
                strength
            ) || 1
        );


    let maxRadius =
        1;


    /*
     * Calculate original nebula radius.
     */

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


        const radius =
            Math.sqrt(

                x * x +
                y * y +
                z * z

            );


        maxRadius =
            Math.max(
                maxRadius,
                radius
            );
    }


    this.explosionRadius =
        maxRadius *
        2.2;


    /*
     * Generate stable directions.
     */

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


        /*
         * Center particles receive
         * a random direction.
         */

        if (
            length <
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
         * Add controlled randomness.
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
 * EXPLOSION
 * =====================================================
 *
 * 0 = singularity
 * 1 = maximum burst
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


        const directionX =
            directions[n];


        const directionY =
            directions[n + 1];


        const directionZ =
            directions[n + 2];


        /*
         * Stable deterministic variation.
         *
         * Always positive.
         */

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

            directionX *
            distance;


        positions[n + 1] =

            directionY *
            distance;


        positions[n + 2] =

            directionZ *
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


    this.data.state =
        "STABLE";


    /*
     * Visible particles return to the
     * logical nebula on the next update.
     */

    this.resetVisibleToBase();


    console.log(
        "[ParticleSystem] EXPLOSION COMPLETE"
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
            value,
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
            Number(
                value
            ) || 0
        );
}


/*
 * =====================================================
 * RESET
 * =====================================================
 *
 * Restores the ORIGINAL generated nebula.
 *
 * This is the hard recovery state.
 */

resetPositions() {

    if (
        !this.geometry ||
        !this.data ||
        !this.originalPositions
    ) {

        return;
    }


    /*
     * Restore logical base.
     */

    this.data.positions =
        new Float32Array(
            this.originalPositions
        );


    /*
     * Restore visible positions.
     */

    const positionAttribute =
        this.geometry
            .attributes
            .position;


    positionAttribute
        .array
        .set(
            this.originalPositions
        );


    positionAttribute
        .needsUpdate =
        true;


    /*
     * Clear temporary event data.
     */

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


    /*
     * Restore state.
     */

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