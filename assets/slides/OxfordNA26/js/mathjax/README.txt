MathJax v3.2.2 -- vendored from the npm package `mathjax`, file es5/tex-svg-full.js.
The "-full" bundle is used because the deck loads the boldsymbol and mathtools TeX
extensions; the plain tex-svg.js fetches those separately at runtime, which is exactly
the network dependency vendoring is meant to remove.

To update: download https://registry.npmjs.org/mathjax/-/mathjax-<version>.tgz and copy
package/es5/tex-svg-full.js over this one.
