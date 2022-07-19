import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import copy from "rollup-plugin-copy";

export default defineConfig([
    {
        input: 'src/setup.ts',
        output: {
            file: 'dist/setup.js',
            format: 'iife'
        },
        plugins: [
            typescript(),
            copy({
                targets: [
                    { src: 'styles/*', dest: 'dist/css' }
                ]
            })
        ]
    },
    {
        input: 'src/loader.ts',
        output: {
            file: 'dist/loader.js',
            format: 'iife',
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            replace({
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify('production'),
            }),
            typescript()
        ]
    }
])