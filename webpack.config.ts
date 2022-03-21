import path from 'path';
import webpack, { Configuration, WebpackOptionsNormalized } from 'webpack';
import { merge } from 'webpack-merge';
import CopyPlugin from 'copy-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import WebExtensionArchivePlugin from './utils/web-extension-archive-webpack-plugin';
import ManifestWebpackPlugin from './utils/manifest-webpack-plugin';

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
                new ManifestWebpackPlugin({
                    targetBrowser: browser,

                    manifest: {
                        name: 'Minehut Reborn',
                        version: '0.1.0',
                        author: 'AppleFlavored',
                        description: 'A modern dashboard for Minehut.',

                        background: {},

                        content_scripts: [
                            {
                                js: [
                                    'inject.js'
                                ],
                                matches: ['*://*.minehut.com/*'],
                                run_at: 'document_start',
                            },
                        ],

                        permissions: [
                            '*://*.minehut.com/*',
                        ],
                    },

                    browser_specific: {
                        background: {
                            scripts: ['background.js'],
                            service_worker: 'background.js',
                        },
                    },
                }),
            ],
        });
    });
}