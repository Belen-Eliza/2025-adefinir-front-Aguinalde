import { 
  Pressable, Text, TextInput, View, StyleSheet, ScrollView,  KeyboardAvoidingView,  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from "react";
import VideoUpload from '@/components/VideoUpload';
import VideoPlayer from '@/components/VideoPlayer';
import { error_alert, success_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import { router, useLocalSearchParams } from 'expo-router';
import { borrar_video_de_storage, cambiar_nombre_senia, cambiar_video } from '@/conexiones/videos';
import { paleta } from '@/components/colores';
import { supabase } from '@/utils/supabase';
import { ThemedText } from '@/components/ThemedText';

export default function VideoUploadForm() {
    const {id_senia=0,url,significado,cate} =useLocalSearchParams();
    if (id_senia==0) router.back();

    const {name,type}= getNameAndTypeFromURL(String(url));
  
  const [meaning, setMeaning] = useState(String(significado));
  const [categories, setCategories] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(Number(cate));
  const [videoFile, setVideoFile] = useState<{ uri: string; name: string; type: string } | null>({uri:String(url),name:name,type:type});
  const [subiendo, setSubiendo] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
      const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
          const { data, error } = await supabase
            .from('Categorias')
            .select('id,nombre')
            .order('nombre', { ascending: true });
  
          if (error) {
            console.error('Error fetching categorias:', error.message);
            setCategories([]);
          } else {
            setCategories(data || []);
          }
        } catch (e) {
          console.error('Error fetching categorias:', e);
          setCategories([]);
        } finally {
          setLoadingCategories(false);
        }
      };
  
      fetchCategories();
    }, []);

  const handleVideoUpload = (video: { uri: string; name: string; type: string }) => {
    setVideoFile(video);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
  };

  const handleSubmit = async () => {
    if (!meaning || !videoFile) {
      error_alert('Completa el significado y sube un video.');
      return;
    }
    setSubiendo(true);
    try {
      //si cambio el video
      let exito= false;
        if (name!=videoFile.name || type!=videoFile.type) {
            exito = await borrar_video_de_storage(String(url))
            const aux = await cambiar_video(videoFile,Number(id_senia)).catch((reason)=>{
              exito = false;
              error_alert("Este video ya fue subido");
              console.log(reason);
            });
        }
        
      //si cambio el significado
      if (significado!=meaning) exito = await cambiar_nombre_senia(meaning,Number(id_senia));

      //si cambio la categoria (después)
        if (Number(cate) != selectedCategory) {
          console.log("cambiando")
          const {error} = await supabase.from("Senias").update({categoria:selectedCategory}).eq("id",Number(id_senia));
          
          if (error) throw error
          exito=true;
        }

      if (exito){
        success_alert('¡Seña subida con éxito!');

        setMeaning('');
        setVideoFile(null);
        setTimeout(()=> {
          router.dismiss();
          router.replace("/tabs/Diccionario");}, 700);
      }
      
    } catch (e: any) {
      error_alert('Error al subir: ' + e.message);
      //atrapar error de videos/señas repetidas
      console.error(e);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <View style={styles.safeArea}>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1,width:"100%"}}
          >
      <ScrollView contentContainerStyle={styles.mainView}>
        <View style={styles.headerContainer}>
          <Text style={styles.panelTitle}>Editar video de seña</Text>
          <Text style={styles.subtitle}>Mantén tus videos actualizados para una mejor experiencia de aprendizaje</Text>
        </View>

        {/* <Image
          source={require('@/assets/images/LSA.png')}
          style={styles.logo}
        /> */}

        <View style={styles.card}>
          {videoFile && (
            <VideoPlayer 
              uri={videoFile.uri}
              style={styles.previewVideo}
            />
          )}
          
          <Text style={styles.label}>¿Qué significa la seña?</Text>
          <TextInput
            placeholder="Ej: Hola, Gracias, etc."
            placeholderTextColor={"#888"}
            value={meaning}
            onChangeText={setMeaning}
            style={styles.input}
          />

          {videoFile ? (
            <View style={styles.fileInfoContainer}>
              <Ionicons name="videocam" size={22} color={paleta.dark_aqua}/>
              <Text style={styles.fileName}>{videoFile.name}</Text>
              <Pressable onPress={handleRemoveVideo} style={styles.removeFileBtn}>
                <Ionicons name="close-circle" size={20} color={paleta.strong_yellow} />
              </Pressable>
            </View>
          ) : (
            <VideoUpload onVideoUpload={handleVideoUpload}  />
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
                    </View>

          {meaning.trim() !== '' && videoFile && (
            <TouchableOpacity style={styles.ctaButton} onPress={handleSubmit} disabled={subiendo}>
              <Text style={styles.ctaButtonText}>{subiendo ? 'Subiendo...' : 'Guardar Seña'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿Por qué subir tus videos?</Text>
          <Text style={styles.infoText}>
            Sube videos cortos de tus prácticas en Lengua de Señas Argentina (LSA) y contribuye a una comunidad de aprendizaje colaborativo. Tus videos ayudarán a otros usuarios a mejorar sus habilidades y a compartir conocimientos.
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      <Toast/>
    </View>
  );
}

const getNameAndTypeFromURL = (url:string)=>{
    const partes= url.split("/");
    const index = partes.indexOf("Senias") +1;
    const nameAndType = partes[index];
    const name = nameAndType.split(".")[0];
    const type = nameAndType.split(".")[1].split("?")[0];
    return {name,type}
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paleta.aqua_bck,
  },
  mainView: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: paleta.aqua_bck,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  panelTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: paleta.dark_aqua,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: paleta.dark_aqua,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
  logo: {
    height: 120,
    width: 120,
    marginBottom: 18,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    marginBottom: 18,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: paleta.dark_aqua,
    fontWeight: '600',
    marginBottom: 8,
    alignSelf: 'flex-start',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 18,
    backgroundColor: paleta.aqua_bck,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paleta.yellow,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 24,
    marginTop: 8,
    width: '100%',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: paleta.aqua_bck,
    borderRadius: 14,
    padding: 18,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    marginTop: 8,
  },
  infoTitle: {
    color: paleta.dark_aqua,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  infoText: {
    color: '#22223b',
    fontSize: 14,
    textAlign: 'center',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paleta.aqua_bck,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    marginTop: 4,
    width: '100%',
  },
  fileName: {
    color: paleta.dark_aqua,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  removeFileBtn: {
    marginLeft: 8,
    padding: 2,
  },
  previewVideo: {
    marginBottom: 20,
    width: '100%',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
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
  categoriesRow: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
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
});