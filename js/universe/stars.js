export function createStars(
    THREE,
    count = 4500
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

        const radius =
            500 +
            Math.random() * 3000;

        const theta =
            Math.random() *
            Math.PI *
            2;

        const phi =
            Math.acos(
                Math.random() * 2 - 1
            );

        positions[n] =
            radius *
            Math.sin(phi) *
            Math.cos(theta);

        positions[n + 1] =
            radius *
            Math.sin(phi) *
            Math.sin(theta);

        positions[n + 2] =
            radius *
            Math.cos(phi);

        const c =
            0.25 +
            Math.random() * 0.75;

        colors[n] =
            c;

        colors[n + 1] =
            c;

        colors[n + 2] =
            c;
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

            size: 1.2,

            vertexColors: true,

            transparent: true,

            opacity: 0.65,

            depthWrite: false,

            blending:
                THREE.AdditiveBlending
        });

    return new THREE.Points(
        geometry,
        material
    );
}


export function createDust(
    THREE,
    count = 1800
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

        const radius =
            300 +
            Math.random() * 1800;

        const theta =
            Math.random() *
            Math.PI *
            2;

        const phi =
            Math.acos(
                Math.random() * 2 - 1
            );

        positions[n] =
            radius *
            Math.sin(phi) *
            Math.cos(theta);

        positions[n + 1] =
            radius *
            Math.sin(phi) *
            Math.sin(theta);

        positions[n + 2] =
            radius *
            Math.cos(phi);

        const c =
            0.08 +
            Math.random() * 0.25;

        colors[n] =
            c;

        colors[n + 1] =
            c;

        colors[n + 2] =
            c;
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

            size: 2.0,

            vertexColors: true,

            transparent: true,

            opacity: 0.22,

            depthWrite: false,

            blending:
                THREE.AdditiveBlending
        });

    return new THREE.Points(
        geometry,
        material
    );
}