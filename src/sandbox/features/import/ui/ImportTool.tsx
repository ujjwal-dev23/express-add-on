import React, { useState } from "react";
import { Button } from "@swc-react/button";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DocumentSandboxApi } from "../../../../models/DocumentSandboxApi";
import { ExportFormat, ImageAsset } from "../../../../types";
import { completeDownload } from "./export";

interface ImportToolProps {
    sandboxProxy: DocumentSandboxApi;
    addOnUISdk: AddOnSDKAPI;
}

export const ImportTool: React.FC<ImportToolProps> = ({ sandboxProxy, addOnUISdk }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
    const [prefix, setPrefix] = useState<string>("export");

    const handleCompleteDownload = async () => {
        try {
            setIsExporting(true);
            await completeDownload(addOnUISdk, exportFormat, prefix || "export");
        } catch (error) {
            console.error("[UI] Export failed:", error);
            // Could show an error message to the user here
        } finally {
            setIsExporting(false);
        }
    };

    const handleDemoImport = async () => {
        try {
            setIsImporting(true);
            console.log("[UI] Starting demo import of 50 images...");

            // Determine the correct base path for assets
            // In development, use relative path; in production, use absolute
            const basePath = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
                ? `${window.location.origin}/demo-assets`
                : './demo-assets';

            console.log(`[UI] Using base path: ${basePath}`);

            // Fetch all 50 images from demo-assets folder
            const imagePromises: Promise<ImageAsset | null>[] = [];
            const failedFetches: string[] = [];
            
            for (let i = 1; i <= 50; i++) {
                const fileName = `stress-test-${i}.jpg`;
                // Try multiple path variations
                const pathsToTry = [
                    `${basePath}/${fileName}`,
                    `./demo-assets/${fileName}`,
                    `/demo-assets/${fileName}`,
                    `demo-assets/${fileName}`
                ];

                const imagePromise = (async () => {
                    for (const imagePath of pathsToTry) {
                        try {
                            console.log(`[UI] Trying to fetch: ${imagePath}`);
                            const response = await fetch(imagePath);
                            if (response.ok) {
                                const blob = await response.blob();
                                console.log(`[UI] Successfully loaded: ${fileName} (${blob.size} bytes)`);
                                return {
                                    blob,
                                    name: fileName
                                } as ImageAsset;
                            } else {
                                console.warn(`[UI] Failed to fetch ${imagePath}: ${response.status} ${response.statusText}`);
                            }
                        } catch (error) {
                            console.warn(`[UI] Error fetching ${imagePath}:`, error);
                            continue;
                        }
                    }
                    failedFetches.push(fileName);
                    return null;
                })();
                
                imagePromises.push(imagePromise);
            }

            // Wait for all images to load
            const imageAssets = (await Promise.all(imagePromises)).filter(
                (asset): asset is ImageAsset => asset !== null
            );

            console.log(`[UI] Successfully loaded ${imageAssets.length}/50 images`);
            if (failedFetches.length > 0) {
                console.warn(`[UI] Failed to load ${failedFetches.length} images:`, failedFetches.slice(0, 5));
            }

            if (imageAssets.length === 0) {
                throw new Error(`No images were successfully loaded. Please ensure the demo-assets folder is accessible. Base path attempted: ${basePath}`);
            }

            // Import images via sandbox
            await sandboxProxy.importImages(imageAssets);
            console.log(`[UI] Demo import complete. ${imageAssets.length} images imported.`);
        } catch (error) {
            console.error("[UI] Demo import failed:", error);
            alert(`Failed to import images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Batch Export</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500 }}>
                    Export Format:
                </label>
                <select 
                    value={exportFormat} 
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExportFormat(e.target.value as ExportFormat)}
                    disabled={isExporting}
                    style={{ 
                        padding: "8px", 
                        fontSize: "14px",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                    }}
                >
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="pdf">PDF</option>
                </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500 }}>
                    File Prefix:
                </label>
                <input
                    type="text"
                    value={prefix}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value)}
                    disabled={isExporting}
                    placeholder="export"
                    style={{ 
                        padding: "8px", 
                        fontSize: "14px",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                    }}
                />
            </div>

            <Button 
                variant="cta" 
                onClick={isExporting || isImporting ? undefined : handleCompleteDownload}
                style={{ marginTop: "8px", opacity: (isExporting || isImporting) ? 0.5 : 1, pointerEvents: (isExporting || isImporting) ? "none" : "auto" }}
            >
                {isExporting ? "Exporting..." : "Complete Download"}
            </Button>

            <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e0e0e0" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Demo Import</h3>
                <Button 
                    variant="secondary" 
                    onClick={isImporting || isExporting ? undefined : handleDemoImport}
                    style={{ opacity: (isImporting || isExporting) ? 0.5 : 1, pointerEvents: (isImporting || isExporting) ? "none" : "auto" }}
                >
                    {isImporting ? "Importing 50 Images..." : "Import 50 Demo Images"}
                </Button>
            </div>
        </div>
    );
};
