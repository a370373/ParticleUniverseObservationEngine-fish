/*
 * Particle Universe Observation Engine
 *
 * Renderer compatibility ladder:
 *
 * LEVEL 1 → Three.js WebGPU
 * LEVEL 2 → Three.js WebGL
 * LEVEL 3 → Native WebGL2
 * LEVEL 4 → Native WebGL
 * LEVEL 5 → Canvas
 *
 * IMPORTANT:
 * Three.js is loaded dynamically.
 * Renderer failure MUST NOT prevent Click Entry
 * from initializing.
 */

export async function createRenderer(canvas) {

    /*
     * =====================================================
     * LEVEL 1
     * Three.js WebGPU
     * =====================================================
     */

    try {

        if (
            "gpu" in navigator
        ) {

            const [
                THREE,
                WEBGPU
            ] = await Promise.all([
                import("../../lib/three.module.js"),
                import("../../lib/three.webgpu.js")
            ]);

            if (
                WEBGPU &&
                WEBGPU.WebGPURenderer
            ) {

                const renderer =
                    new WEBGPU.WebGPURenderer({
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

                await renderer.init();

                return {
                    renderer,
                    THREE,
                    mode: "WEBGPU"
                };
            }
        }

    } catch (error) {

        console.warn(
            "[Renderer] WebGPU unavailable:",
            error
        );
    }


    /*
     * =====================================================
     * LEVEL 2
     * Three.js WebGL
     * =====================================================
     *
     * IMPORTANT:
     * This is a completely separate dynamic import.
     *
     * If WebGPU fails, WebGL still gets a chance.
     */

    try {

        const THREE =
            await import(
                "../../lib/three.module.js"
            );

        if (
            THREE &&
            THREE.WebGLRenderer
        ) {

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

            return {
                renderer,
                THREE,
                mode: "THREE_WEBGL"
            };
        }

    } catch (error) {

        console.warn(
            "[Renderer] Three.js WebGL unavailable:",
            error
        );
    }


    /*
     * =====================================================
     * LEVEL 3
     * Native WebGL2
     * =====================================================
     */

    try {

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

            return {
                renderer: null,
                THREE: null,
                gl,
                mode: "RAW_WEBGL"
            };
        }

    } catch (error) {

        console.warn(
            "[Renderer] WebGL2 unavailable:",
            error
        );
    }


    /*
     * =====================================================
     * LEVEL 4
     * Native WebGL1
     * =====================================================
     */

    try {

        const gl =
            canvas.getContext(
                "webgl",
                {
                    antialias: true,
                    alpha: false
                }
            );

        if (gl) {

            return {
                renderer: null,
                THREE: null,
                gl,
                mode: "RAW_WEBGL"
            };
        }

    } catch (error) {

        console.warn(
            "[Renderer] WebGL unavailable:",
            error
        );
    }


    /*
     * =====================================================
     * LEVEL 5
     * Canvas
     * =====================================================
     */

    return {
        renderer: null,
        THREE: null,
        gl: null,
        mode: "CANVAS"
    };
}