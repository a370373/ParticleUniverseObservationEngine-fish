export function createDust(
    THREE,
    count = 2500
) {

    const geometry =
        new THREE.BufferGeometry();

    const positions =
        new Float32Array(
            count * 3
        );

    const colors =
        new Float32Array(
            count * 3
        );

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const n = i * 3;

        positions[n] =
            (Math.random() - 0.5) *
            700;

        positions[n + 1] =
            (Math.random() - 0.5) *
            700;

        positions[n + 2] =
            (Math.random() - 0.5) *
            700;

        colors[n] =
            Math.random();

        colors[n + 1] =
            Math.random();

        colors[n + 2] =
            Math.random();
    }

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3
        )
    );

    geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(
            colors,
            3
        )
    );

    const material =
        new THREE.PointsMaterial({

            size: 1.8,

            vertexColors: true,

            transparent: true,

            opacity: 0.15,

            depthWrite: false,

            blending:
                THREE.AdditiveBlending
        });

    return new THREE.Points(
        geometry,
        material
    );
}