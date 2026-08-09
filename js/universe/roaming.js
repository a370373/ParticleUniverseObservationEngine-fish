export class UniverseRoaming {

    constructor(THREE, scene) {

        this.THREE = THREE;

        this.scene = scene;

        this.nebulae = [];

        this.timer = 0;
    }

    update(dt) {

        this.timer += dt;

        /*
         * Generate sparse distant nebula
         * structures.
         */
        if (
            this.nebulae.length < 8 &&
            this.timer > 2
        ) {

            this.timer = 0;

            this.spawnGhostNebula();
        }

        for (
            const n of this.nebulae
        ) {

            n.rotation.y +=
                n.speed * dt;

            n.rotation.x +=
                n.speed * 0.2 * dt;
        }
    }

    spawnGhostNebula() {

        const geometry =
            new this.THREE.BufferGeometry();

        const count = 700;

        const positions =
            new Float32Array(
                count * 3
            );

        const colors =
            new Float32Array(
                count * 3
            );

        const radius =
            30 +
            Math.random() * 100;

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const n = i * 3;

            const r =
                Math.random() *
                radius;

            positions[n] =
                (
                    Math.random() - 0.5
                ) * r;

            positions[n + 1] =
                (
                    Math.random() - 0.5
                ) * r;

            positions[n + 2] =
                (
                    Math.random() - 0.5
                ) * r;

            colors[n] =
                Math.random();

            colors[n + 1] =
                Math.random();

            colors[n + 2] =
                Math.random();
        }

        geometry.setAttribute(
            "position",
            new this.THREE.BufferAttribute(
                positions,
                3
            )
        );

        geometry.setAttribute(
            "color",
            new this.THREE.BufferAttribute(
                colors,
                3
            )
        );

        const material =
            new this.THREE.PointsMaterial({

                size: 1.5,

                vertexColors: true,

                transparent: true,

                opacity: 0.25,

                depthWrite: false
            });

        const points =
            new this.THREE.Points(
                geometry,
                material
            );

        points.position.set(
            (
                Math.random() - 0.5
            ) * 1000,

            (
                Math.random() - 0.5
            ) * 1000,

            (
                Math.random() - 0.5
            ) * 1000
        );

        points.speed =
            0.002 +
            Math.random() * 0.008;

        this.scene.add(points);

        this.nebulae.push(points);
    }
}