// SD AI Solutions — intercept the contact form and POST to our backend.
// Maps form field names → /api/v1/discovery/submit schema.
(function () {
  "use strict";
  var API = "https://api.sandiegoaisolutions.com/api/v1/discovery/submit";

  function field(form, names) {
    for (var i = 0; i < names.length; i++) {
      var el = form.querySelector('[name="' + names[i] + '"]');
      if (el) return el;
    }
    return null;
  }
  function val(form, names) { var el = field(form, names); return el ? (el.value || "").trim() : ""; }
  function radio(form, name) { var el = form.querySelector('[name="' + name + '"]:checked'); return el ? el.value : ""; }

  function msg(form, text, ok) {
    var box = form.querySelector(".sdai-form-msg");
    if (!box) {
      box = document.createElement("div");
      box.className = "sdai-form-msg";
      box.style.cssText = "margin-top:14px;padding:12px 16px;border-radius:10px;font-size:14px;font-family:inherit;text-align:center;";
      form.appendChild(box);
    }
    box.style.background = ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)";
    box.style.color = ok ? "#16a34a" : "#dc2626";
    box.textContent = text;
  }

  function onSubmit(e) {
    var form = e.target;
    if (!field(form, ["Email", "email"])) return;  // only the contact form
    e.preventDefault();
    e.stopPropagation();

    var hp = form.querySelector('[name="website"]');
    if (hp && hp.value) return;  // honeypot

    var payload = {
      full_name: val(form, ["Name", "name", "full_name"]),
      email: val(form, ["Email", "email"]),
      company_name: val(form, ["Location", "company", "company_name"]) || null,
      notes: val(form, ["Subject", "subject", "Message", "message"]) || null,
      agent_types: radio(form, "Radio") || null,
      referral_source: "website contact form",
    };
    if (!payload.full_name || !payload.email) {
      msg(form, "Please fill in your name and email.", false);
      return;
    }

    var btn = form.querySelector('[type="submit"], button');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function (d) { msg(form, (d && d.message) || "Thank you! We'll be in touch within 24 hours.", true); form.reset(); })
      .catch(function () { msg(form, "Something went wrong. Please email contact@sandiegoaisolutions.com.", false); })
      .finally(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
  }

  document.addEventListener("submit", onSubmit, true);  // capture before Framer's handler
})();
