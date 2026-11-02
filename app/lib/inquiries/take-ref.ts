/**
 * Inline script for the booking page. It runs while the page is still being parsed, before hydration and before any analytics script:
 *  - `#r=<reference>` in the address: the reference is kept in `window.__mbaRef` (memory only) and the fragment is removed from the current history entry;
 *  - `?ref=...` in the address (links sent before fragment links existed): the parameter is removed the same way (the server has already used it).
 * The reference format is checked and anything else is dropped. Wrapped so a failure can never break the page.
 */
export const TAKE_REF_FROM_FRAGMENT = `try{var u=new URL(location.href),c=false;if(u.hash.indexOf("#r=")===0){var r=decodeURIComponent(u.hash.slice(3));if(/^[A-Za-z0-9_-]{16,64}$/.test(r))window.__mbaRef=r;u.hash="";c=true}if(u.searchParams.has("ref")){u.searchParams.delete("ref");c=true}if(c)history.replaceState(history.state,"",u.pathname+u.search)}catch(e){}`;
