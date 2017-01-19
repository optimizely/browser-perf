var BaseMetrics = require('./BaseMetrics'),
	helpers = require('../helpers');

function PerfTimings() {
	BaseMetrics.apply(this, arguments);
}
require('util').inherits(PerfTimings, BaseMetrics);

PerfTimings.prototype.id = 'PerfTimings';
PerfTimings.prototype.probes = ['PerfTimingProbe'];

PerfTimings.prototype.onData = function(data) {
	this.timing = data;
}

PerfTimings.prototype.getResults = function(cfg, browser) {
	return this.timing;
}

module.exports = PerfTimings;
