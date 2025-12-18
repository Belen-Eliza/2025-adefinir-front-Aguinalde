import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert,  TouchableOpacity,  FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useUserContext } from "@/context/UserContext";
import { paleta, paleta_colores } from "@/components/colores";
import { error_alert } from "@/components/alert";
import Toast from "react-native-toast-message";
import { estilos } from "@/components/estilos";
import { SmallPopupModal } from "@/components/modals";
import { icon_type } from "@/components/types";
import { crear_modulo, editar_modulo } from "@/conexiones/modulos";

const firsticonOptions: icon_type[] = ["car", "paw", "hand-left", "book", "star", "color-palette"] as icon_type[];
const iconOptions = Object.keys(Ionicons.glyphMap) as icon_type[];

export default function CrearModuloScreen() {
  
  const params = useLocalSearchParams<{ id?: string; nombre?: string; icon?: string; descripcion?: string }>();
  const isEdit = !!params.id;
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [icon, setIcon] = useState<icon_type>("car");

  const [modalIconVisible, setIconModalVisible] = useState(false);

  const contexto = useUserContext();

  useEffect(() => {
    if (isEdit) {
  setNombre(params.nombre ? String(params.nombre) : "");
  setDescripcion(params.descripcion ? String(params.descripcion) : "");
  setIcon((params.icon ? String(params.icon) : "car") as icon_type);
    } else {
      setNombre("");
      setDescripcion("");
      setIcon("car");
    }
  }, [params.id, params.nombre, params.descripcion, params.icon, isEdit]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      error_alert("El nombre del módulo es obligatorio.")
      //Alert.alert("Error", "El nombre del módulo es obligatorio.");
      return;
    }
    setLoading(true);
    try {
      if (isEdit && params.id) {
        await editar_modulo(Number(params.id),nombre,descripcion,icon)
      } else {
        await crear_modulo(nombre,descripcion,icon,contexto.user.id);
      }
      contexto.user.gotToModules();
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo guardar el módulo");
    } finally {
      setLoading(false);
    }
  };

  const renderIcons =  ({ item }: { item: icon_type }) => (
    <Pressable
      style={[styles.iconOption, icon === item && styles.iconSelected,{margin:5}]}
      onPress={() => setIcon(item)}
    >
      <Ionicons name={item} size={28} color={icon === item ? "#20bfa9" : "#888"} />
    </Pressable>
  )

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.backBtn} 
        onPress={() => contexto.user.gotToModules()}
      >
        <Ionicons name="arrow-back" size={20} color="#20bfa9" style={{ marginRight: 6 }} />
        <Text style={styles.backBtnText}>Volver</Text>
      </Pressable>
      <Text style={styles.title}>{isEdit ? "Editar módulo" : "Agregar módulo"}</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del módulo"
        value={nombre}
        onChangeText={setNombre}
        placeholderTextColor="#888"
        editable={!loading}
        selectTextOnFocus={true}
        autoCorrect={false}
        autoCapitalize="words"
      />
      <TextInput
        style={[styles.input, { height: 60 }]}
        placeholder="Descripción breve (opcional)"
        value={descripcion}
        onChangeText={setDescripcion}
        placeholderTextColor="#888"
        multiline
        editable={!loading}
        selectTextOnFocus={true}
        autoCorrect={false}
        autoCapitalize="sentences"
        textAlignVertical="top"
      />
      <Text style={styles.label}>Icono:</Text>
      <View style={styles.iconRow}>
        {firsticonOptions.map((ic) =>  (
              <Pressable
                key={ic}
                style={[styles.iconOption, icon === ic && styles.iconSelected]}
                onPress={() => setIcon(ic)}
              >
                <Ionicons name={ic} size={28} color={icon === ic ? "#20bfa9" : "#888"} />
              </Pressable>
            )
          
          )}
      </View>
  {!firsticonOptions.includes(icon)? 
        <View style={styles.iconRow}>
          <Pressable
                key={icon}
                style={[styles.iconOption, styles.iconSelected]}
                onPress={() => setIcon(icon)}
              >
                <Ionicons name={icon} size={28} color= "#20bfa9"  />
              </Pressable>
        </View>:null}
      <TouchableOpacity onPress={()=>setIconModalVisible(true)} style={[styles.iconOption,estilos.centrado,{borderRadius:30,borderColor:"white"},paleta_colores.strong_yellow]}>
        <Ionicons name="add-sharp" size={28} color= "white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear módulo"}</Text>
      </TouchableOpacity>

      <SmallPopupModal title="Seleccionar ícono" modalVisible={modalIconVisible} setVisible={setIconModalVisible}>
        <View style={[estilos.centrado]}>
          <FlatList
            data={iconOptions}
            renderItem={renderIcons}
            keyExtractor={(item) => item.toString()}            
            style={[{maxHeight:400}]}
            numColumns={5}            
            columnWrapperStyle={{marginHorizontal:10}}
          />
        </View>
          
          <TouchableOpacity onPress={()=>setIconModalVisible(false)} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Aceptar</Text>
          </TouchableOpacity>
      </SmallPopupModal>
      <Toast/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7f2',
    padding: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
    padding: 8,
    marginTop:20  
  },
  backBtnText: {
    color: '#20bfa9',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    alignSelf: 'center',
    marginBottom: 18,
    marginTop:15 
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#222',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  label: {
    color: '#555',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 15,
  },
  iconRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  iconOption: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  iconSelected: {
    borderColor: '#20bfa9',
    backgroundColor: '#e6f7f2',
  },
  saveBtn: {
    backgroundColor: '#20bfa9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 25,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  
});
