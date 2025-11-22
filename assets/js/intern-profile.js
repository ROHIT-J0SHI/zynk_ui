// Profile page logic: load, validate basics, and save to mock API / localStorage

document.addEventListener("DOMContentLoaded", function () {
  var formEl = document.getElementById("intern-profile-form");
  var saveStatusEl = document.getElementById("profile-save-status");
  var topbarNameEl = document.getElementById("profile-topbar-name");
  var topbarAvatarEl = document.getElementById("profile-topbar-avatar");
  var topbarPeriodEl = document.getElementById("profile-topbar-period");

  if (!formEl) return;

  // Map of field IDs to profile keys
  var fields = {
    name: document.getElementById("profile-name"),
    email: document.getElementById("profile-email"),
    role: document.getElementById("profile-role"),
    manager: document.getElementById("profile-manager"),
    internshipStart: document.getElementById("profile-start"),
    internshipEnd: document.getElementById("profile-end"),
    stipendPerMonth: document.getElementById("profile-stipend"),
    pan: document.getElementById("profile-pan"),
    aadhaarMasked: document.getElementById("profile-aadhaar"),
    bankAccountLast4: document.getElementById("profile-bank"),
    address: document.getElementById("profile-address"),
  };

  apiGet("/intern/profile")
    .then(function (profile) {
      Object.keys(fields).forEach(function (key) {
        var input = fields[key];
        if (!input) return;
        var value = profile[key];
        if (value === undefined || value === null) return;
        if (key === "stipendPerMonth") {
          input.value = String(value);
        } else {
          input.value = value;
        }
      });

      var name = profile.name || "Intern";
      if (topbarNameEl) topbarNameEl.textContent = name;
      if (topbarAvatarEl) {
        var initials = name
          .split(" ")
          .map(function (n) {
            return n[0];
          })
          .join("")
          .slice(0, 2)
          .toUpperCase();
        topbarAvatarEl.textContent = initials || "IN";
      }
      if (topbarPeriodEl) {
        topbarPeriodEl.textContent =
          formatDateHuman(profile.internshipStart) +
          " – " +
          formatDateHuman(profile.internshipEnd);
      }
    })
    .catch(function (err) {
      console.error("Failed to load profile", err);
    });

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();

    var payload = {};
    Object.keys(fields).forEach(function (key) {
      var input = fields[key];
      if (!input) return;
      var value = input.value.trim();
      if (!value) return;
      if (key === "stipendPerMonth") {
        payload[key] = Number(value) || 0;
      } else {
        payload[key] = value;
      }
    });

    // basic PAN validation messaging
    var panInput = fields.pan;
    if (panInput && panInput.value && !panInput.checkValidity()) {
      panInput.reportValidity();
      return;
    }

    apiPost("/intern/profile", payload)
      .then(function () {
        if (saveStatusEl) {
          saveStatusEl.textContent = "Profile saved locally.";
          saveStatusEl.className =
            "text-[11px] text-emerald-600 transition-colors";
          setTimeout(function () {
            saveStatusEl.textContent =
              "Changes are stored locally for now. Backend wiring coming soon.";
            saveStatusEl.className = "text-[11px] text-slate-500";
          }, 2500);
        }
      })
      .catch(function () {
        if (saveStatusEl) {
          saveStatusEl.textContent = "Could not save profile. Try again.";
          saveStatusEl.className = "text-[11px] text-red-500";
        }
      });
  });
});


