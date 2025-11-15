/**
 * Import Data Dialog Component
 *
 * Provides a user interface for importing previously exported data.
 * Includes file upload, validation, preview, and confirmation.
 */

'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, FileJson, Loader2, Upload } from 'lucide-react';
import {
  readDataFile,
  validateImportData,
  importDataFromFile,
  getDataSummary,
  type ExportDataFile,
  type ValidationResult,
} from '@/lib/services/dataPortabilityService';

export interface ImportDataDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when the dialog open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Callback when import is successful
   */
  onImportSuccess?: () => void;

  /**
   * Callback when import fails
   */
  onImportError?: (error: string) => void;
}

type ImportState = 'idle' | 'validating' | 'valid' | 'invalid' | 'importing' | 'success' | 'error';

/**
 * Import Data Dialog Component
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <ImportDataDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   onImportSuccess={() => {
 *     router.push('/dashboard');
 *   }}
 * />
 * ```
 */
export function ImportDataDialog({
  open,
  onOpenChange,
  onImportSuccess,
  onImportError,
}: ImportDataDialogProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [_file, setFile] = useState<File | null>(null);
  const [exportData, setExportData] = useState<ExportDataFile | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setState('validating');
    setError(null);

    try {
      // Read and parse file
      const data = await readDataFile(selectedFile);
      setExportData(data);

      // Validate data
      const validationResult = validateImportData(data);
      setValidation(validationResult);

      if (validationResult.isValid) {
        setState('valid');
      } else {
        setState('invalid');
        setError(validationResult.errors.join(', '));
      }
    } catch (err) {
      setState('error');
      const errorMessage = err instanceof Error ? err.message : 'Failed to read file';
      setError(errorMessage);
      if (onImportError) {
        onImportError(errorMessage);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/json') {
      handleFileSelect(droppedFile);
    } else {
      setError('Please drop a valid JSON file');
      setState('error');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    if (!exportData) return;

    setState('importing');
    setError(null);

    try {
      await importDataFromFile(exportData);
      setState('success');

      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        if (onImportSuccess) {
          onImportSuccess();
        }
        handleClose();
      }, 1500);
    } catch (err) {
      setState('error');
      const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
      setError(errorMessage);
      if (onImportError) {
        onImportError(errorMessage);
      }
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setState('idle');
    setFile(null);
    setExportData(null);
    setValidation(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const summary = exportData ? getDataSummary(exportData) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Import your previously exported well-being plan data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {state === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:border-muted-foreground/50"
              onClick={handleBrowseClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBrowseClick();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Drop your data file here or click to browse"
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium">Drop your data file here</p>
              <p className="mb-4 text-xs text-muted-foreground">or click to browse</p>
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                <FileJson className="mr-2 h-4 w-4" />
                Select JSON File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Select data file"
              />
            </div>
          )}

          {/* Validating State */}
          {state === 'validating' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validating file...</p>
            </div>
          )}

          {/* Valid State - Show Preview */}
          {state === 'valid' && summary && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-green-zone bg-green-zone/10 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-zone" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-zone">File validated successfully</p>
                  <p className="mt-1 text-sm text-muted-foreground">Ready to import your data</p>
                </div>
              </div>

              {/* Data Summary */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-3 text-sm font-semibold">Data Summary</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Export Date:</dt>
                    <dd className="font-medium">
                      {new Date(summary.exportDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Check-ins:</dt>
                    <dd className="font-medium">{summary.checkInsCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Coping Strategies:</dt>
                    <dd className="font-medium">{summary.copingStrategiesCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">User Settings:</dt>
                    <dd className="font-medium">{summary.userConfigCount}</dd>
                  </div>
                </dl>
              </div>

              {/* Warnings */}
              {validation?.warnings && validation.warnings.length > 0 && (
                <div className="rounded-lg border border-uvm-gold bg-uvm-gold/10 p-4">
                  <p className="text-sm font-medium text-uvm-gold">Warnings:</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Invalid/Error State */}
          {(state === 'invalid' || state === 'error') && error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Import Failed</p>
                <p className="mt-1 text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          )}

          {/* Importing State */}
          {state === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Importing data...</p>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="mb-4 h-12 w-12 text-green-zone" />
              <p className="text-sm font-medium text-green-zone">Import successful!</p>
              <p className="mt-1 text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {state === 'idle' || state === 'invalid' || state === 'error' ? (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          ) : null}

          {state === 'valid' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport}>Import Data</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
