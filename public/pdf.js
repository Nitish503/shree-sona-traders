async function sharePDF(event) {

  if (typeof html2pdf === "undefined") {
    alert("PDF service not loaded. Please refresh.");
    return;
  }

  const element = document.querySelector(".invoice");

  if (!element) {
    alert("Invoice not found");
    return;
  }

  // ✅ APPLY PDF MODE
  element.classList.add("pdf-mode");

  // 🔥 WAIT FOR CSS TO APPLY (VERY IMPORTANT)
  await new Promise(resolve => setTimeout(resolve, 300));

  element.style.transform = "scale(1)";
  element.style.zoom = "1";

  const opt = {
    margin: 5,
    filename: 'invoice.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
      scale: 3,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy']
    }
  };

  const btn = event?.target;
  if (btn) {
    btn.innerText = "Generating...";
    btn.disabled = true;
  }

  try {

    const worker = html2pdf().from(element).set(opt);
    const pdf = await worker.toPdf().get('pdf');

    const pdfBlob = pdf.output('blob');

    const file = new File([pdfBlob], "invoice.pdf", {
      type: "application/pdf"
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Invoice',
        text: 'Here is your invoice'
      });
    } else {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = "invoice.pdf";
      link.click();
    }

  } catch (err) {
    console.error("Share failed:", err);
    alert("Sharing failed or cancelled");
  } finally {

    element.classList.remove("pdf-mode");
    element.style.transform = "";
    element.style.zoom = "";

    if (btn) {
      btn.innerText = "📤 Share PDF";
      btn.disabled = false;
    }
  }
}