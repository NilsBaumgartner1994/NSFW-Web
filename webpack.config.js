const nodeExternals = require('webpack-node-externals');

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
        path: __dirname + "/dist",
        publicPath: '/assets/',
        filename: 'index.js',
        libraryTarget: 'commonjs2',
    },
    module: {
        rules: [
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader',
                options: {
                    name: '/public/fonts/[name].[ext]'
                }
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
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
