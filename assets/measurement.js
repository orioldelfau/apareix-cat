(function () {
  var config = window.APAREIX_MEASUREMENT || {};
  var analyticsId = config.googleAnalyticsMeasurementId || "";
  var adsId = config.googleAdsConversionId || "";
  var conversionLabel = config.googleAdsConversionLabel || "";

  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-conversion]");
    if (!target || !window.gtag) return;

    var eventName = target.getAttribute("data-conversion") || "lead_click";
    var eventPayload = {
      event_category: "lead",
      event_label: target.textContent.trim(),
      page_location: window.location.href
    };

    window.gtag("event", eventName, eventPayload);

    if (adsId && conversionLabel) {
      window.gtag("event", "conversion", {
        send_to: adsId + "/" + conversionLabel
      });
    }
  });

  if (analyticsId) {
    window.gtag("event", "apareix_measurement_loaded", {
      event_category: "diagnostic"
    });
  }
})();
