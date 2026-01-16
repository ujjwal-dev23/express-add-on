/// <reference lib="dom" />
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { ExportFormat } from "../../../../types";

/**
 * Complete download function that exports all pages in the document.
 * Creates renditions for each page and triggers downloads.
 * 
 * @param addOnUISdk - The Adobe Express Add-on SDK instance
 * @param format - The export format (png, jpg, or pdf)
 * @param prefix - Prefix for the downloaded files
 */
export async function completeDownload(
    addOnUISdk: AddOnSDKAPI,
    format: ExportFormat,
    prefix: string
): Promise<void> {
    try {
        console.log(`[Export] Starting batch export: format=${format}, prefix=${prefix}`);

        // Check if export is allowed
        const canExport = await addOnUISdk.app.document.exportAllowed();
        if (!canExport) {
            console.warn("[Export] Export not allowed - document may be under review");
            throw new Error("Export is not allowed. Document may be under review.");
        }

        // Get all pages metadata to determine file names
        const pages = await addOnUISdk.app.document.getPagesMetadata({
            range: addOnUISdk.constants.Range.entireDocument,
        });

        console.log(`[Export] Found ${pages.length} pages to export`);

        // Map export format to RenditionFormat constant
        const renditionFormat =
            format === "png" ? addOnUISdk.constants.RenditionFormat.png :
                format === "jpg" ? addOnUISdk.constants.RenditionFormat.jpg :
                    addOnUISdk.constants.RenditionFormat.pdf;

        // Create renditions for all pages
        const renditions = await addOnUISdk.app.document.createRenditions(
            {
                range: addOnUISdk.constants.Range.entireDocument,
                format: renditionFormat,
            },
            addOnUISdk.constants.RenditionIntent.export
        );

        console.log(`[Export] Created ${renditions.length} renditions`);

        // Download each rendition
        for (let i = 0; i < renditions.length; i++) {
            const rendition = renditions[i];
            const pageTitle = pages[i]?.title || `page-${i + 1}`;
            const sanitizedTitle = pageTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            const fileName = `${prefix}_${sanitizedTitle}_${i + 1}.${format}`;

            // Create download link and trigger download
            const url = URL.createObjectURL(rendition.blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`[Export] Downloaded: ${fileName}`);
        }

        console.log(`[Export] Batch export complete. ${renditions.length} files downloaded.`);

    } catch (error) {
        console.error("[Export] Error during batch export:", error);
        throw error;
    }
}
