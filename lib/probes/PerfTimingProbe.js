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

	var waitJsConditionString = '(window.__optlyPerformanceReady === true)';

	var me = this;
	return browser.execute(helpers.fnCall(code)).then(function() {
		return browser.waitFor({
			asserter: wd.asserters.jsCondition(waitJsConditionString, false),
			timeout: 1000 * 60 * 10,
			pollFreq: 1000
		});
	}).then(function(res) {
		return browser.eval('window.__perfTimings');
	}).then(function(res) {
		me.emit('data', res);
	});
};
module.exports = PerfTimingProbe;
