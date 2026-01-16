// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import "@spectrum-web-components/picker/sp-picker.js";
import "@spectrum-web-components/slider/sp-slider.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import "@spectrum-web-components/textfield/sp-textfield.js";
import "@spectrum-web-components/divider/sp-divider.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Theme } from "@swc-react/theme";
import { Divider } from "@swc-react/divider";


import React from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";
import { startImageUpload, handleImageDrop, isValidDrag } from "../../sandbox/features/import/ui";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { ImportTool } from "../../sandbox/features/import/ui/ImportTool";
import { CanvasFittingTool } from "../../sandbox/features/canvas-fitting/ui/CanvasFittingTool";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {

    // UI state: 'idle' | 'uploading' | 'completed'
    const [status, setStatus] = React.useState<"idle" | "uploading" | "completed">("idle");
    const [fileCount, setFileCount] = React.useState(0);
    const [progress, setProgress] = React.useState(0);
    const [isHoveringDrag, setIsHoveringDrag] = React.useState(false);

    // Export Mode: false = Individual, true = ZIP
    const [isZipExport, setIsZipExport] = React.useState(false);

    // Constants
    const TotalFiles = 50;

    const importOptions = {
        onStart: () => {
            setStatus("uploading");
            setFileCount(0);
            setProgress(0);
        },
        onSuccess: (count: number) => {
            setFileCount(count);
            setProgress(100);
            setStatus("completed");
        },
        onError: (error: unknown) => {
            console.error("Upload failed", error);
            setStatus("idle");
            // Optionally handle error state in UI
        }
    };

    // Placeholder handlers
    const handleStartUpload = () => {
        if (status !== "idle") return;
        startImageUpload(sandboxProxy, importOptions);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (status === "idle" && isValidDrag(e)) {
            setIsHoveringDrag(true);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (status === "idle" && isValidDrag(e)) {
            setIsHoveringDrag(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHoveringDrag(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHoveringDrag(false);

        if (status !== "idle") return;

        await handleImageDrop(e, sandboxProxy, importOptions);
    };

    const handleClearBatch = () => {
        setStatus("idle");
        setFileCount(0);
        setProgress(0);
    };

    const handleUndo = () => { };
    const handleRedo = () => { };
    const handleExport = () => { };
    const handleGlobalAdjustments = () => { };
    const handleWatermark = () => { };
    const handleResize = () => { };

    // Helper for disabled style
    const getDisabledStyle = (isDisabled: boolean) => ({
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? "none" : "auto" as "none" | "auto"
    });

    return (
        <Theme system="express" scale="medium" color="light">
            <div
                className="container"
                style={{
                    width: "320px",
                    margin: "0 auto",
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                    boxSizing: "border-box",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "var(--spectrum-global-color-gray-900)" }}>
                        BatchEdit
                    </h1>
                    <span style={{ fontSize: "12px", color: "var(--spectrum-global-color-gray-700)" }}>
                        Bulk Image Processor
                    </span>
                    <div style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)", marginTop: "4px" }}>
                        {status === "completed" ? "Files loaded" : "No assets loaded"}
                    </div>
                </div>

                <div style={{ margin: "6px 0" }}>
                    <Divider />
                </div>

                {/* Import Card */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        border: "1px solid var(--spectrum-global-color-gray-300)",
                        borderRadius: "8px",
                        padding: "16px",
                        backgroundColor: "var(--spectrum-global-color-gray-50)",
                    }}
                >
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--spectrum-global-color-gray-900)" }}>
                        Import Images
                    </span>

                    {/* Drag & Drop Zone */}
                    <div
                        onMouseEnter={() => setIsHoveringDrag(true)}
                        onMouseLeave={() => setIsHoveringDrag(false)}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleStartUpload}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "24px 12px",
                            border: `2px dashed ${isHoveringDrag && status === 'idle' ? "var(--spectrum-global-color-blue-500)" : "var(--spectrum-global-color-gray-400)"}`,
                            borderRadius: "8px",
                            backgroundColor: isHoveringDrag && status === 'idle' ? "var(--spectrum-global-color-blue-100)" : "transparent",
                            cursor: status === "idle" ? "pointer" : "default",
                            transition: "all 0.2s ease-in-out"
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--spectrum-global-color-gray-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>

                        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--spectrum-global-color-gray-800)" }}>
                                Click to upload or drag & drop
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)" }}>
                                Images will be processed instantly
                            </span>
                        </div>
                    </div>

                    {/* Upload Button */}
                    <Button
                        variant="secondary"
                        onClick={handleStartUpload}
                        style={{
                            width: "100%",
                            height: "32px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            ...getDisabledStyle(status !== "idle")
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginRight: "8px" }}
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload Images
                    </Button>

                    <span style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)" }}>
                        Upload JPG or PNG files (Max 50)
                    </span>

                    {/* Progress Status */}
                    {(status === "uploading" || status === "completed") && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--spectrum-global-color-gray-700)" }}>
                                <span>{status === "uploading" ? "Uploading files..." : "Files loaded"}</span>
                                <span>{status === "uploading" ? `Uploading ${fileCount} of ${TotalFiles} files` : `${TotalFiles} files uploaded`}</span>
                            </div>

                            {/* Visual progress bar */}
                            <div style={{
                                width: "100%",
                                height: "6px",
                                backgroundColor: "var(--spectrum-global-color-gray-300)",
                                borderRadius: "3px",
                                overflow: "hidden"
                            }}>
                                <div style={{
                                    width: `${progress}%`,
                                    height: "100%",
                                    backgroundColor: status === "completed" ? "var(--spectrum-global-color-green-500)" : "var(--spectrum-global-color-blue-500)",
                                    borderRadius: "3px",
                                    transition: "width 0.05s linear, background-color 0.3s"
                                }}></div>
                            </div>
                        </div>
                    )}

                    {status === "idle" && (
                        <div style={{ fontSize: "12px", color: "var(--spectrum-global-color-gray-700)" }}>
                            No assets loaded
                        </div>
                    )}

                    <Button
                        variant="secondary"
                        quiet
                        onClick={handleClearBatch}
                        style={{
                            alignSelf: "flex-start",
                            padding: "0 12px",
                            height: "32px",
                            minWidth: "auto",
                            fontSize: "12px",
                            borderRadius: "4px",
                            ...getDisabledStyle(status !== "completed")
                        }}
                    >
                        Clear Batch
                    </Button>
                </div>

                {/* Batch Controls */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        border: "1px solid var(--spectrum-global-color-gray-300)",
                        borderRadius: "8px",
                        padding: "16px",
                        backgroundColor: "var(--spectrum-global-color-gray-50)",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--spectrum-global-color-gray-900)" }}>
                            Batch Controls
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)" }}>
                            Manage bulk edits, preview assets, and control batch actions
                        </span>
                    </div>

                    {/* Preview UI */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--spectrum-global-color-gray-800)" }}>
                            Preview
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} style={{
                                    width: "48px",
                                    height: "48px",
                                    backgroundColor: "var(--spectrum-global-color-gray-200)",
                                    borderRadius: "4px",
                                    border: "1px solid var(--spectrum-global-color-gray-300)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--spectrum-global-color-gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)" }}>
                            Preview uploaded images
                        </span>
                    </div>

                    <div style={{ margin: "6px 0" }}>
                        <Divider />
                    </div>

                    {/* Undo / Redo */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                            variant="secondary"
                            quiet
                            onClick={handleUndo}
                            style={{
                                minWidth: "auto",
                                padding: "0 12px",
                                height: "32px",
                                borderRadius: "4px",
                                fontSize: "13px",
                                justifyContent: "center",
                                ...getDisabledStyle(true)
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                                <path d="M3 7v6h6" />
                                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                            </svg>
                            Undo
                        </Button>
                        <Button
                            variant="secondary"
                            quiet
                            onClick={handleRedo}
                            style={{
                                minWidth: "auto",
                                padding: "0 12px",
                                height: "32px",
                                borderRadius: "4px",
                                fontSize: "13px",
                                justifyContent: "center",
                                ...getDisabledStyle(true)
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                                <path d="M21 7v6h-6" />
                                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                            </svg>
                            Redo
                        </Button>
                    </div>
                </div>

                <div style={{ margin: "6px 0" }}>
                    <Divider />
                </div>

                {/* Batch Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <Button variant="secondary" onClick={handleGlobalAdjustments} style={{ width: "100%", ...getDisabledStyle(true) }}>
                        Apply Global Adjustments
                    </Button>
                    <Button variant="secondary" onClick={handleWatermark} style={{ width: "100%", ...getDisabledStyle(true) }}>
                        Apply Watermark
                    </Button>
                    <Button variant="secondary" onClick={handleResize} style={{ width: "100%", ...getDisabledStyle(true) }}>
                        Resize Batch
                    </Button>
                </div>

                <div style={{ margin: "6px 0" }}>
                    <Divider />
                </div>

                {/* Export Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Mode Toggle */}
                    <div
                        onClick={() => setIsZipExport(!isZipExport)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            padding: "4px 0"
                        }}
                    >
                        <span style={{ fontSize: "14px", color: "var(--spectrum-global-color-gray-800)", fontWeight: "400" }}>
                            Download as ZIP
                        </span>

                        {/* Visual Switch */}
                        <div style={{
                            width: "32px",
                            height: "18px",
                            backgroundColor: isZipExport ? "var(--spectrum-global-color-blue-500)" : "var(--spectrum-global-color-gray-400)",
                            borderRadius: "10px",
                            position: "relative",
                            transition: "background-color 0.2s ease"
                        }}>
                            <div style={{
                                width: "14px",
                                height: "14px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                position: "absolute",
                                top: "2px",
                                left: isZipExport ? "16px" : "2px",
                                transition: "left 0.2s ease",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                            }} />
                        </div>
                    </div>

                    <Button
                        variant="cta"
                        onClick={handleExport}
                        style={{
                            width: "100%",
                            height: "40px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "15px",
                        }}
                    >
                        Export
                    </Button>
                </div>
            </div>
        </Theme>
    );
};

export default App;
