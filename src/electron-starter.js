const { app, BrowserWindow, webContents, ipcMain } = require("electron");
const path = require("path");
const url = require("url");


function sleep(ms) {
  return new Promise(ok => setTimeout(ok, ms));
}

function createWindow() {
  // Main UI window
  const mainWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // UI window accesses `fs` directly.
      nodeIntegration: true,
    },
  });

  // mainWin.loadFile(`index.html`);
  // and load the index.html of the app.
  const startUrl =
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, "/../dist/index.html"),
      protocol: "file:",
      slashes: true,
    });
  mainWin.loadURL(startUrl);
  mainWin.webContents.openDevTools();

  // When main UI window sends a message to initiate a scrape
  ipcMain.on("scrape", scrape);

  async function loop() {
    await scrape()
    await sleep(10000);
    loop();
  }

  loop();

  async function scrape() {

    console.log('Scraping,.......');

    const win = new BrowserWindow({
      width: 800,
      height: 600,
      show: false, // Don't show to the user
      webPreferences: {
        preload: `${__dirname}/preload.js`, // Load the preload script, which intercepts all AJAX requests
      },
    });

    // Scrape one site, but could schedule multiple in succession
    await win.loadURL(
      "https://www.stevenspass.com/plan-your-trip/lift-access/tickets.aspx?startDate=01%2F09%2F2021&numberOfDays=1&ageGroup=Adult"
    );
    await sleep(5000);
    console.log("Window loaded");
    await win.close();

    await mainWin.webContents.send("scrape-complete");
  }

  mainWin.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWin = null;
  });
}

// Standard start up and shutdown code
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
