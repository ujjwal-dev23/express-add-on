/// <reference lib="dom" />
import { DocumentSandboxApi } from "../../../models/DocumentSandboxApi";
import { ImageAsset } from "../../../types";

interface ImportOptions {
  onStart?: () => void;
  onSuccess?: (count: number) => void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  onProgress?: (index: number, total: number) => void; // Optional progress update
}

/**
 * Triggers a file upload dialog for images and imports them via the sandbox API.
 * 
 * @param sandboxProxy - The proxy to communicate with the document sandbox.
 * @param options - Callbacks for various stages of the import process.
 */
export const startImageUpload = (
  sandboxProxy: DocumentSandboxApi,
  options: ImportOptions = {}
): void => {
  // Create a hidden file input
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png, image/jpeg, image/jpg";
  input.multiple = true;
  input.style.display = "none";

  // Handle file selection
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0) {
      options.onCancel?.();
      input.remove();
      return;
    }

    options.onStart?.();

    try {
      const images: ImageAsset[] = [];
      const total = files.length;

      if (total > 50) {
        // Should we enforce the limit here based on App.tsx UI?
        // Let's just process them, or maybe throw an error/warning?
        // For now, let's stick to reading them all. 
        // The UI had a visual limit of 50.
      }

      // Convert Files to Blobs/ImageAssets
      for (let i = 0; i < total; i++) {
        const file = files[i];
        // In a real app we might want to ensure we don't block the UI reading huge files,
        // but for this hackathon context, sequentially reading is fine or parallel.
        const blob = new Blob([file], { type: file.type });
        images.push({
          blob: blob,
          name: file.name
        });

        // Simulate progress if needed, or just partial updates?
        // Since reading is fast, we might not need granular progress here 
        // until we send to sandbox. 
      }

      // Send to sandbox
      await sandboxProxy.importImages(images);

      options.onSuccess?.(images.length);

    } catch (error) {
      console.error("Error importing images:", error);
      options.onError?.(error);
    } finally {
      input.remove();
    }
  };

  // Handle cancellation (this is tricky with file inputs, often relies on onfocus/timeouts)
  // For simplicity, we won't strictly detect "cancel" of the dialog itself 
  // unless the browser supports it, but we handle empty selection above.

  // Trigger the dialog
  document.body.appendChild(input);
  input.click();
};
