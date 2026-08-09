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
 * DATA GENERATOR ONLY
 *
 * This module does NOT:
 * - render particles
 * - create THREE.Points
 * - control Camera
 * - run observation events
 * - play intro animation
 *
 * CameraController is completely independent.
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
     * LOAD IMAGE
     * =====================================================
     */

    let image = null;


    if (imageSource) {

        try {

            image =
                await loadImage(
                    imageSource
                );

            console.log(
                "[NebulaGenerator] IMAGE LOADED"
            );

        } catch (error) {

            console.warn(
                "[NebulaGenerator] IMAGE LOAD FAILED:",
                error
            );

            image = null;
        }
    }


    /*
     * =====================================================
     * SAMPLE SIZE
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

    const target =
        new Float32Array(
            count * 3
        );


    /*
     * =====================================================
     * PROJECTION
     * =====================================================
     */

    const projection =
        createProjectionParameters();


    /*
     * =====================================================
     * GENERATE
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
         * IMAGE COORDINATES
         * -------------------------------------------------
         */

        const imageX =
            pixel.x;

        const imageY =
            pixel.y;


        /*
         * -------------------------------------------------
         * IMAGE PLANE
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
         * VOLUMETRIC DEPTH
         * -------------------------------------------------
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
         * POSITION
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
         * ALPHA / BRIGHTNESS
         * -------------------------------------------------
         */

        const alpha =
            Number.isFinite(
                pixel.alpha
            )
                ? pixel.alpha
                : 1;


        if (
            alpha <= 0.01
        ) {

            r *= 0.15;
            g *= 0.15;
            b *= 0.15;
        }


        /*
         * Lift extremely dark particles.
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
         * -------------------------------------------------
         * COLOR VARIATION
         * -------------------------------------------------
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
         * SIZE
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
     * OBSERVATION
     * =====================================================
     */

    const observation =
        createObservation(
            THREE,
            projection
        );


    /*
     * =====================================================
     * RESULT
     * =====================================================
     */

    const nebula = {

        positions,

        colors,

        sizes,

        drift,

        phase,

        target,

        count,

        observation,

        birthTime:
            getNow(),

        /*
         * IMPORTANT
         *
         * ParticleSystem will use this
         * state for the opening animation.
         */

        state:
            "SUMMONING",

        rotationMode:
            randomRotationMode(),

        velocity:
            new THREE.Vector3(),

        center:
            new THREE.Vector3(),

        originalImageId:
            imageSource || null,

        imageSource:
            imageSource || null,

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
 * IMAGE LOADER
 * =========================================================
 */

function loadImage(
    source
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const image =
                new Image();

            image.onload =
                () => resolve(
                    image
                );

            image.onerror =
                () => reject(
                    new Error(
                        "Image loading failed."
                    )
                );

            /*
             * Base64 / data URLs work directly.
             */

            image.src =
                source;
        }
    );
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


    if (!context) {

        return null;
    }


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

    } catch (error) {

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
 * SAMPLE PIXEL
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


    return {

        x:
            (
                x /
                Math.max(
                    1,
                    size - 1
                )
            ) -
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

    const config =
        CONFIG?.NEBULA || {};


    return {

        width:
            finiteOr(
                config.PROJECTION_WIDTH,
                110
            ),

        height:
            finiteOr(
                config.PROJECTION_HEIGHT,
                82
            ),

        depth:
            finiteOr(
                config.PROJECTION_DEPTH,
                26
            ),

        noiseDepth:
            finiteOr(
                config.NOISE_DEPTH,
                13
            ),

        brightnessDepth:
            finiteOr(
                config.BRIGHTNESS_DEPTH,
                8
            ),

        organic:
            finiteOr(
                config.ORGANIC_DISTORTION,
                5
            ),

        organicDepth:
            finiteOr(
                config.ORGANIC_DEPTH,
                7
            ),

        outerParticleRatio:
            finiteOr(
                config.OUTER_PARTICLE_RATIO,
                0.18
            ),

        outerDistanceMin:
            finiteOr(
                config.OUTER_DISTANCE_MIN,
                8
            ),

        outerDistanceMax:
            finiteOr(
                config.OUTER_DISTANCE_MAX,
                30
            ),

        drift:
            finiteOr(
                config.DRIFT,
                0.012
            ),

        colorVariation:
            finiteOr(
                config.COLOR_VARIATION,
                0.025
            ),

        minimumBrightness:
            finiteOr(
                config.MINIMUM_BRIGHTNESS,
                0.045
            )
    };
}


/*
 * =========================================================
 * OBSERVATION
 * =========================================================
 */

function createObservation(
    THREE,
    projection
) {

    return {

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

        distance:
            randomRange(
                0.90,
                1.10
            ) *
            110,

        position:
            new THREE.Vector3(
                randomRange(-8, 8),
                randomRange(-8, 8),
                randomRange(-8, 8)
            ),

        scale:
            randomRange(
                0.92,
                1.08
            ),

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

        similarityThreshold:
            Number(
                CONFIG?.OBSERVATION?.SIMILARITY_THRESHOLD
            ) || 0.85,

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


    return {

        x:
            x / length,

        y:
            y / length,

        z:
            z / length
    };
}


/*
 * =========================================================
 * NOISE
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
 * FINITE VALUE
 * =========================================================
 */

function finiteOr(
    value,
    fallback
) {

    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : fallback;
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