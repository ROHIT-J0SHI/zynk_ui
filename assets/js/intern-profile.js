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
    panNumber: document.getElementById("profile-pan"),
    aadhaarNumber: document.getElementById("profile-aadhaar"),
    bankAccountNumber: document.getElementById("profile-bank"),
    bankIfscCode: document.getElementById("profile-ifsc"),
    bankName: document.getElementById("profile-bank-name"),
    bankBranch: document.getElementById("profile-bank-branch"),
    address: document.getElementById("profile-address"),
    phoneNumber: document.getElementById("profile-phone"),
  };

  apiGet("/intern/profile")
    .then(function (profile) {
      var kycVerified = !!profile.kycVerified;

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

      // HR-owned fields are always read-only for intern
      var hrOwnedKeys = [
        "name",
        "email",
        "role",
        "manager",
        "internshipStart",
        "internshipEnd",
        "stipendPerMonth",
      ];
      hrOwnedKeys.forEach(function (key) {
        var input = fields[key];
        if (!input) return;
        input.setAttribute("readonly", "readonly");
        input.classList.add("bg-slate-50", "cursor-not-allowed");
      });

      // KYC fields editable until HR verifies; then locked
      var kycKeys = [
        "panNumber",
        "aadhaarNumber",
        "bankAccountNumber",
        "bankIfscCode",
        "bankName",
        "bankBranch",
      ];
      kycKeys.forEach(function (key) {
        var input = fields[key];
        if (!input) return;
        if (kycVerified) {
          input.setAttribute("readonly", "readonly");
          input.classList.add("bg-slate-50", "cursor-not-allowed");
        } else {
          input.removeAttribute("readonly");
          input.classList.remove("bg-slate-50", "cursor-not-allowed");
        }
      });

      // Address/phone always editable
      ["address", "phoneNumber"].forEach(function (key) {
        var input = fields[key];
        if (!input) return;
        input.removeAttribute("readonly");
        input.classList.remove("bg-slate-50", "cursor-not-allowed");
      });
    })
    .catch(function (err) {
      console.error("Failed to load profile", err);
    });

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var payload = {};

    // Only send fields that intern is allowed to change
    ["panNumber",
      "aadhaarNumber",
      "bankAccountNumber",
      "bankIfscCode",
      "bankName",
      "bankBranch",
      "address",
      "phoneNumber"].forEach(function (key) {
      var input = fields[key];
      if (!input) return;
      var value = input.value.trim();
      if (value) {
        payload[key] = value;
      }
    });

    apiPost("/intern/profile", payload)
      .then(function () {
        if (saveStatusEl) {
          saveStatusEl.textContent =
            "Profile updated. HR will verify and lock KYC fields.";
          saveStatusEl.className =
            "text-[11px] text-emerald-600";
        }
      })
      .catch(function () {
        if (saveStatusEl) {
          saveStatusEl.textContent =
            "Could not update profile right now. Please try again.";
          saveStatusEl.className =
            "text-[11px] text-red-500";
        }
      });
  });
});


