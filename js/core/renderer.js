import * as THREE
    from "../../lib/three.module.js";

export async function createRenderer(canvas) {

    /*
     * =====================================================
     * LEVEL 1
     * WebGPU Renderer
     * =====================================================
     */

    try {

        const module =
            await import("../../lib/three.webgpu.js");

        if (
            module &&
            module.WebGPURenderer &&
            navigator.gpu
        ) {

            const renderer =
                new module.WebGPURenderer({
                    canvas,
                    antialias: true,
                    alpha: false
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

    } catch (error) {

        console.warn(
            "WebGPU unavailable:",
            error
        );
    }

    /*
     * =====================================================
     * LEVEL 2
     * Three.js WebGL
     * =====================================================
     */

    try {

        const renderer =
            new THREE.WebGLRenderer({
                canvas,
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
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

    } catch (error) {

        console.warn(
            "Three.js WebGL unavailable:",
            error
        );
    }

    /*
     * =====================================================
     * LEVEL 3
     * Native WebGL fallback
     * =====================================================
     */

    try {

        const gl =
            canvas.getContext("webgl2", {
                antialias: true,
                alpha: false
            }) ||
            canvas.getContext("webgl", {
                antialias: true,
                alpha: false
            });

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
            "Raw WebGL unavailable:",
            error
        );
    }

    /*
     * =====================================================
     * LEVEL 4
     * Canvas fallback
     * =====================================================
     */

    return {
        renderer: null,
        THREE: null,
        mode: "CANVAS"
    };
}