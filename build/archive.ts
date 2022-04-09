// This file is initially from:
// https://github.com/tallycash/extension/blob/main/build-utils/web-extension-archive-webpack-plugin.ts

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { Compiler, Stats } from 'webpack';

const PLUGIN_NAME = "WebExtArchive"

type ArchiveOptions = {
    filename: string,
    outputDirectory?: string,
}

class WebExtensionArchivePlugin {
    constructor(private options: ArchiveOptions) {}

    apply(compiler: Compiler): void {
        compiler.hooks.done.tapAsync(
            PLUGIN_NAME,
            this.createArchive(compiler, this.options)
        );
    }

    private createArchive(
        compiler: Compiler,
        { filename, outputDirectory }: ArchiveOptions
    ): (stats: Stats, pluginCompleted: (err: Error | null) => void) => void {
        const logger = compiler.getInfrastructureLogger(PLUGIN_NAME);

        return (_: Stats, pluginCompleted: (err: Error | null) => void) => {
            const sources = compiler.outputPath;
            const outputPath = outputDirectory || path.join(compiler.outputPath, '..');
            
            const outputStream = fs.createWriteStream(path.join(outputPath, `${filename}.zip`));
            outputStream.on('close', () => pluginCompleted(null));
            outputStream.on('error', err => pluginCompleted(err));

            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            archive.pipe(outputStream);
            archive.directory(sources, false);
            archive.finalize();
        }
    }
}

export default WebExtensionArchivePlugin;