import React from 'react';
import { Check } from 'lucide-react';
import TemplateCard from './TemplateCard';

export default function SelectableTemplateCard({ template, selected, onToggle, onDelete, onRename }) {
  return (
    <div className="relative">
      <div
        className={`absolute inset-0 z-10 rounded-2xl transition-all cursor-pointer ${selected ? 'ring-2 ring-primary' : ''}`}
        onClick={() => onToggle(template.id)}
      />
      {/* Checkbox overlay */}
      <button
        onClick={() => onToggle(template.id)}
        className={`absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all select-none ${
          selected
            ? 'bg-primary border-primary'
            : 'bg-black/30 border-white/70 backdrop-blur-sm'
        }`}
      >
        {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </button>
      <TemplateCard template={template} onDelete={onDelete} onRename={onRename} />
    </div>
  );
}