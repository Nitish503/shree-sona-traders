async function sharePDF(event) {

  // 🔐 Check library
  if (typeof html2pdf === "undefined") {
    alert("PDF service not loaded. Please refresh.");
    return;
  }

  const element = document.querySelector(".invoice");

   const opt = {
  margin: 5,
  filename: 'invoice.pdf',
  image: { type: 'jpeg', quality: 1 },
  html2canvas: { scale: 3, useCORS: true },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  pagebreak: { mode: ['avoid-all'] }
};

  const btn = event?.target;
  if (btn) {
    btn.innerText = "Generating...";
    btn.disabled = true;
  }

  try {

    // ✅ FIXED WAY (important)
    const pdf = await html2pdf()
      .from(element)
      .set(opt)
      .toPdf()
      .get('pdf');

    const pdfBlob = pdf.output('blob');

    const file = new File([pdfBlob], "invoice.pdf", {
      type: "application/pdf"
    });

    // 📱 Mobile share
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Invoice',
        text: 'Here is your invoice'
      });
    } else {
      // 💻 fallback download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = "invoice.pdf";
      link.click();
    }

  } catch (err) {
    console.error("Share failed:", err);
    alert("Sharing failed or cancelled");
  } finally {
    if (btn) {
      btn.innerText = "📤 Share PDF";
      btn.disabled = false;
    }
  }
}