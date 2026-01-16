import { editor, PageNode, ArtboardNode, MediaContainerNode } from "express-document-sdk";
import { WatermarkSettings } from "../../../types";

/**
 * Injects a watermark on every page in the document.
 * 
 * @param settings - WatermarkSettings object containing blob, opacity, scale, and position
 */
export async function injectWatermark(settings: WatermarkSettings, range?: { start: number, end: number }): Promise<void> {
    try {
        console.log(`[Sandbox] Starting watermark injection with settings:`, {
            opacity: settings.opacity,
            scale: settings.scale,
            position: settings.position
        });

        // 1. Load the watermark bitmap
        console.log(`[Sandbox] Loading watermark bitmap...`);
        const watermarkBitmap = await editor.loadBitmapImage(settings.blob);
        console.log(`[Sandbox] Watermark bitmap loaded`);

        // 2. Get all pages in the document
        const allPages = editor.documentRoot.pages.toArray();
        const pages = range ? allPages.slice(range.start - 1, range.end) : allPages;
        let totalWatermarks = 0;

        // 3. Perform all document mutations in a single queueAsyncEdit block
        await editor.queueAsyncEdit(async () => {
            // Iterate through all pages
            for (const page of pages) {
                const artboard = page.artboards.first;
                if (!artboard) continue;

                console.log(`[Sandbox] Injecting watermark on page "${page.name || 'unnamed'}"`);

                // Get bitmap dimensions for calculating scaled size
                const bitmapWidth = watermarkBitmap.width;
                const bitmapHeight = watermarkBitmap.height;
                const bitmapAspectRatio = bitmapWidth / bitmapHeight;

                // Calculate scaled dimensions maintaining aspect ratio
                const scaledWidth = bitmapWidth * settings.scale;
                const scaledHeight = bitmapHeight * settings.scale;

                console.log(`[Sandbox] Bitmap size: ${bitmapWidth}x${bitmapHeight}, scale: ${settings.scale}`);
                console.log(`[Sandbox] Creating watermark container at size: ${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)}`);

                // Create watermark image container with initialSize to set the scale
                // initialSize must maintain the same aspect ratio as the bitmap
                const watermarkContainer = editor.createImageContainer(watermarkBitmap, {
                    initialSize: {
                        width: scaledWidth,
                        height: scaledHeight
                    }
                });

                // Get artboard dimensions
                const artboardWidth = artboard.width;
                const artboardHeight = artboard.height;

                // Get final container bounds (should match initialSize)
                const finalBounds = watermarkContainer.boundsLocal;
                console.log(`[Sandbox] Watermark container created at size: ${finalBounds.width.toFixed(0)}x${finalBounds.height.toFixed(0)}`);

                // Append to artboard
                artboard.children.append(watermarkContainer);

                // Calculate position based on the position parameter
                let positionX: number;
                let positionY: number;
                const margin = 20; // Margin from edges in pixels

                switch (settings.position) {
                    case "top-left":
                        positionX = margin;
                        positionY = margin;
                        break;
                    case "top-right":
                        positionX = artboardWidth - finalBounds.width - margin;
                        positionY = margin;
                        break;
                    case "bottom-left":
                        positionX = margin;
                        positionY = artboardHeight - finalBounds.height - margin;
                        break;
                    case "bottom-right":
                        positionX = artboardWidth - finalBounds.width - margin;
                        positionY = artboardHeight - finalBounds.height - margin;
                        break;
                    case "center":
                        positionX = (artboardWidth - finalBounds.width) / 2;
                        positionY = (artboardHeight - finalBounds.height) / 2;
                        break;
                    default:
                        // Default to bottom-right
                        positionX = artboardWidth - finalBounds.width - margin;
                        positionY = artboardHeight - finalBounds.height - margin;
                        break;
                }

                // Set position
                watermarkContainer.translation = {
                    x: positionX,
                    y: positionY
                };

                // Set opacity (0.0 to 1.0)
                const clampedOpacity = Math.max(0, Math.min(1, settings.opacity));
                watermarkContainer.opacity = clampedOpacity;

                totalWatermarks++;
                console.log(`[Sandbox] Watermark injected at position (${positionX.toFixed(0)}, ${positionY.toFixed(0)}) with opacity ${clampedOpacity}`);
            }
        });

        console.log(`[Sandbox] Watermark injection complete. Applied to ${totalWatermarks} pages.`);

    } catch (error) {
        console.error("[Sandbox] Error during watermark injection:", error);
        throw error;
    }
}
