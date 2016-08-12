var system = require('system');
var page = require('webpage').create();
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36';
page.viewportSize = { width: 1000, height: 1000 }
page.clipRect = { top: 0, left: 0, width: 1000, height: 1000 }

// Passed in from parent process
var url = system.args[1];
var target = system.args[2];

page.open(url, function start(status) {

  // Set the background to white, just in case
  page.evaluate(function() {
    document.body.style.background = 'white';
  });

  function checkReadyState() {
    setTimeout(function () {
      var readyState = page.evaluate(function () {
        return document.readyState;
      });

      if ("complete" === readyState) {
        page.render(target);
        phantom.exit();
      } else {
        checkReadyState();
      }
    });
  }

  checkReadyState();
});