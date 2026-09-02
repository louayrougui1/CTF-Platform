/** Force a browser download instead of navigating/opening a new tab. */
export async function downloadFile(url: string, fileName?: string | null) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Could not download the attachment.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName || url.split("/").pop() || "challenge-file";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
