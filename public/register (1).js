document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const output = document.getElementById("register-output");
  const customerName = document.getElementById("customer-name");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;

    try {
      const res = await fetch("/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address })
      });

      if (res.ok) {
        customerName.textContent = name;
        output.classList.remove("hidden");
        form.reset();
      } else {
        alert("Error registering customer. Please try again.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Server error. Please try again later.");
    }
  });
});