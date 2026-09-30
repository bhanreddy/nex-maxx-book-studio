export type PreflightSeverity = "error" | "warning" | "info";

export interface PreflightIssue {
  id: string;
  severity: PreflightSeverity;
  category: "resolution" | "geometry" | "text" | "font" | "asset" | "structure";
  title: string;
  message: string;
  pageIndex?: number;
  pageId?: string;
  elementId?: string;
  elementName?: string;
  remediation?: string;
}

export interface PreflightReport {
  timestamp: string;
  isValidForPrint: boolean;
  errorCount: number;
  warningCount: number;
  issues: PreflightIssue[];
  metrics: {
    totalPages: number;
    totalElements: number;
    imageCount: number;
    lowDpiImageCount: number;
    textOverflowCount: number;
    elementsOutsideBleedCount: number;
    emptyPagesCount: number;
  };
}

export type ExportPreset =
  | "Commercial Print"
  | "Office Print"
  | "High Quality Digital"
  | "Compressed Digital"
  | "Review Copy";

export interface ExportConfig {
  preset: ExportPreset;
  format: "pdf" | "images" | "html";
  includeBleed: boolean;
  includeCropMarks: boolean;
  includeColorBars: boolean;
  pageRange: "all" | "current" | "custom";
  customPages?: number[];
  colorProfile: "CMYK" | "RGB";
  targetDpi: number; // 300 for commercial, 150 for digital
  generateClickableToc: boolean;
}
