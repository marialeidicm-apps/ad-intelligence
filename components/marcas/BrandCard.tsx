'use client';
import { Brand } from '@/lib/types';
import { getCountryLabel, getLanguageLabel, getObjectiveLabel, getPlatformLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Instagram, Edit2, Trash2, History, ExternalLink } from 'lucide-react';

interface BrandCardProps {
  brand: Brand;
  contentCount?: number;
  onEdit: (brand: Brand) => void;
  onDelete: (id: string) => void;
  onViewHistory: (brand: Brand) => void;
  onAnalyze?: (brand: Brand) => void;
}

const FLAG_MAP: Record<string, string> = {
  AR: '🇦🇷', MX: '🇲🇽', CL: '🇨🇱', CO: '🇨🇴',
  PE: '🇵🇪', UY: '🇺🇾', BR: '🇧🇷', US: '🇺🇸', ES: '🇪🇸',
};

export function BrandCard({ brand, contentCount = 0, onEdit, onDelete, onViewHistory, onAnalyze }: BrandCardProps) {
  const initials = brand.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const flag = FLAG_MAP[brand.country] ?? '🌎';

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-violet-600/40 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg"
          style={{ backgroundColor: brand.logoColor ?? '#7C3AED' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-ink truncate">{brand.name}</h3>
            <span className="text-base">{flag}</span>
          </div>
          <p className="text-xs text-ink-muted truncate">{brand.industry}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(brand)}
            className="w-7 h-7 rounded-lg hover:bg-surface flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(brand.id)}
            className="w-7 h-7 rounded-lg hover:bg-danger/10 flex items-center justify-center text-ink-dim hover:text-danger transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Info pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge variant="neutral" size="sm">{getPlatformLabel(brand.ecommercePlatform)}</Badge>
        <Badge variant="neutral" size="sm">{getLanguageLabel(brand.language)}</Badge>
        <Badge variant={brand.objective === 'ventas_tienda' ? 'violet' : 'success'} size="sm">
          {getObjectiveLabel(brand.objective)}
        </Badge>
      </div>

      {/* Redes */}
      {brand.socialNetworks.length > 0 && (
        <div className="flex gap-1.5 mb-4">
          {brand.socialNetworks.slice(0, 5).map(net => (
            <span key={net} className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-ink-dim capitalize">
              {net}
            </span>
          ))}
          {brand.socialNetworks.length > 5 && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-ink-dim">
              +{brand.socialNetworks.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Stats & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <button
          onClick={() => onViewHistory(brand)}
          className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink-muted transition-colors"
        >
          <History size={12} />
          <span>{contentCount} generados</span>
        </button>
        <div className="flex gap-2">
          {brand.instagramUsername && (
            <Button size="sm" variant="ghost" icon={<Instagram size={13} />} onClick={() => onAnalyze?.(brand)}>
              Analizar
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit(brand)}>
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
}
