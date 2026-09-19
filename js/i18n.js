/**
 * LeadPredictor - translations, currencies and locale-aware formatting.
 *
 * Every visible string lives here under a short key. Markup opts in with a
 * `data-i18n="key"` attribute, and `I18n.apply()` rewrites those nodes
 * whenever the language changes.
 */

window.I18n = (function () {
  'use strict';

  var DEFAULT_LANGUAGE = 'en';

  /** Locale used for number formatting, per language. */
  var LOCALES = {
    en: 'en-US',
    bg: 'bg-BG',
    de: 'de-DE',
    es: 'es-ES'
  };

  /** Symbol shown inside the money fields, per currency. */
  var CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    BGN: '\u043B\u0432.'
  };

  var TRANSLATIONS = {
    en: {
      language: 'Language',
      currency: 'Currency',
      campaignStart: 'Campaign Start',
      campaignEnd: 'Campaign End',
      totalRevenue: 'Total Revenue',
      avgOrderValue: 'Avg. Order Value',
      leadResponseRate: 'Lead Response Rate',
      prospectResponseRate: 'Prospect Response Rate',
      prospects: 'Prospects',
      leads: 'Leads',
      customers: 'Customers',
      months: 'Months',
      month: 'Month',
      people: 'people',
      usd: 'US Dollar',
      eur: 'Euro',
      gbp: 'British Pound',
      bgn: 'Bulgarian Lev',
      errDates: 'Please pick both a start and an end date.',
      errOrder: 'The campaign end date must come after the start date.',
      errRevenue: 'Total revenue must be greater than zero.',
      errOrderValue: 'Average order value must be greater than zero.'
    },
    bg: {
      language: 'Език',
      currency: 'Валута',
      campaignStart: 'Начало на кампанията',
      campaignEnd: 'Край на кампанията',
      totalRevenue: 'Общ оборот',
      avgOrderValue: 'Средна стойност на поръчка',
      leadResponseRate: 'Отговори от потенциални клиенти',
      prospectResponseRate: 'Отговори от контакти',
      prospects: 'Контакти',
      leads: 'Потенциални клиенти',
      customers: 'Клиенти',
      months: 'Месеци',
      month: 'Месец',
      people: 'души',
      usd: 'Щатски долар',
      eur: 'Евро',
      gbp: 'Британска лира',
      bgn: 'Български лев',
      errDates: 'Моля, изберете начална и крайна дата.',
      errOrder: 'Крайната дата трябва да е след началната.',
      errRevenue: 'Оборотът трябва да е по-голям от нула.',
      errOrderValue: 'Средната стойност на поръчка трябва да е по-голяма от нула.'
    },
    de: {
      language: 'Sprache',
      currency: 'Währung',
      campaignStart: 'Kampagnenstart',
      campaignEnd: 'Kampagnenende',
      totalRevenue: 'Gesamtumsatz',
      avgOrderValue: 'Ø Bestellwert',
      leadResponseRate: 'Lead-Rücklaufquote',
      prospectResponseRate: 'Interessenten-Rücklaufquote',
      prospects: 'Interessenten',
      leads: 'Leads',
      customers: 'Kunden',
      months: 'Monate',
      month: 'Monat',
      people: 'Personen',
      usd: 'US-Dollar',
      eur: 'Euro',
      gbp: 'Britisches Pfund',
      bgn: 'Bulgarischer Lew',
      errDates: 'Bitte Start- und Enddatum wählen.',
      errOrder: 'Das Enddatum muss nach dem Startdatum liegen.',
      errRevenue: 'Der Umsatz muss größer als null sein.',
      errOrderValue: 'Der durchschnittliche Bestellwert muss größer als null sein.'
    },
    es: {
      language: 'Idioma',
      currency: 'Moneda',
      campaignStart: 'Inicio de campaña',
      campaignEnd: 'Fin de campaña',
      totalRevenue: 'Ingresos totales',
      avgOrderValue: 'Valor medio del pedido',
      leadResponseRate: 'Tasa de respuesta de leads',
      prospectResponseRate: 'Tasa de respuesta de prospectos',
      prospects: 'Prospectos',
      leads: 'Leads',
      customers: 'Clientes',
      months: 'Meses',
      month: 'Mes',
      people: 'personas',
      usd: 'Dólar estadounidense',
      eur: 'Euro',
      gbp: 'Libra esterlina',
      bgn: 'Lev búlgaro',
      errDates: 'Elige una fecha de inicio y una de fin.',
      errOrder: 'La fecha de fin debe ser posterior a la de inicio.',
      errRevenue: 'Los ingresos deben ser mayores que cero.',
      errOrderValue: 'El valor medio del pedido debe ser mayor que cero.'
    }
  };

  var language = DEFAULT_LANGUAGE;

  /**
   * Switches the active language and updates the document language attribute.
   * Unknown codes fall back to English.
   * @param {string} code
   */
  function setLanguage(code) {
    language = TRANSLATIONS[code] ? code : DEFAULT_LANGUAGE;
    document.documentElement.lang = language;
  }

  /**
   * Looks up a translated string, falling back to English and then to the key
   * itself so a missing translation is visible rather than blank.
   * @param {string} key
   * @returns {string}
   */
  function t(key) {
    return TRANSLATIONS[language][key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
  }

  /** Rewrites every `[data-i18n]` node in the document. */
  function apply() {
    var nodes = document.querySelectorAll('[data-i18n]');

    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].dataset.i18n);
    }
  }

  /**
   * @param {string} code ISO currency code.
   * @returns {string} The symbol to show inside money fields.
   */
  function currencySymbol(code) {
    return CURRENCY_SYMBOLS[code] || CURRENCY_SYMBOLS.USD;
  }

  /** @returns {string[]} Every supported currency code. */
  function currencyCodes() {
    return Object.keys(CURRENCY_SYMBOLS);
  }

  /**
   * Formats a whole number for the active locale, so 1250 reads as "1,250"
   * in English and "1 250" in Bulgarian.
   * @param {number} value
   * @returns {string}
   */
  function formatNumber(value) {
    return new Intl.NumberFormat(LOCALES[language]).format(value);
  }

  return {
    setLanguage: setLanguage,
    t: t,
    apply: apply,
    currencySymbol: currencySymbol,
    currencyCodes: currencyCodes,
    formatNumber: formatNumber
  };
})();
