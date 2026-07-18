import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const snippet = `(function () {
  "use strict";

  if (window.__fastlaneAnalyticsLoaded) {
    return;
  }

  window.__fastlaneAnalyticsLoaded = true;

  var script = document.currentScript;
  var scriptUrl = null;

  try {
    scriptUrl = script && script.src ? new URL(script.src) : null;
  } catch (_error) {
    scriptUrl = null;
  }

  var existing = window.FastlaneAnalytics || {};
  var endpoint =
    existing.endpoint ||
    readAttribute("data-endpoint") ||
    (scriptUrl ? new URL("/api/events", scriptUrl.href).toString() : "/api/events");
  var workspaceKey =
    existing.workspaceKey ||
    readAttribute("data-workspace-key") ||
    (scriptUrl ? scriptUrl.searchParams.get("key") : "");
  var signupSelector =
    existing.signupSelector ||
    readAttribute("data-signup-selector") ||
    "[data-fastlane-signup], [data-fastlane-track='signup']";
  var signupDomEvent =
    existing.signupDomEvent ||
    readAttribute("data-signup-dom-event") ||
    "fastlane:signup";
  var lastTrackedUrl = "";
  var lastSignupAt = 0;

  window.FastlaneAnalytics = merge(existing, {
    track: track,
    trackSignup: trackSignup,
    workspaceKey: workspaceKey,
  });

  onReady(function () {
    capturePageView();
    bindSignupListeners();
    bindHistoryListeners();
  });

  function readAttribute(name) {
    return script && script.getAttribute ? script.getAttribute(name) : "";
  }

  function merge(target, source) {
    var output = target || {};

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        output[key] = source[key];
      }
    }

    return output;
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function bindHistoryListeners() {
    if (!window.history) {
      return;
    }

    wrapHistoryMethod("pushState");
    wrapHistoryMethod("replaceState");
    window.addEventListener("popstate", function () {
      setTimeout(capturePageView, 0);
    });
  }

  function wrapHistoryMethod(methodName) {
    var original = window.history[methodName];

    if (typeof original !== "function") {
      return;
    }

    window.history[methodName] = function () {
      var result = original.apply(this, arguments);
      setTimeout(capturePageView, 0);
      return result;
    };
  }

  function bindSignupListeners() {
    if (signupSelector) {
      document.addEventListener(
        "click",
        function (event) {
          var target = closestMatch(event.target, signupSelector);

          if (target) {
            trackSignup({ trigger: "click" });
          }
        },
        true,
      );

      document.addEventListener(
        "submit",
        function (event) {
          var target = closestMatch(event.target, signupSelector);

          if (target) {
            trackSignup({ trigger: "submit" });
          }
        },
        true,
      );
    }

    if (signupDomEvent) {
      document.addEventListener(signupDomEvent, function (event) {
        trackSignup({
          trigger: "dom_event",
          eventType: event.type,
        });
      });
    }
  }

  function closestMatch(target, selector) {
    var node = target;

    while (node && node !== document.documentElement) {
      if (node.matches && node.matches(selector)) {
        return node;
      }

      node = node.parentElement;
    }

    return null;
  }

  function capturePageView() {
    if (window.location.href === lastTrackedUrl) {
      return;
    }

    lastTrackedUrl = window.location.href;
    track("page_view", {
      title: document.title || "",
    });
  }

  function trackSignup(metadata) {
    var now = Date.now();

    if (now - lastSignupAt < 750) {
      return;
    }

    lastSignupAt = now;
    track("signup", metadata || {});
  }

  function track(eventName, metadata) {
    if (!workspaceKey || !eventName) {
      return;
    }

    var attribution = readAttribution();
    var payload = {
      workspaceKey: workspaceKey,
      eventName: eventName,
      url: window.location.href,
      referrer: document.referrer || "",
      visitorId: readVisitorId(),
      utmSource: attribution.utmSource,
      utmContent: attribution.utmContent,
      metadata: metadata || {},
    };

    try {
      window.fetch(endpoint, {
        body: JSON.stringify(payload),
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        method: "POST",
        mode: "cors",
      }).catch(function () {});
    } catch (_error) {}
  }

  function readAttribution() {
    var utmSource = "";
    var utmContent = "";

    try {
      var url = new URL(window.location.href);
      utmSource = url.searchParams.get("utm_source") || "";
      utmContent = url.searchParams.get("utm_content") || "";
    } catch (_error) {}

    if (utmSource || utmContent) {
      writeStorage("fl_attribution", JSON.stringify({
        utmSource: utmSource,
        utmContent: utmContent,
      }));
      return {
        utmSource: utmSource,
        utmContent: utmContent,
      };
    }

    try {
      var stored = JSON.parse(readStorage("fl_attribution") || "{}");
      return {
        utmSource: stored.utmSource || "",
        utmContent: stored.utmContent || "",
      };
    } catch (_error) {
      return {
        utmSource: "",
        utmContent: "",
      };
    }
  }

  function readVisitorId() {
    var existingVisitorId = readStorage("fl_visitor_id");

    if (existingVisitorId) {
      return existingVisitorId;
    }

    var generated = "v_" + Date.now().toString(36) + "_" + randomToken();
    writeStorage("fl_visitor_id", generated);
    return generated;
  }

  function randomToken() {
    if (window.crypto && window.crypto.getRandomValues) {
      var bytes = new Uint32Array(2);
      window.crypto.getRandomValues(bytes);
      return bytes[0].toString(36) + bytes[1].toString(36);
    }

    return Math.random().toString(36).slice(2);
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return "";
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {}
  }
})();`;

export function GET(_request: NextRequest) {
  return new Response(snippet, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
}
