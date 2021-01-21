// This entire file gets executed in the context of the scraping window, in the
// browser. However, this script also has access to the local APIs, like `fs`.
// This is potentially dangerous (if you load a malicious site that tries to
// take advantage of that). To mitigate this, you may be able to use
// `contextIsolation`. I recommend looking into it in more detail.
// https://stackoverflow.com/a/57656281/1623877

const fs = require('fs');

const scrapedir = `${__dirname}/scraped`;

// Make sure the scrape dir exists
try {
  fs.mkdirSync(scrapedir);
} catch (e) {}


// Patch window.fetch
// https://stackoverflow.com/a/64961272/1623877
const { fetch: origFetch } = window;
window.fetch = async (...args) => {
  console.log("fetch called with args:", args);
  const response = await origFetch(...args);

  /* work with the cloned response in a separate promise
     chain -- could use the same chain with `await`. */
  response
    .clone()
    .json()
    .then(body => {
      const [url] = args;
      console.log("intercepted:", { args, body });
      writeResponse(url, body);
    })
    .catch(err => console.error(err));

  /* the original response can be resolved unmodified: */
  return response;
};


// Patch XHR to log out request body of all XHR requests (e.g., jQuery.get calls)
// Can add an optional URL matcher to avoid scraping everything.
// https://medium.com/@gilfink/quick-tip-creating-an-xmlhttprequest-interceptor-1da23cf90b76
let oldXHROpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
  this.addEventListener('load', function () {
    writeResponse(url, this.response);
  });
  return oldXHROpen.apply(this, arguments);
}

function writeResponse(url, response) {
  try {
    const filename = url.split('/').pop();
    if (typeof response === 'string') {
      response = JSON.parse(response);
    }
    fs.writeFileSync(`${scrapedir}/${filename}`, JSON.stringify(response, null, 2));
  } catch (e) {
    console.log('Parse failed', { url, response });
  }
}