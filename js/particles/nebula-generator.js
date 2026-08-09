/*
 * =========================================================
 * PARTICLE UNIVERSE
 * NEBULA GENERATOR
 *
 * Image
 *   ↓
 * Pixel Sampling
 *   ↓
 * Hidden Image Projection
 *   ↓
 * 3D Particle Distribution
 *   ↓
 * Nebula Data
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * This module generates nebula DATA only.
 *
 * It does NOT:
 *
 * - render particles
 * - create THREE.Points
 * - control Camera
 * - determine observation success
 * - run observation events
 *
 * The image is NOT stored as a visible object.
 *
 * The image becomes:
 *
 *     particle color
 *     particle spatial arrangement
 *     hidden projection structure
 *
 * Therefore:
 *
 *     correct observation angle
 *              ↓
 *       particle projection
 *              ↓
 *          image appears
 *
 * Side / back views remain a particle cloud.
 * =========================================================
 */

import {
    CONFIG
} from "../config.js";


/*
 * =========================================================
 * MAIN GENERATOR
 * =========================================================
 */

export async function generateNebula(
    THREE,
    imageSource = null
) {

    if (!THREE) {

        throw new Error(
            "[NebulaGenerator] THREE is required."
        );
    }


    console.log(
        "[NebulaGenerator] GENERATION START"
    );


    /*
     * =====================================================
     * IMAGE
     * =====================================================
     */

    let image =
        null;


    if (
        imageSource
    ) {

        try {

            image =
                await loadImage(
                    imageSource
                );


            console.log(
                "[NebulaGenerator] IMAGE LOADED"
            );

        } catch (
            error
        ) {

            console.warn(
                "[NebulaGenerator] IMAGE LOAD FAILED:",
                error
            );

            image =
                null;
        }
    }


    /*
     * =====================================================
     * SAMPLE IMAGE
     * =====================================================
     */

    const sampleSize =
        Math.max(
            16,
            Math.floor(
                Number(
                    CONFIG?.NEBULA?.IMAGE_SAMPLE_SIZE
                ) || 96
            )
        );


    const imageData =
        image
            ? sampleImage(
                image,
                sampleSize
            )
            : null;


    /*
     * =====================================================
     * PARTICLE COUNT
     * =====================================================
     */

    const configuredCount =
        Number(
            CONFIG?.PARTICLES?.MAIN
        );


    const count =
        Math.max(
            1,
            Number.isFinite(
                configuredCount
            )
                ? Math.floor(
                    configuredCount
                )
                : 12000
        );


    /*
     * =====================================================
     * ARRAYS
     * =====================================================
     */

    const positions =
        new Float32Array(
            count * 3
        );


    const colors =
        new Float32Array(
            count * 3
        );


    const sizes =
        new Float32Array(
            count
        );


    const drift =
        new Float32Array(
            count * 3
        );


    const phase =
        new Float32Array(
            count
        );


    /*
     * target is intentionally retained
     * for compatibility with the existing
     * ParticleSystem / Universe architecture.
     */

    const target =
        new Float32Array(
            count * 3
        );


    /*
     * =====================================================
     * IMAGE PROJECTION PARAMETERS
     * =====================================================
     *
     * The image itself is never rendered.
     *
     * Each sampled pixel becomes a point
     * around an invisible projection plane.
     *
     * Depth is introduced according to:
     *
     *     pixel luminance
     *     organic noise
     *     particle layer
     *     random variation
     *
     * This prevents the side view from looking
     * like a flat billboard.
     */

    const projection =
        createProjectionParameters();


    /*
     * =====================================================
     * GENERATION
     * =====================================================
     */

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const n =
            i * 3;


        /*
         * -------------------------------------------------
         * PIXEL
         * -------------------------------------------------
         */

        const pixel =
            imageData
                ? samplePixel(
                    imageData,
                    sampleSize
                )
                : createProceduralPixel();


        let r =
            pixel.r;


        let g =
            pixel.g;


        let b =
            pixel.b;


        const brightness =
            (
                r +
                g +
                b
            ) / 3;


        /*
         * -------------------------------------------------
         * IMAGE COORDINATE
         * -------------------------------------------------
         */

        const imageX =
            pixel.x;


        const imageY =
            pixel.y;


        /*
         * -------------------------------------------------
         * BASE IMAGE PLANE
         * -------------------------------------------------
         */

        const x =
            imageX *
            projection.width;


        const y =
            imageY *
            projection.height;


        /*
         * -------------------------------------------------
         * DEPTH
         * -------------------------------------------------
         *
         * The hidden image is distributed
         * through multiple particle layers.
         *
         * This is what makes the object a
         * volumetric particle cosmos instead
         * of a flat picture.
         */

        const depthNoise =
            noise3(
                i * 0.017,
                imageX * 4.7,
                imageY * 3.9
            );


        const brightnessDepth =
            (
                brightness -
                0.5
            ) *
            projection.brightnessDepth;


        const randomDepth =
            (
                Math.random() -
                0.5
            ) *
            projection.depth;


        let z =
            depthNoise *
            projection.noiseDepth

            +

            brightnessDepth

            +

            randomDepth;


        /*
         * -------------------------------------------------
         * ORGANIC DISTORTION
         * -------------------------------------------------
         */

        const organicX =
            Math.sin(
                y * 0.055 +
                z * 0.021
            ) *
            projection.organic;


        const organicY =
            Math.cos(
                x * 0.047 -
                z * 0.031
            ) *
            projection.organic;


        const organicZ =
            Math.sin(
                x * 0.029 +
                y * 0.041
            ) *
            projection.organicDepth;


        let finalX =
            x +
            organicX;


        let finalY =
            y +
            organicY;


        let finalZ =
            z +
            organicZ;


        /*
         * -------------------------------------------------
         * OUTER PARTICLE FIELD
         * -------------------------------------------------
         *
         * Some particles are deliberately
         * pushed away from the image core.
         *
         * They form the surrounding nebula.
         *
         * The image remains recoverable from
         * the correct observation direction,
         * but the side view becomes much more
         * cosmic and less obviously pictorial.
         */

        if (
            Math.random() <
            projection.outerParticleRatio
        ) {

            const radial =
                randomDirection();


            const outerDistance =
                projection.outerDistanceMin

                +

                Math.random() *
                (
                    projection.outerDistanceMax -
                    projection.outerDistanceMin
                );


            finalX +=
                radial.x *
                outerDistance;


            finalY +=
                radial.y *
                outerDistance;


            finalZ +=
                radial.z *
                outerDistance;
        }


        /*
         * -------------------------------------------------
         * STORE POSITION
         * -------------------------------------------------
         */

        positions[n] =
            finalX;


        positions[n + 1] =
            finalY;


        positions[n + 2] =
            finalZ;


        target[n] =
            finalX;


        target[n + 1] =
            finalY;


        target[n + 2] =
            finalZ;


        /*
         * -------------------------------------------------
         * COLOR
         * -------------------------------------------------
         */

        /*
         * Slightly lift very dark pixels.
         * This prevents completely invisible
         * particles inside the universe.
         */

        if (
            brightness <
            projection.minimumBrightness
        ) {

            const lift =
                projection.minimumBrightness -
                brightness;


            r =
                Math.min(
                    1,
                    r + lift
                );


            g =
                Math.min(
                    1,
                    g + lift
                );


            b =
                Math.min(
                    1,
                    b + lift
                );
        }


        /*
         * Tiny natural color variation.
         */

        const colorVariation =
            (
                Math.random() -
                0.5
            ) *
            projection.colorVariation;


        r =
            clamp(
                r + colorVariation,
                0,
                1
            );


        g =
            clamp(
                g + colorVariation,
                0,
                1
            );


        b =
            clamp(
                b + colorVariation,
                0,
                1
            );


        colors[n] =
            r;


        colors[n + 1] =
            g;


        colors[n + 2] =
            b;


        /*
         * -------------------------------------------------
         * PARTICLE SIZE
         * -------------------------------------------------
         */

        const minSize =
            Math.max(
                0.1,
                Number(
                    CONFIG?.PARTICLES?.MIN_SIZE
                ) || 1.5
            );


        const maxSize =
            Math.max(
                minSize,
                Number(
                    CONFIG?.PARTICLES?.MAX_SIZE
                ) || 5
            );


        /*
         * Brighter image regions receive
         * slightly more visual presence.
         */

        const brightnessFactor =
            0.65 +
            brightness *
            0.65;


        sizes[i] =
            (
                minSize +
                Math.random() *
                (
                    maxSize -
                    minSize
                )
            ) *
            brightnessFactor;


        /*
         * -------------------------------------------------
         * DRIFT
         * -------------------------------------------------
         *
         * Very small movement.
         *
         * This keeps the nebula alive without
         * destroying the hidden image structure.
         */

        const driftStrength =
            projection.drift;


        drift[n] =
            (
                Math.random() -
                0.5
            ) *
            driftStrength;


        drift[n + 1] =
            (
                Math.random() -
                0.5
            ) *
            driftStrength;


        drift[n + 2] =
            (
                Math.random() -
                0.5
            ) *
            driftStrength;


        phase[i] =
            Math.random() *
            Math.PI *
            2;
    }


    /*
     * =====================================================
     * HIDDEN OBSERVATION PARAMETERS
     * =====================================================
     */

    const observation =
        createObservation(
            THREE,
            projection
        );


    /*
     * =====================================================
     * NEBULA
     * =====================================================
     */

    const nebula = {

        /*
         * Particle data
         */

        positions,

        colors,

        sizes,

        drift,

        phase,

        target,

        count,


        /*
         * Observation
         */

        observation,


        /*
         * Runtime
         */

        birthTime:
            getNow(),


        state:
            "SUMMONING",


        rotationMode:
            randomRotationMode(),


        velocity:
            new THREE.Vector3(),


        center:
            new THREE.Vector3(),


        /*
         * Image identity
         */

        originalImageId:
            imageSource || null,


        imageSource:
            imageSource || null,


        /*
         * Internal metadata
         *
         * These values are NOT used by
         * the renderer directly.
         *
         * They allow future observation
         * projection / regeneration modules
         * to understand the generated nebula.
         */

        projection: {

            width:
                projection.width,

            height:
                projection.height,

            depth:
                projection.depth,

            sampleSize,

            imageBacked:
                !!imageData
        }
    };


    /*
     * =====================================================
     * COMPLETE
     * =====================================================
     */

    console.log(
        "[NebulaGenerator] COMPLETE:",
        count,
        "PARTICLES",
        imageData
            ? "IMAGE-BACKED"
            : "PROCEDURAL"
    );


    return nebula;
}


/*
 * =========================================================
 * IMAGE SAMPLING
 * =========================================================
 */

function sampleImage(
    image,
    size
) {

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        size;


    canvas.height =
        size;


    const context =
        canvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true
            }
        );


    if (
        !context
    ) {

        return null;
    }


    /*
     * Preserve image aspect ratio
     * while fitting into the sampling area.
     */

    const sourceWidth =
        Math.max(
            1,
            image.naturalWidth ||
            image.width ||
            1
        );


    const sourceHeight =
        Math.max(
            1,
            image.naturalHeight ||
            image.height ||
            1
        );


    const sourceRatio =
        sourceWidth /
        sourceHeight;


    const targetRatio =
        1;


    let drawWidth =
        size;


    let drawHeight =
        size;


    let offsetX =
        0;


    let offsetY =
        0;


    if (
        sourceRatio >
        targetRatio
    ) {

        drawHeight =
            size;


        drawWidth =
            size *
            sourceRatio;


        offsetX =
            (
                size -
                drawWidth
            ) *
            0.5;

    } else {

        drawWidth =
            size;


        drawHeight =
            size /
            sourceRatio;


        offsetY =
            (
                size -
                drawHeight
            ) *
            0.5;
    }


    /*
     * Black background ensures transparent
     * image areas become empty/dark particles.
     */

    context.clearRect(
        0,
        0,
        size,
        size
    );


    context.drawImage(
        image,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
    );


    let data;


    try {

        data =
            context.getImageData(
                0,
                0,
                size,
                size
            ).data;

    } catch (
        error
    ) {

        console.warn(
            "[NebulaGenerator] IMAGE DATA FAILED:",
            error
        );


        return null;
    }


    return {
        data,
        size
    };
}


/*
 * =========================================================
 * PIXEL
 * =========================================================
 */

function samplePixel(
    imageData,
    size
) {

    const x =
        Math.floor(
            Math.random() *
            size
        );


    const y =
        Math.floor(
            Math.random() *
            size
        );


    const index =
        (
            y *
            size +
            x
        ) *
        4;


    const data =
        imageData.data;


    const alpha =
        (
            data[index + 3] || 0
        ) /
        255;


    /*
     * Coordinates:
     *
     * x: -0.5 → +0.5
     * y: +0.5 → -0.5
     *
     * Y is flipped because image
     * coordinates grow downward.
     */

    return {

        x:
            (
                x /
                Math.max(
                    1,
                    size - 1
                )
            )
            -
            0.5,

        y:
            0.5 -
            (
                y /
                Math.max(
                    1,
                    size - 1
                )
            ),

        r:
            (
                data[index] || 0
            ) /
            255,

        g:
            (
                data[index + 1] || 0
            ) /
            255,

        b:
            (
                data[index + 2] || 0
            ) /
            255,

        alpha
    };
}


/*
 * =========================================================
 * PROCEDURAL PIXEL
 * =========================================================
 *
 * Used when no image is available.
 */

function createProceduralPixel() {

    const angle =
        Math.random() *
        Math.PI *
        2;


    const radius =
        Math.sqrt(
            Math.random()
        ) *
        0.5;


    const x =
        Math.cos(
            angle
        ) *
        radius;


    const y =
        Math.sin(
            angle
        ) *
        radius;


    const hue =
        Math.random();


    return {

        x,

        y,

        r:
            0.15 +
            hue * 0.65,

        g:
            0.20 +
            Math.random() *
            0.55,

        b:
            0.35 +
            Math.random() *
            0.65,

        alpha:
            1
    };
}


/*
 * =========================================================
 * PROJECTION PARAMETERS
 * =========================================================
 */

function createProjectionParameters() {

    const nebulaConfig =
        CONFIG?.NEBULA || {};


    return {

        /*
         * Main hidden image plane.
         */

        width:
            Number.isFinite(
                Number(
                    nebulaConfig.PROJECTION_WIDTH
                )
            )
                ? Number(
                    nebulaConfig.PROJECTION_WIDTH
                )
                : 110,


        height:
            Number.isFinite(
                Number(
                    nebulaConfig.PROJECTION_HEIGHT
                )
            )
                ? Number(
                    nebulaConfig.PROJECTION_HEIGHT
                )
                : 82,


        /*
         * Volumetric depth.
         */

        depth:
            Number.isFinite(
                Number(
                    nebulaConfig.PROJECTION_DEPTH
                )
            )
                ? Number(
                    nebulaConfig.PROJECTION_DEPTH
                )
                : 26,


        noiseDepth:
            Number.isFinite(
                Number(
                    nebulaConfig.NOISE_DEPTH
                )
            )
                ? Number(
                    nebulaConfig.NOISE_DEPTH
                )
                : 13,


        brightnessDepth:
            Number.isFinite(
                Number(
                    nebulaConfig.BRIGHTNESS_DEPTH
                )
            )
                ? Number(
                    nebulaConfig.BRIGHTNESS_DEPTH
                )
                : 8,


        /*
         * Organic structure.
         */

        organic:
            Number.isFinite(
                Number(
                    nebulaConfig.ORGANIC_DISTORTION
                )
            )
                ? Number(
                    nebulaConfig.ORGANIC_DISTORTION
                )
                : 5,


        organicDepth:
            Number.isFinite(
                Number(
                    nebulaConfig.ORGANIC_DEPTH
                )
            )
                ? Number(
                    nebulaConfig.ORGANIC_DEPTH
                )
                : 7,


        /*
         * Outer universe particles.
         */

        outerParticleRatio:
            Number.isFinite(
                Number(
                    nebulaConfig.OUTER_PARTICLE_RATIO
                )
            )
                ? Number(
                    nebulaConfig.OUTER_PARTICLE_RATIO
                )
                : 0.18,


        outerDistanceMin:
            Number.isFinite(
                Number(
                    nebulaConfig.OUTER_DISTANCE_MIN
                )
            )
                ? Number(
                    nebulaConfig.OUTER_DISTANCE_MIN
                )
                : 8,


        outerDistanceMax:
            Number.isFinite(
                Number(
                    nebulaConfig.OUTER_DISTANCE_MAX
                )
            )
                ? Number(
                    nebulaConfig.OUTER_DISTANCE_MAX
                )
                : 30,


        /*
         * Visual life.
         */

        drift:
            Number.isFinite(
                Number(
                    nebulaConfig.DRIFT
                )
            )
                ? Number(
                    nebulaConfig.DRIFT
                )
                : 0.012,


        colorVariation:
            Number.isFinite(
                Number(
                    nebulaConfig.COLOR_VARIATION
                )
            )
                ? Number(
                    nebulaConfig.COLOR_VARIATION
                )
                : 0.025,


        minimumBrightness:
            Number.isFinite(
                Number(
                    nebulaConfig.MINIMUM_BRIGHTNESS
                )
            )
                ? Number(
                    nebulaConfig.MINIMUM_BRIGHTNESS
                )
                : 0.045
    };
}


/*
 * =========================================================
 * OBSERVATION PARAMETERS
 * =========================================================
 */

function createObservation(
    THREE,
    projection
) {

    const distance =
        randomRange(
            0.90,
            1.10
        ) *
        110;


    return {

        /*
         * Hidden camera orientation.
         *
         * This is deliberately generated
         * independently for every nebula.
         */

        yaw:
            randomRange(
                -Math.PI,
                Math.PI
            ),


        pitch:
            randomRange(
                -Math.PI * 0.45,
                Math.PI * 0.45
            ),


        roll:
            randomRange(
                -Math.PI,
                Math.PI
            ),


        /*
         * Hidden observation distance.
         */

        distance,


        /*
         * Hidden observation position.
         *
         * Keep this relative to the nebula center.
         */

        position:
            new THREE.Vector3(
                randomRange(
                    -8,
                    8
                ),
                randomRange(
                    -8,
                    8
                ),
                randomRange(
                    -8,
                    8
                )
            ),


        /*
         * Hidden scale.
         */

        scale:
            randomRange(
                0.92,
                1.08
            ),


        /*
         * Tolerances follow the
         * product specification.
         */

        tolerance: {

            rotation:
                randomRange(
                    0.03,
                    0.05
                ),


            distance:
                randomRange(
                    0.05,
                    0.10
                ),


            position:
                0.05,


            scale:
                randomRange(
                    0.05,
                    0.08
                )
        },


        /*
         * Similarity threshold.
         */

        similarityThreshold:
            Number(
                CONFIG?.OBSERVATION?.SIMILARITY_THRESHOLD
            ) || 0.85,


        /*
         * Metadata for future
         * projection comparison.
         */

        projection: {

            width:
                projection.width,

            height:
                projection.height,

            depth:
                projection.depth
        }
    };
}


/*
 * =========================================================
 * RANDOM ROTATION MODE
 * =========================================================
 */

function randomRotationMode() {

    const modes = [

        "ROTATE",

        "FLIP",

        "STOP",

        "DEFORM"

    ];


    return modes[
        Math.floor(
            Math.random() *
            modes.length
        )
    ];
}


/*
 * =========================================================
 * RANDOM DIRECTION
 * =========================================================
 */

function randomDirection() {

    let x =
        Math.random() *
        2 -
        1;


    let y =
        Math.random() *
        2 -
        1;


    let z =
        Math.random() *
        2 -
        1;


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


    return {

        x,

        y,

        z
    };
}


/*
 * =========================================================
 * PROCEDURAL NOISE
 * =========================================================
 */

function noise3(
    x,
    y,
    z
) {

    return (

        Math.sin(
            x * 1.71 +
            y * 2.13 +
            z * 1.91
        )

        +

        Math.sin(
            x * 3.11 -
            y * 1.47 +
            z * 2.71
        )

    ) * 0.25;
}


/*
 * =========================================================
 * RANDOM RANGE
 * =========================================================
 */

function randomRange(
    a,
    b
) {

    return (
        a +
        Math.random() *
        (
            b -
            a
        )
    );
}


/*
 * =========================================================
 * CLAMP
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
 * TIME
 * =========================================================
 */

function getNow() {

    if (
        typeof performance !==
        "undefined"
        &&
        typeof performance.now ===
        "function"
    ) {

        return performance.now();
    }


    return Date.now();
}