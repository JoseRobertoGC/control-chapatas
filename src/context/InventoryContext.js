// src/context/InventoryContext.js
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const InventoryContext = createContext(null);

const DEFAULT_PRODUCTS = [
  { id: "chapata", name: "Chapata", price: 35, image: { type: "asset", name: "chapata" } },
  { id: "sandwich", name: "Sándwich", price: 42, image: { type: "asset", name: "sandwich" } },
];

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [point, setPointState] = useState(null);

  // 🔥 stock ahora viene desde Firebase
  const [stock, setStock] = useState({
    A: { chapata: 0, sandwich: 0 },
    B: { chapata: 0, sandwich: 0 },
  });

  const [sales, setSales] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [ventaIniciada, setVentaIniciada] = useState(false);
  const [registroActual, setRegistroActual] = useState(null);

  // ---------- Escuchar cambios en Firebase ----------
  useEffect(() => {
    const unsubA = onSnapshot(doc(db, "stocks", "A"), (snap) => {
      if (snap.exists()) {
        setStock((prev) => ({ ...prev, A: snap.data() }));
      }
    });

    const unsubB = onSnapshot(doc(db, "stocks", "B"), (snap) => {
      if (snap.exists()) {
        setStock((prev) => ({ ...prev, B: snap.data() }));
      }
    });

    const unsubEstado = onSnapshot(doc(db, "estadoVenta", "actual"), (snap) => {
      if (snap.exists()) {
        const data = snap.data(); // faltaba
        setVentaIniciada(data.ventaIniciada);
        if (data.registro) {
          setRegistroActual(data.registro);
        }
      }
    });
  
    return () => {
      unsubA();
      unsubB();
      unsubEstado();
    };
  }, []);

  // ---------- Setters ----------
  const setPoint = async (p) => {
    setPointState(p);
    await AsyncStorage.setItem("point", p);
  };

  // Inicializar inventario en Firebase
  const setInitialStock = async ({ A, B }) => {
    try {
      await setDoc(doc(db, "stocks", "A"), A, { merge: true });
      await setDoc(doc(db, "stocks", "B"), B, { merge: true });
    } catch (err) {
      console.error("Error inicializando stock ❌", err);
    }
  };

  // ---------- Registro 
const iniciarRegistro = async () => {
  const fechaHoy = new Date().toISOString().split("T")[0];
  const nuevoRegistro = {
    fecha: fechaHoy,
    totalVenta: 0,
    inventarioFinal: {},
    ventas: {},
    traspasos: [],
    sincronizado: false,
    activa: true, // 🔥 venta en curso
  };

  setRegistroActual(nuevoRegistro);
  setVentaIniciada(true);

  // Guardar local
  await AsyncStorage.setItem("registroActual", JSON.stringify(nuevoRegistro));
  await AsyncStorage.setItem("ventaIniciada", "true");

  // Guardar en Firebase
  await setDoc(doc(db, "estadoVenta", "actual"), {
    ventaIniciada: true,
    registro: nuevoRegistro,
  });
};


  const aggregateSales = (ventas) => {
    const result = {};
    ventas.forEach(({ point, product, qty }) => {
      if (!result[point]) result[point] = {};
      if (!result[point][product]) result[point][product] = 0;
      result[point][product] += qty;
    });
    return result;
  };

  const calcularTotal = (ventas) =>
    ventas.reduce((acc, { product, qty }) => {
      const prod = products.find((p) => p.id === product);
      return acc + (prod?.price || 0) * qty;
    }, 0);

    const finalizarVenta = async (navigation) => {
      const final = {
        ...registroActual,
        ventas: aggregateSales(sales),
        traspasos: transfers,
        inventarioFinal: stock,
        totalVenta: calcularTotal(sales),
        createdAt: new Date().toISOString(),
        sincronizado: false,
      };
    
      // 👇 Calculamos inventario restante en ambos puntos
      const totalStockA = Object.values(stock.A || {}).reduce((acc, val) => acc + val, 0);
      const totalStockB = Object.values(stock.B || {}).reduce((acc, val) => acc + val, 0);
    
      try {
        await addDoc(collection(db, "registros"), final);
        console.log("Registro guardado en Firebase ✅");
    
        // Actualizamos estado global de la venta
        await setDoc(doc(db, "estadoVenta", "actual"), {
          ventaIniciada: false,
          registro: null,
        });
    
        // 👇 Si ya no queda inventario en ningún punto
        if (totalStockA === 0 && totalStockB === 0) {
          setTimeout(() => {
            Alert.alert("Inventario vacío", "Se ha terminado la venta del día.");
            if (navigation) {
              navigation.replace("VentasHome");
            }
          }, 5000);
        }
      } catch (error) {
        console.error("Error subiendo registro ❌", error);
      }
    
      await resetInventory();
    };
    

  const resetInventory = async () => {
    await AsyncStorage.multiRemove([
      "sales",
      "transfers",
      "registroActual",
    ]);
    await AsyncStorage.setItem("ventaIniciada", "false");

    setVentaIniciada(false);
    setSales([]);
    setTransfers([]);
    setRegistroActual(null);
  };

  // ---------- Operaciones ----------
  const sell = async (product, qty = 1) => {
    if (!point) return;
    const current = stock[point]?.[product] || 0;
    if (current < qty) {
      const prod = products.find((p) => p.id === product);
      Alert.alert("Inventario insuficiente", `No hay suficientes ${prod?.name || product}s en Punto ${point}`);
      return false;
    }

    try {
      await updateDoc(doc(db, "stocks", point), {
        [product]: current - qty,
      });
      setSales((prev) => [...prev, { point, product, qty, ts: Date.now() }]);
      return true;
    } catch (err) {
      console.error("Error al vender ❌", err);
      return false;
    }
  };

  const transfer = async (product, qty = 1, to) => {
    if (!point || !to || point === to) return;
    const from = point;

    const currentFrom = stock[from]?.[product] || 0;
    const currentTo = stock[to]?.[product] || 0;

    if (currentFrom < qty) {
      Alert.alert("Inventario insuficiente", `No hay suficientes ${product} en Punto ${from}`);
      return;
    }

    try {
      await updateDoc(doc(db, "stocks", from), { [product]: currentFrom - qty });
      await updateDoc(doc(db, "stocks", to), { [product]: currentTo + qty });

      setTransfers((prev) => [...prev, { from, to, product, qty, ts: Date.now() }]);
    } catch (err) {
      console.error("Error en traspaso ❌", err);
    }
  };

  // ---------- Restaurar al inicio ----------
  useEffect(() => {
    const loadAsyncData = async () => {
      try {
        const savedPoint = await AsyncStorage.getItem("point");
        const venta = await AsyncStorage.getItem("ventaIniciada");
        const savedRegistro = await AsyncStorage.getItem("registroActual");
        const savedProducts = await AsyncStorage.getItem("products");

        if (savedProducts) {
          setProducts(JSON.parse(savedProducts));
        } else {
          await AsyncStorage.setItem("products", JSON.stringify(DEFAULT_PRODUCTS));
        }

        if (savedPoint) setPointState(savedPoint);
        if (!navigator.onLine) { 
          if (venta === "true") setVentaIniciada(true);
          if (savedRegistro) setRegistroActual(JSON.parse(savedRegistro));
        }
        
      } catch (error) {
        console.error("Error cargando AsyncStorage:", error);
      }
    };

    loadAsyncData();
  }, []);

  // ---------- Productos ----------

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productos"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
      AsyncStorage.setItem("products", JSON.stringify(list)); // opcional: backup local
    });
  
    return () => unsub();
  }, []);

  const addProduct = async ({ name, price, image }) => {
    try {
      const docRef = await addDoc(collection(db, "productos"), {
        name,
        price: Number(price) || 0,
        image,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (err) {
      console.error("Error agregando producto ❌", err);
      Alert.alert("Error", "No se pudo agregar el producto");
    }
  };

  const updateProduct = async (id, patch) => {
    try {
      const refDoc = doc(db, "productos", id);
      await updateDoc(refDoc, {
        ...patch,
        price: patch.price != null ? Number(patch.price) : undefined,
      });
    } catch (err) {
      console.error("Error actualizando producto ❌", err);
      Alert.alert("Error", "No se pudo actualizar el producto");
    }
  };

  const removeProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "productos", id));
    } catch (err) {
      console.error("Error eliminando producto ❌", err);
      Alert.alert("Error", "No se pudo eliminar el producto");
    }
  };

  // ---------- Context Value ----------
  const value = useMemo(
    () => ({
      point,
      setPoint,
      stock,
      sales,
      transfers,
      ventaIniciada,
      setVentaIniciada,
      setInitialStock,
      sell,
      transfer,
      resetInventory,
      registroActual,
      setRegistroActual,
      iniciarRegistro,
      finalizarVenta,
      setStock,
      products,
      addProduct,
      updateProduct,
      removeProduct,
    }),
    [point, stock, sales, transfers, ventaIniciada, registroActual, products]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
