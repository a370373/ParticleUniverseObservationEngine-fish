(function () {

    "use strict";

    let entered = false;

    function boot() {

        const layer =
            document.getElementById(
                "entryLayer"
            );

        const button =
            document.getElementById(
                "enterButton"
            );

        if (!layer || !button) {

            console.error(
                "[ENTRY] Missing #entryLayer or #enterButton"
            );

            return;
        }

        console.log(
            "[ENTRY] Ready."
        );

        /*
         * =====================================================
         * INPUT
         * =====================================================
         */

        layer.style.pointerEvents = "auto";
        button.style.pointerEvents = "auto";

        button.addEventListener(
            "click",
            enter,
            false
        );

        /*
         * Mobile backup.
         */

        button.addEventListener(
            "pointerup",
            function (event) {

                if (
                    event.pointerType === "touch"
                ) {

                    enter(event);
                }

            },
            false
        );


        /*
         * =====================================================
         * ENTER
         * =====================================================
         */

        function enter(event) {

            if (entered) {
                return;
            }

            entered = true;

            if (event) {

                event.preventDefault?.();
                event.stopPropagation?.();
            }

            console.log(
                "[ENTRY] Enter activated."
            );


            /*
             * =================================================
             * FULLSCREEN
             * =================================================
             */

            try {

                if (
                    !document.fullscreenElement &&
                    document.documentElement.requestFullscreen
                ) {

                    document.documentElement
                        .requestFullscreen()
                        .catch(
                            function (error) {

                                console.warn(
                                    "[ENTRY] Fullscreen failed:",
                                    error
                                );

                            }
                        );
                }

            } catch (error) {

                console.warn(
                    "[ENTRY] Fullscreen unavailable:",
                    error
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


            /*
             * =================================================
             * USER-GESTURE AUDIO BRIDGE
             *
             * main.js will also attempt playback,
             * but this gives audio the strongest possible
             * chance because this function is directly
             * triggered by the user's click.
             * =================================================
             */

            window.dispatchEvent(
                new CustomEvent(
                    "particle-universe-audio"
                )
            );


            /*
             * =================================================
             * START UNIVERSE
             * =================================================
             */

            window.dispatchEvent(
                new CustomEvent(
                    "particle-universe-enter"
                )
            );

            console.log(
                "[ENTRY] Universe event dispatched."
            );
        }
    }


    /*
     * =========================================================
     * BOOT
     * =========================================================
     */

    if (
        document.readyState === "loading"
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