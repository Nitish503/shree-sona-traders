document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const output = document.getElementById("register-output");
  const customerName = document.getElementById("customer-name");
  const messageBox = document.getElementById("register-message");

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

        messageBox.textContent = "✅ Registered successfully!";
        messageBox.className = "success";
        messageBox.classList.remove("hidden");

        form.reset();
      } else {
        messageBox.textContent = "❌ Registration failed. Please try again.";
        messageBox.className = "error";
        messageBox.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error:", err);
      messageBox.textContent = "❌ Server error. Please try again later.";
      messageBox.className = "error";
      messageBox.classList.remove("hidden");
    }
  });
});