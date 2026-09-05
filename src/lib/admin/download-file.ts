"use client";

function downloadBase64(base64: string, filename: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Triggers a browser download for a base64-encoded .xlsx workbook produced by a server action. */
export function downloadBase64Xlsx(base64: string, filename: string) {
  downloadBase64(
    base64,
    filename,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

/** Triggers a browser download for a base64-encoded PDF produced by a server action. */
export function downloadBase64Pdf(base64: string, filename: string) {
  downloadBase64(base64, filename, "application/pdf");
}
