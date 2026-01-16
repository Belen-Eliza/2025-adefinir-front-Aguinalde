import { 
  Pressable, Text, TextInput, View, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoUpload from '@/components/VideoUpload';
import VideoPlayer from '@/components/VideoPlayer';
import { supabase } from '../../utils/supabase';
import { error_alert, success_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { paleta, paleta_colores } from '@/components/colores';
import { estilos } from '@/components/estilos';
import { BotonLogin } from '@/components/botones';
import { useUserContext } from '@/context/UserContext';
import { SmallPopupModal } from '@/components/modals';
import { IconTextInput } from '@/components/inputs';
import { crearNuevaCategoria, traerCategorias } from '@/conexiones/categorias';
import { router, useFocusEffect } from 'expo-router';

export default function VideoUploadForm() {
  
  const insets = useSafeAreaInsets();
  const [meaning, setMeaning] = useState('');
  const [meaningError, setMeaningError] = useState<string | null>(null);
  const [checkingMeaning, setCheckingMeaning] = useState(false);
  const [videoFile, setVideoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const checkTimeoutRef = useRef<any>(null);

  const contexto = useUserContext();
  const [user,setUser] = useState({ nombre: contexto.user.username, id: contexto.user.id });

  const [categories, setCategories] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [modalNuevaCateVisible,setModalNuevaCateVisible] =useState(false);
  const [nombreNuevaCate,setNombreNuevaCate] = useState("");

  useFocusEffect(
      useCallback(() => {
        
        fetchCategories();
        return () => {
        };
      }, [])
    );

  useEffect(() => {
    const trimmed = meaning.trim();

    if (!trimmed) {
      setMeaningError(null);
      setCheckingMeaning(false);
      return;
    }

    setCheckingMeaning(true);
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

    checkTimeoutRef.current = setTimeout(async () => {
      try {

        const { data, error } = await supabase
          .from('Senias')
          .select('id')
          .ilike('significado', trimmed);

        if (error) {
          console.error('Error checking significado:', error.message);

          setMeaningError(null);
        } else if (data && data.length > 0) {
          setMeaningError('La seña ya está creada');
        } else {
          setMeaningError(null);
        }
      } catch (e) {
        console.error('Error checking significado:', e);
        setMeaningError(null);
      } finally {
        setCheckingMeaning(false);
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [meaning]);


  const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await traerCategorias();
        setCategories(data || []);
        
      } catch (e) {
        console.error('Error fetching categorias:', e);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
  };

  const handleVideoUpload = (video: { uri: string; name: string; type: string }) => {
    setVideoFile(video);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
  };

  const getSignedUrl = async (bucketName: string, filePath: string): Promise<string> => {
    try {
      // Calcular expiración en segundos (1 año = 365 días * 24 horas * 60 minutos * 60 segundos)
      const expiresIn = 365 * 24 * 60 * 60;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);
      
      if (error) {
        throw new Error(`Error creating signed URL: ${error.message}`);
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!meaning || !videoFile) {
      error_alert('Completa el significado y sube un video.');
      return;
    }
    if (!selectedCategory) {
      error_alert('Selecciona una categoría.');
      return;
    }
    if (meaningError) {
      error_alert('Revisa el significado: ' + meaningError);
      return;
    }
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: videoFile.uri,
        name: videoFile.name,
        type: 'video/mp4'
      } as any);

      const filename = `Senias/${videoFile.name}`;
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filename, formData, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (error) throw error;

      const videoPath = data.path;
      const videoUrl = await getSignedUrl('videos', videoPath);

      // 4. Guardar en la tabla incluyendo autor y categoría
      const { error: insertError } = await supabase
        .from('Senias')
        .insert([{
          significado: meaning,
          video_url: videoUrl,
          id_autor: user.id,
          categoria: selectedCategory
        }]);

      if (insertError) throw insertError;

        success_alert('¡Seña subida con éxito!');
        setMeaning('');
        setVideoFile(null);
        setSelectedCategory(null);
      } catch (e: any) {
        error_alert('Error al subir: ' + (e?.message || e));
        console.error(e)
      } finally {
        setSubiendo(false);
      }
  };

  const crear_categoria = async ()=>{
    if (nombreNuevaCate) {
      try {
        crearNuevaCategoria(nombreNuevaCate)
          .then(()=>{
            setModalNuevaCateVisible(false);
            setNombreNuevaCate("");
            fetchCategories();
            success_alert("Categoría creada con éxito");
          })
          .catch(reason =>{
            console.error(reason);
            error_alert("No se pudo crear la categoría")
          })
        
      } catch (error) {
        console.error(error);
        error_alert("No se pudo crear la categoría")
      }
      
    } else error_alert("El nombre no puede estar vacío");
    
  }

  return (
    <ThemedView style={[styles.safeArea, { marginBottom: insets.bottom + 12 }]} lightColor={paleta.aqua_bck} darkColor='#333'>
      <ScrollView contentContainerStyle={styles.mainView}>
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.panelTitle}>Subir video de seña</ThemedText>
          <ThemedText type="defaultSemiBold" lightColor="#666" darkColor="white" style={styles.subtitle}>Comparte tus videos de LSA con la comunidad</ThemedText>
        </View>

        <ThemedView style={[styles.card, estilos.shadow]} lightColor="white" darkColor="#3e9f94ff">
          {videoFile && (
            <VideoPlayer 
              uri={videoFile.uri}
              style={styles.previewVideo}
            />
          )}
          
          <ThemedText type="defaultSemiBold" style={styles.label}>¿Qué significa la seña?</ThemedText>
          <TextInput
            placeholder="Ej: Hola, Gracias, etc."
            placeholderTextColor={"#888"}
            value={meaning}
            onChangeText={setMeaning}
            style={[styles.input, { backgroundColor: paleta.softgray }]}
          />
          {meaningError && (
            <ThemedText style={styles.errorText}>{meaningError}</ThemedText>
          )}

          <ThemedText type="defaultSemiBold" style={[styles.label, { marginTop: 4 }]}>Categoría</ThemedText>
          <View style={styles.categoriesRow}>
            {loadingCategories ? (
              <ThemedText style={styles.smallMuted}>Cargando categorías...</ThemedText>
            ) : categories.length === 0 ? (
              <ThemedText style={styles.smallMuted}>No hay categorías disponibles</ThemedText>
            ) : (
              <View style={styles.categoriesWrap}>
                {categories.map(cat => {
                  const selected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={String(cat.id)}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={[
                        styles.chip,
                        selected ? styles.chipSelected : styles.chipIdle
                      ]}
                    >
                      <ThemedText style={[styles.chipText, selected ? { color: '#fff' } : {}]} numberOfLines={1}>{cat.nombre}</ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            
            <TouchableOpacity  style={[styles.uploadButton]} onPress={()=>setModalNuevaCateVisible(true)}>
              <Text style={styles.buttonText}>Crear nueva categoría</Text>
            </TouchableOpacity>
          </View>

          {videoFile ? (
            <ThemedView style={styles.fileInfoContainer} lightColor={paleta.aqua_bck} darkColor={paleta.aqua_bck}>
              <Ionicons name="videocam" size={22} color={paleta.dark_aqua} />
              <ThemedText style={styles.fileName}>{videoFile.name}</ThemedText>
              <TouchableOpacity onPress={handleRemoveVideo} style={styles.removeFileBtn}>
                <Ionicons name="close-circle" size={20} color="#73d3c8ff" />
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <VideoUpload onVideoUpload={handleVideoUpload} />
          )}

          {meaning.trim() !== '' && videoFile && !meaningError && selectedCategory && (
            <BotonLogin 
              callback={handleSubmit} 
              textColor="white" 
              text={subiendo ? 'Subiendo...' : 'Guardar Seña'} 
              bckColor={paleta.dark_aqua}
            />
          )}
        </ThemedView>

        {/* <ThemedView style={[styles.infoCard, estilos.shadow]} lightColor={paleta.softgray} darkColor="#2a2a2a">
          <ThemedText type="defaultSemiBold" style={styles.infoTitle}>¿Por qué subir tus videos?</ThemedText>
          <ThemedText style={styles.infoText}>
            Sube videos cortos de tus prácticas en Lengua de Señas Argentina (LSA) y contribuye a una comunidad de aprendizaje colaborativo. Tus videos ayudarán a otros usuarios a mejorar sus habilidades y a compartir conocimientos.
          </ThemedText>
        </ThemedView> */}
      </ScrollView>

      <SmallPopupModal title="Crear nueva categoría" modalVisible={modalNuevaCateVisible} setVisible={setModalNuevaCateVisible}>
        <ThemedText type='defaultSemiBold' lightColor={paleta.dark_aqua}>Nombre de la categoría</ThemedText>
          <TextInput
            placeholder="Ej: Saludos, Comidas, etc."
            placeholderTextColor={"#888"}
            value={nombreNuevaCate}
            onChangeText={setNombreNuevaCate}
            style={[styles.input, { backgroundColor: paleta.softgray, marginTop:15 }]}
          />

        <BotonLogin
          callback={crear_categoria}
          textColor='white'
          bckColor={paleta.yellow}
          text='Crear'
        />
      </SmallPopupModal>
      <Toast/>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e6f7f2',
  },
  mainView: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: '#e6f7f2',
    marginBottom: 60,
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop:40 
  },
  panelTitle: {
    marginBottom: 8,
    textAlign: 'center',
    color: paleta.dark_aqua,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    padding: 22,
    marginBottom: 18,
    width: '90%',
    alignItems: 'center',
  },
  label: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 18,
    fontSize: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    marginTop: 12,
  },
  infoTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    marginTop: 4,
    width: '100%',
  },
  fileName: {
    color: '#222',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  removeFileBtn: {
    marginLeft: 8,
    padding: 4,
  },
  previewVideo: {
    marginBottom: 20,
    width: '100%',
    borderRadius: 10,
  },
  errorText: {
    color: '#cc0000',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginTop: -12,
    marginBottom: 12,
  },

  categoriesRow: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    marginBottom: 3
  },
  chipIdle: {
    backgroundColor: '#fff',
    borderColor: paleta.softgray,
  },
  chipSelected: {
    backgroundColor: paleta.dark_aqua,
    borderColor: paleta.dark_aqua,
  },
  chipText: {
    fontSize: 14,
  },
  smallMuted: {
    color: '#666',
    fontSize: 13,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    backgroundColor: paleta.yellow,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    minWidth: 200,
    marginTop: 25
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
