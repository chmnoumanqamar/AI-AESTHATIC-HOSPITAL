import React, { useState } from 'react';
import { FileText, Image as ImageIcon, X, Eye, File } from 'lucide-react';

export interface AttachedFileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64
}

interface FileAttachmentDockProps {
  files: AttachedFileItem[];
  onRemoveFile?: (id: string) => void;
  readOnly?: boolean;
}

export const FileAttachmentDock: React.FC<FileAttachmentDockProps> = ({
  files,
  onRemoveFile,
  readOnly = false
}) => {
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (!files || files.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-[#121A0F] rounded-2xl border border-dashed border-emerald-500/40 text-xs">
        {files.map(file => {
          const isImage = file.type.startsWith('image/');
          const isPdf = file.type === 'application/pdf';

          return (
            <div
              key={file.id}
              className="flex items-center gap-2 p-1.5 pr-2 rounded-xl bg-white dark:bg-[#1F2C1B] border border-slate-200 dark:border-emerald-900/50 shadow-xs max-w-[240px] group transition-all"
            >
              {/* Thumbnail or File Icon */}
              {isImage ? (
                <div
                  onClick={() => setZoomImage(file.data)}
                  className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-black/40 shrink-0 cursor-pointer relative group/img"
                >
                  <img
                    src={file.data}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-3 h-3 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  {isPdf ? <FileText className="w-4 h-4 text-red-500" /> : <File className="w-4 h-4" />}
                </div>
              )}

              {/* Name & Size */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {file.name}
                </div>
                <div className="text-[9px] text-slate-400 dark:text-[#889980]">
                  {formatFileSize(file.size)}
                </div>
              </div>

              {/* Remove Button */}
              {!readOnly && onRemoveFile && (
                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/20">
            <img src={zoomImage} alt="Attachment Zoom" className="w-full h-full object-contain" />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
