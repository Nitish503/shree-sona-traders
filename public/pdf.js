async function sharePDF() {

  // 🔐 safety check
  if (typeof html2pdf === "undefined") {
    alert("PDF service not loaded. Please refresh.");
    return;
  }

  const element = document.querySelector(".invoice");

  const opt = {
  margin: 5,
  filename: 'invoice.pdf',
  image: { type: 'jpeg', quality: 1 },
  html2canvas: { scale: 2 },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
};

  const btn = event.target;
  btn.innerText = "Generating...";
  btn.disabled = true;

  try {
    const pdfBlob = await html2pdf()
      .from(element)
      .set(opt)
      .outputPdf('blob');

    const file = new File([pdfBlob], "invoice.pdf", {
      type: "application/pdf"
    });

    // 📱 Mobile share
    if (navigator.share) {
      await navigator.share({
        files: [file],
        title: 'Invoice',
        text: 'Here is your invoice'
      });
    } else {
      // 💻 Desktop fallback
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = "invoice.pdf";
      link.click();
    }

  } catch (err) {
    console.log("Share cancelled or failed");
  } finally {
    btn.innerText = "📤 Share PDF";
    btn.disabled = false;
  }
}