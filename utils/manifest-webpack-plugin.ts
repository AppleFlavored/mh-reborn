import path from "path";
import webpack, { Compiler } from "webpack";

const pluginName = "ManifestWebpackPlugin";

interface ContentScript {
    js?: string[];
    css?: string[];
    matches?: string[];
    run_at?:
        | 'document_idle'
        | 'document_start'
        | 'document_end';
}

interface Manifest {
    name?: string;
    version?: string;
    description?: string;
    author?: string;

    background: {
        scripts?: string[];
        service_worker?: string;
    }

    content_scripts?: ContentScript[];
    permissions?: string[];

    [index: string]: any;
}

interface BrowserSpecificFields {
    background?: {
        /** Used for Mozilla Firefox (Manifest v2) */
        scripts?: string[];
        
        /** Used for Google Chrome (Manifest v3) */
        service_worker?: string;
    }
}

interface ManifestOptions {
    targetBrowser?:
        | string
        | 'chrome'
        | 'firefox';
    
    manifest?: Manifest;
    browser_specific?: BrowserSpecificFields;
}

export default class ManifestWebpackPlugin {
    constructor(private options: ManifestOptions) {}

    apply(compiler: Compiler): void {
        compiler.hooks.thisCompilation.tap(pluginName, compilation => {
            const logger = compilation.getLogger(pluginName);

            const replacements = this.options.browser_specific;
            const manifest: Manifest = this.options.manifest!;
            manifest.manifest_version = 2; // Use v2 by default.
    
            switch (this.options.targetBrowser) {
                case 'chrome':
                    manifest.manifest_version = 3;
                    manifest.background.service_worker = replacements?.background?.service_worker;
                    break;
                case 'firefox':
                    manifest.background.scripts = replacements?.background?.scripts;
                    break;
                default:
                    logger.warn("Browser target is not supported.");
            }

            const content = JSON.stringify(manifest, null, 2);
            compilation.emitAsset('manifest.json', new webpack.sources.RawSource(content));
        });
    }
}