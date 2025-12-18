import { supabase } from '../lib/supabase'
import { Senia_Info } from '@/components/types'
import { error_alert } from '@/components/alert';

const traer_tabla_videos = async () => {
    try {
        const { data: videos, error } = await supabase.from('Senias').select('*');
        if (error) {
            console.error('Error:', error.message);
            return;
        }
        if (videos && videos.length >0){
            return videos
        }

    } catch (error) {
        error_alert(String(error))
    }
    
}

const buscarSenias = async () => {
    try {        
        let { data, error } = await supabase.from('Senias').select(`*,  Users: Users!id_autor (*),  Categorias (nombre) `);        

        if (error) throw error;
        if (data && data.length>0)  return data
      
    } catch (error) {
      console.error('Error fetching señas:', error);
      error_alert('No se pudieron cargar las señas');
    } 
};

function getPathFromUrl(fileUrl: string) {
      const urlParts = fileUrl.split('/');
      const first_index=urlParts.findIndex(each=>each=="videos")
      const filePath = urlParts[first_index+1]+"/"+urlParts[first_index+2].split("?")[0];
      return  filePath ;
}

const borrar_de_bucket= async (fileUrl: string) =>{
    const filePath =getPathFromUrl(fileUrl)
    const { error } = await supabase.storage.from("videos").remove([filePath]);
    
    if (error) throw new Error(String(error));
    return true
}

const eliminar_video = async (senia:Senia_Info)=>{
    try {
        borrar_de_bucket(senia.video_url);      
        const { error } = await supabase.from('Senias').delete().eq('id', senia.id);
        if (error) throw new Error(String(error));
        
    } catch (error) {
        console.error("Error borrando la seña:",error);
        error_alert("Ocurrió un error al borrar la seña");
    }
}

const subir_video =async(videoFile: { uri: string; name: string; type: string })=>{
// 1. Crear FormData para subir el archivo
      const formData = new FormData();
      formData.append('file', {
        uri: videoFile.uri,
        name: videoFile.name,
        type: 'video/mp4'
      } as any);

      // 2. Subir video al bucket usando FormData
      const filename = `Senias/${videoFile.name}`;
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filename, formData, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (error) throw new Error(String(error));

      // 3. Obtener URL privada
      const videoPath = data.path;
      const videoUrl = await getSignedUrl('videos', videoPath);
      return videoUrl
}

const subir_senia = async(videoFile: { uri: string; name: string; type: string },meaning:string)=>{
    try {
        const videoUrl = await subir_video(videoFile);

        // 4. Guardar en la tabla
        const { error: insertError } = await supabase
        .from('Senias')
        .insert([{ significado: meaning, video_url: videoUrl }]);

        if (insertError) throw insertError;
    } catch (error) {
        error_alert("Ocurrió un error al subir la seña");
        console.error(error)
    }
}
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

const cambiar_video = async (videoFile: { uri: string; name: string; type: string },id_senia:number)=>{
    const url = await subir_video(videoFile);
    
    const { error } = await supabase
        .from('Senias')
        .update({ video_url: url })
        .eq('id', id_senia)
        .select();

    if (error) throw new Error(String(error))
}

const cambiar_nombre_senia = async (nombre_nuevo:string,id_senia:number)=>{
    const { error } = await supabase
        .from('Senias')
        .update({ significado: nombre_nuevo })
        .eq('id', id_senia)
        .select();
    if (error) throw new Error(String(error));
    return true
}

const mis_senias = async (id:number)=>{
  
  let { data: Senias, error } = await supabase
    .from('Senias')
    .select(`*,  Categorias (nombre) `)
    .eq('id_autor',id);
  if (error) throw error;

  if (Senias && Senias.length>0) return Senias     
}

export {traer_tabla_videos,buscarSenias,eliminar_video, subir_senia , cambiar_video, borrar_de_bucket as borrar_video_de_storage, 
    cambiar_nombre_senia, mis_senias }