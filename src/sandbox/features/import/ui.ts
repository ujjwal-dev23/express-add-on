/// <reference lib="dom" />
import React from "react";
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
 * Checks if the drag event contains valid files (images).
 */
export const isValidDrag = (event: React.DragEvent<HTMLElement>): boolean => {
  if (!event.dataTransfer) return false;
  // Check if it's a file drag
  return event.dataTransfer.types.includes("Files");
};

/**
 * Handles the drop event for images.
 */
export const handleImageDrop = async (
  event: React.DragEvent<HTMLElement>,
  sandboxProxy: DocumentSandboxApi,
  options: ImportOptions = {}
): Promise<void> => {
  event.preventDefault();
  event.stopPropagation();

  const files = event.dataTransfer.files;
  if (files && files.length > 0) {
    await processFiles(files, sandboxProxy, options);
  }
};

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

    await processFiles(files, sandboxProxy, options);
    input.remove();
  };

  // Trigger the dialog
  document.body.appendChild(input);
  input.click();
};

/**
 * Shared file processing logic.
 */
const processFiles = async (
  files: FileList | File[],
  sandboxProxy: DocumentSandboxApi,
  options: ImportOptions
) => {
  options.onStart?.();

  try {
    const images: ImageAsset[] = [];
    const total = files.length;

    // Convert Files to Blobs/ImageAssets
    for (let i = 0; i < total; i++) {
      const file = files[i];
      // Basic type check to ensure we only get images if the drag/drop wasn't strict enough
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const blob = new Blob([file], { type: file.type });
      images.push({
        blob: blob,
        name: file.name
      });
    }

    if (images.length === 0) {
      // Maybe notify no valid images found?
      options.onCancel?.();
      return;
    }

    // Send to sandbox
    await sandboxProxy.importImages(images);

    options.onSuccess?.(images.length);

  } catch (error) {
    console.error("Error importing images:", error);
    options.onError?.(error);
  }
};
