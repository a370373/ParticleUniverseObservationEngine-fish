/*
 * Particle Universe Observation Engine
 *
 * Renderer compatibility ladder:
 *
 * LEVEL 1 → Three.js WebGL
 * LEVEL 2 → Native WebGL2
 * LEVEL 3 → Native WebGL1
 * LEVEL 4 → Canvas
 *
 * IMPORTANT:
 * The current particle system uses traditional
 * Three.js ShaderMaterial / GLSL.
 *
 * Therefore WebGL is intentionally preferred.
 *
 * WebGPU is NOT selected here because using the
 * existing GLSL ShaderMaterial directly through
 * WebGPURenderer can cause compatibility problems.
 */

export async function createRenderer(canvas) {

    if (!canvas) {
        throw new Error(
            "Canvas not found."
        );
    }


    /*
     * =====================================================
     * LEVEL 1
     * THREE.JS WEBGL
     * =====================================================
     */

    try {

        console.log(
            "[Renderer] Loading Three.js WebGL..."
        );

        const THREE =
            await import(
                "../../lib/three.module.js"
            );

        if (
            !THREE ||
            !THREE.WebGLRenderer
        ) {

            throw new Error(
                "THREE.WebGLRenderer unavailable."
            );
        }


        const renderer =
            new THREE.WebGLRenderer({

                canvas,

                antialias: true,

                alpha: false,

                powerPreference:
                    "high-performance"
            });


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                2
            )
        );


        renderer.setSize(
            window.innerWidth,
            window.innerHeight,
            false
        );


        renderer.setClearColor(
            0x000000,
            1
        );


        /*
         * Make sure the canvas is actually usable.
         */

        renderer.outputColorSpace =
            THREE.SRGBColorSpace;


        console.log(
            "[Renderer] Three.js WebGL ready."
        );


        return {

            renderer,

            THREE,

            gl:
                renderer.getContext(),

            mode:
                "THREE_WEBGL"
        };

    } catch (error) {

        console.warn(
            "[Renderer] Three.js WebGL failed:",
            error
        );
    }


    /*
     * =====================================================
     * LEVEL 2
     * RAW WEBGL2
     * =====================================================
     */

    try {

        console.log(
            "[Renderer] Trying native WebGL2..."
        );


        const gl =
            canvas.getContext(
                "webgl2",
                {
                    antialias: true,
                    alpha: false,
                    powerPreference:
                        "high-performance"
                }
            );


        if (gl) {

            console.log(
                "[Renderer] Native WebGL2 ready."
            );


            return {

                renderer: null,

                THREE: null,

                gl,

                mode:
                    "RAW_WEBGL"
            };
        }

    } catch (error) {

        console.warn(
            "[Renderer] WebGL2 failed:",
            error
        );
    }


    /*
     * =====================================================
     * LEVEL 3
     * RAW WEBGL1
     * =====================================================
     */

    try {

        console.log(
            "[Renderer] Trying native WebGL1..."
        );


        const gl =
            canvas.getContext(
                "webgl",
                {
                    antialias: true,
                    alpha: false,
                    powerPreference:
                        "high-performance"
                }
            );


        if (gl) {

            console.log(
                "[Renderer] Native WebGL1 ready."
            );


            return {

                renderer: null,

                THREE: null,

                gl,

                mode:
                    "RAW_WEBGL"
            };
        }

    } catch (error) {

        console.warn(
            "[Renderer] WebGL1 failed:",
            error
        );
    }


    /*
     * =====================================================
     * LEVEL 4
     * CANVAS
     * =====================================================
     */

    console.warn(
        "[Renderer] Falling back to Canvas."
    );


    return {

        renderer: null,

        THREE: null,

        gl: null,

        mode:
            "CANVAS"
    };
}