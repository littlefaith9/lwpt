import { shell, app, BrowserWindow } from 'electron';
import * as prompt from 'electron-prompt';

const startupJS = `
document.body.classList.add('scroll');
const titleBar = document.createElement('header');
const title = document.createElement('span');
title.id = 'dragZone';
title.innerText = document.body.dataset.gameTitle ?? document.body.dataset.copyright;
titleBar.append(title);
const btn = document.createElement('button');
btn.classList.add('btn-close');
btn.style.marginRight = '2px';
btn.onclick = () => window.close();
titleBar.append(btn);
document.body.prepend(titleBar);
document.body.style.setProperty('--inset-top', \`\${titleBar.offsetHeight}px\`, 'important');
`;

const startupCSS = `
body {
	--inset-top: 25px !important;
	overflow-y: auto !important;
}
header {
	position: fixed;
	display: flex !important;
	width: 100%;
	height: auto;
	background: #0003;
	z-index: 1;
	user-select: none;
	padding: 2px;
	top: 0
}
#dragZone {
	flex-grow: 1;
	text-align: center;
	-webkit-app-region: drag;
}
`;

const allowedUrls = [
	`pony.town`,
	`***REMOVED***`,
	`***REMOVED***`,
];

const addr_pt = 'https://pony.town/';

async function createWindow(defaultUrl: string) {
	const url = await prompt({
		title: 'Lightweight PT',
		label: 'Enter address',
		value: defaultUrl,
		inputAttrs: { type: 'url', required: 'true' },
		type: 'input',
		alwaysOnTop: true,
	});

	if (!url) {
		return;
	}

	const win = new BrowserWindow({
		minWidth: 150,
		minHeight: 150,
		width: 800,
		height: 600,
		titleBarStyle: 'hidden',
		// frame: false,
		alwaysOnTop: true,
	});

	win.loadURL(url);

	win.webContents.on('dom-ready', () => {
		win.webContents.executeJavaScript(startupJS);
		win.webContents.insertCSS(startupCSS);
		win.webContents.setZoomFactor(0.8);
	});

	win.webContents.on('before-input-event', (_, input) => {
		if (input.type === 'keyDown' && input.key === 'F12') {
			win.webContents.toggleDevTools();
		}
	});

	win.webContents.setWindowOpenHandler(({ url }) => {
		if (allowedUrls.some(u => url.includes(u))) {
			createWindow(url);
			return { action: 'deny' };
		}
		return { action: 'allow' };
	});
}

const isFirstProc = app.requestSingleInstanceLock();

if (!isFirstProc) {
	app.quit();
}
else {
	app.on('second-instance', () => {
		createWindow('https://');
	});

	app.whenReady().then(() => createWindow(addr_pt));

	app.on('window-all-closed', () => app.quit());

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows.length === 0) {
			createWindow(addr_pt);
		}
	});
}
