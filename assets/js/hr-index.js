// Unified login page for Intern and Admin on hr-index.html

document.addEventListener("DOMContentLoaded", function () {
  var roleInternBtn = document.getElementById("role-intern");
  var roleAdminBtn = document.getElementById("role-admin");
  var loginBtn = document.getElementById("login-btn");
  var emailInput = document.getElementById("login-email");
  var passwordInput = document.getElementById("login-password");

  if (!loginBtn || !emailInput || !passwordInput) return;

  var currentRole = "intern";

  function setRole(role) {
    currentRole = role;
    if (!roleInternBtn || !roleAdminBtn) return;
    if (role === "intern") {
      roleInternBtn.classList.add("bg-white", "text-slate-900", "font-semibold");
      roleInternBtn.classList.remove("text-slate-600");
      roleAdminBtn.classList.remove("bg-white", "text-slate-900", "font-semibold");
      roleAdminBtn.classList.add("text-slate-600");
    } else {
      roleAdminBtn.classList.add("bg-white", "text-slate-900", "font-semibold");
      roleAdminBtn.classList.remove("text-slate-600");
      roleInternBtn.classList.remove(
        "bg-white",
        "text-slate-900",
        "font-semibold"
      );
      roleInternBtn.classList.add("text-slate-600");
    }
  }

  if (roleInternBtn) {
    roleInternBtn.addEventListener("click", function () {
      setRole("intern");
    });
  }
  if (roleAdminBtn) {
    roleAdminBtn.addEventListener("click", function () {
      setRole("admin");
    });
  }

  setRole("intern");

  loginBtn.addEventListener("click", function () {
    var email = emailInput.value.trim().toLowerCase();
    var password = passwordInput.value.trim();
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    if (!password) {
      alert("Please enter your password (any value for now).");
      return;
    }

    if (currentRole === "intern") {
      apiGet("/hr/interns")
        .then(function (interns) {
          interns = interns || [];
          var match = interns.find(function (i) {
            return (i.email || "").toLowerCase() === email;
          });
          if (!match) {
            alert(
              "This email is not registered as an intern yet. Please contact HR."
            );
            return;
          }
          setCurrentIntern({
            id: match.id,
            name: match.name,
            email: match.email,
            role: match.role,
            manager: match.manager,
            internshipStart: match.internshipStart,
            internshipEnd: match.internshipEnd,
            stipendPerMonth: match.stipendPerMonth,
          });
          window.location.href = "intern-dashboard.html";
        })
        .catch(function () {
          alert(
            "Could not validate email against mock HR data. Please try again."
          );
        });
    } else {
      // Admin login: for now, accept any email/password and set HR session
      setCurrentHr({
        id: "hr-001",
        name: "HR Admin",
        role: "HR",
        email: email,
      });
      window.location.href = "hr-dashboard.html";
    }
  });
});


