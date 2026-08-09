export const CONFIG = {

    PARTICLES: {
        MAIN: 24000,
        DUST: 2500,
        STARS: 4500,

        MIN_SIZE: 0.7,
        MAX_SIZE: 3.8,

        FIELD_RADIUS: 120,

        DRIFT: 0.0015,
        TWINKLE: 0.8
    },

    OBSERVATION: {

        HOLD_TIME: 2000,

        ROTATION_TOLERANCE: 0.045,

        DISTANCE_TOLERANCE: 0.08,

        POSITION_TOLERANCE: 0.05,

        SCALE_TOLERANCE: 0.07,

        SIMILARITY_THRESHOLD: 0.72,

        MIN_FAILURE_TIME: 180000,

        MAX_FAILURE_TIME: 420000,

        SHUFFLE_TIME: 6000
    },

    AMBIENT: {
        IDLE_TIME: 30000
    },

    CAMERA: {
        FOV: 65,

        MOVE_SPEED: 0.12,
        FAST_SPEED: 0.35,

        ROTATION_SPEED: 0.0025,

        FRICTION: 0.88
    },

    AUDIO: {
        FADE_IN: 5000,
        FADE_OUT: 3000
    }
};