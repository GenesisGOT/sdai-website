// SD AI Solutions — intercept the Framer contact form and POST to our backend.
// Maps Framer field names → our /api/v1/discovery/submit schema.
(function () {
  "use strict";

  var API = "https://api.sandiegoaisolutions.com/api/v1/discovery/submit";

  function findField(form, names) {
    for (var i = 0; i < names.length; i++) {
      var el = form.querySelector('[name="' + names[i] + '"]');
      if (el) return el;
    }
    return null;
  }

  function val(form, names) {
    var el = findField(form, names);
    return el ? (el.value || "").trim() : "";
  }

  function checkedRadio(form, name) {
    var el = form.querySelector('[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function showMessage(form, text, ok) {
    var box = form.querySelector(".sdai-form-msg");
    if (!box) {
      box = document.createElement("div");
      box.className = "sdai-form-msg";
      box.style.cssText = "margin-top:12px;padding:12px 16px;border-radius:10px;font-size:14px;font-family:inherit;text-align:center;";
      form.appendChild(box);
    }
    box.style.background = ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)";
    box.style.color = ok ? "#16a34a" : "#dc2626";
    box.textContent = text;
  }

  function handleSubmit(e) {
    var form = e.target;
    // Only intercept forms that have an Email field (the contact form)
    if (!findField(form, ["Email", "email"])) return;

    e.preventDefault();
    e.stopPropagation();

    // Honeypot — if the hidden anti-spam fields are filled, silently drop
    var hp = form.querySelector('[name="website"]');
    if (hp && hp.value) return;

    var payload = {
      full_name: val(form, ["Name", "name", "full_name"]),
      email: val(form, ["Email", "email"]),
      company_name: val(form, ["Location", "company", "company_name"]) || null,
      notes: val(form, ["Subject", "subject"]) || null,
      agent_types: checkedRadio(form, "Radio") || null,
      referral_source: "website contact form",
    };

    if (!payload.full_name || !payload.email) {
      showMessage(form, "Please fill in your name and email.", false);
      return;
    }

    var btn = form.querySelector('[type="submit"], button');
    var originalText = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function (data) {
        showMessage(form, (data && data.message) || "Thank you! We'll be in touch within 24 hours.", true);
        form.reset();
      })
      .catch(function () {
        showMessage(form, "Something went wrong. Please email contact@sandiegoaisolutions.com.", false);
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      });
  }

  // Capture phase so we run before Framer's own handler
  document.addEventListener("submit", handleSubmit, true);
})();
