(() => {
  // <stdin>
  (() => {
    var t, n, o, r, l, d, h, f, p, y, w, x, A, M, F, e = Object.assign || function(s2) {
      for (var e2, n2, t2 = 1; t2 < arguments.length; t2++) {
        e2 = arguments[t2];
        for (n2 in e2)
          Object.prototype.hasOwnProperty.call(e2, n2) && (s2[n2] = e2[n2]);
      }
      return s2;
    }, i = function(e2) {
      return e2.tagName === "IMG";
    }, G = function(e2) {
      return NodeList.prototype.isPrototypeOf(e2);
    }, a = function(e2) {
      return e2 && e2.nodeType === 1;
    }, O = function(e2) {
      var t2 = e2.currentSrc || e2.src;
      return t2.substr(-4).toLowerCase() === ".svg";
    }, E = function(e2) {
      try {
        return Array.isArray(e2) ? e2.filter(i) : G(e2) ? [].slice.call(e2).filter(i) : a(e2) ? [e2].filter(i) : typeof e2 == "string" ? [].slice.call(document.querySelectorAll(e2)).filter(i) : [];
      } catch (e3) {
        throw new TypeError("The provided selector is invalid.\nExpects a CSS selector, a Node element, a NodeList or an array.\nSee: https://github.com/francoischalifour/medium-zoom");
      }
    }, K = function(t2) {
      var e2 = document.createElement("div");
      return e2.classList.add("medium-zoom-overlay"), e2.style.background = t2, e2;
    }, Y = function(n2) {
      var t2 = n2.getBoundingClientRect(), o2 = t2.top, i2 = t2.left, a2 = t2.width, s2 = t2.height, e2 = n2.cloneNode(), r2 = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0, c2 = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
      return e2.removeAttribute("id"), e2.style.position = "absolute", e2.style.top = o2 + r2 + "px", e2.style.left = i2 + c2 + "px", e2.style.width = a2 + "px", e2.style.height = s2 + "px", e2.style.transform = "", e2;
    }, s = function(s2, o2) {
      var n2, t2 = e({ bubbles: false, cancelable: false, detail: void 0 }, o2);
      return typeof window.CustomEvent == "function" ? new CustomEvent(s2, t2) : (n2 = document.createEvent("CustomEvent"), n2.initCustomEvent(s2, t2.bubbles, t2.cancelable, t2.detail), n2);
    }, T = function(d2) {
      var o2, l2, M2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, h2 = window.Promise || function(t3) {
        function e2() {
        }
        t3(e2, e2);
      }, S2 = function(t3) {
        var e2 = t3.target;
        if (e2 === l2) {
          r2();
          return;
        }
        if (i2.indexOf(e2) === -1)
          return;
        f2({ target: e2 });
      }, A2 = function() {
        if (c2 || !t2.original)
          return;
        var e2 = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        Math.abs(p2 - e2) > n2.scrollOffset && setTimeout(r2, 150);
      }, k2 = function(t3) {
        var e2 = t3.key || t3.keyCode;
        (e2 === "Escape" || e2 === "Esc" || e2 === 27) && r2();
      }, C2 = function() {
        var c3, t3 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, r3 = t3;
        return t3.background && (l2.style.background = t3.background), t3.container && t3.container instanceof Object && (r3.container = e({}, n2.container, t3.container)), t3.template && (c3 = a(t3.template) ? t3.template : document.querySelector(t3.template), r3.template = c3), n2 = e({}, n2, r3), i2.forEach(function(e2) {
          e2.dispatchEvent(s("medium-zoom:update", { detail: { zoom: o2 } }));
        }), o2;
      }, x2 = function() {
        var t3 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        return T(e({}, n2, t3));
      }, m2 = function() {
        for (var t3, n3 = arguments.length, s2 = Array(n3), e2 = 0; e2 < n3; e2++)
          s2[e2] = arguments[e2];
        return t3 = s2.reduce(function(e3, t4) {
          return [].concat(e3, E(t4));
        }, []), t3.filter(function(e3) {
          return i2.indexOf(e3) === -1;
        }).forEach(function(e3) {
          i2.push(e3), e3.classList.add("medium-zoom-image");
        }), u2.forEach(function(e3) {
          var n4 = e3.type, s3 = e3.listener, o3 = e3.options;
          t3.forEach(function(e4) {
            e4.addEventListener(n4, s3, o3);
          });
        }), o2;
      }, w2 = function() {
        for (var a2, c3 = arguments.length, n3 = Array(c3), e2 = 0; e2 < c3; e2++)
          n3[e2] = arguments[e2];
        return t2.zoomed && r2(), a2 = n3.length > 0 ? n3.reduce(function(e3, t3) {
          return [].concat(e3, E(t3));
        }, []) : i2, a2.forEach(function(e3) {
          e3.classList.remove("medium-zoom-image"), e3.dispatchEvent(s("medium-zoom:detach", { detail: { zoom: o2 } }));
        }), i2 = i2.filter(function(e3) {
          return a2.indexOf(e3) === -1;
        }), o2;
      }, b2 = function(e2, t3) {
        var n3 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        return i2.forEach(function(s2) {
          s2.addEventListener("medium-zoom:" + e2, t3, n3);
        }), u2.push({ type: "medium-zoom:" + e2, listener: t3, options: n3 }), o2;
      }, v2 = function(e2, t3) {
        var n3 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        return i2.forEach(function(s2) {
          s2.removeEventListener("medium-zoom:" + e2, t3, n3);
        }), u2 = u2.filter(function(n4) {
          return n4.type !== "medium-zoom:" + e2 || n4.listener.toString() !== t3.toString();
        }), o2;
      }, g2 = function() {
        var m3 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, d3 = m3.target, u3 = function() {
          if (s2 = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight, left: 0, top: 0, right: 0, bottom: 0 }, o3 = void 0, i3 = void 0, n2.container)
            if (n2.container instanceof Object)
              s2 = e({}, s2, n2.container), o3 = s2.width - s2.left - s2.right - n2.margin * 2, i3 = s2.height - s2.top - s2.bottom - n2.margin * 2;
            else {
              var s2, C3 = a(n2.container) ? n2.container : document.querySelector(n2.container), c3 = C3.getBoundingClientRect(), _3 = c3.width, y3 = c3.height, v3 = c3.left, g3 = c3.top;
              s2 = e({}, s2, { width: _3, height: y3, left: v3, top: g3 });
            }
          var o3 = o3 || s2.width - n2.margin * 2, i3 = i3 || s2.height - n2.margin * 2, r3 = t2.zoomedHd || t2.original, p3 = O(r3) ? o3 : r3.naturalWidth || o3, f3 = O(r3) ? i3 : r3.naturalHeight || i3, l3 = r3.getBoundingClientRect(), b3 = l3.top, j3 = l3.left, h3 = l3.width, u4 = l3.height, w3 = Math.min(p3, o3) / h3, x3 = Math.min(f3, i3) / u4, d4 = Math.min(w3, x3), E2 = (-j3 + (o3 - h3) / 2 + n2.margin + s2.left) / d4, k3 = (-b3 + (i3 - u4) / 2 + n2.margin + s2.top) / d4, m4 = "scale(" + d4 + ") translate3d(" + E2 + "px, " + k3 + "px, 0)";
          t2.zoomed.style.transform = m4, t2.zoomedHd && (t2.zoomedHd.style.transform = m4);
        };
        return new h2(function(e2) {
          if (d3 && i2.indexOf(d3) === -1) {
            e2(o2);
            return;
          }
          var h3, m4, f3, g3, v3 = function n3() {
            c2 = false, t2.zoomed.removeEventListener("transitionend", n3), t2.original.dispatchEvent(s("medium-zoom:opened", { detail: { zoom: o2 } })), e2(o2);
          };
          if (t2.zoomed) {
            e2(o2);
            return;
          }
          if (d3)
            t2.original = d3;
          else if (i2.length > 0)
            m4 = i2, t2.original = m4[0];
          else {
            e2(o2);
            return;
          }
          t2.original.dispatchEvent(s("medium-zoom:open", { detail: { zoom: o2 } })), p2 = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0, c2 = true, t2.zoomed = Y(t2.original), document.body.appendChild(l2), n2.template && (f3 = a(n2.template) ? n2.template : document.querySelector(n2.template), t2.template = document.createElement("div"), t2.template.appendChild(f3.content.cloneNode(true)), document.body.appendChild(t2.template)), document.body.appendChild(t2.zoomed), window.requestAnimationFrame(function() {
            document.body.classList.add("medium-zoom--opened");
          }), t2.original.classList.add("medium-zoom-image--hidden"), t2.zoomed.classList.add("medium-zoom-image--opened"), t2.zoomed.addEventListener("click", r2), t2.zoomed.addEventListener("transitionend", v3), t2.original.getAttribute("data-zoom-src") ? (t2.zoomedHd = t2.zoomed.cloneNode(), t2.zoomedHd.removeAttribute("srcset"), t2.zoomedHd.removeAttribute("sizes"), t2.zoomedHd.src = t2.zoomed.getAttribute("data-zoom-src"), t2.zoomedHd.onerror = function() {
            clearInterval(h3), console.warn("Unable to reach the zoom image target " + t2.zoomedHd.src), t2.zoomedHd = null, u3();
          }, h3 = setInterval(function() {
            t2.zoomedHd.complete && (clearInterval(h3), t2.zoomedHd.classList.add("medium-zoom-image--opened"), t2.zoomedHd.addEventListener("click", r2), document.body.appendChild(t2.zoomedHd), u3());
          }, 10)) : t2.original.hasAttribute("srcset") ? (t2.zoomedHd = t2.zoomed.cloneNode(), t2.zoomedHd.removeAttribute("sizes"), t2.zoomedHd.removeAttribute("loading"), g3 = t2.zoomedHd.addEventListener("load", function() {
            t2.zoomedHd.removeEventListener("load", g3), t2.zoomedHd.classList.add("medium-zoom-image--opened"), t2.zoomedHd.addEventListener("click", r2), document.body.appendChild(t2.zoomedHd), u3();
          })) : u3();
        });
      }, r2 = function() {
        return new h2(function(e2) {
          if (c2 || !t2.original) {
            e2(o2);
            return;
          }
          var n3 = function n4() {
            t2.original.classList.remove("medium-zoom-image--hidden"), document.body.removeChild(t2.zoomed), t2.zoomedHd && document.body.removeChild(t2.zoomedHd), document.body.removeChild(l2), t2.zoomed.classList.remove("medium-zoom-image--opened"), t2.template && document.body.removeChild(t2.template), c2 = false, t2.zoomed.removeEventListener("transitionend", n4), t2.original.dispatchEvent(s("medium-zoom:closed", { detail: { zoom: o2 } })), t2.original = null, t2.zoomed = null, t2.zoomedHd = null, t2.template = null, e2(o2);
          };
          c2 = true, document.body.classList.remove("medium-zoom--opened"), t2.zoomed.style.transform = "", t2.zoomedHd && (t2.zoomedHd.style.transform = ""), t2.template && (t2.template.style.transition = "opacity 150ms", t2.template.style.opacity = 0), t2.original.dispatchEvent(s("medium-zoom:close", { detail: { zoom: o2 } })), t2.zoomed.addEventListener("transitionend", n3);
        });
      }, f2 = function() {
        var e2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n3 = e2.target;
        return t2.original ? r2() : g2({ target: n3 });
      }, j2 = function() {
        return n2;
      }, y2 = function() {
        return i2;
      }, _2 = function() {
        return t2.original;
      }, i2 = [], u2 = [], c2 = false, p2 = 0, n2 = M2, t2 = { original: null, zoomed: null, zoomedHd: null, template: null };
      return Object.prototype.toString.call(d2) === "[object Object]" ? n2 = d2 : (d2 || typeof d2 == "string") && m2(d2), n2 = e({ margin: 0, background: "#fff", scrollOffset: 40, container: null, template: null }, n2), l2 = K(n2.background), document.addEventListener("click", S2), document.addEventListener("keyup", k2), document.addEventListener("scroll", A2), window.addEventListener("resize", r2), o2 = { open: g2, close: r2, toggle: f2, update: C2, clone: x2, attach: m2, detach: w2, on: b2, off: v2, getOptions: j2, getImages: y2, getZoomedImage: _2 }, o2;
    };
    function q(n2, s2) {
      s2 === void 0 && (s2 = {});
      var e2, t2, o2 = s2.insertAt;
      if (!n2 || typeof document == "undefined")
        return;
      t2 = document.head || document.getElementsByTagName("head")[0], e2 = document.createElement("style"), e2.type = "text/css", o2 === "top" ? t2.firstChild ? t2.insertBefore(e2, t2.firstChild) : t2.appendChild(e2) : t2.appendChild(e2), e2.styleSheet ? e2.styleSheet.cssText = n2 : e2.appendChild(document.createTextNode(n2));
    }
    M = ".medium-zoom-overlay{position:fixed;top:0;right:0;bottom:0;left:0;opacity:0;transition:opacity .3s;will-change:opacity}.medium-zoom--opened .medium-zoom-overlay{cursor:pointer;cursor:zoom-out;opacity:1}.medium-zoom-image{cursor:pointer;cursor:zoom-in;transition:transform .3s cubic-bezier(.2,0,.2,1)!important}.medium-zoom-image--hidden{visibility:hidden}.medium-zoom-image--opened{position:relative;cursor:pointer;cursor:zoom-out;will-change:transform}", q(M), x = T, A = false, f = "production", p = false;
    function k(t2 = false) {
      let e2 = [];
      [].push.apply(e2, document.getElementsByClassName("language-mermaid"));
      for (let s2 = 0; s2 < e2.length; s2++) {
        let o2 = e2[s2], n2 = document.createElement("div");
        n2.innerHTML = o2.innerHTML, n2.classList.add("mermaid"), t2 && window.mermaid.mermaidAPI.render(`mermaid-${s2}`, n2.textContent, function(e3) {
          n2.innerHTML = e3;
        }), o2.parentNode.replaceWith(n2);
      }
      console.debug(`Processed ${e2.length} Mermaid code blocks`);
    }
    function z(e2, s2) {
      const t2 = e2.getBoundingClientRect(), o2 = { height: e2.clientHeight, width: e2.clientWidth }, n2 = s2.getBoundingClientRect(), i2 = n2.top >= t2.top && n2.bottom <= t2.top + o2.height;
      i2 || (e2.scrollTop = n2.top + e2.scrollTop - t2.top);
    }
    function C(e2, s2 = 600) {
      e2.style.display = "", e2.style.opacity = "0";
      let n2 = +new Date(), t2 = function() {
        e2.style.opacity = (+e2.style.opacity + (new Date() - n2) / s2).toString(), n2 = +new Date(), +e2.style.opacity < 1 && (window.requestAnimationFrame && requestAnimationFrame(t2) || setTimeout(t2, 16));
      };
      t2();
    }
    t = document.body;
    function _() {
      return parseInt(localStorage.getItem("wcTheme") || 2);
    }
    function c() {
      return Boolean(window.wc.darkLightEnabled);
    }
    function W() {
      if (!c())
        return console.debug("User theming disabled."), { isDarkTheme: window.wc.isSiteThemeDark, themeMode: window.wc.isSiteThemeDark ? 1 : 0 };
      console.debug("User theming enabled.");
      let e2, n2 = _();
      switch (console.debug(`User's theme variation: ${n2}`), n2) {
        case 0:
          e2 = false;
          break;
        case 1:
          e2 = true;
          break;
        default:
          window.matchMedia("(prefers-color-scheme: dark)").matches ? e2 = true : window.matchMedia("(prefers-color-scheme: light)").matches ? e2 = false : e2 = window.wc.isSiteThemeDark;
          break;
      }
      return e2 && !t.classList.contains("dark") ? (console.debug("Applying Wowchemy dark theme"), document.body.classList.add("dark")) : !e2 && t.classList.contains("dark") && (console.debug("Applying Wowchemy light theme"), document.body.classList.remove("dark")), { isDarkTheme: e2, themeMode: n2 };
    }
    function j(t2) {
      if (!c()) {
        console.debug("Cannot change theme - user theming disabled.");
        return;
      }
      let e2;
      switch (t2) {
        case 0:
          localStorage.setItem("wcTheme", "0"), e2 = false, console.debug("User changed theme variation to Light.");
          break;
        case 1:
          localStorage.setItem("wcTheme", "1"), e2 = true, console.debug("User changed theme variation to Dark.");
          break;
        default:
          localStorage.setItem("wcTheme", "2"), window.matchMedia("(prefers-color-scheme: dark)").matches ? e2 = true : window.matchMedia("(prefers-color-scheme: light)").matches ? e2 = false : e2 = window.wc.isSiteThemeDark, console.debug("User changed theme variation to Auto.");
          break;
      }
      b(e2, t2);
    }
    function X(s2) {
      let e2 = document.querySelector(".js-set-theme-light"), t2 = document.querySelector(".js-set-theme-dark"), n2 = document.querySelector(".js-set-theme-auto");
      if (e2 === null)
        return;
      switch (s2) {
        case 0:
          e2.classList.add("dropdown-item-active"), t2.classList.remove("dropdown-item-active"), n2.classList.remove("dropdown-item-active");
          break;
        case 1:
          e2.classList.remove("dropdown-item-active"), t2.classList.add("dropdown-item-active"), n2.classList.remove("dropdown-item-active");
          break;
        default:
          e2.classList.remove("dropdown-item-active"), t2.classList.remove("dropdown-item-active"), n2.classList.add("dropdown-item-active");
          break;
      }
    }
    function b(e2, r2 = 2, n2 = false) {
      const s2 = document.querySelector("link[title=hl-light]"), o2 = document.querySelector("link[title=hl-dark]"), i2 = s2 !== null || o2 !== null, a2 = document.querySelector("script[title=mermaid]") !== null;
      X(r2);
      const c2 = new CustomEvent("wcThemeChange", { detail: { isDarkTheme: () => e2 } });
      if (document.dispatchEvent(c2), !n2 && (e2 === false && !t.classList.contains("dark") || e2 === true && t.classList.contains("dark")))
        return;
      e2 === false ? (n2 || (Object.assign(document.body.style, { opacity: 0, visibility: "visible" }), C(document.body, 600)), t.classList.remove("dark"), i2 && (console.debug("Setting HLJS theme to light"), s2 && (s2.disabled = false), o2 && (o2.disabled = true)), a2 && (console.debug("Initializing Mermaid with light theme"), n2 ? (window.mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" }), k(true)) : location.reload())) : e2 === true && (n2 || (Object.assign(document.body.style, { opacity: 0, visibility: "visible" }), C(document.body, 600)), t.classList.add("dark"), i2 && (console.debug("Setting HLJS theme to dark"), s2 && (s2.disabled = true), o2 && (o2.disabled = false)), a2 && (console.debug("Initializing Mermaid with dark theme"), n2 ? (window.mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" }), k(true)) : location.reload()));
    }
    function V(n2) {
      if (!c())
        return;
      const s2 = n2.matches;
      console.debug(`OS dark mode preference changed to ${s2 ? "\u{1F312} on" : "\u2600\uFE0F off"}.`);
      let t2 = _(), e2;
      t2 === 2 && (window.matchMedia("(prefers-color-scheme: dark)").matches ? e2 = true : window.matchMedia("(prefers-color-scheme: light)").matches ? e2 = false : e2 = window.wc.isSiteThemeDark, b(e2, t2));
    }
    console.debug(`Environment: ${f}`);
    function g() {
      let t2 = $("#navbar-main"), e2 = t2.outerHeight();
      return console.debug("Navbar height: " + e2), e2;
    }
    function m(e2, t2 = 0) {
      if (e2 = typeof e2 == "undefined" || typeof e2 == "object" ? decodeURIComponent(window.location.hash) : e2, $(e2).length) {
        e2 = "#" + $.escapeSelector(e2.substring(1));
        let n2 = Math.ceil($(e2).offset().top - g());
        $("body").addClass("scrolling"), $("html, body").animate({ scrollTop: n2 }, t2, function() {
          $("body").removeClass("scrolling");
        });
      } else
        console.debug("Cannot scroll to target `#" + e2 + "`. ID not found!");
    }
    function S() {
      let e2 = $("body"), t2 = e2.data("bs.scrollspy");
      t2 && (t2._config.offset = g(), e2.data("bs.scrollspy", t2), e2.scrollspy("refresh"));
    }
    function B() {
      if (window.history.replaceState) {
        let e2 = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
        window.history.replaceState({ path: e2 }, "", e2);
      }
    }
    if (window.addEventListener("hashchange", m), $("#navbar-main li.nav-item a.nav-link, .js-scroll").on("click", function(t2) {
      let e2 = this.hash;
      if (this.pathname === window.location.pathname && e2 && $(e2).length && $(".js-widget-page").length > 0) {
        t2.preventDefault();
        let n2 = Math.ceil($(e2).offset().top - g());
        $("html, body").animate({ scrollTop: n2 }, 800);
      }
    }), $(document).on("click", ".navbar-collapse.show", function(e2) {
      let t2 = $(e2.target).is("a") ? $(e2.target) : $(e2.target).parent();
      t2.is("a") && t2.attr("class") != "dropdown-toggle" && $(this).collapse("hide");
    }), o = {}, n = $("#container-publications"), n.length) {
      n.isotope({ itemSelector: ".isotope-item", percentPosition: true, masonry: { columnWidth: ".grid-sizer" }, filter: function() {
        let e3 = $(this), t2 = !l || e3.text().match(l), n2 = !r || e3.is(r);
        return t2 && n2;
      } });
      let e2 = $(".filter-search").keyup(N(function() {
        l = new RegExp(e2.val(), "gi"), n.isotope();
      }));
      $(".pub-filters").on("change", function() {
        let t2 = $(this), e3 = t2[0].getAttribute("data-filter-group");
        if (o[e3] = this.value, r = D(o), n.isotope(), e3 === "pubtype") {
          let e4 = $(this).val();
          e4.substr(0, 9) === ".pubtype-" ? window.location.hash = e4.substr(9) : window.location.hash = "";
        }
      });
    }
    function N(n2, e2) {
      let t2;
      return e2 = e2 || 100, function() {
        clearTimeout(t2);
        let s2 = arguments, o2 = this;
        function i2() {
          n2.apply(o2, s2);
        }
        t2 = setTimeout(i2, e2);
      };
    }
    function D(e2) {
      let t2 = "";
      for (let n2 in e2)
        t2 += e2[n2];
      return t2;
    }
    function P() {
      if (!n.length)
        return;
      let e2 = window.location.hash.replace("#", ""), t2 = "*";
      e2 != "" && !isNaN(e2) && (t2 = ".pubtype-" + e2);
      let s2 = "pubtype";
      o[s2] = t2, r = D(o), n.isotope(), $(".pubtype-select").val(t2);
    }
    function H() {
      if ($("#map").length) {
        let o2 = $("#map-provider").val(), e2 = $("#map-lat").val(), t2 = $("#map-lng").val(), n2 = parseInt($("#map-zoom").val()), s2 = $("#map-dir").val(), i2 = $("#map-api-key").val();
        if (o2 === "google") {
          let o3 = new GMaps({ div: "#map", lat: e2, lng: t2, zoom: n2, zoomControl: true, zoomControlOpt: { style: "SMALL", position: "TOP_LEFT" }, streetViewControl: false, mapTypeControl: false, gestureHandling: "cooperative" });
          o3.addMarker({ lat: e2, lng: t2, click: function() {
            let n3 = "https://www.google.com/maps/place/" + encodeURIComponent(s2) + "/@" + e2 + "," + t2 + "/";
            window.open(n3, "_blank");
          }, title: s2 });
        } else {
          let a2 = new L.map("map").setView([e2, t2], n2);
          o2 === "mapbox" && i2.length ? L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", { attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery \xA9 <a href="http://mapbox.com">Mapbox</a>', tileSize: 512, maxZoom: 18, zoomOffset: -1, id: "mapbox/streets-v11", accessToken: i2 }).addTo(a2) : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(a2);
          let r2 = L.marker([e2, t2]).addTo(a2), c2 = e2 + "," + t2 + "#map=" + n2 + "/" + e2 + "/" + t2 + "&layers=N";
          r2.bindPopup(s2 + '<p><a href="https://www.openstreetmap.org/directions?engine=osrm_car&route=' + c2 + '">Routing via OpenStreetMap</a></p>');
        }
      }
    }
    function I(e2, t2) {
      f === "production" && $.getJSON("https://api.github.com/repos/" + t2 + "/tags").done(function(t3) {
        let n2 = t3[0];
        $(e2).append(" " + n2.name);
      }).fail(function(s2, e3, t3) {
        let n2 = e3 + ", " + t3;
        console.log("Request Failed: " + n2);
      });
    }
    function u() {
      $("body").hasClass("searching") ? ($("[id=search-query]").blur(), $("body").removeClass("searching compensate-for-scrollbar"), B(), $("#fancybox-style-noscroll").remove()) : (!$("#fancybox-style-noscroll").length && document.body.scrollHeight > window.innerHeight && ($("head").append('<style id="fancybox-style-noscroll">.compensate-for-scrollbar{margin-right:' + (window.innerWidth - document.documentElement.clientWidth) + "px;}</style>"), $("body").addClass("compensate-for-scrollbar")), $("body").addClass("searching"), $(".search-results").css({ opacity: 0, visibility: "visible" }).animate({ opacity: 1 }, 200), $("#search-query").focus());
    }
    function v() {
      $(".carousel").each(function() {
        let e2 = $(".carousel-item", this);
        e2.css("min-height", 0);
        let t2 = Math.max.apply(null, e2.map(function() {
          return $(this).outerHeight();
        }).get());
        e2.css("min-height", t2 + "px");
      });
    }
    function R() {
      $("#TableOfContents").addClass("nav flex-column"), $("#TableOfContents li").addClass("nav-item"), $("#TableOfContents li a").addClass("nav-link"), $("input[type='checkbox'][disabled]").parents("ul").addClass("task-list");
    }
    function U(e2) {
      return Array.prototype.filter.call(e2.parentNode.children, function(t2) {
        return t2 !== e2;
      });
    }
    $(document).ready(function() {
      R();
      let { isDarkTheme: n2, themeMode: s2 } = W();
      b(n2, s2, true), A && hljs.initHighlighting();
      let e2 = document.querySelector(".docs-links .active"), t2 = document.querySelector(".docs-links");
      e2 && t2 && z(t2, e2);
    }), $(window).on("load", function() {
      S();
      let n2 = document.querySelectorAll(".projects-container"), a2 = n2.length;
      window.location.hash && a2 === 0 && m(decodeURIComponent(window.location.hash), 0);
      let s2 = document.querySelector(".docs-toc .nav-link.active"), o2 = document.querySelector(".docs-toc");
      s2 && o2 && z(o2, s2);
      let t2 = {};
      document.body.classList.contains("dark") ? t2.background = "rgba(0,0,0,0.9)" : t2.background = "rgba(255,255,255,0.9)", x("[data-zoomable]", t2);
      let i2 = 0;
      n2.forEach(function(e3, a3) {
        console.debug(`Loading Isotope instance ${a3}`);
        let o3, t3 = e3.closest("section"), n3 = "";
        t3.querySelector(".isotope").classList.contains("js-layout-row") ? n3 = "fitRows" : n3 = "masonry";
        let i3 = t3.querySelector(".default-project-filter"), s3 = "*";
        i3 !== null && (s3 = i3.textContent), console.debug(`Default Isotope filter: ${s3}`), imagesLoaded(e3, function() {
          o3 = new Isotope(e3, { itemSelector: ".isotope-item", layoutMode: n3, masonry: { gutter: 20 }, filter: s3 });
          let i4 = t3.querySelectorAll(".project-filters a");
          i4.forEach((e4) => e4.addEventListener("click", (n4) => {
            n4.preventDefault();
            let t4 = e4.getAttribute("data-filter");
            console.debug(`Updating Isotope filter to ${t4}`), o3.arrange({ filter: t4 }), e4.classList.remove("active"), e4.classList.add("active");
            let s4 = U(e4);
            s4.forEach((e5) => {
              e5.classList.remove("active"), e5.classList.remove("all");
            });
          })), r2();
        });
      });
      function r2() {
        i2++, i2 === a2 && (console.debug(`All Portfolio Isotope instances loaded.`), window.location.hash && m(decodeURIComponent(window.location.hash), 0));
      }
      $(".pub-filters-select") && P(), $(".js-cite-modal").click(function(n3) {
        n3.preventDefault();
        let e3 = $(this).attr("data-filename"), t3 = $("#modal");
        t3.find(".modal-body code").load(e3, function(s3, n4, t4) {
          if (n4 == "error") {
            let e4 = "Error: ";
            $("#modal-error").html(e4 + t4.status + " " + t4.statusText);
          } else
            $(".js-download-cite").attr("href", e3);
        }), t3.modal("show");
      }), $(".js-copy-cite").click(function(t3) {
        t3.preventDefault();
        let e3 = document.createRange(), n3 = document.querySelector("#modal .modal-body");
        e3.selectNode(n3), window.getSelection().addRange(e3);
        try {
          document.execCommand("copy");
        } catch (e4) {
          console.log("Error: citation copy failed.");
        }
        window.getSelection().removeRange(e3);
      }), H();
      let e2 = ".js-github-release";
      $(e2).length > 0 && I(e2, $(e2).data("repo")), document.addEventListener("keyup", (e3) => {
        if (e3.code === "Escape") {
          const e4 = document.body;
          e4.classList.contains("searching") && u();
        }
        if (e3.key === "/") {
          let t3 = document.hasFocus() && document.activeElement !== document.body && document.activeElement !== document.documentElement && document.activeElement || null, n3 = t3 instanceof HTMLInputElement || t3 instanceof HTMLTextAreaElement;
          p && !n3 && (e3.preventDefault(), u());
        }
      }), p && $(".js-search").click(function(e3) {
        e3.preventDefault(), u();
      }), $('[data-toggle="tooltip"]').tooltip();
    }), h = document.querySelector(".js-set-theme-light"), d = document.querySelector(".js-set-theme-dark"), y = document.querySelector(".js-set-theme-auto"), h && d && y && (h.addEventListener("click", (e2) => {
      e2.preventDefault(), j(0);
    }), d.addEventListener("click", (e2) => {
      e2.preventDefault(), j(1);
    }), y.addEventListener("click", (e2) => {
      e2.preventDefault(), j(2);
    })), F = window.matchMedia("(prefers-color-scheme: dark)"), F.addEventListener("change", (e2) => {
      V(e2);
    }), window.addEventListener("load", v), window.addEventListener("resize", v), window.addEventListener("orientationchange", v), $("body").on("mouseenter mouseleave", ".dropdown", function(n2) {
      var e2 = $(n2.target).closest(".dropdown"), t2 = $(".dropdown-menu", e2);
      e2.addClass("show"), t2.addClass("show"), setTimeout(function() {
        e2[e2.is(":hover") ? "addClass" : "removeClass"]("show"), t2[e2.is(":hover") ? "addClass" : "removeClass"]("show");
      }, 300);
    }), $(window).resize(function() {
      clearTimeout(w), w = setTimeout(S, 200);
    });
  })();
})();
/*! Copyright 2016-present George Cushen (https://georgecushen.com/) */
/*! License: https://github.com/wowchemy/wowchemy-hugo-modules/blob/main/LICENSE.md */
/*! Wowchemy v5.1.0 | https://wowchemy.com/ */
