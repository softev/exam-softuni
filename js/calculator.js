/**
 * LeadPredictor - funnel maths.
 *
 * The whole calculator rests on three formulas that walk backwards up the
 * sales funnel, from the revenue target to the number of people that have to
 * enter it:
 *
 *   1. Customers  = Total Revenue / Average Order Value
 *   2. Leads      = Customers * 100 / Lead Response Rate
 *   3. Prospects  = Leads * 100 / Prospect Response Rate
 *
 * Every result is rounded up, because a campaign needs *at least* that many
 * people - two thirds of a customer does not pay an invoice.
 */

window.FunnelCalculator = (function () {
  'use strict';

  /**
   * Formula 01 - how many paying customers the revenue target requires.
   * @param {number} revenue Total revenue the campaign has to produce.
   * @param {number} orderValue Average value of a single order.
   * @returns {number} Whole customers needed.
   */
  function customersNeeded(revenue, orderValue) {
    if (!(orderValue > 0)) {
      return 0;
    }
    return Math.ceil(revenue / orderValue);
  }

  /**
   * Formula 02 - how many leads produce that many customers.
   * @param {number} customers Customers the campaign has to win.
   * @param {number} leadResponseRate Percentage of leads that convert (0-100).
   * @returns {number} Whole leads needed.
   */
  function leadsNeeded(customers, leadResponseRate) {
    if (!(leadResponseRate > 0)) {
      return 0;
    }
    return Math.ceil((customers * 100) / leadResponseRate);
  }

  /**
   * Formula 03 - how many prospects produce that many leads.
   * @param {number} leads Leads the campaign has to generate.
   * @param {number} prospectResponseRate Percentage of prospects that respond (0-100).
   * @returns {number} Whole prospects needed.
   */
  function prospectsNeeded(leads, prospectResponseRate) {
    if (!(prospectResponseRate > 0)) {
      return 0;
    }
    return Math.ceil((leads * 100) / prospectResponseRate);
  }

  /**
   * Runs all three formulas in order.
   * @param {{revenue: number, orderValue: number, leadRate: number, prospectRate: number}} input
   * @returns {{customers: number, leads: number, prospects: number}}
   */
  function calculate(input) {
    var customers = customersNeeded(input.revenue, input.orderValue);
    var leads = leadsNeeded(customers, input.leadRate);
    var prospects = prospectsNeeded(leads, input.prospectRate);

    return { customers: customers, leads: leads, prospects: prospects };
  }

  /**
   * Share of the top of the funnel a stage represents, as a percentage.
   * Prospects are the top, so they always sit at 100%.
   * @param {number} stageValue
   * @param {number} prospects
   * @returns {number} 0-100
   */
  function shareOfFunnel(stageValue, prospects) {
    if (!(prospects > 0)) {
      return 0;
    }
    return (stageValue / prospects) * 100;
  }

  /**
   * Whole months a campaign spans, rounded up so a trailing part-month still
   * gets its own bar on the chart.
   * @param {Date} start
   * @param {Date} end
   * @returns {number} At least 1.
   */
  function monthsBetween(start, end) {
    var months = (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (end.getDate() > start.getDate()) {
      months += 1;
    }

    return Math.max(months, 1);
  }

  /**
   * Spreads a funnel evenly over the campaign and reports it as a running
   * total, so month N holds everything achieved up to and including month N.
   * @param {{customers: number, leads: number, prospects: number}} funnel
   * @param {number} months
   * @returns {Array<{month: number, prospects: number, leads: number, customers: number}>}
   */
  function buildSchedule(funnel, months) {
    var schedule = [];

    for (var month = 1; month <= months; month++) {
      schedule.push({
        month: month,
        prospects: Math.round((funnel.prospects * month) / months),
        leads: Math.round((funnel.leads * month) / months),
        customers: Math.round((funnel.customers * month) / months)
      });
    }

    return schedule;
  }

  return {
    customersNeeded: customersNeeded,
    leadsNeeded: leadsNeeded,
    prospectsNeeded: prospectsNeeded,
    calculate: calculate,
    shareOfFunnel: shareOfFunnel,
    monthsBetween: monthsBetween,
    buildSchedule: buildSchedule
  };
})();
