export function shuffleParticles(
    particleSystem,
    duration
) {

    const data =
        particleSystem.data;

    data.state =
        "SHUFFLE";

    const start =
        performance.now();

    const positions =
        particleSystem
            .geometry
            .attributes
            .position
            .array;

    const velocities =
        new Float32Array(
            data.count * 3
        );

    for (
        let i = 0;
        i < data.count;
        i++
    ) {

        const n = i * 3;

        const x =
            Math.random() * 2 - 1;

        const y =
            Math.random() * 2 - 1;

        const z =
            Math.random() * 2 - 1;

        const length =
            Math.sqrt(
                x*x +
                y*y +
                z*z
            ) || 1;

        velocities[n] =
            x / length *
            (1 + Math.random() * 3);

        velocities[n + 1] =
            y / length *
            (1 + Math.random() * 3);

        velocities[n + 2] =
            z / length *
            (1 + Math.random() * 3);
    }

    return new Promise(resolve => {

        function animate(now) {

            const elapsed =
                now - start;

            const progress =
                Math.min(
                    1,
                    elapsed / duration
                );

            for (
                let i = 0;
                i < data.count;
                i++
            ) {

                const n = i * 3;

                const factor =
                    Math.sin(
                        progress *
                        Math.PI
                    );

                positions[n] +=
                    velocities[n] *
                    factor;

                positions[n + 1] +=
                    velocities[n + 1] *
                    factor;

                positions[n + 2] +=
                    velocities[n + 2] *
                    factor;
            }

            particleSystem
                .geometry
                .attributes
                .position
                .needsUpdate = true;

            if (progress < 1) {

                requestAnimationFrame(
                    animate
                );

            } else {

                data.state =
                    "STABLE";

                resolve();
            }
        }

        requestAnimationFrame(
            animate
        );
    });
}