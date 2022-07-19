let app: HTMLElement;

document.addEventListener('readystatechange', () => {
    switch (document.readyState) {
        case 'interactive':
            app = document.getElementById('app');
            app.id = 'mhr-app';
            break;
        case 'complete':
            // Disable existing stylesheets.
            for (let i = 0; i < document.styleSheets.length; i++) {
                const s = document.styleSheets.item(i);
                if (!s.ownerNode.textContent.startsWith('/* Absolute')) {
                    s.disabled = true;
                }
            }

            setTimeout(() => {
                // If the children of app are not overriden after 10 seconds, the loader may have failed.
                if (document.querySelector('div.full-loader')) {
                    const errorMessage = document.createElement('p');
                    errorMessage.className = 'mhr-error';
                    errorMessage.innerHTML = 'Minehut Reborn took too long to load! <a href="https://github.com/AppleFlavored/mh-reborn/issues">Create a bug report here.</a>';
                    app.appendChild(errorMessage);
                }
            }, 10000);
            break;
    }
});