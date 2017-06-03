var Q = require('q'),
	util = require('util'),
	wd = require('wd'),
	events = require('events'),
	helpers = require('../helpers'),
	debug = require('debug')('bp:probes');

function PerfTimingProbe() {
	events.EventEmitter.call(this);
}

util.inherits(PerfTimingProbe, events.EventEmitter);

PerfTimingProbe.prototype.id = 'PerfTimingProbe';

PerfTimingProbe.prototype.teardown = function(browser) {
	var code = function() {
		var requestAnimationFrame = (function() {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback) {
					window.setTimeout(callback, 1000 / 60);
				};
		})().bind(window);

		requestAnimationFrame(function() {
			var result = {};
			var performance = window.performance || window.webkitPerformance || window.msPerformance || window.mozPerformance;
			if (typeof performance !== 'undefined') {
        var marks = performance.getEntriesByType('measure');
        marks.forEach(function(val) {
					if (typeof val.duration === 'number') // Firefox spits out a toJSON function also
            if (val.name in result) {
						  result[val.name] += val.duration;
            } else {
              result[val.name] = val.duration;
            }
        })
      }
      var counts = {
        'optlyCounterJAMES': 6,
        'optlyCounterDEREK': 9,
        'optlyCounterAMY': 245
      };
      if (window.__optlyPerfCounters) {
        Object.assign(counts, window.__optlyPerfCounters);
      }
			window.__perfTimings = Object.assign({}, result, counts);
		});
	};

	var waitForClientReadyString = '((typeof window.__optlyPerformanceReady !== "undefined") ? window.__optlyPerformanceReady === true : true)';
	var waitForPerfDataReadyString = '(typeof window.__perfTimings !== "undefined")';
	var me = this;

	return browser
		// First wait for the client to indicate its ready to test.
		.waitFor({
			asserter: wd.asserters.jsCondition(waitForClientReadyString, false),
			timeout: 1000 * 60 * 10,
			pollFreq: 200
		})
	  // Then execute the requestAnimationFrame helper code to set the global perf variable.
		.then(function() { return browser.execute(helpers.fnCall(code)) })
		// Then wait for the global perf variable to be set.
		.then(function() {
			return browser.waitFor({
				asserter: wd.asserters.jsCondition(waitForPerfDataReadyString, false),
				timeout: 1000 * 60 * 10,
				pollFreq: 200
			});
		})
		// Then eval the code to get the global perf data.
		.then(function(res) {
			return browser.eval('window.__perfTimings');
		})
		// Then finally emit the result of the eval as the data.
		.then(function(res) {
			debug('@@@@@@@@@@@@@@@@@@@@@@@@@@  BROWSER PERF RUN - EMITTING DATA  @@@@@@@@@@@@@@@@@@@@@@@@@@@@')
			debug(res)
			debug('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
			me.emit('data', res);
		});
};
module.exports = PerfTimingProbe;
