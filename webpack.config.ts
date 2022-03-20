import path from 'path';
import webpack, { Configuration, WebpackOptionsNormalized } from 'webpack';
import { merge } from 'webpack-merge';
import CopyPlugin from 'copy-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import WebExtensionArchivePlugin from './utils/web-extension-archive-webpack-plugin';

const browserTargets = ["firefox", "chrome"];

const baseConfig: Configuration = {
    devtool: 'source-map',
    
    entry: {
        background: './src/background/background.ts',
        inject: './src/inject/index.ts',
    },
    
    module: {
        rules: [
            {
                test: /\.(ts|tsx|jsx)?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: { cacheDirectory: true }
                    },
                ],
            },
        ],
    },
    
    output: {
        filename: '[name].js',
    },
    
    resolve: {
        extensions: ['.ts', '.tsx', '.js', 'jsx'],
    },
    
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                diagnosticOptions: {
                    semantic: true,
                    syntactic: true,
                },
                mode: 'write-references',
            },
        }),
    ],
}

const modeConfigs: {
    [mode: string]: (browser: string) => Partial<Configuration>
} = {
    development: () => ({
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        mangle: false,
                        compress: false,
                        output: {
                            beautify: true,
                            indent_level: 2, // eslint-disable-line camelcase
                        },
                    },
                }),
            ],
        },
    }),
    production: (browser) => ({
        plugins: [
            new WebExtensionArchivePlugin({
                filename: browser,
            }),
        ],
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        mangle: browser === "firefox",
                        compress: browser === "firefox",
                        output:
                        browser === "firefox"
                        ? undefined
                        : {
                            beautify: true,
                            indent_level: 2, // eslint-disable-line camelcase
                        },
                    },
                }),
            ],
        },
    }),
}

export default (_: unknown, { mode }: WebpackOptionsNormalized): Configuration[] => {
    return browserTargets.map(browser => {
        const buildPath = path.join(__dirname, "build", browser);
        
        const modeSpecificAdjuster =
            typeof mode !== "undefined" ? modeConfigs[mode] : undefined;
        const modeSpecificAdjustment =
            typeof modeSpecificAdjuster !== "undefined" ? modeSpecificAdjuster(browser) : {};
        
        return merge(baseConfig, modeSpecificAdjustment, {
            name: browser,
            output: {
                path: buildPath,
            },
            plugins: [
                new CopyPlugin({
                    patterns: [
                        {
                            from: `src/manifest(|.${mode}|.${browser}).json`,
                            to: 'manifest.json',
                            transformAll: (assets: { data: Buffer }[]) => {
                                const combined = merge(
                                    {},
                                    ...assets
                                        .map(asset => asset.data.toString('utf-8'))
                                        .filter(data => data.trim().length > 0)
                                        .map(data => JSON.parse(data))
                                );
                                return JSON.stringify(combined, null, 2);
                            },
                        },
                    ],
                }),
            ],
        });
    });
}