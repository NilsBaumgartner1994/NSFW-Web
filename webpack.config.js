const nodeExternals = require('webpack-node-externals');
const path = require('path');
const outputDir = path.join(__dirname, 'dist/');

module.exports = {
    target: 'web',
    //externals: [
    //    nodeExternals({modulesFromFile: true,})
    //],
    entry: ['./src/index.js'],
    node: {
        fs: 'empty',
        child_process: 'empty',
    },
    output: {
        path: outputDir,
        publicPath: outputDir,
        filename: 'index.js',
        libraryTarget: 'commonjs2',
    },
    module: {
        rules: [
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url-loader",
                options: {
                    limit: Infinity // everything
                }
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                loader: "url-loader",
                options: {
                    limit: Infinity // everything
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    }
};
