# myPortfolio

Personal portfolio of **Ahmad Amirizal Rahmat**, a Java Developer and Full-Stack Engineer based in Kuala Lumpur.

Live: https://amirizalrahmat0799.github.io/myPortfolio/

## Stack

Plain HTML, CSS and JavaScript: no framework, no build step, no jQuery.

- Dark and light themes (follows the OS setting, with a toggle that remembers your choice)
- Responsive down to small phones, keyboard-accessible, respects reduced-motion
- SEO and social preview meta tags plus JSON-LD `Person` schema

## Structure

```
index.html
assets/
  css/site.css
  js/site.js
  img/            avatar, favicon
  resume/         downloadable CV (PDF)
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

## Deploy

Pushed to `main` and served by GitHub Pages.
