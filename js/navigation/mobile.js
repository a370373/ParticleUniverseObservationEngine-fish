import { registerInteraction } from "../core/state.js";

export function initMobileControls(
    canvas,
    camera,
    isLocked
) {

    const fingers = new Map();

    let previousDistance = null;
    let previousCenter = null;

    canvas.addEventListener(
        "pointerdown",
        event => {

            if (isLocked()) {
                return;
            }

            fingers.set(
                event.pointerId,
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );

            registerInteraction();
        }
    );

    canvas.addEventListener(
        "pointermove",
        event => {

            if (isLocked()) {
                return;
            }

            const old =
                fingers.get(
                    event.pointerId
                );

            if (!old) {
                return;
            }

            fingers.set(
                event.pointerId,
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );

            const list =
                [...fingers.values()];

            if (list.length === 1) {

                const dx =
                    event.clientX - old.x;

                const dy =
                    event.clientY - old.y;

                camera.rotate(dx, dy);

                registerInteraction();

                return;
            }

            if (list.length >= 2) {

                const a = list[0];
                const b = list[1];

                const distance =
                    Math.hypot(
                        a.x - b.x,
                        a.y - b.y
                    );

                const center = {
                    x: (a.x + b.x) / 2,
                    y: (a.y + b.y) / 2
                };

                if (
                    previousDistance !== null
                ) {

                    const zoomDelta =
                        previousDistance -
                        distance;

                    camera.zoom(
                        zoomDelta * 0.04
                    );
                }

                if (previousCenter) {

                    camera.rotate(
                        center.x -
                        previousCenter.x,
                        center.y -
                        previousCenter.y
                    );
                }

                previousDistance =
                    distance;

                previousCenter =
                    center;

                registerInteraction();
            }
        }
    );

    function release(event) {

        fingers.delete(
            event.pointerId
        );

        if (fingers.size < 2) {

            previousDistance =
                null;

            previousCenter =
                null;
        }
    }

    canvas.addEventListener(
        "pointerup",
        release
    );

    canvas.addEventListener(
        "pointercancel",
        release
    );
}