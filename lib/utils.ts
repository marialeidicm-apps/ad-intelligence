import { Brand, SocialNetwork, EcommercePlatform, Objective } from './types';

export const COUNTRIES = [
  { value: 'AR', label: 'Argentina' },
  { value: 'MX', label: 'México' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'PE', label: 'Perú' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'BR', label: 'Brasil' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'ES', label: 'España' },
];

export const LANGUAGES = [
  { value: 'es_rioplatense', label: 'Español rioplatense (vos)' },
  { value: 'es_neutro', label: 'Español neutro (usted)' },
  { value: 'es_mx', label: 'Español mexicano (tú)' },
  { value: 'es_es', label: 'Español España' },
  { value: 'en_us', label: 'Inglés americano' },
  { value: 'en_uk', label: 'Inglés británico' },
  { value: 'pt_br', label: 'Portugués brasileño' },
];

export const SOCIAL_NETWORKS: { value: SocialNetwork; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
];

export const ECOMMERCE_PLATFORMS: { value: EcommercePlatform; label: string }[] = [
  { value: 'tiendanube', label: 'Tienda Nube' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'mercadoshops', label: 'Mercado Shops' },
  { value: 'otro', label: 'Otro' },
];

export const OBJECTIVES: { value: Objective; label: string; description: string }[] = [
  { value: 'ventas_tienda', label: 'Ventas en tienda', description: 'Derivar tráfico a la tienda online' },
  { value: 'mensajeria_mayorista', label: 'Mensajería mayorista', description: 'Captar compradores por WhatsApp/DM' },
];

export const INDUSTRIES = [
  'Indumentaria',
  'Calzado',
  'Accesorios y bijouterie',
  'Belleza y cosmética',
  'Cuidado personal',
  'Alimentación y bebidas',
  'Decoración del hogar',
  'Tecnología',
  'Deportes y fitness',
  'Libros y papelería',
  'Juguetes y niños',
  'Mascotas',
  'Joyería',
  'Arte y diseño',
  'Servicios de salud',
  'Educación',
  'Turismo',
  'Gastronomía',
  'Otro',
];

export const BRAND_COLORS = [
  '#7C3AED', '#2563EB', '#DC2626', '#D97706',
  '#059669', '#DB2777', '#7C3AED', '#0891B2',
];

export function getCountryLabel(code: string): string {
  return COUNTRIES.find(c => c.value === code)?.label ?? code;
}

export function getLanguageLabel(code: string): string {
  return LANGUAGES.find(l => l.value === code)?.label ?? code;
}

export function getObjectiveLabel(obj: Objective): string {
  return OBJECTIVES.find(o => o.value === obj)?.label ?? obj;
}

export function getPlatformLabel(p: EcommercePlatform): string {
  return ECOMMERCE_PLATFORMS.find(e => e.value === p)?.label ?? p;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins}min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return formatDate(iso);
}

export function buildBrandContext(brand: Brand): string {
  return `
MARCA: ${brand.name}
RUBRO: ${brand.industry}
PAÍS: ${getCountryLabel(brand.country)}
IDIOMA/VARIANTE: ${getLanguageLabel(brand.language)}
PLATAFORMA: ${getPlatformLabel(brand.ecommercePlatform)}
OBJETIVO: ${getObjectiveLabel(brand.objective)}
REDES: ${brand.socialNetworks.join(', ')}

PERFIL DE VOZ:
- Tono: ${brand.voiceProfile.tone}
- Frases características: ${brand.voiceProfile.characteristicPhrases}
- Palabras que NUNCA usa: ${brand.voiceProfile.bannedWords}
- Emojis: ${brand.voiceProfile.emojis}
- Cliente ideal: ${brand.voiceProfile.idealCustomer}
`.trim();
}

export function getSeasonAR(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'otoño';
  if (month >= 6 && month <= 8) return 'invierno';
  if (month >= 9 && month <= 11) return 'primavera';
  return 'verano';
}

export function getCurrentMonthAR(): string {
  return new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}
