import {
    CONFIG
} from "../config.js";


export async function generateNebula(
    THREE,
    imageSource
) {

    if (
        !THREE
    ) {

        throw new Error(
            "THREE is required."
        );
    }


    if (
        !imageSource
    ) {

        throw new Error(
            "Image source is empty."
        );
    }


    /*
     * =====================================================
     * LOAD IMAGE
     * =====================================================
     */

    const image =
        await loadImage(
            imageSource
        );


    /*
     * =====================================================
     * IMAGE SAMPLING SURFACE
     *
     * This canvas is NEVER displayed.
     * It only extracts pixel colors.
     * =====================================================
     */

    const size =
        96;


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        size;

    canvas.height =
        size;


    const ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true
            }
        );


    if (!ctx) {

        throw new Error(
            "2D canvas context unavailable."
        );
    }


    ctx.drawImage(
        image,
        0,
        0,
        size,
        size
    );


    const pixels =
        ctx.getImageData(
            0,
            0,
            size,
            size
        ).data;


    /*
     * =====================================================
     * PARTICLE DATA
     * =====================================================
     */

    const count =
        Math.max(
            1,
            CONFIG.PARTICLES.MAIN
        );


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
     * Target is kept as a separate
     * mathematical reference.
     */

    const target =
        new Float32Array(
            count * 3
        );


    /*
     * =====================================================
     * GENERATE PARTICLES
     * =====================================================
     */

    for (
        let i = 0;
        i < count;
        i++
    ) {

        /*
         * -------------------------------------------------
         * RANDOM PIXEL
         * -------------------------------------------------
         */

        const px =
            Math.floor(
                Math.random() * size
            );


        const py =
            Math.floor(
                Math.random() * size
            );


        const p =
            (
                py * size +
                px
            ) * 4;


        let r =
            pixels[p] / 255;


        let g =
            pixels[p + 1] / 255;


        let b =
            pixels[p + 2] / 255;


        /*
         * -------------------------------------------------
         * BASE IMAGE COORDINATES
         * -------------------------------------------------
         */

        const u =
            (px / (size - 1)) -
            0.5;


        const v =
            (py / (size - 1)) -
            0.5;


        /*
         * -------------------------------------------------
         * 3D DEFORMATION
         * -------------------------------------------------
         */

        const radial =
            Math.sqrt(
                u * u +
                v * v
            );


        const irregular =
            noise3(
                u * 8,
                v * 8,
                i * 0.0007
            );


        const depthNoise =
            (
                Math.random() -
                0.5
            ) * 45;


        const spiral =
            radial * 15 +
            irregular * 4;


        let x =
            u * 95;


        let y =
            -v * 70;


        let z =
            depthNoise +
            Math.sin(
                spiral
            ) * 8;


        /*
         * -------------------------------------------------
         * DEPTH LAYERS
         * -------------------------------------------------
         */

        const layer =
            Math.floor(
                Math.random() * 9
            );


        z +=
            (layer - 4) * 4.5;


        /*
         * -------------------------------------------------
         * ORGANIC DISTORTION
         * -------------------------------------------------
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
         * -------------------------------------------------
         * SPARSE ZONES
         * -------------------------------------------------
         */

        const density =
            Math.random();


        if (
            density < 0.25
        ) {

            x *= 1.5;

            y *= 1.45;

            z *= 1.25;
        }


        /*
         * -------------------------------------------------
         * RANDOM LOCAL ROTATION
         * -------------------------------------------------
         */

        const randomAngle =
            Math.random() *
            Math.PI *
            2;


        const cos =
            Math.cos(
                randomAngle
            );


        const sin =
            Math.sin(
                randomAngle
            );


        const rx =
            x * cos -
            y * sin;


        const ry =
            x * sin +
            y * cos;


        x =
            rx;

        y =
            ry;


        /*
         * -------------------------------------------------
         * POSITION
         * -------------------------------------------------
         */

        const n =
            i * 3;


        positions[n] =
            x;

        positions[n + 1] =
            y;

        positions[n + 2] =
            z;


        /*
         * -------------------------------------------------
         * OBSERVATION TARGET
         * -------------------------------------------------
         */

        target[n] =
            x;

        target[n + 1] =
            y;

        target[n + 2] =
            z;


        /*
         * -------------------------------------------------
         * COLOR
         * -------------------------------------------------
         */

        /*
         * Slightly lift dark pixels so the universe
         * does not become completely invisible.
         */

        const brightness =
            (
                r +
                g +
                b
            ) / 3;


        if (
            brightness < 0.04
        ) {

            const lift =
                0.04 -
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
         * -------------------------------------------------
         * PARTICLE SIZE
         * -------------------------------------------------
         */

        sizes[i] =
            CONFIG.PARTICLES.MIN_SIZE +

            Math.random() *

            (
                CONFIG.PARTICLES.MAX_SIZE -
                CONFIG.PARTICLES.MIN_SIZE
            );


        /*
         * -------------------------------------------------
         * DRIFT
         * -------------------------------------------------
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


        /*
         * -------------------------------------------------
         * PHASE
         * -------------------------------------------------
         */

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

    const observation = {

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
            35 *
            randomRange(
                0.90,
                1.10
            ),


        position:
            new THREE.Vector3(

                randomRange(
                    -5,
                    5
                ),

                randomRange(
                    -5,
                    5
                ),

                randomRange(
                    -5,
                    5
                )
            ),


        scale:
            randomRange(
                0.92,
                1.08
            )
    };


    /*
     * =====================================================
     * RELEASE IMAGE RESOURCES
     * =====================================================
     */

    try {

        image.onload =
            null;

        image.onerror =
            null;

    } catch (_) {}


    /*
     * =====================================================
     * RETURN NEBULA
     * =====================================================
     */

    return {

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
            imageSource
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

            const img =
                new Image();


            img.onload =
                () => {

                    resolve(
                        img
                    );
                };


            img.onerror =
                () => {

                    reject(
                        new Error(
                            "Failed to load image."
                        )
                    );
                };


            img.src =
                source;
        }
    );
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
            b - a
        )
    );
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
 * LIGHTWEIGHT 3D NOISE
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