import { registerInteraction } from "../core/state.js";

export function initDesktopControls(
    canvas,
    camera,
    isLocked
) {

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    window.addEventListener(
        "keydown",
        event => {

            registerInteraction();

            camera.keys.add(
                event.key.toLowerCase()
            );
        }
    );

    window.addEventListener(
        "keyup",
        event => {

            camera.keys.delete(
                event.key.toLowerCase()
            );
        }
    );

    canvas.addEventListener(
        "pointerdown",
        event => {

            if (isLocked()) {
                return;
            }

            dragging = true;

            lastX = event.clientX;
            lastY = event.clientY;

            canvas.setPointerCapture?.(
                event.pointerId
            );

            registerInteraction();
        }
    );

    canvas.addEventListener(
        "pointermove",
        event => {

            if (!dragging || isLocked()) {
                return;
            }

            const dx =
                event.clientX - lastX;

            const dy =
                event.clientY - lastY;

            lastX = event.clientX;
            lastY = event.clientY;

            camera.rotate(dx, dy);

            registerInteraction();
        }
    );

    canvas.addEventListener(
        "pointerup",
        () => {
            dragging = false;
        }
    );

    canvas.addEventListener(
        "wheel",
        event => {

            if (isLocked()) {
                return;
            }

            camera.zoom(
                event.deltaY * 0.025
            );

            registerInteraction();
        },
        {
            passive: true
        }
    );
}