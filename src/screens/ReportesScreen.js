import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import { es } from "date-fns/locale";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useInventory } from "../context/InventoryContext";
import { useFocusEffect } from "@react-navigation/native";

export default function ReportesScreen() {
  const { products } = useInventory();
  const [registros, setRegistros] = useState([]);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [filterType, setFilterType] = useState("semanal");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 🔥 Suscripción en tiempo real a Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "registros"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRegistros(data);
    }, (error) => {
      console.error("Error cargando reportes ❌", error);
    });

    return () => unsub();
  }, []);

  // 🔎 Filtrar registros por semana o mes
  const filteredData = useMemo(() => {
    let start, end;

    if (filterType === "semanal") {
      start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      end = addDays(start, 4);
    } else {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    }

    return registros.filter((r) => {
      const date = new Date(r.createdAt);
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return localDate >= start && localDate <= end;
    });
  }, [registros, selectedDate, filterType]);

  const handleDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (selected) setSelectedDate(selected);
  };

  const rangeText = useMemo(() => {
    if (filterType === "semanal") {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = addDays(start, 4);
      return `${format(start, "MMM d", { locale: es })} - ${format(
        end,
        "MMM d (yyyy)",
        { locale: es }
      )}`;
    } else {
      return `${format(selectedDate, "MMMM (yyyy)", { locale: es })}`;
    }
  }, [selectedDate, filterType]);

  const handleFilterChange = () => {
    setModalVisible(false);
    setTimeout(() => setShowDatePicker(true), 300);
    setFilterType(filterType === "semanal" ? "mensual" : "semanal");
  };

  // Agrupar traspasos por punto de ORIGEN
  const aggregateTransfers = (traspasos) => {
    const result = {};
    (traspasos || []).forEach(({ from, product, qty }) => {
      if (!result[from]) result[from] = {};
      if (!result[from][product]) result[from][product] = 0;
      result[from][product] += qty;
    });
    return result;
  };
  
  const productNames = useMemo(() => {
    const map = {};
    products.forEach(p => {
      map[p.id] = p.name;
    });
    return map;
  }, [products]);

  const renderGrouped = (dataPorPunto) => {
    return Object.entries(dataPorPunto || {}).map(([punto, datos]) => {
      const detalles = Object.entries(datos)
        .map(([prodId, qty]) => `${productNames[prodId] || prodId}: ${qty}`)
        .join("   ");
  
      return (
        <Text key={punto} style={styles.detailContent}>
          Punto {punto} → {detalles}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.rangeText}>{rangeText}</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.dropdownText}>
            {filterType === "semanal" ? "Semanal" : "Mensual"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedDayDetail(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{item.fecha}</Text>
              <Text style={styles.total}>
                Total: ${item.totalVenta?.toFixed(2) || 0}
              </Text>
            </View>
            <Text style={styles.inv}>
              Inventario Final:{" "}
              {Object.values(item.inventarioFinal || {}).reduce(
                (sum, p) => sum + Object.values(p).reduce((s, x) => s + x, 0),
                0
              )}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* MODAL: Opciones de filtro */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.filterToggle} onPress={handleFilterChange}>
              <Text style={styles.filterToggleText}>
                Cambiar a {filterType === "semanal" ? "Mensual" : "Semanal"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeButtonFilter}
            >
              <Text style={styles.closeTextFilter}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="calendar"
          locale="es-ES"
          onChange={handleDateChange}
        />
      )}

      {/* MODAL: Detalle del registro */}
      {selectedDayDetail && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.detailModal}>
              <Text style={styles.date}>{selectedDayDetail.fecha}</Text>

              <Pressable
                onPress={() => setSelectedDayDetail(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>

              <Text style={styles.detailTotal}>
                Total: ${selectedDayDetail.totalVenta?.toFixed(2) || 0}
              </Text>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Inventario Final</Text>
                {renderGrouped(selectedDayDetail.inventarioFinal)}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Ventas</Text>
                {renderGrouped(selectedDayDetail.ventas)}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Traspasos</Text>
                {renderGrouped(aggregateTransfers(selectedDayDetail.traspasos))}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fbbf24",
    padding: 16,
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    alignItems: "center",
  },
  rangeText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "black",
  },
  dropdown: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dropdownText: {
    fontWeight: "bold",
    color: "#000",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  date: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
    alignSelf: "flex-start",
  },
  total: {
    fontSize: 16,
    color: "#000",
    marginTop: 6,
  },
  detailTotal: {
    fontSize: 20,
    color: "#000",
    marginTop: 6,
    alignSelf: "flex-start",
  },
  inv: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  filterToggle: {
    marginBottom: 12,
  },
  filterToggleText: {
    fontWeight: "bold",
    color: "#1e40af",
  },
  closeButtonFilter: {
    top: 10,
    zIndex: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  closeTextFilter: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "Center",
  },
  closeText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000000",
    margin: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailModal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    alignItems: "center",
    position: "relative",
  },
  detailSection: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
    backgroundColor: "white"
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000",
    alignSelf: "flex-start",
  },
  detailContent: {
    alignSelf: "center",
  },
});
