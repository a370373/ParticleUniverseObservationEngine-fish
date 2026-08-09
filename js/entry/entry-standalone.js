(function () {

    "use strict";

    let entered = false;

    function createDebug() {

        let debug =
            document.getElementById(
                "startupDebug"
            );

        if (!debug) {

            debug =
                document.createElement("div");

            debug.id =
                "startupDebug";

            debug.style.position = "fixed";
            debug.style.left = "10px";
            debug.style.top = "10px";
            debug.style.zIndex = "999999";
            debug.style.padding = "12px";
            debug.style.background =
                "rgba(0,0,0,0.85)";
            debug.style.color = "#ffffff";
            debug.style.fontFamily =
                "monospace";
            debug.style.fontSize = "14px";
            debug.style.lineHeight = "1.5";
            debug.style.whiteSpace =
                "pre-wrap";
            debug.style.pointerEvents =
                "none";

            document.body.appendChild(
                debug
            );
        }

        return debug;
    }


    function debug(message) {

        const box =
            createDebug();

        box.textContent +=
            message + "\n";

        console.log(
            "[ENTRY]",
            message
        );
    }


    function boot() {

        debug(
            "ENTRY SCRIPT LOADED"
        );

        const layer =
            document.getElementById(
                "entryLayer"
            );

        const button =
            document.getElementById(
                "enterButton"
            );

        if (!layer || !button) {

            debug(
                "ERROR: ENTRY ELEMENTS MISSING"
            );

            return;
        }

        debug(
            "ENTRY ELEMENTS OK"
        );


        layer.style.pointerEvents =
            "auto";

        button.style.pointerEvents =
            "auto";


        button.addEventListener(
            "click",
            enter,
            false
        );


        button.addEventListener(
            "pointerup",
            function (event) {

                if (
                    event.pointerType ===
                    "touch"
                ) {

                    enter(event);
                }

            },
            false
        );


        debug(
            "CLICK LISTENER READY"
        );


        function enter(event) {

            if (entered) {
                return;
            }

            entered = true;

            event?.preventDefault?.();
            event?.stopPropagation?.();

            debug(
                "CLICK DETECTED"
            );


            /*
             * =================================================
             * FULLSCREEN
             * =================================================
             */

            try {

                if (
                    !document.fullscreenElement &&
                    document.documentElement
                        .requestFullscreen
                ) {

                    document.documentElement
                        .requestFullscreen()
                        .then(
                            function () {

                                debug(
                                    "FULLSCREEN OK"
                                );

                            }
                        )
                        .catch(
                            function () {

                                debug(
                                    "FULLSCREEN FAILED"
                                );

                            }
                        );

                } else {

                    debug(
                        "FULLSCREEN SKIPPED"
                    );
                }

            } catch (error) {

                debug(
                    "FULLSCREEN ERROR: " +
                    error.message
                );
            }


            /*
             * =================================================
             * HIDE ENTRY
             * =================================================
             */

            layer.classList.add(
                "hidden"
            );

            document.body.classList.add(
                "entered"
            );

            debug(
                "ENTRY HIDDEN"
            );


            /*
             * =================================================
             * AUDIO EVENT
             * =================================================
             */

            window.dispatchEvent(
                new CustomEvent(
                    "particle-universe-audio"
                )
            );

            debug(
                "AUDIO EVENT SENT"
            );


            /*
             * =================================================
             * MAIN EVENT
             * =================================================
             */

            window.dispatchEvent(
                new CustomEvent(
                    "particle-universe-enter"
                )
            );

            debug(
                "ENTER EVENT SENT"
            );

            debug(
                "WAITING FOR MAIN..."
            );
        }
    }


    /*
     * =========================================================
     * START
     * =========================================================
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once: true
            }
        );

    } else {

        boot();
    }

})();