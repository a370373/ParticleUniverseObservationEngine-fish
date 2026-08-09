import { CONFIG } from "../config.js";

export async function generateNebula(
    THREE,
    imageSource
) {

    const image =
        await loadImage(imageSource);

    /*
     * Sampling surface.
     *
     * This is NOT used as a visible plane.
     */

    const size = 96;

    const canvas =
        document.createElement("canvas");

    canvas.width = size;
    canvas.height = size;

    const ctx =
        canvas.getContext("2d", {
            willReadFrequently: true
        });

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
     * Once sampled, image element can be released.
     */
    image.src = "";

    const count =
        CONFIG.PARTICLES.MAIN;

    const positions =
        new Float32Array(count * 3);

    const colors =
        new Float32Array(count * 3);

    const sizes =
        new Float32Array(count);

    const drift =
        new Float32Array(count * 3);

    const phase =
        new Float32Array(count);

    const target =
        new Float32Array(count * 3);

    for (
        let i = 0;
        i < count;
        i++
    ) {

        /*
         * Pick random pixel.
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
            (py * size + px) * 4;

        let r =
            pixels[p] / 255;

        let g =
            pixels[p + 1] / 255;

        let b =
            pixels[p + 2] / 255;

        const brightness =
            (
                r +
                g +
                b
            ) / 3;

        /*
         * Base image coordinate.
         */
        const u =
            (px / size) - 0.5;

        const v =
            (py / size) - 0.5;

        /*
         * MASSIVE 3D DEFORMATION
         *
         * This prevents the cloud from becoming
         * a rectangular image plane.
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
                Math.random() - 0.5
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
            Math.sin(spiral) * 8;

        /*
         * Make multiple depth layers.
         */
        const layer =
            Math.floor(
                Math.random() * 9
            );

        z +=
            (layer - 4) * 4.5;

        /*
         * Organic distortion.
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
         * Sparse zones.
         */
        const density =
            Math.random();

        if (density < 0.25) {

            x *= 1.5;
            y *= 1.45;
            z *= 1.25;
        }

        /*
         * Random orientation.
         */
        const randomAngle =
            Math.random() *
            Math.PI *
            2;

        const rx =
            x * Math.cos(randomAngle) -
            y * Math.sin(randomAngle);

        const ry =
            x * Math.sin(randomAngle) +
            y * Math.cos(randomAngle);

        x = rx;
        y = ry;

        positions[i * 3] =
            x;

        positions[i * 3 + 1] =
            y;

        positions[i * 3 + 2] =
            z;

        /*
         * Target remains hidden.
         *
         * It is the mathematical reference
         * used by observation detection.
         */

        target[i * 3] =
            x;

        target[i * 3 + 1] =
            y;

        target[i * 3 + 2] =
            z;

        colors[i * 3] =
            r;

        colors[i * 3 + 1] =
            g;

        colors[i * 3 + 2] =
            b;

        sizes[i] =
            CONFIG.PARTICLES.MIN_SIZE +
            Math.random() *
            (
                CONFIG.PARTICLES.MAX_SIZE -
                CONFIG.PARTICLES.MIN_SIZE
            );

        drift[i * 3] =
            (
                Math.random() -
                0.5
            ) * 0.015;

        drift[i * 3 + 1] =
            (
                Math.random() -
                0.5
            ) * 0.015;

        drift[i * 3 + 2] =
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
     * Hidden random observation parameters.
     *
     * Every nebula gets a different observation location.
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
                randomRange(-5, 5),
                randomRange(-5, 5),
                randomRange(-5, 5)
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
            imageSource
    };
}

function loadImage(source) {

    return new Promise(
        (resolve, reject) => {

            const img =
                new Image();

            img.onload = () =>
                resolve(img);

            img.onerror = reject;

            img.src = source;
        }
    );
}

function randomRange(a, b) {
    return a +
        Math.random() *
        (b - a);
}

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

function noise3(x, y, z) {

    return (
        Math.sin(
            x * 1.71 +
            y * 2.13 +
            z * 1.91
        ) +
        Math.sin(
            x * 3.11 -
            y * 1.47 +
            z * 2.71
        )
    ) * 0.25;
}