import webpack from 'webpack'
import path from 'path'

const debug = process.env.NODE_ENV !== "production"

export default [
    {
        target: 'node',
        context: __dirname,
        devtool: debug ? "inline-sourcemap" : false,
        entry: "./src/main.js",
        output: {
            path: path.join(__dirname, "build"),
            filename: "app.js",
        },
        resolve: {
            alias: {
                app: path.resolve(__dirname, 'src/'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: [/node_modules/],
                    loader: 'babel-loader',
                },
                {
                    test: /\.js$/,
                    exclude: [/node_modules/],
                    loader: 'eslint-loader',
                    enforce: 'pre',
                },
            ],
        },
        plugins: debug ? [] : [
            new webpack.optimize.OccurrenceOrderPlugin(),
            new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
        ]
    }
]
