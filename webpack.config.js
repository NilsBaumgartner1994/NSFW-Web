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
        filename: 'index.js',
        libraryTarget: 'commonjs2',
    },
    module: {
        rules: [
            {
                test: /\.(ttf|eot|svg|png|woff(2)?)(\?[a-z0-9]+)?$/,
                use: [{
                    loader: 'file-loader', options: {esModule: false}
                }]
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
