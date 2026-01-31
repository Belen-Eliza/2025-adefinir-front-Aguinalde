import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet,   TextInput,  
  KeyboardAvoidingView,  Platform,  ScrollView
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import VideoPlayer from '@/components/VideoPlayer';
import { success_alert,error_alert } from '@/components/alert';
import { paleta } from '@/components/colores';
import { ThemedText } from '@/components/ThemedText';
import { useUserContext } from '@/context/UserContext';
import { router,useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { traerCategorias } from '@/conexiones/categorias';
import { BotonLogin } from '@/components/botones';
import { crearReporte, traerMotivosReporte } from '@/conexiones/reportes';

type Cate ={
     id: number; nombre: string
}

DropDownPicker.setListMode("SCROLLVIEW");

export default function Reportar_senia() {
    const {id_senia=0,url,significado,cate} =useLocalSearchParams();
    if (id_senia==0) router.back();

    const {name,type}= getNameAndTypeFromURL(String(url));
    const contexto= useUserContext()

    const videoFile = {uri:String(url),name:name,type:type};
    const selectedCategory = Number(cate);

    const [categories, setCategories] = useState<Cate[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoria,setCategoria] = useState<Cate>()
    const [comentario,setComentario] = useState("");
    
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(null);
    const [items, setItems] = useState<{value:number,label:string}[]>([]);
    
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
        try {
            const cates = await traerCategorias();
            setCategories(cates || []);

            cates.forEach(cat => {
                const selected = selectedCategory === cat.id;
                if (selected) setCategoria(cat)
            })
        } catch (error) {
            error_alert("No se pudieron cargar las categorías");
            console.error(error)
        } finally {
            setLoadingCategories(false)
        }
        };

        const fetchMotivos = async ()=>{
            try {
                const motivos = await traerMotivosReporte();
                let itms = motivos?.map(each=>{
                    return {value: each.id,label: each.descripcion}
                });
                setItems(itms || [])

            } catch (error) {
                error_alert("No se pudieron obtener los motivos");
                console.error(error)
            }
        }
    
        fetchCategories();
        fetchMotivos();
    }, []);

    const submit = async ()=>{
        if (value){            
            let my_id = contexto.user.id;
            crearReporte(my_id,value,comentario,Number(id_senia))
            .catch(reason=>{
                error_alert("No se pudo crear el reporte");
                console.error(reason)
            })
            .then(()=>{
                success_alert("¡Reporte creado con éxito!");
                setTimeout(()=> {
                    router.dismiss();
                    router.replace("/tabs/Diccionario");}, 700);
            })
        } else{
            error_alert("Seleccione un motivo");
        }
    }

    return (
        <View style={styles.safeArea}>
            <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1,width:"100%"}}
            >
                <ScrollView contentContainerStyle={styles.mainView}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.panelTitle}>Reportar video de seña</Text>
                        <Text style={styles.subtitle}>Reporta contenido duplicado o erróneo para una mejor experiencia de aprendizaje</Text>
                    </View>

                    <View style={styles.card}>
                    {videoFile && (
                        <VideoPlayer 
                        uri={videoFile.uri}
                        style={styles.previewVideo}
                        />
                    )} 
                    <ThemedText style={[{marginVertical: 10,alignSelf:"flex-start"}]}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>Significado:</ThemedText>{' '}
                        <ThemedText type='default'>{String(significado)}</ThemedText>
                    </ThemedText>

                    <ThemedText style={[{alignSelf:"flex-start"}]}>
                    <ThemedText type="subtitle" style={[styles.label, { marginTop: 4 }]}>Categoría:</ThemedText>{' '}
                    {loadingCategories ? (
                        <ThemedText style={styles.smallMuted}>Cargando categorías...</ThemedText>
                        ) : categories.length === 0 ? (
                        <ThemedText style={styles.smallMuted}>No hay categorías disponibles</ThemedText>
                        ) : (
                            <ThemedText>{categoria?.nombre}</ThemedText>
                        )}
                    </ThemedText>

                    <ThemedText type='subtitle' style={[styles.label,{marginTop:20}]}>¿Por qué deseas reportar este contenido?</ThemedText>                    
                    <DropDownPicker
                        open={open}
                        value={value}
                        items={items}
                        setOpen={setOpen}
                        setValue={setValue}
                        setItems={setItems}
                        placeholder={'Elige un motivo'}
                        placeholderStyle={{color:"#888"}}
                        style={styles.input}
                    />

                    <Text style={[styles.label,{marginVertical:10}]}>Comentarios</Text>
                    <TextInput
                        placeholder="Consideraciones adicionales"
                        placeholderTextColor={"#888"}
                        value={comentario}
                        onChangeText={setComentario}
                        style={styles.input}
                    />
                    
                    <BotonLogin callback={submit} textColor={'white'} bckColor={paleta.dark_aqua} text={'Reportar'}                    
                    />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <Toast/>
        </View>
    )
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
    paddingHorizontal: 10
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
    marginTop:10
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
  ctaIcon: {
    marginRight: 10,
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