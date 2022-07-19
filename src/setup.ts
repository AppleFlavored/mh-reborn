let app: HTMLElement;

document.addEventListener('readystatechange', () => {
    switch (document.readyState) {
        case 'interactive':
            app = document.getElementById('app');
            app.id = 'mhr-app';
            break;
        case 'complete':
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