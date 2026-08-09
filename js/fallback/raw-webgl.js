export function startRawWebGL(
    canvas,
    gl
) {

    function resize() {

        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        canvas.width =
            window.innerWidth * dpr;

        canvas.height =
            window.innerHeight * dpr;

        gl.viewport(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    resize();

    window.addEventListener(
        "resize",
        resize
    );

    gl.clearColor(
        0,
        0,
        0,
        1
    );

    /*
     * Minimal native fallback.
     *
     * It guarantees the page continues running
     * even when Three.js cannot initialize.
     */

    function frame() {

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        requestAnimationFrame(
            frame
        );
    }

    frame();
}