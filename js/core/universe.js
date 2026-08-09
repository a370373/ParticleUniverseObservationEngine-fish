console.log("[UNIVERSE] universe.js LOADED");

export class Universe {

    constructor(
        THREE,
        scene,
        cameraController
    ) {

        console.log(
            "[UNIVERSE] constructor reached"
        );

        this.THREE = THREE;
        this.scene = scene;
        this.camera = cameraController;

        this.particleSystem = null;
        this.nebula = null;

        console.log(
            "[UNIVERSE] constructor OK"
        );
    }

    update(time, dt) {
    }

    async startNewCycle() {
        console.log(
            "[UNIVERSE] startNewCycle reached"
        );
    }

    async shuffle() {
    }

    async completeObservation() {
    }

    disposeParticleSystem() {
    }
}