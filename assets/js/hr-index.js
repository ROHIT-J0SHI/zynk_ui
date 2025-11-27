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
      // Real intern login against backend; falls back to mock lookup if backend fails
      fetch((window.API_BASE_URL || "http://localhost:1234/api") + "/auth/login/intern", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error("Invalid intern credentials");
          }
          return res.json();
        })
        .then(function (auth) {
          // Persist JWT for subsequent API calls
          if (typeof setAuthSession === "function") {
            setAuthSession(auth);
          }

          // Hydrate a simple current intern profile for the UI
          var profile = {
            id: auth.userId,
            name: auth.name || "Intern",
            email: auth.email || email,
          };
          setCurrentIntern(profile);

          window.location.href = "intern-dashboard.html";
        })
        .catch(function (err) {
          console.warn("Backend intern login failed, falling back to mock", err);
          // Fallback: previous mock behavior using HR intern directory
          apiGet("/hr/interns")
            .then(function (interns) {
              interns = interns || [];
              var match = interns.find(function (i) {
                return (i.email || "").toLowerCase() === email;
              });
              if (!match) {
                alert(
                  "Login failed. Either credentials are invalid or this email is not onboarded yet."
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
                "Could not log you in right now. Please check your credentials or try again later."
              );
            });
        });
    } else {
      // Real HR login against backend
      fetch((window.API_BASE_URL || "http://localhost:1234/api") + "/auth/login/hr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error("Invalid HR credentials");
          }
          return res.json();
        })
        .then(function (auth) {
          // Persist JWT for subsequent API calls
          if (typeof setAuthSession === "function") {
            setAuthSession(auth);
          }

          // Store basic HR profile for UI
          setCurrentHr({
            id: auth.userId,
            name: auth.name || "HR Manager",
            role: auth.role || "HR",
            email: auth.email || email,
          });
          window.location.href = "hr-dashboard.html";
        })
        .catch(function (err) {
          console.warn("Backend HR login failed", err);
          alert("Invalid HR credentials or backend unavailable. Please try again.");
        });
    }
  });
});


