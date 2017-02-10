module.exports = {

    entry: "./src/js/index.tsx",

    output: {
        filename: "bundle.js",
        path: __dirname + "/dist",

        // Adding publicPath fixes font loading problem
        // http://stackoverflow.com/questions/34133808/webpack-ots-parsing-error-loading-fonts
        publicPath: "http://localhost:8082"
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },

    module: {

        // About Webpack loaders:
        // https://webpack.github.io/docs/loaders.html
        // In short, Webpack is going to transpile our modules and bundle 
        // them into plain JS, CSS, and HTML. This tells Webpack how to 
        // load different file types (e.g. TypeScript, SVG, SCSS, etc.).
        loaders: [

            // For loading TypeScript files.
            { test: /\.tsx?$/, loader: "ts-loader" },

            // Use the Babel loader for plain JSX (vs. TSX) files
            {
                test: /\.jsx?$/, 
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react']
                }
            },

            // SASS CSS: http://sass-lang.com/
            { test: /\.scss$/, loaders: ["style-loader", "css-loader", "sass-loader"]},

            // Plain CSS            
            { test: /\.css$/, loader: "style-loader!css-loader" },

            // Images
            { test: /\.(svg|png)$/, loader: "file-loader"},

            // Fonts 
            { test: /\.(woff|woff2|ttf|eot)$/, loader: "file-loader"} 
        ],

        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "backbone" : "Backbone",
        "underscore" : "_"
    }  
};