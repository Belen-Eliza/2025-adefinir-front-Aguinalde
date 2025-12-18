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
            <Stack.Screen name='completado' options={{headerShown:false , presentation: "fullScreenModal"}}   />
            <Stack.Screen name='no_completado' options={{headerShown:false , presentation: "fullScreenModal"}}   />
    </Stack>)
}