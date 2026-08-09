(function () {

"use strict";


/*
 * =========================================================
 * MAIN
 * MINIMAL VISUAL TEST
 * =========================================================
 */

function debug(
    message
) {

    let box =
        document.getElementById(
            "startupDebug"
        );


    if (
        !box
    ) {

        box =
            document.createElement(
                "div"
            );


        box.id =
            "startupDebug";


        box.style.position =
            "fixed";

        box.style.left =
            "10px";

        box.style.top =
            "10px";

        box.style.zIndex =
            "999999";

        box.style.padding =
            "12px";

        box.style.background =
            "rgba(0,0,0,0.85)";

        box.style.color =
            "#00ff88";

        box.style.fontFamily =
            "monospace";

        box.style.fontSize =
            "14px";

        box.style.lineHeight =
            "1.5";

        box.style.whiteSpace =
            "pre-wrap";

        box.style.pointerEvents =
            "none";


        document.body.appendChild(
            box
        );
    }


    box.textContent +=
        "[MAIN] " +
        message +
        "\n";


    console.log(
        "[MAIN]",
        message
    );
}


debug(
    "MAIN MODULE EXECUTING"
);


/*
 * =========================================================
 * IMPORTS
 * =========================================================
 */

Promise.all([

    import(
        "./core/renderer.js"
    ),

    import(
        "./core/camera.js"
    ),

    import(
        "./core/universe.js"
    ),

    import(
        "./core/engine.js"
    ),

    import(
        "./universe/roaming.js"
    ),

    import(
        "./core/state.js"
    ),

    import(
        "./universe/ambient.js"
    )

])
.then(
    function (
        modules
    ) {

        debug(
            "ALL IMPORTS OK"
        );


        startApplication(
            modules
        );
    }
)
.catch(
    function (
        error
    ) {

        debug(
            "IMPORT ERROR"
        );


        debug(
            error?.stack ||
            error?.message ||
            String(error)
        );


        console.error(
            "[MAIN] IMPORT ERROR:",
            error
        );
    }
);


/*
 * =========================================================
 * APPLICATION
 * =========================================================
 */

async function startApplication(
    modules
) {

    const [

        rendererModule,
        cameraModule,
        universeModule,
        engineModule,
        roamingModule,
        stateModule

    ] =
        modules;


    debug(
        "MODULES CONNECTED"
    );


    const {
        createRenderer
    } =
        rendererModule;


    const {
        CameraController
    } =
        cameraModule;


    const {
        Universe
    } =
        universeModule;


    const {
        Engine
    } =
        engineModule;


    const {
        UniverseRoaming
    } =
        roamingModule;


    const {
        STATE
    } =
        stateModule;


    /*
     * =====================================================
     * CANVAS
     * =====================================================
     */

    const canvas =
        document.getElementById(
            "universeCanvas"
        );


    if (
        !canvas
    ) {

        debug(
            "CANVAS MISSING"
        );

        return;
    }


    debug(
        "CANVAS OK"
    );


    /*
     * =====================================================
     * RENDERER
     * =====================================================
     */

    debug(
        "CREATING RENDERER"
    );


    const runtime =
        await createRenderer(
            canvas
        );


    if (
        !runtime
    ) {

        throw new Error(
            "Renderer returned null."
        );
    }


    debug(
        "RENDERER: " +
        runtime.mode
    );


    /*
     * =====================================================
     * THREE
     * =====================================================
     */

    if (
        runtime.mode !==
        "THREE_WEBGL"
    ) {

        debug(
            "NOT THREE WEBGL: " +
            runtime.mode
        );

        return;
    }


    const THREE =
        runtime.THREE;


    const renderer =
        runtime.renderer;


    if (
        !THREE
    ) {

        throw new Error(
            "THREE missing."
        );
    }


    if (
        !renderer
    ) {

        throw new Error(
            "Renderer missing."
        );
    }


    debug(
        "THREE.JS OK"
    );


    /*
     * =====================================================
     * SCENE
     * =====================================================
     */

    const scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x000000
        );


    debug(
        "SCENE OK"
    );


    /*
     * =====================================================
     * CAMERA
     * =====================================================
     */

    const cameraController =
        new CameraController(
            THREE
        );


    const camera =
        cameraController
            .createCamera();


    if (
        !camera
    ) {

        throw new Error(
            "Camera creation failed."
        );
    }


    /*
     * Force known camera position.
     */

    camera.position.set(
        0,
        0,
        0
    );


    camera.lookAt(
        0,
        0,
        -100
    );


    camera.near =
        0.1;

    camera.far =
        5000;


    camera.updateProjectionMatrix();


    debug(
        "CAMERA OK"
    );


    /*
     * =====================================================
     * UNIVERSE
     * =====================================================
     */

    debug(
        "CREATING UNIVERSE"
    );


    const universe =
        new Universe(
            THREE,
            scene,
            cameraController
        );


    debug(
        "UNIVERSE CREATED"
    );


    /*
     * =====================================================
     * ROAMING
     * =====================================================
     */

    let roaming =
        null;


    try {

        roaming =
            new UniverseRoaming(
                THREE,
                scene
            );


        debug(
            "ROAMING OK"
        );

    } catch (error) {

        console.warn(
            "[MAIN] ROAMING ERROR:",
            error
        );

        debug(
            "ROAMING DISABLED"
        );
    }


    /*
     * =====================================================
     * RESIZE
     * =====================================================
     */

    function resize() {

        try {

            cameraController.resize();

        } catch (error) {

            console.warn(
                "[MAIN] CAMERA RESIZE ERROR:",
                error
            );
        }


        renderer.setSize(
            window.innerWidth,
            window.innerHeight,
            false
        );


        if (
            renderer.setPixelRatio
        ) {

            renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    2
                )
            );
        }


        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();
    }


    window.addEventListener(
        "resize",
        resize
    );


    resize();


    debug(
        "RESIZE OK"
    );


    /*
     * =====================================================
     * ENGINE
     * =====================================================
     */

    const engine =
        new Engine(

            renderer,

            scene,

            camera,

            cameraController,

            universe,

            null,

            roaming
        );


    debug(
        "ENGINE CREATED"
    );


    engine.start();


    debug(
        "ENGINE STARTED"
    );


    debug(
        "SYSTEM ONLINE"
    );
}

})();