import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Modal, TextInput, Pressable, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useInventory } from '../context/InventoryContext';


// Mapa de imágenes locales (solo default)
const assets = {
  chapata: require('../../assets/chapata.png'),
  sandwich: require('../../assets/sandwich.png'),
};

const getImageSource = (image) => {
  if (!image) return null;
  if (typeof image === 'string') {
    if (image.startsWith('http') || image.startsWith('file')) {
      return { uri: image };
    }
    if (assets[image]) return assets[image];
  }
  return null;
};

// 🔥 SUBIR IMAGEN A CLOUDINARY
const uploadToCloudinary = async (imageUri) => {
  const cloudName = "dwx9yzazs";
  const uploadPreset = "product";

  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "producto.jpg",
  });
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("📦 Cloudinary response:", data);

    if (data.secure_url) {
      return {
        url: data.secure_url,
        publicId: data.public_id
      };
    } else {
      throw new Error(data.error?.message || "No se recibió secure_url");
    }
  } catch (err) {
    console.error("❌ Error subiendo a Cloudinary:", err);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const res = await fetch("https://control-chapatas.vercel.app/api/deleteImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    const data = await res.json();
    console.log("🗑️ Cloudinary delete:", data);
    return data;
  } catch (err) {
    console.error("❌ Error borrando en Cloudinary:", err);
  }
};

export default function ProductosScreen() {
  const { products, addProduct, updateProduct, removeProduct } = useInventory();

  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [oldPublicId, setOldPublicId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', image: null });

  const openAdd = () => {
    setMode('add');
    setEditingId(null);
    setForm({ name: '', price: '', image: null });
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setMode('edit');
    setEditingId(p.id);
    setOldPublicId(p.publicId || null);
    setForm({
      name: p.name,
      price: String(p.price),
      image: p.image?.url || p.image || null,
    });
    setFormOpen(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesito acceso a tu galería para elegir una imagen.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setForm((f) => ({ ...f, image: result.assets[0].uri }));
    } else {
      Alert.alert('No seleccionaste ninguna imagen.');
    }
  };

  const uploadImageIfNeeded = async (image) => {
    if (!image) return null;
    if (typeof image === "object" && image.url) return image; // ya viene Cloudinary
    if (typeof image === "string" && image.startsWith("http")) return { url: image, publicId: null };
    return await uploadToCloudinary(image); // retorna {url, publicId}
  };

  const submit = async () => {
    if (!form.name.trim()) return Alert.alert('Falta nombre');
    if (form.price === '' || isNaN(Number(form.price))) return Alert.alert('Precio inválido');

    try {
      let newImageData = await uploadImageIfNeeded(form.image);

      if (mode === 'edit') {
        // 👇 si se cambió la imagen, borrar la vieja en Cloudinary
        if (newImageData && oldPublicId && newImageData.url !== form.image) {
          await deleteFromCloudinary(oldPublicId);
        }
        await updateProduct(editingId, {
          name: form.name.trim(),
          price: Number(form.price),
          image: newImageData || form.image,
          publicId: newImageData?.publicId || oldPublicId || null,
        });
      } else {
        await addProduct({
          name: form.name.trim(),
          price: Number(form.price),
          image: newImageData,
          publicId: newImageData?.publicId || null,
        });
      }
      setFormOpen(false);
    } catch (err) {
      console.error("Error guardando producto ❌", err);
      Alert.alert("Error", "No se pudo guardar el producto");
    }
  };

  const confirmDelete = (p) => {
    Alert.alert('Eliminar producto', '¿Deseas eliminar el producto del inventario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          if (p.publicId) {
            await deleteFromCloudinary(p.publicId); // 👈 borramos imagen primero
          }
          removeProduct(p.id);
        }
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={getImageSource(item.image?.url || item.image)} style={styles.cardImg} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>Precio: ${item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
        <Image source={require('../../assets/edit.png')} style={styles.editIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(item.id)}>
        <Image source={require('../../assets/trash.png')} style={styles.trashIcon} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={renderItem}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>Agregar Producto</Text>
          </TouchableOpacity>
        }
      />

      {/* Modal de agregar/editar */}
      <Modal transparent visible={formOpen} animationType="fade" onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{mode === 'add' ? 'Nuevo producto' : 'Editar producto'}</Text>
              <Pressable onPress={() => setFormOpen(false)}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.imageRow}>
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerBox}>
                {form.image ? (
                  <Image source={getImageSource(form.image)} style={styles.previewImg} />
                ) : (
                  <Text style={{ textAlign: 'center' }}>Agregar/editar imagen</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.label}>Nombre del producto:</Text>
              <TextInput
                value={form.name}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                style={styles.input}
                placeholder="Ej. Café"
              />
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.label}>Precio del producto:</Text>
              <TextInput
                value={String(form.price)}
                onChangeText={(t) => setForm((f) => ({ ...f, price: t }))}
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={submit}>
              <Text style={styles.saveBtnText}>{mode === 'add' ? 'Agregar Producto' : 'Guardar cambios'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4B31A', padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
  },
  cardImg: { width: 70, height: 70, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  cardTitle: { fontWeight: 'bold', fontSize: 18, color: '#000' },
  cardSubtitle: { color: '#333', marginTop: 2 },
  iconBtn: { padding: 8, marginLeft: 6 },
  trashIcon: { width: 25, height: 25, marginLeft: 10, tintColor: '#d32f2f' },
  editIcon: { width: 25, height: 25, marginLeft: 10 },
  addBtn: { backgroundColor: '#000', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  closeX: { fontSize: 20, fontWeight: 'bold', color: '#000' },

  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  imageRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12 },
  imagePickerBox: { width: 100, height: 100, borderRadius: 10, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  previewImg: { width: 100, height: 100, borderRadius: 10 },
  label: { fontSize: 15, color: '#000', marginRight: 10, flex: 1 },
  input: { flex: 1.2, backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, textAlign: 'center' },

  saveBtn: { marginTop: 16, backgroundColor: '#000', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
