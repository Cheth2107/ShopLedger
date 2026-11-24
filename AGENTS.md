# Repository Guidelines

## Project Structure

- `server.js` sets up Express, mounts the `/api` routers, and serves the printable invoice. `config.js` holds shop details, GST slabs, coupon rules, and inventory defaults.
- `routes/` contains HTTP handlers for products, orders, customers, and reports. Keep reusable business rules in `lib/`, which handles pricing, tax, stock, Khata, invoices, and JSON persistence.
- `public/` contains the browser UI in `index.html`, `js/app.js`, and `css/style.css`. See `docs/architecture.svg` for the order flow.
- `data/db.json` is the tracked data file and the running app's writable store. Use a disposable checkout for write-heavy manual testing and review the data diff before committing.

## Local Development

- `npm install` installs Express and body-parser.
- `npm start` runs `node server.js`. Open `http://localhost:3000` by default. Set `PORT` to choose a different port.
- The browser assets are served directly. There is no build step or configured lint or format command.

## Coding Style

Follow the surrounding JavaScript style. Use two-space indentation, single quotes, semicolons, and CommonJS `require()` and `module.exports` or `exports`. Use descriptive camelCase names for functions and variables and lowercase names for modules. Keep HTTP request and response handling in `routes/`. Preserve the stored data shape when changing shared logic. For example, order lines reference products through `items[].id`.

## Testing

`npm test` is a placeholder that exits with an error. The repository has no automated suite, test naming convention, or coverage target. For checkout changes, manually verify a sale, a rejected cart, and the resulting stock and order data. For pricing or invoice changes, compare saved totals, printed figures, and GST reconciliation using a coupon and multiple HSN slabs. For cancellation changes, check stock and Khata balances before and after.

## Commits and Pull Requests

Recent commits use short, lowercase summaries such as `support hsn gst slabs and coupon maxDiscount caps`. In a pull request, describe the behavior change and how you verified it. Link the issue when available, include screenshots for visible POS or invoice changes, and call out intentional changes to tracked data.
