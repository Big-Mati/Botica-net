/**
 * Catálogo oficial de imágenes WebP existentes en client/public/productos
 * Cumple PLAN.md Sección 2.D: Selector visual sin cargas multipart/form-data
 */
export const PRODUCT_IMAGE_CATALOG = [
  { id: 'paracetamol', label: 'Paracetamol Tabletas', path: '/productos/paracetamol.webp' },
  { id: 'amoxicilina', label: 'Amoxicilina Cápsulas', path: '/productos/amoxicilina.webp' },
  { id: 'ibuprofeno', label: 'Ibuprofeno Comp.', path: '/productos/ibuprofeno.webp' },
  { id: 'azitromicina', label: 'Azitromicina 500mg', path: '/productos/azitromicina.webp' },
  { id: 'omeprazol', label: 'Omeprazol Cápsulas', path: '/productos/omeprazol.webp' },
  { id: 'loratadina', label: 'Loratadina Antialérgico', path: '/productos/loratadina.webp' },
  { id: 'salbutamol', label: 'Salbutamol Inhalador', path: '/productos/salbutamol.webp' },
  { id: 'alcohol', label: 'Alcohol Medicinal', path: '/productos/alcohol.webp' },
  { id: 'termometro', label: 'Termómetro Clínico', path: '/productos/termometro.webp' },
  { id: 'gasas_esteriles', label: 'Gasas Estériles', path: '/productos/gasas_esteriles.webp' },
  { id: 'vitamina_c', label: 'Vitamina C Tubo', path: '/productos/vitamina_c.webp' }
];

const STORAGE_KEY = 'botica_product_image_map_v1';

function readCustomImageMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomProductImage(idProducto, nombre, imagePath) {
  if (!imagePath) return;
  try {
    const map = readCustomImageMap();
    if (idProducto) {
      map[`id:${idProducto}`] = imagePath;
    }
    if (nombre) {
      const cleanName = nombre.trim().toLowerCase();
      map[`name:${cleanName}`] = imagePath;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Fallback silencioso si el navegador restringe storage
  }
}

/**
 * Mapeo determinístico de imágenes WebP de medicamentos de alta resolución
 * disponibles en client/public/productos
 */
export function getProductImage(nombre, idProducto) {
  const customMap = readCustomImageMap();
  if (idProducto && customMap[`id:${idProducto}`]) {
    return customMap[`id:${idProducto}`];
  }
  if (nombre) {
    const cleanName = nombre.trim().toLowerCase();
    if (customMap[`name:${cleanName}`]) {
      return customMap[`name:${cleanName}`];
    }
  }

  if (!nombre) return '/favicon.svg';
  const n = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (n.includes('paracetamol')) return '/productos/paracetamol.webp';
  if (n.includes('amoxicilina')) return '/productos/amoxicilina.webp';
  if (n.includes('ibuprofeno')) return '/productos/ibuprofeno.webp';
  if (n.includes('azitromicina')) return '/productos/azitromicina.webp';
  if (n.includes('omeprazol')) return '/productos/omeprazol.webp';
  if (n.includes('loratadina')) return '/productos/loratadina.webp';
  if (n.includes('salbutamol')) return '/productos/salbutamol.webp';
  if (n.includes('alcohol')) return '/productos/alcohol.webp';
  if (n.includes('termometro')) return '/productos/termometro.webp';
  if (n.includes('gasa')) return '/productos/gasas_esteriles.webp';
  if (n.includes('vitamina')) return '/productos/vitamina_c.webp';

  return '/favicon.svg';
}
