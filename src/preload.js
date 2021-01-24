// This entire file gets executed in the context of the scraping window, in the
// browser. However, this script also has access to the local APIs, like `fs`.
// This is potentially dangerous (if you load a malicious site that tries to
// take advantage of that). To mitigate this, you may be able to use
// `contextIsolation`. I recommend looking into it in more detail.
// https://stackoverflow.com/a/57656281/1623877

const fs = require('fs');
const { format } = require("date-fns");

const scrapedir = `${__dirname}/data`;

// Make sure the scrape dir exists
try {
  fs.mkdirSync(scrapedir);
} catch (e) {}

// Patch XHR to log out request body of all XHR requests (e.g., jQuery.get calls)
// Can add an optional URL matcher to avoid scraping everything.
// https://medium.com/@gilfink/quick-tip-creating-an-xmlhttprequest-interceptor-1da23cf90b76
let oldXHROpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
  this.addEventListener('load', function () {
    if(url.match(/.*GetLiftTicketControlReservationInventory.*/)) {
      writeResponse(url, this.response);
    }
  });
  return oldXHROpen.apply(this, arguments);
}

function writeResponse(url, response) {
  try {
    let existingData;
    try {
      existingData = JSON.parse(fs.readFileSync(`${scrapedir}/data.json`));
    } catch(e) {
      existingData = [];
    }
    if (typeof response === 'string') {
      response = JSON.parse(response);
      response.forEach(({ InventoryDateTime, Remaining }) => {
        const inventoryDateTime = format(
          new Date(InventoryDateTime),
          "MM/dd/yyyy"
        );
        const currentIndex = existingData.findIndex(e => e.inventoryDateTime === inventoryDateTime);
        if(currentIndex === -1) {
          existingData.push({inventoryDateTime, remaining: Remaining});
        } else if(existingData[currentIndex].remaining !== Remaining) {
          existingData[currentIndex] = {inventoryDateTime, remaining: Remaining};
        }
      })
      fs.writeFileSync(`${scrapedir}/data.json`, JSON.stringify(existingData, null, 2));
    } else {
      console.warn('wrong format');
      return;
    }    
  } catch (e) {
    console.log('Parse failed', { url, response });
  }
}