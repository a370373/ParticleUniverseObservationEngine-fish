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
         * Make absolutely sure the button
         * can receive input.
         */

        layer.style.pointerEvents =
            "auto";

        button.style.pointerEvents =
            "auto";

        /*
         * Click
         */

        button.addEventListener(
            "click",
            enter,
            false
        );

        /*
         * Touch / Pointer backup
         */

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
             * Fullscreen.
             *
             * Failure is completely ignored.
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
             * Hide entry.
             */

            layer.classList.add(
                "hidden"
            );

            document.body.classList.add(
                "entered"
            );


            /*
             * Tell main.js that entry happened.
             *
             * No direct import.
             * No dependency.
             */

            window.dispatchEvent(
                new CustomEvent(
                    "particle-universe-enter"
                )
            );

        }

    }


    /*
     * DOM may already exist because this
     * script is placed at the bottom of body.
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