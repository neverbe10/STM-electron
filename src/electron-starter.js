const {
  app,
  BrowserWindow,
  webContents,
  ipcMain,
  Notification,
  shell
} = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
const { format } = require("date-fns");

const scrapedir = `${__dirname}/data`;
// const resortArray = ["keystone", "stevens", "breckenridge"];
// const resortMap = {
//   keystone:
//     "https://www.keystoneresort.com/plan-your-trip/lift-access/tickets.aspx",
//   stevens:
//     "https://www.stevenspass.com/plan-your-trip/lift-access/tickets.aspx",
//   breckenridge: 'https://www.breckenridge.com/plan-your-trip/lift-access/tickets.aspx',
// };

const resortArray = ["stevens"];
const resortMap = {
  stevens:
    "https://www.stevenspass.com/plan-your-trip/lift-access/tickets.aspx",
};

ipcMain.on("resort-list", (event) => {
  event.returnValue = resortArray;
});

let ChoosenDate;

ipcMain.on("availability", (event, resort, choosenDate) => {
  const res = getAvailability(resort, choosenDate);
  event.returnValue = {
    remaining: res,
    resort,
    resortUrl: resortMap[resort],
  };
  ChoosenDate = choosenDate;
});

function getAvailability(resort, choosenDate) {
  try {
    const availability = JSON.parse(fs.readFileSync(`${scrapedir}/data.json`));
    choosenDate = format(new Date(choosenDate), "MM/dd/yyyy");
    return (
      availability.find((e) => e.inventoryDateTime === choosenDate).remaining ||
      null
    );
  } catch (e) {
    console.error(e);
    return null;
  }
}

ipcMain.on("ready", (event) => {
  event.returnValue = checkIfDataExist();
});

function checkIfDataExist() {
  try {
    fs.readFileSync(`${scrapedir}/data.json`);
    return true;
  } catch (e) {
    return false;
  }
}

function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

function createWindow() {
  // Main UI window
  const mainWin = new BrowserWindow({
    width: 600,
    height: 1000,
    webPreferences: {
      // UI window accesses `fs` directly.
      nodeIntegration: true,
    },
  });

  // mainWin.loadFile(`index.html`);
  // and load the index.html of the app.
  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, "../build/index.html")}`;
  mainWin.loadURL(startUrl);
  mainWin.webContents.openDevTools();

  // if(ChoosenDate) {
  //   const notification = {
  //     title: 'Basic Notification',
  //     body: 'Notification from the Main process'
  //   }
  //   new Notification(notification).show()
  // }

  async function loop(url = "https://www.stevenspass.com/plan-your-trip/lift-access/tickets.aspx") {
    try {
      console.log({url});
      await scrape(url);
      if (ChoosenDate) {
        const remaining = getAvailability(null, ChoosenDate);
        // TODO Notification
        console.log("sending notification");
        if (remaining > 0) {
          const notification = new Notification({
            title: "Click to get ticket!",
            body: `Stevens resort has ${remaining} ticket(s) available for ${ChoosenDate}.`,
          });
          notification.on('click', (event, arg)=>{
            event.preventDefault(); // prevent the browser from focusing the Notification's tab
            shell.openExternal('https://www.stevenspass.com/plan-your-trip/lift-access/tickets.aspx');
          });
          notification.show();
        }
      }
      await sleep(60000);
      loop(url);
    } catch (e) {
      console.error(e);
    }
  }

  // loop();

  ipcMain.on("scrape", (event, arg) => {
    loop(arg);
  });

  async function scrape(url) {
    console.log("Scraping,.......");

    const win = new BrowserWindow({
      width: 800,
      height: 600,
      show: false, // Don't show to the user
      webPreferences: {
        preload: `${__dirname}/preload.js`, // Load the preload script, which intercepts all AJAX requests
      },
    });

    // Scrape one site, but could schedule multiple in succession
    await win.loadURL(url);
    await sleep(5000);
    win.close();

    if (mainWin) {
      mainWin.webContents.send("scrape-complete");
    }
  }

  // mainWin.on("closed", function () {
  //   // Dereference the window object, usually you would store windows
  //   // in an array if your app supports multi windows, this is the time
  //   // when you should delete the corresponding element.
  //   mainWin.close();
  // });
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
