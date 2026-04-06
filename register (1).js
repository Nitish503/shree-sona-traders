document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const output = document.getElementById("register-output");
  const customerName = document.getElementById("customer-name");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    customerName.textContent = name;

    output.classList.remove("hidden");
    form.reset();
  });
});