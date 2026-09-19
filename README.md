# LeadPredictor

A sales funnel calculator. Give it a revenue target, an average order value
and two response rates, and it works backwards up the funnel to tell you how
many **prospects**, **leads** and **customers** the campaign needs — then
spreads that work across the months between the start and end dates.

> Exam project for the SoftUni course *Programming Fundamentals with AI*.

**Live:** https://leadpredictor-softev.netlify.app

## What it does

- **Three funnel stages** — prospects, leads and customers, each with its
  count and its share of the top of the funnel.
- **Monthly plan** — one bar per campaign month, as a running total, so month
  4 shows everything the campaign has to have achieved by the end of month 4.
  Hovering a bar breaks that month down.
- **Live response rates** — both sliders recalculate the whole funnel as you
  drag them.
- **Four languages** — English, Bulgarian, German and Spanish, including the
  chart axes and the validation messages.
- **Four currencies** — US Dollar, Euro, British Pound and Bulgarian Lev.
- **Validation** — bad dates or a non-positive revenue are reported inline
  instead of silently producing nonsense.

## The formulas

The calculator walks up the funnel in three steps:

| # | Stage | Formula |
|---|-------|---------|
| 1 | Customers | `Total Revenue / Average Order Value` |
| 2 | Leads | `Customers * 100 / Lead Response Rate` |
| 3 | Prospects | `Leads * 100 / Prospect Response Rate` |

Every result is rounded **up**, because a campaign needs *at least* that many
people — two thirds of a customer does not pay an invoice.

Worked example, matching the defaults:

```
Revenue 10 000 / Order value 1 000        = 10 customers
10 customers * 100 / 40% lead response    = 25 leads
25 leads * 100 / 20% prospect response    = 125 prospects
```

So the funnel reads 125 prospects (100%), 25 leads (20%), 10 customers (8%).

## Project structure

```
index.html          markup and the script tags that load the modules
css/styles.css      design tokens, layout, components, responsive rules
js/i18n.js          translations, currencies and locale-aware formatting
js/calculator.js    the funnel formulas and the monthly schedule
js/chart.js         renders the monthly bars as inline SVG
js/app.js           reads the inputs and keeps the UI in sync
netlify.toml        Netlify build and header configuration
```

Each module hangs off a single global (`I18n`, `FunnelCalculator`,
`FunnelChart`) so the project stays dependency-free and needs no build step.

## Running locally

There is nothing to install. Open `index.html` in a browser, or serve the
folder if you prefer a real origin:

```bash
npx serve .
```

## Deployment

Deployed to Netlify from the `main` branch. `netlify.toml` sets the publish
directory to the repository root and leaves the build command empty, so every
push to `main` redeploys the static files as they are.
