module.exports = {
    source: {
        include: [
            'lib'
        ]
    },
    opts: {
        recurse: true,
        destination: './API'
    },
    templates: {
        default: {
            layoutFile: './jsdoc/layout.html',
            staticFiles: {
                include: [
                    './jsdoc/style.css'
                ]
            }
        }
    },
    plugins: [
        'plugins/markdown',
        './jsdoc/shortLinks'
    ]
};
