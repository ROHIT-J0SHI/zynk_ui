// Mock login: interns can only log in with emails registered by HR

document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("enter-portal-btn");
  var emailInput = document.getElementById("login-email");
  var passwordInput = document.getElementById("login-password");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    var password = passwordInput ? passwordInput.value.trim() : "";
    if (!email) {
      alert("Please enter your registered intern email.");
      return;
    }
    if (!password) {
      alert("Please enter your password (any value for now).");
      return;
    }

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
  });
});


