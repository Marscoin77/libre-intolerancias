import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const KEY = 'libre:lista_compra';

export interface ItemLista {
  id: string;
  nombre: string;
  comprado: boolean;
  origen?: string;
}

interface ListaCompraContextValue {
  items: ItemLista[];
  añadirItems: (nombres: string[], origen?: string) => void;
  marcarComprado: (id: string) => void;
  eliminarItem: (id: string) => void;
  vaciarLista: () => void;
}

const ListaCompraContext = createContext<ListaCompraContextValue | undefined>(undefined);

export function ListaCompraProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemLista[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setItems(JSON.parse(raw));
    });
  }, []);

  const persistir = useCallback((nuevos: ItemLista[]) => {
    setItems(nuevos);
    AsyncStorage.setItem(KEY, JSON.stringify(nuevos));
  }, []);

  const añadirItems = useCallback(
    (nombres: string[], origen?: string) => {
      setItems((actuales) => {
        const nuevos = [
          ...actuales,
          ...nombres.map((nombre) => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            nombre,
            comprado: false,
            origen,
          })),
        ];
        AsyncStorage.setItem(KEY, JSON.stringify(nuevos));
        return nuevos;
      });
    },
    []
  );

  const marcarComprado = useCallback(
    (id: string) => {
      setItems((actuales) => {
        const nuevos = actuales.map((it) => (it.id === id ? { ...it, comprado: !it.comprado } : it));
        AsyncStorage.setItem(KEY, JSON.stringify(nuevos));
        return nuevos;
      });
    },
    []
  );

  const eliminarItem = useCallback((id: string) => {
    setItems((actuales) => {
      const nuevos = actuales.filter((it) => it.id !== id);
      AsyncStorage.setItem(KEY, JSON.stringify(nuevos));
      return nuevos;
    });
  }, []);

  const vaciarLista = useCallback(() => {
    persistir([]);
  }, [persistir]);

  return (
    <ListaCompraContext.Provider value={{ items, añadirItems, marcarComprado, eliminarItem, vaciarLista }}>
      {children}
    </ListaCompraContext.Provider>
  );
}

export function useListaCompra(): ListaCompraContextValue {
  const ctx = useContext(ListaCompraContext);
  if (!ctx) throw new Error('useListaCompra debe usarse dentro de ListaCompraProvider');
  return ctx;
}
