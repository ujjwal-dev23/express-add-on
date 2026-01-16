import { editor, PageNode, ArtboardNode, MediaContainerNode } from "express-document-sdk";
import { WatermarkSettings } from "../../../types";

/**
 * Injects a watermark on every page in the document.
 * 
 * @param settings - WatermarkSettings object containing blob, opacity, scale, and position
 */
export async function injectWatermark(settings: WatermarkSettings): Promise<void> {
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
        const pages = editor.documentRoot.pages;
        let totalWatermarks = 0;

        // 3. Perform all document mutations in a single queueAsyncEdit block
        await editor.queueAsyncEdit(async () => {
            // Iterate through all pages
            for (const page of pages) {
                const artboard = page.artboards.first;
                if (!artboard) continue;

                console.log(`[Sandbox] Injecting watermark on page "${page.name || 'unnamed'}"`);

                // Create watermark image container
                const watermarkContainer = editor.createImageContainer(watermarkBitmap);

                // Get the container and artboard dimensions
                const containerBounds = watermarkContainer.boundsLocal;
                const artboardWidth = artboard.width;
                const artboardHeight = artboard.height;

                // Calculate scaled dimensions
                const scaledWidth = containerBounds.width * settings.scale;
                const scaledHeight = containerBounds.height * settings.scale;

                // Resize the watermark container to the scaled size
                // Using the experimental resize API with proportional behavior
                try {
                    const containerNode = watermarkContainer as unknown as {
                        resize: (options: {
                            width?: number;
                            height?: number;
                            behavior: "proportional";
                            avoidScalingVisualDetailsIfPossible: boolean;
                        }) => void;
                    };

                    // Resize proportionally using width (will maintain aspect ratio)
                    containerNode.resize({
                        width: scaledWidth,
                        behavior: "proportional",
                        avoidScalingVisualDetailsIfPossible: true
                    });

                    // Wait a bit for resize to take effect, then get updated bounds
                    // Note: resize is synchronous, but bounds might update slightly after
                } catch (resizeError) {
                    console.warn("[Sandbox] Could not resize watermark container, using original size:", resizeError);
                }

                // Get final bounds after resize (or original if resize failed)
                const finalBounds = watermarkContainer.boundsLocal;

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

                // Append the watermark to the artboard
                artboard.children.append(watermarkContainer);

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
