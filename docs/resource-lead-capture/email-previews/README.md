# Delivery email previews

Rendered by `render.mjs` from `buildDeliveryEmail` (states: `pending` = confirmation offered, `active` = already
subscribed, `none` = suppressed). Subject: "Your guide is ready: Build the Bridge First". The postal address comes from
the `MAILING_ADDRESS` environment variable (multiline); these previews were rendered with the approved MINDRA address
set in the environment at render time only. It is not in any template.
