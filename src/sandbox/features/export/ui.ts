/// <reference lib="dom" />
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DocumentSandboxApi } from "../../../models/DocumentSandboxApi";



/**
 * Exports all pages in the document as PNGs.
 * This function is intended to be used by the UI runtime.
 * 
 * @param addOnUISdk The Add-on UI SDK instance
 * @param sandboxProxy The Sandbox Proxy instance
 * @returns A promise that resolves to the array of renditions
 */
export const exportAllPages = async (addOnUISdk: AddOnSDKAPI, sandboxProxy: DocumentSandboxApi) => {
  // Check if export is allowed
  const isExportAllowed = await addOnUISdk.app.document.exportAllowed();
  if (!isExportAllowed) {
    throw new Error("Export is not allowed by the host application.");
  }

  // Get pages from sandbox
  const pages = await sandboxProxy.getPages();
  const pageIds = pages.map(page => page.id);

  if (pageIds.length === 0) {
    throw new Error("No pages found to export");
  }

  // Configure options to export specific pages (demonstrating sandbox usage)
  const renditionOptions = {
    range: addOnUISdk.constants.Range.specificPages,
    pageIds: pageIds,
    format: addOnUISdk.constants.RenditionFormat.png,
    backgroundColor: 0xFFFFFFFF // Optional: White background
  };

  // Create renditions
  const renditions = await addOnUISdk.app.document.createRenditions(
    renditionOptions,
    addOnUISdk.constants.RenditionIntent.export
  );

  return renditions;
};

import { downloadZip } from "client-zip";

/**
 * Saves the provided renditions to the user's device.
 * @param renditions The renditions to save
 */
const saveRenditions = (renditions: { blob: Blob, title?: string }[]) => {
  renditions.forEach((rendition, index) => {
    const url = URL.createObjectURL(rendition.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `page-${index + 1}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
};

/**
 * Saves the provided renditions as a single ZIP file.
 * @param renditions The renditions to save
 */
const saveAsZip = async (renditions: { blob: Blob, title?: string }[]) => {
  const files = renditions.map((rendition, index) => ({
    name: `page-${index + 1}.png`,
    lastModified: new Date(),
    input: rendition.blob
  }));

  const blob = await downloadZip(files).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pages.zip";
  a.click();
  URL.revokeObjectURL(url);
};

export type ExportFormat = "png" | "zip";

/**
 * Exports and downloads all pages in the document.
 * @param addOnUISdk The Add-on SDK instance
 * @param sandboxProxy The Sandbox Proxy instance
 * @param format The format to download (png or zip)
 */
export const downloadAllPages = async (addOnUISdk: AddOnSDKAPI, sandboxProxy: DocumentSandboxApi, format: ExportFormat = "png") => {
  const renditions = await exportAllPages(addOnUISdk, sandboxProxy);

  if (format === "zip") {
    await saveAsZip(renditions);
  } else {
    saveRenditions(renditions);
  }
};
