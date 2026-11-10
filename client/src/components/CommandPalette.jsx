import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { playNavTick } from '../utils/audioFeedback';
import {
  IconSearch,
  IconTerminal,
  IconBox,
  IconAlert,
  IconKardex,
  IconReceipt,
  IconMonitor,
  IconLock,
  IconPlus,
  IconBolt,
  IconClose
} from './Icons';

export default function CommandPalette({ isOpen, onClose, onOpenVisor, onLock }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const commands = useMemo(() => [
    {
      id: 'pos',
      seccion: 'Navegación Principal',
      titulo: 'Ir a Terminal POS',
      subtitulo: 'Punto de venta y despacho rápido de medicamentos (F2 / F12)',
      icono: <IconTerminal size={17} />,
      atajo: 'Alt + 1',
      accion: () => { navigate('/'); onClose(); }
    },
    {
      id: 'inv',
      seccion: 'Navegación Principal',
      titulo: 'Ir a Inventario de Almacén',
      subtitulo: 'Catálogo de medicamentos, control de lotes y anaqueles',
      icono: <IconBox size={17} />,
      atajo: 'Alt + 2',
      accion: () => { navigate('/inventario'); onClose(); }
    },
    {
      id: 'alertas',
      seccion: 'Navegación Principal',
      titulo: 'Ir a Monitor de Alertas',
      subtitulo: 'Semáforo de existencias (crítico, preventivo y óptimo)',
      icono: <IconAlert size={17} />,
      atajo: 'Alt + 3',
      accion: () => { navigate('/alertas'); onClose(); }
    },
    {
      id: 'kardex',
      seccion: 'Navegación Principal',
      titulo: 'Ir a Auditoría Kardex',
      subtitulo: 'Historial inmutable de entradas, salidas y mermas',
      icono: <IconKardex size={17} />,
      atajo: 'Alt + 4',
      accion: () => { navigate('/kardex'); onClose(); }
    },
    {
      id: 'comprobantes',
      seccion: 'Navegación Principal',
      titulo: 'Ir a Comprobantes Emitidos',
      subtitulo: 'Historial de boletas electrónicas y anulación con reversión',
      icono: <IconReceipt size={17} />,
      atajo: 'Alt + 5',
      accion: () => { navigate('/comprobantes'); onClose(); }
    },
    {
      id: 'visor',
      seccion: 'Acciones Rápidas de Botica',
      titulo: 'Abrir Visor de Cliente Móvil',
      subtitulo: 'Sincronizar pantalla secundaria para cobro con QR vía Tunnel',
      icono: <IconMonitor size={17} />,
      atajo: 'QR',
      accion: () => { onClose(); if (onOpenVisor) onOpenVisor(); }
    },
    {
      id: 'reponer-criticos',
      seccion: 'Acciones Rápidas de Botica',
      titulo: 'Reponer Stock Crítico (1-Clic)',
      subtitulo: 'Ir al monitor de alertas para abastecer fármacos en rojo',
      icono: <IconBolt size={17} />,
      atajo: '⚡',
      accion: () => { navigate('/alertas'); onClose(); }
    },
    {
      id: 'nuevo-producto',
      seccion: 'Acciones Rápidas de Botica',
      titulo: 'Registrar Nuevo Medicamento',
      subtitulo: 'Alta en catálogo maestro con lote y anaquel',
      icono: <IconPlus size={17} />,
      atajo: '+ SKU',
      accion: () => { navigate('/inventario'); onClose(); }
    },
    {
      id: 'bloquear',
      seccion: 'Seguridad Operativa',
      titulo: 'Bloquear Terminal de Caja',
      subtitulo: 'Cerrar turno temporalmente y proteger sesión activa',
      icono: <IconLock size={17} />,
      atajo: 'Alt + L',
      accion: () => { onClose(); if (onLock) onLock(); }
    }
  ], [navigate, onClose, onOpenVisor, onLock]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.titulo.toLowerCase().includes(q) ||
        c.subtitulo.toLowerCase().includes(q) ||
        c.seccion.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Asegura que el ítem seleccionado con flechas siempre sea visible con auto-scroll
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('.cmd-item.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        playNavTick();
        setSelectedIndex((prev) => (prev + 1) % (filtrados.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playNavTick();
        setSelectedIndex((prev) => (prev - 1 + filtrados.length) % (filtrados.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtrados[selectedIndex]) {
          filtrados[selectedIndex].accion();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtrados, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command Palette">
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-header">
          <IconSearch size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Escribe una acción, módulo o fármaco (ej. 'Kardex', 'Visor', 'POS')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-esc-kbd" onClick={onClose}>ESC</kbd>
        </div>

        <div className="cmd-list" ref={listRef}>
          {filtrados.length === 0 ? (
            <div className="cmd-empty">
              No se encontraron comandos o módulos que coincidan con &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtrados.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => cmd.accion()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-item-icon">{cmd.icono}</div>
                  <div className="cmd-item-content">
                    <div className="cmd-item-title">{cmd.titulo}</div>
                    <div className="cmd-item-subtitle">{cmd.subtitulo}</div>
                  </div>
                  {cmd.atajo && <kbd className="cmd-item-kbd">{cmd.atajo}</kbd>}
                </div>
              );
            })
          )}
        </div>

        <footer className="cmd-footer">
          <span>Usa <kbd className="cmd-hint-kbd">↑</kbd> <kbd className="cmd-hint-kbd">↓</kbd> para navegar</span>
          <span><kbd className="cmd-hint-kbd">↵ Enter</kbd> para ejecutar</span>
          <span><kbd className="cmd-hint-kbd">Esc</kbd> para cerrar</span>
        </footer>
      </div>
    </div>
  );
}

