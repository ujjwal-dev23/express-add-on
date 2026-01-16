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
export const exportAllPages = async (addOnUISdk: AddOnSDKAPI, sandboxProxy: DocumentSandboxApi, range?: { start: number, end: number }) => {
  // Check if export is allowed
  const isExportAllowed = await addOnUISdk.app.document.exportAllowed();
  if (!isExportAllowed) {
    throw new Error("Export is not allowed by the host application.");
  }

  // Define extended PageInfo locally if needed (or prefer relying on TS inference from DocumentSandboxApi)
  type PageInfo = Awaited<ReturnType<DocumentSandboxApi['getPages']>>[number];

  // Get pages from sandbox
  const pages = await sandboxProxy.getPages(range);
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

  let docName = "Document";
  try {
    const titleOrFn = addOnUISdk.app.document.title;
    if (typeof titleOrFn === 'function') {
      docName = await titleOrFn();
    } else if (typeof titleOrFn === 'string') {
      docName = titleOrFn;
    }
  } catch (e) {
    console.error("Failed to get document title", e);
  }

  return { renditions, pages, docName };
};

import { downloadZip } from "client-zip";

/**
 * Generates a filename based on the provided pattern, index, and date.
 * @param pattern The filename pattern
 * @param index The index of the page (0-based)
 * @param page The page information (name, width, height)
 * @param docName The name of the document
 * @returns The generated filename with extension
 */
const generateFilename = (pattern: string, index: number, page: { name: string; width: number; height: number; id: string }, docName: string): string => {
  const date = new Date().toISOString().split('T')[0];
  let filename = pattern
    .replace(/{index}/g, (index + 1).toString())
    .replace(/{date}/g, date)
    .replace(/{pageName}/g, page.name)
    .replace(/{docName}/g, docName)
    .replace(/{width}/g, page.width.toString())
    .replace(/{height}/g, page.height.toString())
    .replace(/{id}/g, page.id);

  if (!filename.toLowerCase().endsWith('.png')) {
    filename += '.png';
  }

  return filename;
};

/**
 * Saves the provided renditions to the user's device.
 * @param renditions The renditions to save
 * @param pages Page information corresponding to renditions
 * @param docName Document name
 * @param filenamePattern The pattern to use for filenames
 */
const saveRenditions = (
  renditions: { blob: Blob, title?: string }[],
  pages: { name: string; width: number; height: number; id: string }[],
  docName: string,
  filenamePattern: string
) => {
  renditions.forEach((rendition, index) => {
    const page = pages[index]; // Assumes order is preserved, which createRenditions guarantees for pageIds list
    const filename = generateFilename(filenamePattern, index, page, docName);

    const url = URL.createObjectURL(rendition.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
};

/**
 * Saves the provided renditions as a single ZIP file.
 * @param renditions The renditions to save
 * @param pages Page information corresponding to renditions
 * @param docName Document name
 * @param filenamePattern The pattern to use for filenames inside the zip
 */
const saveAsZip = async (
  renditions: { blob: Blob, title?: string }[],
  pages: { name: string; width: number; height: number; id: string }[],
  docName: string,
  filenamePattern: string
) => {
  const files = renditions.map((rendition, index) => ({
    name: generateFilename(filenamePattern, index, pages[index], docName),
    lastModified: new Date(),
    input: rendition.blob
  }));

  const blob = await downloadZip(files).blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${docName || "pages"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};

export type ExportFormat = "png" | "zip";

/**
 * Exports and downloads all pages in the document.
 * @param addOnUISdk The Add-on SDK instance
 * @param sandboxProxy The Sandbox Proxy instance
 * @param format The format to download (png or zip)
 * @param filenamePattern The pattern to use for filenames (default: "{date}_{index}")
 */
export const downloadAllPages = async (
  addOnUISdk: AddOnSDKAPI,
  sandboxProxy: DocumentSandboxApi,
  format: ExportFormat = "png",
  filenamePattern: string = "{date}_{index}",
  range?: { start: number, end: number }
) => {
  const { renditions, pages, docName } = await exportAllPages(addOnUISdk, sandboxProxy, range);

  if (format === "zip") {
    await saveAsZip(renditions, pages, docName, filenamePattern);
  } else {
    saveRenditions(renditions, pages, docName, filenamePattern);
  }
};
