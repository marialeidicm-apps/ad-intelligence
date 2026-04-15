export type Objetivo = 'ventas_tienda' | 'mensajeria_mayorista';
export type Formato = 'Reel' | 'Story' | 'Carrusel';
export type ActiveView = 'cuentas' | 'generador' | 'historial';

export interface Account {
  id: string;
  nombre: string;
  rubro: string;
  objetivo: Objetivo;
  color: string;
  createdAt: string;
}

export interface AdIdea {
  id: string;
  accountId: string;
  titulo: string;
  hook: string;
  formato: Formato;
  script: string;
  caption: string;
  cta: string;
  createdAt: string;
}

export interface GeneratedSet {
  id: string;
  accountId: string;
  ideas: AdIdea[];
  createdAt: string;
}
