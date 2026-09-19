/**
 * LeadPredictor - application wiring.
 *
 * Reads the campaign inputs from the sidebar and keeps the rest of the UI in
 * sync with them.
 */

(function () {
  'use strict';

  /** Currency symbol shown inside the money fields. */
  var CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    BGN: '\u043B\u0432.'
  };

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
    prospectRate: document.getElementById('prospect-rate')
  };

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
    var symbol = CURRENCY_SYMBOLS[els.currency.value] || '$';
    var targets = document.querySelectorAll('[data-currency-symbol]');

    for (var i = 0; i < targets.length; i++) {
      targets[i].textContent = symbol;
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
      return fail('Please pick both a start and an end date.');
    }

    if (end <= start) {
      return fail('The campaign end date must come after the start date.');
    }

    if (!(revenue > 0)) {
      return fail('Total revenue must be greater than zero.');
    }

    if (!(orderValue > 0)) {
      return fail('Average order value must be greater than zero.');
    }

    clearError();
    return { startDate: start, endDate: end, revenue: revenue, orderValue: orderValue };
  }

  function fail(message) {
    els.error.textContent = message;
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

    card.querySelector('[data-kpi-value]').textContent = String(value);
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

  /** Recomputes everything that depends on the campaign inputs. */
  function render() {
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
  }

  function init() {
    applyDefaultDates();
    els.form.addEventListener('input', render);
    els.form.addEventListener('change', render);
    els.rates.addEventListener('input', render);
    els.form.addEventListener('submit', function (event) {
      event.preventDefault();
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
