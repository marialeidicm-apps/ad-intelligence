import { Account, AdIdea, Formato } from './types';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

type RubroCategory =
  | 'moda'
  | 'tech'
  | 'alimentos'
  | 'belleza'
  | 'hogar'
  | 'deportes'
  | 'ninos'
  | 'mascotas'
  | 'construccion'
  | 'generic';

function getRubroCategory(rubro: string): RubroCategory {
  const r = rubro.toLowerCase();
  if (r.match(/moda|ropa|textil|indumentaria|calzado|vestimenta/)) return 'moda';
  if (r.match(/electr|tecno|comput|celular|digital|gadget/)) return 'tech';
  if (r.match(/aliment|comida|gastro|bebida|gourmet|panadería|carnicería/)) return 'alimentos';
  if (r.match(/belleza|cosmét|cosmet|estética|estetic|peluquería|spa|perfum/)) return 'belleza';
  if (r.match(/hogar|deco|mueble|casa|living|cocina|baño/)) return 'hogar';
  if (r.match(/deporte|fitness|gym|sport|outdoor|running/)) return 'deportes';
  if (r.match(/niño|nino|juguete|bebe|bebé|infantil|maternidad/)) return 'ninos';
  if (r.match(/mascota|perro|gato|veterinaria|pet|acuario/)) return 'mascotas';
  if (r.match(/ferret|construc|herramienta|pintura|madera|plomería/)) return 'construccion';
  return 'generic';
}

interface CategoryConfig {
  productoEjemplo: string;
  dolorCliente: string;
  beneficioClave: string;
  contextoPedido: string;
}

const categoryConfigs: Record<RubroCategory, CategoryConfig> = {
  moda: {
    productoEjemplo: 'ropa y accesorios de temporada',
    dolorCliente: 'encontrar prendas de calidad a precios accesibles',
    beneficioClave: 'diseños exclusivos con materiales premium',
    contextoPedido: 'talles disponibles y colecciones',
  },
  tech: {
    productoEjemplo: 'equipos y accesorios tecnológicos',
    dolorCliente: 'conseguir tecnología confiable sin pagar de más',
    beneficioClave: 'garantía real y soporte técnico incluido',
    contextoPedido: 'modelos disponibles y especificaciones',
  },
  alimentos: {
    productoEjemplo: 'productos frescos y seleccionados',
    dolorCliente: 'conseguir calidad consistente en cada pedido',
    beneficioClave: 'productos frescos con trazabilidad garantizada',
    contextoPedido: 'lotes disponibles y condiciones de envío',
  },
  belleza: {
    productoEjemplo: 'productos de belleza y cuidado personal',
    dolorCliente: 'encontrar cosméticos que realmente funcionen',
    beneficioClave: 'fórmulas probadas y resultados visibles',
    contextoPedido: 'líneas disponibles y descuentos por volumen',
  },
  hogar: {
    productoEjemplo: 'artículos de decoración y hogar',
    dolorCliente: 'decorar con estilo sin gastar una fortuna',
    beneficioClave: 'diseño y funcionalidad al mejor precio',
    contextoPedido: 'catálogo completo y opciones de envío',
  },
  deportes: {
    productoEjemplo: 'equipamiento deportivo y ropa técnica',
    dolorCliente: 'encontrar equipamiento que aguante el entrenamiento real',
    beneficioClave: 'materiales técnicos con rendimiento probado',
    contextoPedido: 'talles, colores y stock disponible',
  },
  ninos: {
    productoEjemplo: 'juguetes y artículos infantiles',
    dolorCliente: 'encontrar juguetes seguros y que entretengan de verdad',
    beneficioClave: 'productos certificados con foco en el desarrollo',
    contextoPedido: 'edades recomendadas y disponibilidad',
  },
  mascotas: {
    productoEjemplo: 'alimentos y accesorios para mascotas',
    dolorCliente: 'encontrar todo para tu mascota en un solo lugar',
    beneficioClave: 'nutrición y bienestar animal garantizado',
    contextoPedido: 'razas, tamaños y frecuencia de pedido',
  },
  construccion: {
    productoEjemplo: 'materiales y herramientas de construcción',
    dolorCliente: 'conseguir materiales de calidad sin demoras en la obra',
    beneficioClave: 'materiales certificados con entrega en plazo',
    contextoPedido: 'volúmenes, especificaciones y plazos de entrega',
  },
  generic: {
    productoEjemplo: 'productos especializados del rubro',
    dolorCliente: 'encontrar un proveedor confiable y de calidad',
    beneficioClave: 'calidad garantizada y atención personalizada',
    contextoPedido: 'disponibilidad y condiciones comerciales',
  },
};

export function generateIdeas(account: Account): AdIdea[] {
  const { nombre, rubro, objetivo } = account;
  const esTienda = objetivo === 'ventas_tienda';
  const category = getRubroCategory(rubro);
  const cfg = categoryConfigs[category];

  const cta = esTienda ? 'Visitanos en tienda' : 'Escribinos por WhatsApp';
  const ctaUrgente = esTienda ? '¡Vení hoy a la tienda!' : '¡Escribinos ahora por WhatsApp!';
  const audiencia = esTienda ? 'compradores retail' : 'revendedores y mayoristas';
  const ventajaLogistica = esTienda
    ? 'retiro inmediato en tienda'
    : 'despacho rápido con pedido mínimo accesible';
  const hashtagObjetivo = esTienda ? 'compralocal tiendafisica' : 'mayorista proveedores revendedores';

  const rubroHashtag = rubro.replace(/\s+/g, '').replace(/[áéíóú]/g, (c) =>
    ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[c] ?? c)
  );

  const now = new Date().toISOString();

  const ideas: AdIdea[] = [
    // ─── 1. PROBLEMA → SOLUCIÓN (Reel) ───────────────────────────────────────
    {
      id: uid(),
      accountId: account.id,
      titulo: `El problema de ${cfg.dolorCliente} — resuelto`,
      hook: `¿Cuánto tiempo perdiste intentando ${cfg.dolorCliente}? Esto se acabó. 👇`,
      formato: 'Reel' as Formato,
      script: `[0–3s] 📷 Escena de frustración: cliente con cara de duda, pila de productos sin calidad o pantalla de búsqueda interminable
[3–8s] 💬 Texto animado en pantalla: "¿Te pasó esto?" → pausa de 1 segundo
[8–15s] 🎬 Transición rápida (cut o swipe) → mostrar ${nombre}: local/producto limpio, bien exhibido, profesional
[15–22s] ⚡ 3 checks animados en pantalla:
  ✅ ${cfg.beneficioClave}
  ✅ Precios claros y justos
  ✅ ${ventajaLogistica}
[22–27s] 😊 Clip de cliente satisfecho usando/recibiendo el producto — o texto de reseña real
[27–30s] 📲 Logo ${nombre} + CTA: "${cta} → Link en bio"`,
      caption: `¿Cansado de ${cfg.dolorCliente}? 🙅‍♀️

En ${nombre} eso no existe:
✅ ${cfg.beneficioClave}
✅ Atención real, sin vueltas
✅ ${ventajaLogistica.charAt(0).toUpperCase() + ventajaLogistica.slice(1)}

👇 ${cta}

#${rubroHashtag} #calidad #${hashtagObjetivo.split(' ')[0]}`,
      cta: `${cta} → Link en bio`,
      createdAt: now,
    },

    // ─── 2. ANTES / DESPUÉS (Carrusel) ────────────────────────────────────────
    {
      id: uid(),
      accountId: account.id,
      titulo: `Antes y después de elegir ${nombre}`,
      hook: `Esto es lo que cambia cuando por fin encontrás el proveedor de ${rubro} que siempre buscaste.`,
      formato: 'Carrusel' as Formato,
      script: `[Diap. 1 — Portada] Fondo oscuro, tipografía bold:
"¿Seguís eligiendo mal tu ${rubro}?" — subtítulo: "Deslizá y descubrí la diferencia 👉"

[Diap. 2 — ANTES] Lista de dolores del cliente:
❌ Precios que no cierran
❌ Calidad inconsistente
❌ ${esTienda ? 'Ningún lugar de confianza cerca' : 'Proveedores que no cumplen los plazos'}
❌ Atención fría o inexistente

[Diap. 3 — El quiebre] Fondo de color vibrante:
"Hasta que conocieron ${nombre}..."
Flecha grande → transición al siguiente slide

[Diap. 4 — DESPUÉS] Lista de beneficios reales:
✅ ${cfg.beneficioClave}
✅ Precio justo con transparencia total
✅ ${ventajaLogistica.charAt(0).toUpperCase() + ventajaLogistica.slice(1)}
✅ Alguien que realmente te asesora

[Diap. 5 — Prueba social] Foto del producto/local + dato de autoridad:
"[X]+ clientes de ${rubro} ya eligieron ${nombre}"
Frase real de un cliente si tenés

[Diap. 6 — CTA] Fondo brand, CTA claro:
"Sumáte a los que ya eligieron bien"
📲 ${cta} | @${nombre.replace(/\s+/g, '').toLowerCase()}`,
      caption: `La diferencia la hacen los detalles ✨

→ Deslizá y guardá este post para cuando necesites ${cfg.productoEjemplo}.

Nuestros clientes no volvieron atrás después de conocernos. ¿Serás el próximo?

📲 ${cta}

#${rubroHashtag} #${esTienda ? 'tienda' : 'mayorista'} #proveedorconfiable #${rubroHashtag}`,
      cta: `${cta} — Sin compromiso`,
      createdAt: now,
    },

    // ─── 3. PRUEBA SOCIAL / TESTIMONIALES (Reel) ──────────────────────────────
    {
      id: uid(),
      accountId: account.id,
      titulo: `Lo que dicen los ${audiencia} que eligen ${nombre}`,
      hook: `[X]+ ${audiencia} ya confían en ${nombre}. Esto es lo que cuentan. 🎤`,
      formato: 'Reel' as Formato,
      script: `[0–4s] 🌟 Animación de estrellas → texto: "★★★★★ +[X] clientes satisfechos"

[4–11s] 💬 Testimonio 1 en pantalla (tipografía grande, fondo limpio):
"[Nombre del cliente] — ${esTienda ? '"Siempre tienen lo que busco y la atención es increíble"' : '"Trabajo con ellos hace 2 años. Entrega puntual y calidad garantizada en cada pedido."'}"

[11–19s] 🎬 B-roll del producto estrella de ${rubro} en uso real / exhibición atractiva

[19–25s] 💬 Testimonio 2:
"[Nombre] — ${esTienda ? '"El lugar de confianza para mis compras de ' + rubro + '"' : '"Desde que trabajo con ' + nombre + ', mi negocio creció 30%. No busco otro proveedor."'}"

[25–28s] 📊 Dato de autoridad:
"[X] años en el rubro — [X]+ clientes — [X] envíos por mes"

[28–30s] 📲 Logo + "${cta}"`,
      caption: `Hablamos menos, mostramos más 💪

Nuestros clientes de ${rubro} son la mejor publicidad que tenemos:

⭐ "${esTienda ? 'Atención excelente y variedad increíble' : 'El mejor mayorista que encontré, siempre cumplen'}"
⭐ "${esTienda ? 'Precios justos y calidad de primera' : 'Pedido, entrega, factura. Todo perfecto'}"
⭐ "${esTienda ? 'El lugar al que siempre vuelvo' : 'En 2 años nunca me fallaron — eso no tiene precio'}"

¿Querés ser el próximo? 👇
📲 ${cta}

#${rubroHashtag} #testimonios #clientessatisfechos`,
      cta: `${cta} — Unite a la comunidad`,
      createdAt: now,
    },

    // ─── 4. URGENCIA / OFERTA FLASH (Story) ───────────────────────────────────
    {
      id: uid(),
      accountId: account.id,
      titulo: `Oferta flash en ${rubro} — Solo esta semana`,
      hook: `¡ATENCIÓN! Esta semana hay una oportunidad única en ${nombre} que no podés perderte. ⏰`,
      formato: 'Story' as Formato,
      script: `[0–2s] 🔴 Texto animado grande con fondo rojo/naranja vibrante:
"¡OFERTA ESPECIAL! — Solo por tiempo limitado"

[2–7s] 📦 Mostrar producto destacado de ${rubro} con precio tachado → precio nuevo
Subtexto: "Calidad premium, precio de oportunidad"

[7–13s] ✅ Lista de beneficios rápidos (texto aparece uno por uno):
→ ${cfg.beneficioClave}
→ ${ventajaLogistica.charAt(0).toUpperCase() + ventajaLogistica.slice(1)}
→ ${esTienda ? 'Retiro el mismo día' : 'Factura y envío incluidos'}

[13–20s] ⏰ Elemento de urgencia visual:
Contador regresivo O texto: "Válido hasta el [fecha] — Stock limitado: quedan X unidades"

[20–27s] 📱 ${esTienda ? 'Dirección de tienda + horarios de atención' : 'Número de WhatsApp grande + flecha animada apuntando'}

[27–30s] 🎯 CTA final en pantalla completa:
"${ctaUrgente}"`,
      caption: `⏰ Solo por esta semana en ${nombre}!

🔥 Descuento especial en ${cfg.productoEjemplo}
📦 Stock limitado
⚡ ${ventajaLogistica.charAt(0).toUpperCase() + ventajaLogistica.slice(1)}

❌ No dejes para mañana lo que podés aprovechar HOY.

👇 ${cta} antes que se acabe

#oferta #${rubroHashtag} #liquidacion #${hashtagObjetivo.split(' ')[0]} #oportunidad`,
      cta: `${ctaUrgente} — Oferta limitada`,
      createdAt: now,
    },

    // ─── 5. EDUCATIVO / GUÍA DE COMPRA (Carrusel) ────────────────────────────
    {
      id: uid(),
      accountId: account.id,
      titulo: `3 errores al comprar ${rubro} (y cómo evitarlos)`,
      hook: `Antes de gastar en ${rubro}, leé esto. Te va a ahorrar tiempo y plata. 📖`,
      formato: 'Carrusel' as Formato,
      script: `[Diap. 1 — Gancho] Tipografía llamativa, fondo de color:
"3 ERRORES que todos cometen al comprar ${rubro}"
Subtítulo: "Deslizá → Guardá → Ahorrá tiempo y plata 💰"

[Diap. 2 — Error #1] Ícono ❌ + título bold:
"No verificar la calidad del producto"
Descripción: Lo barato sale caro. Un proveedor sin respaldo te deja sin stock en el momento más crítico.
Tip: Pedí siempre muestras o garantía antes de comprometerte.

[Diap. 3 — Error #2] Ícono ❌ + título bold:
"Elegir solo por precio, sin mirar el valor total"
Descripción: El precio más bajo no incluye servicio, plazo de entrega ni soporte. Calculá el costo real.
Tip: Comparás peras con peras solo cuando las condiciones son iguales.

[Diap. 4 — Error #3] Ícono ❌ + título bold:
"${esTienda ? 'No tener un lugar de referencia cerca' : 'No consolidar proveedores confiables a largo plazo'}"
Descripción: ${esTienda ? 'Comprar en cualquier lado sin fidelidad te quita poder de negociación.' : 'Cambiar de proveedor constantemente genera inconsistencia en tu negocio.'}
Tip: La relación a largo plazo siempre beneficia a las dos partes.

[Diap. 5 — Solución] Fondo brand, tono más cálido:
"En ${nombre} te ayudamos a evitar todo esto."
Brief de propuesta de valor: ${cfg.beneficioClave} + ${cfg.contextoPedido}

[Diap. 6 — CTA] Llamado final:
"¿Tenés dudas sobre ${cfg.contextoPedido}?"
📲 ${cta} — Asesoramiento sin cargo`,
      caption: `Guía rápida para no equivocarte en ${rubro} 📌

→ Guardá este carrusel antes de tu próxima compra.

En ${nombre} nos especializamos en ${cfg.productoEjemplo} para ${audiencia}. Si tenés dudas, escribinos sin compromiso.

📲 ${cta}

#tips #${rubroHashtag} #guia #${hashtagObjetivo.split(' ')[0]} #comprasmart`,
      cta: `${cta} — Asesoramiento sin cargo`,
      createdAt: now,
    },
  ];

  return ideas;
}
