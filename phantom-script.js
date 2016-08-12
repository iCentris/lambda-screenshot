var system = require('system');
var page = require('webpage').create();
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36';
page.viewportSize = { width: 2000, height: 2000 }

// Passed in from parent process
var url = system.args[1];
var target = system.args[2];

page.onLoadFinished = function() {
  page.clipRect = page.evaluateJavaScript( "function() { var element = jQuery('.ecard-body'); return jQuery.extend(element.offset(), {width: element.outerWidth(), height: element.outerHeight()});}" );
  page.render(target);
  phantom.exit();
}

page.open(url, function start(status) {
  // Set the background to white, just in case
  page.evaluate(function() {
    document.body.style.background = 'white';
  });
});