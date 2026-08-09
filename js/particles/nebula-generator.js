import {
    CONFIG
} from "../config.js";


export async function generateNebula(
    THREE,
    imageSource
) {

    if (!THREE) {

        throw new Error(
            "THREE is required."
        );
    }


    let image = null;


    /*
     * =====================================================
     * OPTIONAL IMAGE
     * =====================================================
     */

    if (imageSource) {

        try {

            image =
                await loadImage(
                    imageSource
                );

        } catch (error) {

            console.warn(
                "[Nebula] Image failed, using procedural source:",
                error
            );

            image = null;
        }
    }


    /*
     * =====================================================
     * IMAGE SAMPLING
     * =====================================================
     */

    const size =
        96;


    let pixels = null;


    if (image) {

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


        if (ctx) {

            ctx.drawImage(
                image,
                0,
                0,
                size,
                size
            );


            pixels =
                ctx.getImageData(
                    0,
                    0,
                    size,
                    size
                ).data;
        }
    }


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


    const target =
        new Float32Array(
            count * 3
        );


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


        let r;
        let g;
        let b;


        /*
         * =================================================
         * IMAGE COLOR
         * =================================================
         */

        if (pixels) {

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


            r =
                pixels[p] / 255;

            g =
                pixels[p + 1] / 255;

            b =
                pixels[p + 2] / 255;

        } else {

            /*
             * Procedural fallback colors.
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
         * POSITION
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
            Math.random() < 0.25
        ) {

            x *= 1.5;
            y *= 1.45;
            z *= 1.25;
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
            brightness < 0.08
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
         * SIZE
         * =================================================
         */

        sizes[i] =
            CONFIG.PARTICLES.MIN_SIZE +
            Math.random() *
            (
                CONFIG.PARTICLES.MAX_SIZE -
                CONFIG.PARTICLES.MIN_SIZE
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
     * OBSERVATION
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
            110 *
            randomRange(
                0.90,
                1.10
            ),

        position:
            new THREE.Vector3(
                0,
                0,
                0
            ),

        scale:
            randomRange(
                0.92,
                1.08
            )
    };


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
            imageSource || null
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
 * ROTATION
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