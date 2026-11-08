/**
 * Generador nativo de Matriz QR ISO/IEC 18004 (Modo Byte · Nivel ECC L · Versiones 1 a 6).
 * 100% autónomo y offline (cero llamadas a red externa y cero dependencias npm).
 * Soporta URLs de hasta 134 bytes UTF-8 (ej: http://192.168.137.1:5173/?visor=cliente).
 */

const VERSION_SPECS = [
  null,
  { size: 21, blocks: 1, dataPerBlock: 19, ecPerBlock: 7, align: [] },
  { size: 25, blocks: 1, dataPerBlock: 34, ecPerBlock: 10, align: [6, 18] },
  { size: 29, blocks: 1, dataPerBlock: 55, ecPerBlock: 15, align: [6, 22] },
  { size: 33, blocks: 1, dataPerBlock: 80, ecPerBlock: 20, align: [6, 26] },
  { size: 37, blocks: 1, dataPerBlock: 108, ecPerBlock: 26, align: [6, 30] },
  { size: 41, blocks: 2, dataPerBlock: 68, ecPerBlock: 18, align: [6, 34] }
];

function gfMul(a, b) {
  let res = 0;
  let x = a;
  let y = b;
  for (let i = 0; i < 8; i += 1) {
    if (y & 1) res ^= x;
    const hi = x & 0x80;
    x = (x << 1) & 0xff;
    if (hi) x ^= 0x1d;
    y >>= 1;
  }
  return res;
}

function rsDivisor(degree) {
  let poly = [1];
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
    root = gfMul(root, 2);
  }
  return poly.slice(1);
}

function rsRemainder(dataBytes, degree) {
  const divisor = rsDivisor(degree);
  const rem = new Uint8Array(degree);
  for (let i = 0; i < dataBytes.length; i += 1) {
    const factor = dataBytes[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[degree - 1] = 0;
    for (let j = 0; j < degree; j += 1) {
      rem[j] ^= gfMul(divisor[j], factor);
    }
  }
  return Array.from(rem);
}

function maskCondition(mask, r, c) {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }
}

function drawFormatInfo(grid, size, mask) {
  // Nivel ECC L = 01 en estándar ISO/IEC 18004
  const data = (0b01 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) {
    rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  }
  const bits = ((data << 10) | rem) ^ 0x5412;
  const getBit = (idx) => (bits >> idx) & 1;

  for (let i = 0; i <= 5; i += 1) grid[i][8] = getBit(i);
  grid[7][8] = getBit(6);
  grid[8][8] = getBit(7);
  grid[8][7] = getBit(8);
  for (let i = 9; i <= 14; i += 1) grid[8][14 - i] = getBit(i);

  for (let i = 0; i <= 7; i += 1) grid[8][size - 1 - i] = getBit(i);
  for (let i = 8; i <= 14; i += 1) grid[size - 15 + i][8] = getBit(i);
  grid[size - 8][8] = 1;
}

function computePenalty(grid, size) {
  let penalty = 0;

  // Regla 1: Rachas de >= 5 módulos iguales en filas y columnas
  for (let r = 0; r < size; r += 1) {
    let runLen = 1;
    for (let c = 1; c < size; c += 1) {
      if (grid[r][c] === grid[r][c - 1]) {
        runLen += 1;
        if (runLen === 5) penalty += 3;
        else if (runLen > 5) penalty += 1;
      } else {
        runLen = 1;
      }
    }
  }

  for (let c = 0; c < size; c += 1) {
    let runLen = 1;
    for (let r = 1; r < size; r += 1) {
      if (grid[r][c] === grid[r - 1][c]) {
        runLen += 1;
        if (runLen === 5) penalty += 3;
        else if (runLen > 5) penalty += 1;
      } else {
        runLen = 1;
      }
    }
  }

  // Regla 2: Bloques homogéneos 2x2
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const v = grid[r][c];
      if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) {
        penalty += 3;
      }
    }
  }

  return penalty;
}

export function generateQrMatrix(text) {
  const payload = new TextEncoder().encode(String(text || ''));

  let spec = null;
  for (let v = 1; v <= 6; v += 1) {
    const candidate = VERSION_SPECS[v];
    const maxCapacityBytes = candidate.blocks * candidate.dataPerBlock - 2;
    if (payload.length <= maxCapacityBytes) {
      spec = candidate;
      break;
    }
  }

  if (!spec) {
    return null;
  }

  const totalDataCodewords = spec.blocks * spec.dataPerBlock;
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i -= 1) {
      bits.push((val >> i) & 1);
    }
  };

  // Modo Byte (0100) + longitud de 8 bits + bytes UTF-8
  pushBits(0b0100, 4);
  pushBits(payload.length, 8);
  for (let i = 0; i < payload.length; i += 1) {
    pushBits(payload[i], 8);
  }

  const maxBits = totalDataCodewords * 8;
  const termCount = Math.min(4, maxBits - bits.length);
  pushBits(0, termCount);
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b += 1) {
      byte = (byte << 1) | bits[i + b];
    }
    dataCodewords.push(byte);
  }

  let padToggle = true;
  while (dataCodewords.length < totalDataCodewords) {
    dataCodewords.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  // Bloques Reed-Solomon e intercalado
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < spec.blocks; b += 1) {
    const block = dataCodewords.slice(offset, offset + spec.dataPerBlock);
    offset += spec.dataPerBlock;
    dataBlocks.push(block);
    ecBlocks.push(rsRemainder(block, spec.ecPerBlock));
  }

  const finalCodewords = [];
  for (let i = 0; i < spec.dataPerBlock; i += 1) {
    for (let b = 0; b < spec.blocks; b += 1) {
      finalCodewords.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i += 1) {
    for (let b = 0; b < spec.blocks; b += 1) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  const { size, align } = spec;
  const baseGrid = Array.from({ length: size }, () => new Uint8Array(size));
  const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

  const placeFinder = (topR, topC) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const r = topR + dr;
        const c = topC + dc;
        if (r >= 0 && r < size && c >= 0 && c < size) {
          isFunc[r][c] = 1;
          const inBox = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
          const isRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          baseGrid[r][c] = inBox && (isRing || isCenter) ? 1 : 0;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Patrón de alineación (5x5)
  for (let i = 0; i < align.length; i += 1) {
    for (let j = 0; j < align.length; j += 1) {
      const cr = align[i];
      const cc = align[j];
      const overlapsFinder =
        (cr === 6 && cc === 6) ||
        (cr === 6 && cc === size - 7) ||
        (cr === size - 7 && cc === 6);
      if (!overlapsFinder) {
        for (let dr = -2; dr <= 2; dr += 1) {
          for (let dc = -2; dc <= 2; dc += 1) {
            isFunc[cr + dr][cc + dc] = 1;
            baseGrid[cr + dr][cc + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0;
          }
        }
      }
    }
  }

  // Líneas de sincronización (Timing patterns)
  for (let i = 8; i < size - 8; i += 1) {
    if (!isFunc[6][i]) {
      isFunc[6][i] = 1;
      baseGrid[6][i] = i % 2 === 0 ? 1 : 0;
    }
    if (!isFunc[i][6]) {
      isFunc[i][6] = 1;
      baseGrid[i][6] = i % 2 === 0 ? 1 : 0;
    }
  }

  // Reservar áreas de formato y módulo oscuro fijo
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      isFunc[8][i] = 1;
      isFunc[i][8] = 1;
    }
  }
  for (let i = 0; i <= 7; i += 1) isFunc[8][size - 1 - i] = 1;
  for (let i = 0; i <= 6; i += 1) isFunc[size - 1 - i][8] = 1;
  isFunc[size - 8][8] = 1;
  baseGrid[size - 8][8] = 1;

  // Volcado de bits de datos en zig-zag de derecha a izquierda
  const cwBits = [];
  for (let i = 0; i < finalCodewords.length; i += 1) {
    for (let b = 7; b >= 0; b -= 1) {
      cwBits.push((finalCodewords[i] >> b) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v += 1) {
      const r = upward ? size - 1 - v : v;
      for (let k = 0; k < 2; k += 1) {
        const c = right - k;
        if (!isFunc[r][c]) {
          baseGrid[r][c] = bitIdx < cwBits.length ? cwBits[bitIdx] : 0;
          bitIdx += 1;
        }
      }
    }
    upward = !upward;
  }

  // Selección óptima de máscara (0..7)
  let bestGrid = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask += 1) {
    const candidateGrid = baseGrid.map((row) => Uint8Array.from(row));
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (!isFunc[r][c] && maskCondition(mask, r, c)) {
          candidateGrid[r][c] ^= 1;
        }
      }
    }
    drawFormatInfo(candidateGrid, size, mask);
    const score = computePenalty(candidateGrid, size);
    if (score < bestScore) {
      bestScore = score;
      bestGrid = candidateGrid;
    }
  }

  return {
    size,
    matrix: bestGrid
  };
}
