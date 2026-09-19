/**
 * LeadPredictor - monthly funnel chart.
 *
 * Draws one horizontal bar per campaign month. The three funnel stages are
 * layered on top of each other rather than stacked: prospects run the full
 * length of the bar, with leads and then customers drawn over the start of
 * it, so a bar reads as "of these prospects, this many become leads, and this
 * many of those become customers".
 */

window.FunnelChart = (function () {
  'use strict';

  var VIEW_WIDTH = 660;
  var VIEW_HEIGHT = 300;

  var MARGIN = { top: 8, right: 14, bottom: 36, left: 52 };

  var PLOT_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
  var PLOT_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;

  var MAX_BAR_HEIGHT = 22;
  var BAR_HEIGHT_RATIO = 0.62;
  var TARGET_TICKS = 5;

  /** Steps that produce round axis labels. */
  var NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

  /**
   * Picks a round step so the axis ends on a sensible number.
   * @param {number} maxValue Largest value that has to fit on the axis.
   * @returns {number}
   */
  function niceStep(maxValue) {
    var raw = maxValue / TARGET_TICKS;

    for (var i = 0; i < NICE_STEPS.length; i++) {
      if (NICE_STEPS[i] >= raw) {
        return NICE_STEPS[i];
      }
    }

    return NICE_STEPS[NICE_STEPS.length - 1];
  }

  /**
   * Builds the tick values for the people axis.
   * @param {number} maxValue
   * @returns {{ticks: number[], max: number}}
   */
  function buildScale(maxValue) {
    var step = niceStep(Math.max(maxValue, 1));
    var max = Math.max(Math.ceil(maxValue / step) * step, step);
    var ticks = [];

    for (var value = 0; value <= max; value += step) {
      ticks.push(value);
    }

    return { ticks: ticks, max: max };
  }

  function svgTag(name, attributes, children) {
    var parts = [];

    for (var key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) {
        parts.push(key + '="' + attributes[key] + '"');
      }
    }

    return '<' + name + ' ' + parts.join(' ') + '>' + (children || '') + '</' + name + '>';
  }

  /**
   * Renders the chart into an existing <svg> element.
   *
   * @param {Object} options
   * @param {SVGElement} options.svg Target element, emptied before drawing.
   * @param {Array<{month: number, prospects: number, leads: number, customers: number}>} options.schedule
   * @param {{months: string, people: string}} options.labels Axis captions.
   */
  function render(options) {
    var schedule = options.schedule;
    var labels = options.labels;
    var svg = options.svg;

    svg.setAttribute('viewBox', '0 0 ' + VIEW_WIDTH + ' ' + VIEW_HEIGHT);
    svg.setAttribute('role', 'img');

    if (!schedule.length) {
      svg.innerHTML = '';
      return;
    }

    var largest = schedule[schedule.length - 1].prospects;
    var scale = buildScale(largest);
    var rowHeight = PLOT_HEIGHT / schedule.length;
    var barHeight = Math.min(rowHeight * BAR_HEIGHT_RATIO, MAX_BAR_HEIGHT);

    function x(value) {
      return MARGIN.left + (value / scale.max) * PLOT_WIDTH;
    }

    var markup = '';

    // Vertical grid and the "N people" captions underneath it.
    scale.ticks.forEach(function (tick) {
      var tickX = x(tick).toFixed(1);

      markup += svgTag('line', {
        class: 'chart__grid',
        x1: tickX,
        y1: MARGIN.top,
        x2: tickX,
        y2: MARGIN.top + PLOT_HEIGHT
      });

      markup += svgTag('text', {
        class: 'chart__tick',
        x: tickX,
        y: MARGIN.top + PLOT_HEIGHT + 20,
        'text-anchor': 'middle'
      }, tick + ' ' + labels.people);
    });

    // Axis captions.
    markup += svgTag('text', {
      class: 'chart__axis-title',
      x: 13,
      y: MARGIN.top + PLOT_HEIGHT / 2,
      'text-anchor': 'middle',
      transform: 'rotate(-90 13 ' + (MARGIN.top + PLOT_HEIGHT / 2) + ')'
    }, labels.months);

    // One row per month: the month number, the three layered bars and a
    // transparent strip that catches the pointer.
    schedule.forEach(function (point, index) {
      var rowTop = MARGIN.top + index * rowHeight;
      var barTop = (rowTop + (rowHeight - barHeight) / 2).toFixed(1);

      markup += svgTag('text', {
        class: 'chart__row-label',
        x: MARGIN.left - 11,
        y: (rowTop + rowHeight / 2 + 3.5).toFixed(1),
        'text-anchor': 'end'
      }, String(point.month));

      ['prospects', 'leads', 'customers'].forEach(function (stage) {
        var width = x(point[stage]) - MARGIN.left;

        if (width <= 0) {
          return;
        }

        markup += svgTag('rect', {
          class: 'chart__bar chart__bar--' + stage,
          x: MARGIN.left,
          y: barTop,
          width: Math.max(width, 2).toFixed(1),
          height: barHeight.toFixed(1),
          rx: 3
        });
      });

      markup += svgTag('rect', {
        class: 'chart__hit',
        'data-index': index,
        x: MARGIN.left,
        y: rowTop.toFixed(1),
        width: PLOT_WIDTH,
        height: rowHeight.toFixed(1)
      });
    });

    svg.innerHTML = markup;
  }

  return { render: render };
})();
