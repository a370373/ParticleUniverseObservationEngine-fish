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
                "[ENTRY] Entry elements not found."
            );

            return;
        }


        console.log(
            "[ENTRY] Standalone entry ready."
        );


        /*
         * =================================================
         * INPUT
         * =================================================
         */

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

                /*
                 * Touch devices sometimes behave
                 * differently from desktop click.
                 */

                if (
                    event.pointerType ===
                    "touch"
                ) {

                    enter(event);
                }

            },
            false
        );


        /*
         * =================================================
         * ENTER
         * =================================================
         */

        function enter(event) {

            if (entered) {
                return;
            }

            entered = true;


            event?.preventDefault?.();
            event?.stopPropagation?.();


            console.log(
                "[ENTRY] Click to Enter."
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
                        .catch(
                            function () {}
                        );
                }

            } catch (_) {}


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
             * START UNIVERSE
             *
             * main.js is listening for this event.
             * =================================================
             */

            window.dispatchEvent(
                new CustomEvent(
                    "particle-universe-enter"
                )
            );


            /*
             * Remove entry layer after fade.
             */

            setTimeout(
                function () {

                    if (
                        layer.parentNode
                    ) {

                        layer.remove();
                    }

                },
                1800
            );
        }
    }


    /*
     * =====================================================
     * DOM READY
     * =====================================================
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