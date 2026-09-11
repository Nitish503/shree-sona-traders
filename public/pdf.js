// =====================
// PDF SHARE / SAVE
// =====================

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

  const btn = event?.target;

  if (btn) {
    btn.innerText = "Generating...";
    btn.disabled = true;
  }

  // APPLY PDF MODE
  element.classList.add("pdf-mode");

  // WAIT FOR CSS TO APPLY
  await new Promise(resolve => setTimeout(resolve, 300));

  element.style.transform = "scale(1)";
  element.style.zoom = "1";

  const opt = {
    margin: 5,
    filename: "invoice.pdf",
    image: {
      type: "jpeg",
      quality: 1
    },
    html2canvas: {
      scale: 3,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"]
    }
  };

  try {

    // =====================
    // GENERATE PDF
    // =====================

    const worker = html2pdf()
      .from(element)
      .set(opt);

    const pdf = await worker
      .toPdf()
      .get("pdf");

    const pdfBlob = pdf.output("blob");

    // =====================
    // ANDROID CAPACITOR
    // =====================

    if (
      window.Capacitor &&
      window.Capacitor.isNativePlatform() &&
      window.Capacitor.Plugins
    ) {

      const Filesystem = window.Capacitor.Plugins.Filesystem;
      const Share = window.Capacitor.Plugins.Share;

      if (!Filesystem || !Share) {
        throw new Error("Capacitor Share/FileSystem plugin not available");
      }

      // Convert PDF Blob to Base64
      const base64 = await blobToBase64(pdfBlob);

      // Remove data URL prefix
      const base64Data = base64.split(",")[1];

      // Save PDF temporarily in Android cache
      const savedFile = await Filesystem.writeFile({
        path: "invoice.pdf",
        data: base64Data,
        directory: "CACHE",
        recursive: true
      });

      // Get native file URI
      const fileUri = await Filesystem.getUri({
        path: "invoice.pdf",
        directory: "CACHE"
      });

      // Open Android native share sheet
      await Share.share({
        title: "Invoice",
        text: "Here is your invoice",
        url: fileUri.uri,
        dialogTitle: "Share / Save Invoice"
      });

    }

    // =====================
    // NORMAL WEB BROWSER
    // =====================

    else {

      const file = new File(
        [pdfBlob],
        "invoice.pdf",
        {
          type: "application/pdf"
        }
      );

      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {

        await navigator.share({
          files: [file],
          title: "Invoice",
          text: "Here is your invoice"
        });

      } else {

        const link = document.createElement("a");

        link.href = URL.createObjectURL(pdfBlob);
        link.download = "invoice.pdf";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
          URL.revokeObjectURL(link.href);
        }, 1000);
      }
    }

  } catch (err) {

    console.error("Share PDF failed:", err);

    if (err?.message?.toLowerCase().includes("cancel")) {
      return;
    }

    alert("❌ Failed to create or share PDF");

  } finally {

    // RESTORE INVOICE
    element.classList.remove("pdf-mode");

    element.style.transform = "";
    element.style.zoom = "";

    if (btn) {
      btn.innerText = "📤 Share PDF";
      btn.disabled = false;
    }
  }
}


// =====================
// BLOB → BASE64
// =====================

function blobToBase64(blob) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}