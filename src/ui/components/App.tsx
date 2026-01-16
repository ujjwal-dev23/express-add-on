// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

import "@spectrum-web-components/divider/sp-divider.js";
import "@spectrum-web-components/slider/sp-slider.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Theme } from "@swc-react/theme";
import { Divider } from "@swc-react/divider";
import { Textfield } from "@swc-react/textfield";
import { Button } from "@swc-react/button";

import React from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";
import { startImageUpload, handleImageDrop, isValidDrag } from "../../sandbox/features/import/ui";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { ImportTool } from "../../sandbox/features/import/ui/ImportTool";
import { CanvasFittingTool } from "../../sandbox/features/canvas-fitting/ui/CanvasFittingTool";

import { Switch } from "@swc-react/switch";
import { useState } from "react";
import { downloadAllPages } from "../../sandbox/features/export/ui";

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
    const [watermarkOpacity, setWatermarkOpacity] = React.useState(100);
    const [watermarkScale, setWatermarkScale] = React.useState(100);

    // UI state: Watermark Position (Visual placeholders)
    const [watermarkPos, setWatermarkPos] = React.useState<string[]>([]);

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
            await sandboxProxy.fitToCanvas(fittingOption);
        } catch (e) {
            console.error("Fit to canvas failed", e);
        }
    };

    // Dummy handlers for UI consistency
    const handleExport = () => { };
    const handleRangeChange = () => { }; // Dummy for text inputs

    const handleOpenWatermark = () => setIsWatermarkDialogOpen(true);
    const handleCloseWatermark = () => setIsWatermarkDialogOpen(false);
    const handleApplyWatermark = () => setIsWatermarkDialogOpen(false); // Can be same as close for UI-only

    // Dummy Preset Handlers (UI-only state)
    const handlePresetIG = () => {
        setBulkWidth("1080");
        setBulkHeight("1350");
        setSelectedPreset("instagram");
    };

    const handlePresetFB = () => {
        setBulkWidth("1200");
        setBulkHeight("630");
        setSelectedPreset("facebook");
    };

    const toggleWatermarkPos = (pos: string) => {
        if (watermarkPos.includes(pos)) {
            setWatermarkPos(watermarkPos.filter(p => p !== pos));
        } else {
            setWatermarkPos([...watermarkPos, pos]);
        }
    };

    const toggleZipExport = () => setIsZipExport(!isZipExport);

    // Helper: Simulated Checkbox
    // Uses Blue-600 (#2563eb) for checked state, Slate-300 (#cbd5e1) for border
    const SimulatedCheckbox = ({ label, value }: { label: string, value: string }) => {
        const isChecked = watermarkPos.includes(value);
        return (
            <div
                onClick={() => toggleWatermarkPos(value)}
                style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            >
                <div style={{
                    width: "14px", height: "14px",
                    borderRadius: "2px",
                    border: `2px solid ${isChecked ? "#2563eb" : "#cbd5e1"}`,
                    backgroundColor: isChecked ? "#2563eb" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.1s ease"
                }}>
                    {isChecked && (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                            <path d="M1 5l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
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
                                    <Textfield type="text" inputMode="numeric" value="1" style={{ width: "100%" }} onInput={handleRangeChange} onChange={handleRangeChange}></Textfield>
                                </div>
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <span style={{ fontSize: "11px", color: "#334155" }}>To</span>
                                    <Textfield type="text" inputMode="numeric" value={`${TotalFiles}`} style={{ width: "100%" }} onInput={handleRangeChange} onChange={handleRangeChange}></Textfield>
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
                                    onClick={() => { }} // Dummy Apply handler
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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                Apply Watermark
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
                                Bulk Resize
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
                                <Textfield placeholder="Item Name - 01" style={{ width: "100%" }}></Textfield>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4) Reset All Button */}
                {(status !== 'idle' || hasActiveSession) && (
                    <div style={{ width: "100%", maxWidth: "320px", display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            variant="negative"
                            onClick={() => { }} // Dummy handler
                            style={{
                                height: "32px",
                                borderRadius: "4px",
                                fontSize: "13px"
                            }}
                        >
                            Reset All
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
                                    onClick={handleRangeChange} // Dummy handler
                                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
                                >
                                    <div style={{
                                        width: "100%",
                                        height: "80px",
                                        border: "2px dashed #cbd5e1",
                                        borderRadius: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "#f8fafc",
                                        color: "#64748b",
                                        fontSize: "12px",
                                        cursor: "pointer"
                                    }}>
                                        Click to browse files
                                    </div>
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
                                        <SimulatedCheckbox label="Top Left" value="tl" />
                                        <SimulatedCheckbox label="Top Right" value="tr" />
                                        <SimulatedCheckbox label="Bottom Left" value="bl" />
                                        <SimulatedCheckbox label="Bottom Right" value="br" />
                                    </div>
                                    <div style={{ marginTop: "4px" }}>
                                        <SimulatedCheckbox label="Center" value="c" />
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
                                            gap: "12px",
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
                                        <span style={{
                                            fontSize: "12px",
                                            fontWeight: selectedPreset === "instagram" ? "600" : "400",
                                            color: selectedPreset === "instagram" ? "#1e40af" : "#334155"
                                        }}>
                                            Instagram
                                        </span>
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
                                            gap: "12px",
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
                                        <span style={{
                                            fontSize: "12px",
                                            fontWeight: selectedPreset === "facebook" ? "600" : "400",
                                            color: selectedPreset === "facebook" ? "#1e40af" : "#334155"
                                        }}>
                                            Facebook
                                        </span>
                                    </div>
                                </div>

                                <span style={{ fontSize: "14px", color: "#64748b", textAlign: "center", fontWeight: "500" }}>
                                    or
                                </span>

                                {/* Dimensions */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "11px", color: "#334155" }}>Width (px)</span>
                                        <Textfield
                                            type="text"
                                            inputMode="numeric"
                                            value={bulkWidth}
                                            placeholder="1080"
                                            style={{ width: "100%" }}
                                            onInput={(e: any) => { setBulkWidth(e.target.value); setSelectedPreset(null); }}
                                        ></Textfield>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "11px", color: "#334155" }}>Height (px)</span>
                                        <Textfield
                                            type="text"
                                            inputMode="numeric"
                                            value={bulkHeight}
                                            placeholder="1080"
                                            style={{ width: "100%" }}
                                            onInput={(e: any) => { setBulkHeight(e.target.value); setSelectedPreset(null); }}
                                        ></Textfield>
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
                                <Button variant="cta" onClick={() => setIsBulkResizeDialogOpen(false)}>Apply</Button>
                            </div>
                        </div>
                    </div>
                )}
        </Theme>
    );
};

export default App;
