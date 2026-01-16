// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";


// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Slider } from "@swc-react/slider";
import { Picker } from "@swc-react/picker";
import { MenuItem } from "@swc-react/menu";
import { Theme } from "@swc-react/theme";

import React from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";
import { startImageUpload, handleImageDrop, isValidDrag } from "../../sandbox/features/import/ui";
import { resetAllPages as resetAllPagesHelper } from "../../sandbox/features/reset/ui";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { downloadAllPages, ExportFormat } from "../../sandbox/features/export/ui";
import { changePageLayout } from "../../sandbox/features/page-layout/ui";
import { injectWatermark } from "../../sandbox/features/watermark/ui";
import { WatermarkSettings } from "../../types";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {

    // UI state: 'idle' | 'uploading' | 'completed'
    const [status, setStatus] = React.useState<"idle" | "uploading" | "completed">("idle");
    const [fileCount, setFileCount] = React.useState(0);
    const [progress, setProgress] = React.useState(0);
    const [isHoveringDrag, setIsHoveringDrag] = React.useState(false);

    // UI state: Session Tracking (Visual Persistence)
    const [hasActiveSession, setHasActiveSession] = React.useState(false);

    // UI state: Toggle & Dialog
    const [isZipExport, setIsZipExport] = React.useState(false);
    const [isWatermarkDialogOpen, setIsWatermarkDialogOpen] = React.useState(false);
    const [isBulkResizeDialogOpen, setIsBulkResizeDialogOpen] = React.useState(false);

    // UI state: Fitting Option
    const [fittingOption, setFittingOption] = React.useState<"fill" | "contain">("fill");

    // UI state: Bulk Resize (Visual placeholders)
    const [bulkWidth, setBulkWidth] = React.useState("");
    const [bulkHeight, setBulkHeight] = React.useState("");
    const [selectedPreset, setSelectedPreset] = React.useState<"instagram" | "facebook" | null>(null);

    // UI state: Watermark Settings
    const [watermarkOpacity, setWatermarkOpacity] = React.useState(50);
    const [watermarkScale, setWatermarkScale] = React.useState(30);
    const [watermarkBlob, setWatermarkBlob] = React.useState<Blob | null>(null);

    // UI state: Watermark Position
    const [watermarkPos, setWatermarkPos] = React.useState<WatermarkSettings["position"]>("bottom-right");

    // UI state: Smart Naming
    const [namingPattern, setNamingPattern] = React.useState("{date}_{index}");

    // UI state: Reset
    const [isResetting, setIsResetting] = React.useState(false);

    // UI state: Range
    const [rangeStart, setRangeStart] = React.useState(1);
    const [rangeEnd, setRangeEnd] = React.useState(250);

    // Constants
    const TotalFiles = 250;

    // Auto-Reset Effect
    React.useEffect(() => {
        if (status === "completed") {
            const timer = setTimeout(() => {
                setStatus("idle");
                // Note: We do NOT reset hasActiveSession here, keeping other cards visible.
            }, 3000); // UI-Only Reset: 3 seconds
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Actual handlers
    const handleStartUpload = () => {
        if (status === "uploading") return;

        startImageUpload(sandboxProxy, {
            onStart: () => {
                setStatus("uploading");
                setFileCount(0);
                setProgress(0);
            },
            onSuccess: (count) => {
                setStatus("completed");
                setFileCount(count);
                setProgress(100);
                setHasActiveSession(true);
            },
            onError: (error) => {
                console.error("Upload failed:", error);
                setStatus("idle"); // reset on error?
            },
            onCancel: () => {
                if (status !== "completed") setStatus("idle");
            }
        });
    };

    const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
        setIsHoveringDrag(false);
        if (status === "uploading") return;

        if (isValidDrag(e)) {
            await handleImageDrop(e, sandboxProxy, {
                onStart: () => {
                    setStatus("uploading");
                    setFileCount(0);
                    setProgress(0);
                },
                onSuccess: (count) => {
                    setStatus("completed");
                    setFileCount(count);
                    setProgress(100);
                    setHasActiveSession(true);
                },
                onError: (error) => {
                    console.error("Drop failed:", error);
                    setStatus("idle");
                }
            });
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        if (!isHoveringDrag) setIsHoveringDrag(true);
    };

    const handleDragLeave = () => {
        setIsHoveringDrag(false);
    };

    const handleApplyFitting = async () => {
        try {
            console.log(`[UI] Applying fit mode: ${fittingOption} with range ${rangeStart}-${rangeEnd}`);
            await sandboxProxy.fitToCanvas(fittingOption, { start: rangeStart, end: rangeEnd });
            console.log(`[UI] Fit complete`);
        } catch (e) {
            console.error("Fit to canvas failed", e);
        }
    };

    const handleExport = async () => {
        try {
            console.log("[UI] Starting export...");
            const format: ExportFormat = isZipExport ? "zip" : "png";
            await downloadAllPages(addOnUISdk, sandboxProxy, format, namingPattern, { start: rangeStart, end: rangeEnd });
            console.log("[UI] Export complete");
        } catch (error) {
            console.error("[UI] Export failed:", error);
        }
    };

    const handleRangeChange = (type: "start" | "end", value: string) => {
        const val = parseInt(value, 10);
        if (isNaN(val)) return;

        if (type === "start") {
            setRangeStart(val);
        } else {
            setRangeEnd(val);
        }
    };

    const handleOpenWatermark = () => setIsWatermarkDialogOpen(true);
    const handleCloseWatermark = () => setIsWatermarkDialogOpen(false);

    const handleWatermarkFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const blob = new Blob([file], { type: file.type });
            setWatermarkBlob(blob);
        } else {
            console.warn("Please select a valid image file");
        }
    };

    const handleApplyWatermark = async () => {
        if (!watermarkBlob) {
            console.warn("No watermark image selected");
            return;
        }

        try {
            const settings: WatermarkSettings = {
                blob: watermarkBlob,
                opacity: watermarkOpacity / 100,
                scale: watermarkScale / 100,
                position: watermarkPos
            };

            await injectWatermark(sandboxProxy, settings, {
                onSuccess: () => {
                    console.log("[UI] Watermark applied");
                    setIsWatermarkDialogOpen(false);
                },
                onError: (e) => console.error("[UI] Watermark failed", e)
            }, { start: rangeStart, end: rangeEnd });
        } catch (e) {
            console.error("[UI] Watermark exception", e);
        }
    };

    // Preset Handlers
    const handlePresetIG = () => {
        setBulkWidth("1080");
        setBulkHeight("1080");
        setSelectedPreset("instagram");
    };

    const handlePresetFB = () => {
        setBulkWidth("1200");
        setBulkHeight("630");
        setSelectedPreset("facebook");
    };

    const handleBulkResizeApply = async () => {
        const width = parseInt(bulkWidth, 10);
        const height = parseInt(bulkHeight, 10);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            console.warn("Invalid dimensions for resize");
            return;
        }

        try {
            await changePageLayout(sandboxProxy, { width, height }, {
                onSuccess: () => {
                    console.log(`[UI] Resized to ${width}x${height}`);
                    setIsBulkResizeDialogOpen(false);
                },
                onError: (e) => console.error("[UI] Resize failed", e)
            }, { start: rangeStart, end: rangeEnd });
        } catch (e) {
            console.error("[UI] Resize exception", e);
        }
    };

    const setWatermarkPosSafe = (pos: WatermarkSettings["position"]) => {
        setWatermarkPos(pos);
    };

    const toggleZipExport = () => setIsZipExport(!isZipExport);

    const handleResetAll = async () => {
        if (isResetting) return;

        await resetAllPagesHelper(sandboxProxy, {
            onStart: () => {
                setIsResetting(true);
            },
            onSuccess: () => {
                setIsResetting(false);
                setStatus("idle");
                setFileCount(0);
                setProgress(0);
                setHasActiveSession(false);
                console.log("[UI] Reset complete: all pages deleted");
            },
            onError: (error) => {
                console.error("[UI] Reset failed:", error);
                setIsResetting(false);
            }
        });
    };

    // Helper: Simulated Checkbox (now acting as Radio)
    const SimulatedCheckbox = ({ label, value }: { label: string, value: WatermarkSettings["position"] }) => {
        const isChecked = watermarkPos === value;
        return (
            <div
                onClick={() => setWatermarkPosSafe(value)}
                style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            >
                <div style={{
                    width: "14px", height: "14px",
                    borderRadius: "50%", // Radio style
                    border: `2px solid ${isChecked ? "#2563eb" : "#cbd5e1"}`,
                    backgroundColor: isChecked ? "#2563eb" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.1s ease"
                }}>
                    {isChecked && (
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "white" }} />
                    )}
                </div>
                <span style={{ fontSize: "12px", color: "#334155" }}>{label}</span>
            </div>
        );
    };

    return (
        // Theme: "light" with manual Slate-100 BG override
        <Theme system="express" scale="medium" color="light" style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f1f5f9" }}>

            {/* SCROLLABLE AREA */}
            <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center", // Center cards horizontally
                gap: "24px",
                width: "100%", // Full width of sidebar
                boxSizing: "border-box"
            }}>

                {/* 1) Import Images Card */}
                {/* Background: White (#ffffff), Border: Slate-200 (#e2e8f0) */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "16px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        width: "100%", // Fill container (up to max-width)
                        maxWidth: "320px" // Maintain consistent max width
                    }}
                >
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>
                        Import Images
                    </span>

                    {/* Drag & Drop Zone */}
                    <div
                        onMouseEnter={() => setIsHoveringDrag(true)}
                        onMouseLeave={() => setIsHoveringDrag(false)}
                        onClick={handleStartUpload}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "24px 12px",
                            border: `2px dashed ${status === 'completed'
                                ? "#2563eb" // Success Solid Blue
                                : (isHoveringDrag && status !== 'uploading' ? "#2563eb" : "#cbd5e1")
                                }`,
                            borderRadius: "8px",
                            backgroundColor:
                                status === 'completed'
                                    ? "#eff6ff" // Success Blue-50
                                    : (isHoveringDrag && status !== 'uploading' ? "#eff6ff" : "transparent"),
                            cursor: status === "uploading" ? "default" : "pointer",
                            transition: "all 0.2s ease-in-out"
                        }}
                    >
                        {/* Icon Switch: Cloud (Default) vs Check (Success) */}
                        {status === 'completed' ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        )}

                        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "2px" }}>
                            {/* Primary Success Message */}
                            <span style={{
                                fontSize: "12px",
                                fontWeight: status === 'completed' ? "700" : "600",
                                color: status === 'completed' ? "#1e40af" : "#334155" // Darker Blue vs Secondary
                            }}>
                                {status === "completed" ? "Import successful" : "Click to upload or drag & drop"}
                            </span>

                            {/* Secondary Helper Text */}
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                                {status === "completed" ? "You can continue adding images" : "Images will be processed instantly"}
                            </span>
                        </div>

                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Upload JPG or PNG files (Max {TotalFiles})
                        </span>

                        {/* Progress Status */}
                        {(status === "uploading" || status === "completed") && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#334155" }}>
                                    <span>{status === "uploading" ? "Uploading files..." : "Files loaded"}</span>
                                    {/* Reset Progress Text */}
                                    <span>{status === "completed" ? "Ready for next upload" : status === "uploading" ? `Uploading ${fileCount} of ${TotalFiles} files` : `${TotalFiles} files uploaded`}</span>
                                </div>

                                {/* Visual progress bar */}
                                <div style={{
                                    width: "100%",
                                    height: "6px",
                                    backgroundColor: "#e2e8f0",
                                    borderRadius: "3px",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        width: `${progress}%`,
                                        height: "100%",
                                        backgroundColor: status === "completed" ? "var(--spectrum-global-color-green-500)" : "#2563eb",
                                        borderRadius: "3px",
                                        transition: "width 0.05s linear, background-color 0.3s"
                                    }}></div>
                                </div>
                            </div>
                        )}

                        {/* Show "No assets loaded" ONLY if idle and NO session active */}
                        {status === "idle" && !hasActiveSession && (
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                                No assets loaded
                            </div>
                        )}
                    </div>
                </div>

                {/* 2) Batch Controls Card */}
                {/* Visible if status is NOT idle OR if a session is active */}
                {(status !== 'idle' || hasActiveSession) && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "16px",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                            animation: "fadeIn 0.4s ease-out",
                            width: "100%", // Fill container (up to max-width)
                            maxWidth: "320px" // Maintain consistent max width
                        }}
                    >
                        <style>{`
                            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                        `}</style>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>
                                Batch Controls
                            </span>
                        </div>

                        {/* Range Selector */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                                Range
                            </span>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <span style={{ fontSize: "11px", color: "#334155" }}>From</span>
                                    <input
                                        type="number"
                                        value={rangeStart}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid var(--spectrum-global-color-gray-300)",
                                            borderRadius: "4px",
                                            fontSize: "13px"
                                        }}
                                        onChange={(e) => handleRangeChange("start", e.target.value)}
                                    />
                                </div>
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <span style={{ fontSize: "11px", color: "#334155" }}>To</span>
                                    <input
                                        type="number"
                                        value={rangeEnd}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid var(--spectrum-global-color-gray-300)",
                                            borderRadius: "4px",
                                            fontSize: "13px"
                                        }}
                                        onChange={(e) => handleRangeChange("end", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fitting Options */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                                Fitting Options
                            </span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setFittingOption("fill")}
                                        style={{
                                            flex: 1,
                                            height: "32px",
                                            borderRadius: "4px",
                                            fontSize: "13px",
                                            padding: "0 12px",
                                            opacity: fittingOption === "fill" ? 1 : 0.5,
                                            transition: "opacity 0.2s ease"
                                        }}
                                    >
                                        Fill
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setFittingOption("contain")}
                                        style={{
                                            flex: 1,
                                            height: "32px",
                                            borderRadius: "4px",
                                            fontSize: "13px",
                                            padding: "0 12px",
                                            opacity: fittingOption === "contain" ? 1 : 0.5,
                                            transition: "opacity 0.2s ease"
                                        }}
                                    >
                                        Contain
                                    </Button>
                                </div>
                                <Button
                                    variant="cta"
                                    onClick={handleApplyFitting}
                                    style={{
                                        width: "100%",
                                        height: "32px",
                                        borderRadius: "4px",
                                        fontSize: "13px",
                                        padding: "0 12px"
                                    }}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>

                        {/* Watermark Button */}
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                            <Button
                                variant="secondary"
                                quiet
                                onClick={handleOpenWatermark}
                                style={{
                                    minWidth: "auto",
                                    height: "32px",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    padding: "0 12px"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    Apply Watermark
                                </div>
                            </Button>
                        </div>

                        {/* Bulk Resize Button */}
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                            <Button
                                variant="cta"
                                onClick={() => setIsBulkResizeDialogOpen(true)}
                                style={{
                                    height: "32px",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    padding: "0 12px"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                                    <div style={{
                                        width: "18px",
                                        height: "18px",
                                        backgroundColor: "#f472b6",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: "8px"
                                    }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                                            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                                        </svg>
                                    </div>
                                    Bulk Resize
                                </div>
                            </Button>
                        </div>
                    </div>

                )}

                {/* 3) Smart Naming Card */}
                {(status !== 'idle' || hasActiveSession) && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "16px",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                            width: "100%",
                            maxWidth: "320px"
                        }}
                    >
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>
                            Smart Naming
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "11px", color: "#334155" }}>Naming Pattern</span>
                                <input
                                    type="text"
                                    placeholder="Item Name - 01"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid var(--spectrum-global-color-gray-300)",
                                        borderRadius: "4px",
                                        fontSize: "13px"
                                    }}
                                    value={namingPattern}
                                    onChange={(e) => setNamingPattern(e.target.value)}
                                />
                                <span style={{ fontSize: "11px", color: "#64748b" }}>For further updates</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4) Reset All Button */}
                {(status !== 'idle' || hasActiveSession) && (
                    <div style={{ width: "100%", maxWidth: "320px", display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            variant="negative"
                            onClick={handleResetAll}
                            style={{
                                height: "32px",
                                borderRadius: "4px",
                                fontSize: "13px",
                                opacity: isResetting ? 0.5 : 1,
                                pointerEvents: isResetting ? "none" : "auto" as "none" | "auto"
                            }}
                        >
                            {isResetting ? "Resetting..." : "Reset All"}
                        </Button>
                    </div>
                )}
            </div>

            {/* STICKY EXPORT FOOTER - REVEAL ONLY AFTER INTERACTION */}
            {/* Background: White (#ffffff), Border Top: Slate-200 (#e2e8f0) */}
            {
                (status !== 'idle' || hasActiveSession) && (
                    <div style={{
                        padding: "16px 20px",
                        borderTop: "1px solid #e2e8f0",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        animation: "fadeIn 0.6s ease-out"
                    }}>
                        <div
                            onClick={toggleZipExport}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                padding: "4px 0"
                            }}
                        >
                            <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: "400" }}>
                                Download as ZIP
                            </span>

                            {/* Visual Switch */}
                            {/* ON: Blue-600 (#2563eb), OFF: Slate-300 (#cbd5e1) */}
                            <div style={{
                                width: "32px",
                                height: "18px",
                                backgroundColor: isZipExport ? "#2563eb" : "#cbd5e1",
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
                                borderRadius: "6px",
                                fontSize: "15px",
                                textAlign: "center"
                            }}
                        >
                            Export
                        </Button>
                    </div>
                )
            }

            {/* WATERMARK DIALOG OVERLAY */}
            {
                isWatermarkDialogOpen && (
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        backdropFilter: "blur(2px)"
                    }}>
                        <div style={{
                            width: "280px",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden"
                        }}>
                            {/* Header Border: Slate-200 (#e2e8f0) */}
                            <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>
                                    Upload Watermark Logo
                                </span>
                            </div>

                            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

                                {/* Upload Placeholder */}
                                <div
                                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
                                >
                                    <label style={{
                                        width: "100%",
                                        height: "80px",
                                        border: "2px dashed #cbd5e1",
                                        borderRadius: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: watermarkBlob ? "#f0fdf4" : "#f8fafc",
                                        color: watermarkBlob ? "#15803d" : "#64748b",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}>
                                        {watermarkBlob ? `✓ Selected: ${(watermarkBlob as any).name || "Image"}` : "Click to browse files"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleWatermarkFileSelect}
                                            style={{ display: "none" }}
                                        />
                                    </label>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                        Upload logo for watermark
                                    </span>
                                </div>

                                {/* Opacity Slider */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#0f172a" }}>Opacity</span>
                                        <span style={{ fontSize: "12px", color: "#64748b" }}>{watermarkOpacity}%</span>
                                    </div>
                                    {/* @ts-ignore */}
                                    <sp-slider min="1" max="100" value={watermarkOpacity} onInput={(e: any) => setWatermarkOpacity(e.target.value)} style={{ width: "100%" }}></sp-slider>
                                </div>

                                {/* Scale Slider */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#0f172a" }}>Scale</span>
                                        <span style={{ fontSize: "12px", color: "#64748b" }}>{watermarkScale}</span>
                                    </div>
                                    {/* @ts-ignore */}
                                    <sp-slider min="1" max="100" value={watermarkScale} onInput={(e: any) => setWatermarkScale(e.target.value)} style={{ width: "100%" }}></sp-slider>
                                </div>

                                {/* Position Selection */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#0f172a" }}>
                                        Position
                                    </span>
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "10px"
                                    }}>
                                        <SimulatedCheckbox label="Top Left" value="top-left" />
                                        <SimulatedCheckbox label="Top Right" value="top-right" />
                                        <SimulatedCheckbox label="Bottom Left" value="bottom-left" />
                                        <SimulatedCheckbox label="Bottom Right" value="bottom-right" />
                                    </div>
                                    <div style={{ marginTop: "4px" }}>
                                        <SimulatedCheckbox label="Center" value="center" />
                                    </div>
                                </div>
                            </div>

                            {/* Footer BG: White (#ffffff), Border: Slate-200 (#e2e8f0) */}
                            <div style={{
                                padding: "16px",
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "8px",
                                backgroundColor: "#ffffff",
                                borderTop: "1px solid #e2e8f0"
                            }}>
                                <Button variant="secondary" onClick={handleCloseWatermark}>Cancel</Button>
                                <Button variant="cta" onClick={handleApplyWatermark}>Apply</Button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* BULK RESIZE DIALOG OVERLAY */}
            {
                isBulkResizeDialogOpen && (
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        backdropFilter: "blur(2px)"
                    }}>
                        <div style={{
                            width: "360px",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden"
                        }}>
                            {/* Header */}
                            <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>
                                    Bulk Resize
                                </span>
                            </div>

                            {/* Content */}
                            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

                                {/* Presets */}
                                <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                                    {/* Instagram Card */}
                                    <div
                                        onClick={handlePresetIG}
                                        style={{
                                            width: "100px",
                                            padding: "16px 8px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            border: `2px solid ${selectedPreset === "instagram" ? "#2563eb" : "#e2e8f0"}`,
                                            borderRadius: "8px",
                                            backgroundColor: selectedPreset === "instagram" ? "#eff6ff" : "white",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedPreset !== "instagram") e.currentTarget.style.borderColor = "#cbd5e1";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedPreset !== "instagram") e.currentTarget.style.borderColor = "#e2e8f0";
                                        }}
                                    >
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={selectedPreset === "instagram" ? "#2563eb" : "#334155"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                        </svg>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                            <span style={{
                                                fontSize: "12px",
                                                fontWeight: "bold",
                                                color: selectedPreset === "instagram" ? "#1e40af" : "#334155"
                                            }}>
                                                Instagram
                                            </span>
                                            <span style={{ fontSize: "10px", color: "#64748b" }}>1080 × 1080</span>
                                        </div>
                                    </div>

                                    {/* Facebook Card */}
                                    <div
                                        onClick={handlePresetFB}
                                        style={{
                                            width: "100px",
                                            padding: "16px 8px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            border: `2px solid ${selectedPreset === "facebook" ? "#2563eb" : "#e2e8f0"}`,
                                            borderRadius: "8px",
                                            backgroundColor: selectedPreset === "facebook" ? "#eff6ff" : "white",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedPreset !== "facebook") e.currentTarget.style.borderColor = "#cbd5e1";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedPreset !== "facebook") e.currentTarget.style.borderColor = "#e2e8f0";
                                        }}
                                    >
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={selectedPreset === "facebook" ? "#2563eb" : "#334155"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                        </svg>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                            <span style={{
                                                fontSize: "12px",
                                                fontWeight: "bold",
                                                color: selectedPreset === "facebook" ? "#1e40af" : "#334155"
                                            }}>
                                                Facebook
                                            </span>
                                            <span style={{ fontSize: "10px", color: "#64748b" }}>1200 × 630</span>
                                        </div>
                                    </div>
                                </div>

                                <span style={{ fontSize: "14px", color: "#64748b", textAlign: "center", fontWeight: "500" }}>
                                    or
                                </span>

                                {/* Dimensions */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "11px", color: "#334155" }}>Width (px)</span>
                                        <input
                                            type="number"
                                            value={bulkWidth}
                                            placeholder="1080"
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: "1px solid var(--spectrum-global-color-gray-300)",
                                                borderRadius: "4px",
                                                fontSize: "13px"
                                            }}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBulkWidth(e.target.value); setSelectedPreset(null); }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "11px", color: "#334155" }}>Height (px)</span>
                                        <input
                                            type="number"
                                            value={bulkHeight}
                                            placeholder="1080"
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: "1px solid var(--spectrum-global-color-gray-300)",
                                                borderRadius: "4px",
                                                fontSize: "13px"
                                            }}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBulkHeight(e.target.value); setSelectedPreset(null); }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: "16px",
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "8px",
                                backgroundColor: "#ffffff",
                                borderTop: "1px solid #e2e8f0"
                            }}>
                                <Button variant="secondary" onClick={() => setIsBulkResizeDialogOpen(false)}>Cancel</Button>
                                <Button variant="cta" onClick={handleBulkResizeApply}>Apply</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </Theme >
    );
};

export default App;
