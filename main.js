const os = require('os')
const electron = require('electron')
const {app, BrowserWindow, remote} = electron;
let phpServer = null;
let mainWindow = null;
let splashScreen = null;
const isDev = process.env.NODE_ENV !== 'production'

// Computer application URL
let port = 8080, host = 'localhost';
const serverUrl = `http://${host}:${port}`;

// Create Server using node-php-server when on a windows machine
const isWindows = os.platform() === "win32";
if (isWindows) {
    phpServer = require('./resources/js/electron/node-php-server');
}

if (app !== undefined) {
    app.on('ready', () => {
        createWindow()
        splashScreenWindow()

        mainWindow.webContents.once('did-frame-finish-load', function () {
            mainWindow.show();
            splashScreen.close();
        });
    })

    // Quit when all windows are closed.
    app.on('window-all-closed', function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            // PHP SERVER QUIT
            if (isWindows && phpServer) {
                phpServer.close();
            }

            app.quit();
        }
    })

    app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) {
            createWindow()
        }
    })
}


function createServer() {
    phpServer.createServer({
        port: port,
        hostname: host,
        base: `${__dirname}/public`,
        keepalive: false,
        open: false,
        bin: `${__dirname}/extra/php/php.exe`, // Location of php executable
        router: __dirname + '/server.php',
    });
}

function createWindow() {
    if (isWindows) {
        // Create a PHP Server
        createServer()
    }

    // Create the browser window.
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize

    // Initialize main window
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        autoHideMenuBar: false,
        frame: true,
        show: false,
        title: "YOUR_APP",
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    })

    mainWindow.loadURL(serverUrl).then(() => {
    })

    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.show()
        mainWindow.maximize();
        if (isDev) {
            mainWindow.webContents.openDevTools()
        }
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        if (isWindows && phpServer) {
            phpServer.close();
        }
        mainWindow = null;
    })
}

function splashScreenWindow() {
    splashScreen = new BrowserWindow({
        width: 500,
        height: 300,
        transparent: (process.platform !== 'linux'), // Transparency doesn't work on Linux.
        resizable: false,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        title: "Loading YOUR_APP...",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    });

    // Load splash screen html file
    splashScreen.loadFile('./resources/views/Splash.html').then(r => {
    });
}

function closeWindow() {
    // Close current window
    remote.getCurrentWindow().close();

    if (process.platform !== 'darwin') {
        if (isWindows && phpServer) {
            phpServer.close(); // PHP SERVER QUIT
        }

        remote.app.quit(); // Quit application
    }
}

function minimizeWindow() {
    remote.getCurrentWindow().minimize()
}

