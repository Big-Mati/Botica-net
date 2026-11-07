/**
 * Mapeo inteligente de imágenes WebP de medicamentos de alta resolución
 * disponibles en client/public/productos
 */
export function getProductImage(nombre) {
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

