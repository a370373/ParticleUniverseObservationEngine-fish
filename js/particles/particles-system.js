export class ParticleSystem {

    constructor(THREE, nebula) {

        this.THREE = THREE;
        this.data = nebula;

        this.geometry =
            new THREE.BufferGeometry();

        this.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                nebula.positions,
                3
            )
        );

        this.geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(
                nebula.colors,
                3
            )
        );

        this.geometry.setAttribute(
            "aSize",
            new THREE.BufferAttribute(
                nebula.sizes,
                1
            )
        );

        this.material =
            new THREE.ShaderMaterial({

                transparent: true,

                depthWrite: false,

                vertexColors: true,

                blending:
                    THREE.AdditiveBlending,

                uniforms: {
                    uTime: {
                        value: 0
                    },

                    uPixelRatio: {
                        value:
                            Math.min(
                                window.devicePixelRatio || 1,
                                2
                            )
                    }
                },

                vertexShader: `

                    attribute float aSize;

                    varying vec3 vColor;

                    uniform float uTime;
                    uniform float uPixelRatio;

                    void main() {

                        vColor = color;

                        vec3 p = position;

                        float wave =
                            sin(
                                uTime * 0.0005 +
                                p.x * 0.03 +
                                p.y * 0.02
                            );

                        p +=
                            normalize(
                                p + vec3(0.001)
                            )
                            *
                            wave
                            *
                            0.015;

                        vec4 mv =
                            modelViewMatrix *
                            vec4(p, 1.0);

                        float distanceScale =
                            70.0 /
                            max(
                                0.5,
                                -mv.z
                            );

                        gl_PointSize =
                            aSize *
                            uPixelRatio *
                            distanceScale;

                        gl_Position =
                            projectionMatrix *
                            mv;
                    }
                `,

                fragmentShader: `

                    varying vec3 vColor;

                    void main() {

                        vec2 uv =
                            gl_PointCoord -
                            vec2(0.5);

                        float d =
                            length(uv);

                        if (d > 0.5) {
                            discard;
                        }

                        float glow =
                            1.0 -
                            smoothstep(
                                0.05,
                                0.5,
                                d
                            );

                        gl_FragColor =
                            vec4(
                                vColor *
                                (0.65 + glow),
                                glow
                            );
                    }
                `
            });

        this.points =
            new THREE.Points(
                this.geometry,
                this.material
            );
    }

    update(time, dt) {

        this.material.uniforms.uTime.value =
            time;

        const pos =
            this.geometry.attributes.position;

        const base =
            this.data.positions;

        const drift =
            this.data.drift;

        const phase =
            this.data.phase;

        const state =
            this.data.state;

        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n = i * 3;

            let x =
                pos.array[n];

            let y =
                pos.array[n + 1];

            let z =
                pos.array[n + 2];

            /*
             * BEFORE OBSERVATION:
             *
             * slow organic movement.
             */
            if (
                state === "STABLE" ||
                state === "SUMMONING"
            ) {

                x +=
                    drift[n] *
                    Math.sin(
                        time * 0.0004 +
                        phase[i]
                    );

                y +=
                    drift[n + 1] *
                    Math.cos(
                        time * 0.00035 +
                        phase[i]
                    );

                z +=
                    drift[n + 2] *
                    Math.sin(
                        time * 0.0003 +
                        phase[i]
                    );
            }

            pos.array[n] =
                x;

            pos.array[n + 1] =
                y;

            pos.array[n + 2] =
                z;
        }

        pos.needsUpdate = true;
    }

    applyCollapse(progress) {

        const pos =
            this.geometry.attributes.position;

        const base =
            this.data.positions;

        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n = i * 3;

            const x =
                base[n];

            const y =
                base[n + 1];

            const z =
                base[n + 2];

            const power =
                1 - progress;

            pos.array[n] =
                x * power;

            pos.array[n + 1] =
                y * power;

            pos.array[n + 2] =
                z * power;
        }

        pos.needsUpdate = true;
    }

    explode(progress) {

        const pos =
            this.geometry.attributes.position;

        for (
            let i = 0;
            i < this.data.count;
            i++
        ) {

            const n = i * 3;

            const x =
                pos.array[n];

            const y =
                pos.array[n + 1];

            const z =
                pos.array[n + 2];

            const length =
                Math.sqrt(
                    x*x +
                    y*y +
                    z*z
                ) || 1;

            const speed =
                (1 - progress) *
                0.4;

            pos.array[n] +=
                (x / length) *
                speed;

            pos.array[n + 1] +=
                (y / length) *
                speed;

            pos.array[n + 2] +=
                (z / length) *
                speed;
        }

        pos.needsUpdate = true;
    }
}