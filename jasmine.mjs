export default {
    spec_dir: "test",
    spec_files: [
        "**/*spec.mjs"
    ],
    helpers: [
        "helpers/**/*.mjs"
    ],
    captureExceptions: true,
    env: {
        stopSpecOnExpectationFailure: false,
        random: true,
        forbidDuplicateNames: true
    }
}
