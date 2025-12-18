import { estilos } from '@/components/estilos';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, Navigator } from 'expo-router';
import { Pressable } from 'react-native';

export default function Layout(){
    return(
    <Stack screenOptions={{
          
          headerStyle: {
            backgroundColor: "#004993",
          },
          headerTintColor: 'white',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
            <Stack.Screen name='index' options={{headerShown:false}}/>
            <Stack.Screen name='modulo_detalle' options={{headerShown:false }}   />
            <Stack.Screen name='lecciones' options={{headerShown:false }}   />

    </Stack>)
}