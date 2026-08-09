import {
    CONFIG
} from "../config.js";


/*
 * =========================================================
 * NEBULA GENERATOR
 *
 * Image
 *   ↓
 * Pixel Sampling
 *   ↓
 * Particle Data
 *   ↓
 * 3D Spatial Distribution
 *
 * This module DOES NOT render particles.
 * It only creates the procedural nebula data.
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


    let image =
        null;


    /*
     * =====================================================
     * IMAGE
     * =====================================================
     */

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

            image =
                null;
        }
    }


    /*
     * =====================================================
     * IMAGE SAMPLING
     * =====================================================
     */

    const size =
        CONFIG?.NEBULA?.IMAGE_SAMPLE_SIZE ||
        96;


    let pixels =
        null;


    if (image) {

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


        if (context) {

            context.drawImage(
                image,
                0,
                0,
                size,
                size
            );


            try {

                pixels =
                    context.getImageData(
                        0,
                        0,
                        size,
                        size
                    ).data;

            } catch (error) {

                console.warn(
                    "[NebulaGenerator] PIXEL READ FAILED:",
                    error
                );

                pixels =
                    null;
            }
        }
    }


    /*
     * =====================================================
     * PARTICLE COUNT
     * =====================================================
     */

    const count =
        Math.max(
            1,
            CONFIG?.PARTICLES?.MAIN ||
            12000
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


        let r;
        let g;
        let b;


        /*
         * =================================================
         * COLOR SOURCE
         * =================================================
         */

        if (pixels) {

            const px =
                Math.floor(
                    Math.random() *
                    size
                );


            const py =
                Math.floor(
                    Math.random() *
                    size
                );


            const pixelIndex =
                (
                    py *
                    size +
                    px
                ) * 4;


            r =
                pixels[pixelIndex] /
                255;


            g =
                pixels[pixelIndex + 1] /
                255;


            b =
                pixels[pixelIndex + 2] /
                255;

        } else {

            /*
             * Procedural fallback.
             */

            const hue =
                Math.random();


            r =
                0.15 +
                hue * 0.65;


            g =
                0.20 +
                Math.random() * 0.55;


            b =
                0.35 +
                Math.random() * 0.65;
        }


        /*
         * =================================================
         * SPATIAL DISTRIBUTION
         * =================================================
         */

        const angle =
            Math.random() *
            Math.PI *
            2;


        const radius =
            Math.pow(
                Math.random(),
                0.55
            ) * 120;


        const vertical =
            (
                Math.random() -
                0.5
            ) * 80;


        const irregular =
            noise3(
                i * 0.017,
                radius * 0.03,
                angle
            );


        let x =
            Math.cos(angle) *
            radius;


        let y =
            vertical;


        let z =
            Math.sin(angle) *
            radius;


        x +=
            irregular * 25;


        y +=
            irregular * 18;


        z +=
            irregular * 25;


        /*
         * Organic deformation.
         */

        x +=
            Math.sin(
                y * 0.07 +
                z * 0.04
            ) * 10;


        y +=
            Math.cos(
                x * 0.06 -
                z * 0.05
            ) * 9;


        z +=
            Math.sin(
                x * 0.03 +
                y * 0.04
            ) * 12;


        /*
         * Sparse outer region.
         */

        if (
            Math.random() <
            0.25
        ) {

            x *=
                1.5;


            y *=
                1.45;


            z *=
                1.25;
        }


        positions[n] =
            x;


        positions[n + 1] =
            y;


        positions[n + 2] =
            z;


        target[n] =
            x;


        target[n + 1] =
            y;


        target[n + 2] =
            z;


        /*
         * =================================================
         * COLOR LIFT
         * =================================================
         */

        const brightness =
            (
                r +
                g +
                b
            ) / 3;


        if (
            brightness <
            0.08
        ) {

            const lift =
                0.08 -
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


        colors[n] =
            r;


        colors[n + 1] =
            g;


        colors[n + 2] =
            b;


        /*
         * =================================================
         * PARTICLE SIZE
         * =================================================
         */

        const minSize =
            CONFIG?.PARTICLES?.MIN_SIZE ??
            1.5;


        const maxSize =
            CONFIG?.PARTICLES?.MAX_SIZE ??
            5;


        sizes[i] =
            minSize +
            Math.random() *
            (
                maxSize -
                minSize
            );


        /*
         * =================================================
         * DRIFT
         * =================================================
         */

        drift[n] =
            (
                Math.random() -
                0.5
            ) * 0.015;


        drift[n + 1] =
            (
                Math.random() -
                0.5
            ) * 0.015;


        drift[n + 2] =
            (
                Math.random() -
                0.5
            ) * 0.015;


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
            THREE
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
            performance.now(),

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
            imageSource || null
    };


    console.log(
        "[NebulaGenerator] COMPLETE:",
        count,
        "PARTICLES"
    );


    return nebula;
}


/*
 * =========================================================
 * OBSERVATION PARAMETERS
 * =========================================================
 */

function createObservation(
    THREE
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
            110 *
            randomRange(
                0.90,
                1.10
            ),

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

        scale:
            randomRange(
                0.92,
                1.08
            ),

        tolerance:

            {
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
                    randomRange(
                        0.05,
                        0.05
                    ),

                scale:
                    randomRange(
                        0.05,
                        0.08
                    )
            },

        similarityThreshold:
            CONFIG?.OBSERVATION?.SIMILARITY_THRESHOLD ??
            0.85
    };
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
                () => {

                    resolve(
                        image
                    );
                };


            image.onerror =
                () => {

                    reject(
                        new Error(
                            "Failed to load image."
                        )
                    );
                };


            image.src =
                source;
        }
    );
}


/*
 * =========================================================
 * RANDOM
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
 * ROTATION MODE
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