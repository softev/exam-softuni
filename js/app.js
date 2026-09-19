/**
 * LeadPredictor - application wiring.
 *
 * Reads the campaign inputs from the sidebar and keeps the rest of the UI in
 * sync with them.
 */

(function () {
  'use strict';

  /** Months a campaign covers when no end date has been picked yet. */
  var DEFAULT_CAMPAIGN_MONTHS = 6;

  var els = {
    form: document.getElementById('controls'),
    language: document.getElementById('language'),
    currency: document.getElementById('currency'),
    startDate: document.getElementById('start-date'),
    endDate: document.getElementById('end-date'),
    revenue: document.getElementById('revenue'),
    orderValue: document.getElementById('order-value'),
    error: document.getElementById('controls-error'),
    kpis: document.querySelectorAll('.kpi'),
    rates: document.getElementById('rates-panel'),
    leadRate: document.getElementById('lead-rate'),
    prospectRate: document.getElementById('prospect-rate'),
    chart: document.getElementById('chart'),
    chartSvg: document.getElementById('chart-svg'),
    tooltip: document.getElementById('chart-tooltip'),
    printReport: document.getElementById('print-report')
  };

  /** Latest month-by-month figures, kept so the tooltip can read them back. */
  var schedule = [];

  /** Captions the chart draws on its axes, in the active language. */
  function chartLabels() {
    return { months: I18n.t('months'), people: I18n.t('people') };
  }

  /**
   * Formats a Date as the `yyyy-mm-dd` string an `<input type="date">` expects.
   * @param {Date} date
   * @returns {string}
   */
  function toInputDate(date) {
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + month + '-' + day;
  }

  /**
   * Returns a copy of `date` moved forward by `months` calendar months.
   * @param {Date} date
   * @param {number} months
   * @returns {Date}
   */
  function addMonths(date, months) {
    var result = new Date(date.getTime());
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /** Pre-fills the campaign with a six month window starting today. */
  function applyDefaultDates() {
    var today = new Date();
    els.startDate.value = toInputDate(today);
    els.endDate.value = toInputDate(addMonths(today, DEFAULT_CAMPAIGN_MONTHS));
  }

  /** Mirrors the selected currency into every money field. */
  function applyCurrencySymbol() {
    var symbol = I18n.currencySymbol(els.currency.value);
    var targets = document.querySelectorAll('[data-currency-symbol]');

    for (var i = 0; i < targets.length; i++) {
      targets[i].textContent = symbol;
    }
  }

  /**
   * Re-translates the interface and relabels the currency options, which
   * carry a symbol as well as a name and so cannot use data-i18n directly.
   */
  function applyLanguage() {
    I18n.setLanguage(els.language.value);
    I18n.apply();

    var options = els.currency.querySelectorAll('[data-currency]');

    for (var i = 0; i < options.length; i++) {
      var code = options[i].dataset.currency;
      options[i].textContent = I18n.currencySymbol(code) + ' ' + I18n.t(code.toLowerCase());
    }
  }

  /**
   * Reads the sidebar into a plain object. Invalid input is reported through
   * the inline error line rather than thrown.
   * @returns {{startDate: Date, endDate: Date, revenue: number, orderValue: number}|null}
   */
  function readCampaign() {
    var start = new Date(els.startDate.value);
    var end = new Date(els.endDate.value);
    var revenue = Number(els.revenue.value);
    var orderValue = Number(els.orderValue.value);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return fail('errDates');
    }

    if (end <= start) {
      return fail('errOrder');
    }

    if (!(revenue > 0)) {
      return fail('errRevenue');
    }

    if (!(orderValue > 0)) {
      return fail('errOrderValue');
    }

    clearError();
    return { startDate: start, endDate: end, revenue: revenue, orderValue: orderValue };
  }

  /**
   * Shows a translated validation message and stops the render.
   * @param {string} key Translation key of the message.
   * @returns {null}
   */
  function fail(key) {
    els.error.textContent = I18n.t(key);
    els.error.hidden = false;
    return null;
  }

  function clearError() {
    els.error.textContent = '';
    els.error.hidden = true;
  }

  /**
   * Reads both response sliders, refreshes their read-outs and the filled
   * part of their tracks.
   * @returns {{leadRate: number, prospectRate: number}} Percentages, 1-100.
   */
  function readRates() {
    return {
      leadRate: readRate(els.leadRate),
      prospectRate: readRate(els.prospectRate)
    };
  }

  /**
   * @param {HTMLInputElement} slider
   * @returns {number} The slider value as a percentage.
   */
  function readRate(slider) {
    var value = Number(slider.value);
    var percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
    var output = document.querySelector('[data-rate-output="' + slider.id + '"]');

    slider.style.setProperty('--fill', percent + '%');
    output.textContent = value.toFixed(2) + '%';

    return value;
  }

  /**
   * Writes one funnel stage into its KPI card.
   * @param {Element} card
   * @param {number} value People at this stage.
   * @param {number} prospects People at the top of the funnel.
   */
  function renderKpi(card, value, prospects) {
    var share = FunnelCalculator.shareOfFunnel(value, prospects);

    card.querySelector('[data-kpi-value]').textContent = I18n.formatNumber(value);
    card.querySelector('[data-kpi-share]').textContent = Math.round(share) + '%';
    card.querySelector('[data-kpi-bar]').style.width = share + '%';
  }

  /** Fills all three KPI cards from a calculated funnel. */
  function renderKpis(funnel) {
    for (var i = 0; i < els.kpis.length; i++) {
      var card = els.kpis[i];
      renderKpi(card, funnel[card.dataset.kpi], funnel.prospects);
    }
  }

  /**
   * Fills the tooltip for a month and parks it next to the pointer.
   * @param {number} index Row the pointer is over.
   * @param {MouseEvent} event
   */
  function showTooltip(index, event) {
    var point = schedule[index];

    if (!point) {
      return;
    }

    els.tooltip.innerHTML =
      '<strong>' + I18n.t('month') + ' #' + point.month + '</strong>' +
      '<span>' + I18n.t('prospects') + ': ' + I18n.formatNumber(point.prospects) + '</span>' +
      '<span>' + I18n.t('leads') + ': ' + I18n.formatNumber(point.leads) + '</span>' +
      '<span>' + I18n.t('customers') + ': ' + I18n.formatNumber(point.customers) + '</span>';

    var bounds = els.chart.getBoundingClientRect();
    var left = event.clientX - bounds.left;
    var margin = 75;

    els.tooltip.hidden = false;
    els.tooltip.style.left = Math.min(Math.max(left, margin), bounds.width - margin) + 'px';
    els.tooltip.style.top = (event.clientY - bounds.top) + 'px';
  }

  function hideTooltip() {
    els.tooltip.hidden = true;
  }

  /** Recomputes everything that depends on the campaign inputs. */
  function render() {
    applyLanguage();
    applyCurrencySymbol();

    var campaign = readCampaign();
    if (!campaign) {
      return;
    }

    var rates = readRates();

    var funnel = FunnelCalculator.calculate({
      revenue: campaign.revenue,
      orderValue: campaign.orderValue,
      leadRate: rates.leadRate,
      prospectRate: rates.prospectRate
    });

    renderKpis(funnel);

    var months = FunnelCalculator.monthsBetween(campaign.startDate, campaign.endDate);
    schedule = FunnelCalculator.buildSchedule(funnel, months);

    FunnelChart.render({
      svg: els.chartSvg,
      schedule: schedule,
      labels: chartLabels()
    });
  }

  function init() {
    applyDefaultDates();
    els.form.addEventListener('input', render);
    els.form.addEventListener('change', render);
    els.rates.addEventListener('input', render);

    els.chartSvg.addEventListener('mousemove', function (event) {
      var hit = event.target.closest('.chart__hit');

      if (hit) {
        showTooltip(Number(hit.dataset.index), event);
      } else {
        hideTooltip();
      }
    });

    els.chartSvg.addEventListener('mouseleave', hideTooltip);

    els.printReport.addEventListener('click', function () {
      hideTooltip();
      window.print();
    });
    els.form.addEventListener('submit', function (event) {
      event.preventDefault();
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
