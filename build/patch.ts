import patch from 'jsonpatch';

const patches = {
    chrome: [
        {
            op: 'replace',
            path: '/manifest_version',
            value: 3
        },
        {
            op: 'add',
            path: '/background',
            value: {
                'service_worker': 'background.js'
            }
        },
    ],
    firefox: [
        {
            op: 'add',
            path: '/background',
            value: {
                'scripts': ['background.js']
            }
        }
    ]
}

export default (base: any, browser: string) => {
    const browserSpecificPatch = patches[browser] || [];
    return patch.apply_patch(base, browserSpecificPatch);
}