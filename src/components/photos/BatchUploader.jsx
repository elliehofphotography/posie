import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheetSelect from '@/components/ui/BottomSheetSelect';

export default function BatchUploader({ galleries, onDone }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]); // { file, preview, status: 'pending'|'uploading'|'done'|'error' }
  const [targetTemplateId, setTargetTemplateId] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [uploading, setUploading] = useState(false);

  const addFiles = (incoming) => {
    const imageFiles = Array.from(incoming).filter(f => f.type.startsWith('image/'));
    const newEntries = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...newEntries]);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const removeFile = (idx) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const templateOptions = [
    { value: '', label: 'None (upload without assigning)' },
    ...galleries.map(g => ({ value: g.id, label: g.name })),
    { value: '__new__', label: '+ Create new template…' },
  ];

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    // Resolve target template
    let templateId = targetTemplateId;
    if (targetTemplateId === '__new__') {
      const name = newTemplateName.trim() || 'Batch Upload';
      const newTemplate = await base44.entities.ShootTemplate.create({
        name,
        template_type: 'gallery',
        photo_count: 0,
      });
      templateId = newTemplate.id;
    }

    const target = galleries.find(g => g.id === templateId);
    let existingCount = 0;
    if (templateId && templateId !== '__new__') {
      const existing = await base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order');
      existingCount = existing.length;
    }

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i].file });
        if (templateId && templateId !== '__new__') {
          await base44.entities.TemplatePhoto.create({
            template_id: templateId,
            image_url: file_url,
            sort_order: existingCount + successCount,
          });
        } else if (templateId) {
          // newly created template
          await base44.entities.TemplatePhoto.create({
            template_id: templateId,
            image_url: file_url,
            sort_order: successCount,
          });
        }
        successCount++;
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f));
      } catch {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
      }
    }

    // Update template metadata
    if (templateId) {
      const allPhotos = await base44.entities.TemplatePhoto.filter({ template_id: templateId }, 'sort_order');
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: allPhotos.length,
        cover_image: allPhotos[0]?.image_url || target?.cover_image || '',
      });
    }

    queryClient.invalidateQueries({ queryKey: ['all_photos'] });
    queryClient.invalidateQueries({ queryKey: ['templates'] });
    setUploading(false);
    onDone?.();
  };

  const allDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error');
  const pending = files.filter(f => f.status === 'pending').length;

  return (
    <div className="mb-6">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 py-8 px-4 cursor-pointer transition-colors select-none ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:bg-muted/70'
        }`}
      >
        <Plus className={`w-7 h-7 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-dm text-sm text-foreground font-medium">
          {isDragging ? 'Drop images here' : 'Drag & drop images, or tap to browse'}
        </p>
        <p className="font-dm text-xs text-muted-foreground">Supports JPG, PNG, WEBP — multiple files at once</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-muted">
              <img src={f.preview} alt="" className="w-full h-full object-cover" />
              {/* Overlay per status */}
              {f.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {f.status === 'done' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              )}
              {f.status === 'error' && (
                <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                  <X className="w-5 h-5 text-white" />
                </div>
              )}
              {f.status === 'pending' && !uploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template selector + upload button */}
      {files.length > 0 && !allDone && (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <p className="font-dm text-xs text-muted-foreground uppercase tracking-wider">Assign to template</p>
            <BottomSheetSelect
              label="Template"
              value={targetTemplateId}
              onChange={setTargetTemplateId}
              options={templateOptions}
              placeholder="None"
            />
          </div>

          {targetTemplateId === '__new__' && (
            <input
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="New template name…"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 font-dm text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || pending === 0}
            className="w-full rounded-full bg-primary text-primary-foreground font-dm"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            ) : (
              `Upload ${pending} photo${pending !== 1 ? 's' : ''}${targetTemplateId && targetTemplateId !== '__new__' ? ' to template' : ''}`
            )}
          </Button>
        </div>
      )}

      {allDone && (
        <div className="mt-4 flex flex-col items-center gap-2 py-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <p className="font-dm text-sm text-foreground font-medium">
            {files.filter(f => f.status === 'done').length} photo{files.filter(f => f.status === 'done').length !== 1 ? 's' : ''} uploaded!
          </p>
          <button
            onClick={() => { setFiles([]); setTargetTemplateId(''); setNewTemplateName(''); }}
            className="font-dm text-xs text-primary hover:underline"
          >
            Upload more
          </button>
        </div>
      )}
    </div>
  );
}