import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { Configuration, WebpackOptionsNormalized } from 'webpack';
import merge from 'webpack-merge';
import CopyPlugin from 'copy-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import WebExtensionArchivePlugin from './build/archive';
import patch from './build/patch';

const browserTargets = [
    'firefox',
    'chrome'
]

const baseConfig: Configuration = {
    devtool: 'source-map',

    entry: {
        entry: './src/entry.ts',
        background: './src/background.ts'
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },

    output: {
        filename: '[name].js'
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },

    plugins: [
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                diagnosticOptions: {
                    semantic: true,
                    syntactic: true
                },
                mode: 'write-references'
            }
        }),
    ]
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
                            indent_level: 2 // eslint-disable-line camelcase
                        }
                    }
                })
            ]
        }
    }),
    production: (browser) => ({
        plugins: [
            new WebExtensionArchivePlugin({
                filename: browser
            })
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
                            indent_level: 2 // eslint-disable-line camelcase
                        }
                    }
                })
            ]
        }
    })
}

export default (_: unknown, { mode }: WebpackOptionsNormalized): Configuration[] => {
    return browserTargets.map(browser => {
        const buildPath = path.join(__dirname, 'dist', browser);

        const modeSpecificAdjuster =
            typeof mode !== "undefined" ? modeConfigs[mode] : undefined;
        const modeSpecificAdjustment =
            typeof modeSpecificAdjuster !== "undefined" ? modeSpecificAdjuster(browser) : {};
    
        return merge(baseConfig, modeSpecificAdjustment, {
            name: browser,

            output: {
                path: buildPath
            },

            plugins: [
                new CopyPlugin({
                    patterns: [
                        { from: 'LICENSE' },
                        {
                            from: 'src/manifest.json',
                            transform: (buffer: Buffer, p: string) => {
                                const manifest = JSON.parse(buffer.toString());
                                const patched = patch(manifest, browser);
                                return JSON.stringify(patched);    
                            }
                        }
                    ]
                })
            ]
        })
    })
}