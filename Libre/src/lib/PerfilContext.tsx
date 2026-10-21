import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ALMACEN_VACIO,
  AlmacenPerfiles,
  AVATARES,
  ID_PRINCIPAL,
  MAX_PERFILES,
  Perfil,
  PERFIL_VACIO,
  cargarAlmacen,
  guardarAlmacen,
} from './perfil';

interface PerfilContextValue {
  /** Perfil activo: todas las pantallas filtran con este */
  perfil: Perfil;
  perfiles: Perfil[];
  cargando: boolean;
  /** Guarda los cambios del perfil activo */
  actualizarPerfil: (perfil: Perfil) => Promise<void>;
  cambiarPerfil: (id: string) => Promise<void>;
  /** Crea un perfil nuevo y lo activa. Devuelve null si se alcanzó el máximo. */
  anadirPerfil: (nombre: string) => Promise<Perfil | null>;
  eliminarPerfil: (id: string) => Promise<void>;
}

const PerfilContext = createContext<PerfilContextValue | undefined>(undefined);

export function PerfilProvider({ children }: { children: React.ReactNode }) {
  const [almacen, setAlmacen] = useState<AlmacenPerfiles>(ALMACEN_VACIO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarAlmacen().then((a) => {
      setAlmacen(a);
      setCargando(false);
    });
  }, []);

  const aplicar = useCallback(async (siguiente: AlmacenPerfiles) => {
    setAlmacen(siguiente);
    await guardarAlmacen(siguiente);
  }, []);

  const actualizarPerfil = useCallback(
    (nuevo: Perfil) =>
      aplicar({
        ...almacen,
        perfiles: almacen.perfiles.map((p) => (p.id === nuevo.id ? nuevo : p)),
      }),
    [almacen, aplicar]
  );

  const cambiarPerfil = useCallback(
    (id: string) => aplicar({ ...almacen, activoId: id }),
    [almacen, aplicar]
  );

  const anadirPerfil = useCallback(
    async (nombre: string) => {
      if (almacen.perfiles.length >= MAX_PERFILES) return null;
      const principal = almacen.perfiles[0];
      // Elige el primer avatar que no esté ya en uso, para distinguir a la familia de un vistazo.
      const usados = new Set(almacen.perfiles.map((p) => p.avatar));
      const avatar = AVATARES.find((a) => !usados.has(a)) ?? AVATARES[almacen.perfiles.length % AVATARES.length];
      const nuevo: Perfil = {
        ...PERFIL_VACIO,
        id: `perfil-${Date.now()}`,
        nombre: nombre.trim() || `Perfil ${almacen.perfiles.length + 1}`,
        avatar,
        ubicacion: principal.ubicacion,
        disclaimerAceptado: principal.disclaimerAceptado,
      };
      await aplicar({ activoId: nuevo.id, perfiles: [...almacen.perfiles, nuevo] });
      return nuevo;
    },
    [almacen, aplicar]
  );

  const eliminarPerfil = useCallback(
    async (id: string) => {
      if (id === ID_PRINCIPAL || almacen.perfiles.length <= 1) return;
      const perfiles = almacen.perfiles.filter((p) => p.id !== id);
      await aplicar({
        perfiles,
        activoId: almacen.activoId === id ? perfiles[0].id : almacen.activoId,
      });
    },
    [almacen, aplicar]
  );

  const perfil = almacen.perfiles.find((p) => p.id === almacen.activoId) ?? almacen.perfiles[0];

  return (
    <PerfilContext.Provider
      value={{
        perfil,
        perfiles: almacen.perfiles,
        cargando,
        actualizarPerfil,
        cambiarPerfil,
        anadirPerfil,
        eliminarPerfil,
      }}
    >
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfil(): PerfilContextValue {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error('usePerfil debe usarse dentro de PerfilProvider');
  return ctx;
}
