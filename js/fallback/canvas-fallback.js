export function startCanvasFallback(
    canvas
) {

    const ctx =
        canvas.getContext("2d");

    if (!ctx) {
        return;
    }

    const particles =
        [];

    const count = 900;

    for (
        let i = 0;
        i < count;
        i++
    ) {

        particles.push({

            x:
                Math.random() *
                canvas.width,

            y:
                Math.random() *
                canvas.height,

            z:
                Math.random(),

            vx:
                (
                    Math.random() -
                    0.5
                ) * 0.15,

            vy:
                (
                    Math.random() -
                    0.5
                ) * 0.15,

            size:
                0.5 +
                Math.random() * 2
        });
    }

    function resize() {

        canvas.width =
            window.innerWidth *
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        canvas.height =
            window.innerHeight *
            Math.min(
                window.devicePixelRatio || 1,
                2
            );
    }

    resize();

    window.addEventListener(
        "resize",
        resize
    );

    function frame() {

        ctx.fillStyle =
            "rgba(0,0,0,0.15)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        for (
            const p of particles
        ) {

            p.x += p.vx;
            p.y += p.vy;

            if (
                p.x < 0
            ) p.x = canvas.width;

            if (
                p.x > canvas.width
            ) p.x = 0;

            if (
                p.y < 0
            ) p.y = canvas.height;

            if (
                p.y > canvas.height
            ) p.y = 0;

            const alpha =
                0.2 +
                p.z * 0.8;

            ctx.fillStyle =
                `rgba(
                    255,
                    255,
                    255,
                    ${alpha}
                )`;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        requestAnimationFrame(
            frame
        );
    }

    frame();
}