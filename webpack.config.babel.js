import webpack from 'webpack'
import path from 'path'

const debug = process.env.NODE_ENV !== "production"

export default [
    {
        target: 'web',
        context: __dirname,
        devtool: debug ? "inline-sourcemap" : false,
        entry: "./src/client/js/main.js",
        output: {
            path: path.join(__dirname, "/client/build/js"),
            filename: "app.js",
        },
        resolve: {
            alias: {
                client: path.resolve(__dirname, 'src/client/js'),
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
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin(),
            new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
        ],
        devServer: {
            contentBase: path.join(__dirname, 'client'),
            port: 9000
        }
    },
    {
        target: 'node',
        context: __dirname,
        devtool: debug ? "inline-sourcemap" : false,
        entry: "./src/server/js/main.js",
        output: {
            path: path.join(__dirname, "/server/build/js"),
            filename: "app.js",
        },
        resolve: {
            alias: {
                server: path.resolve(__dirname, 'src/server/js'),
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
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin(),
            new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
        ]
    }
]
