import { Stack, Navigator } from 'expo-router';

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
            <Stack.Screen name='editar_perfil' options={{headerShown:false}}/>
            <Stack.Screen name='gestion_avatars' options={{headerShown:false}}/>
            <Stack.Screen name='detalle_insignias' options={{headerShown:false}}/>
            <Stack.Screen name='insignias_categoria' options={{headerShown:false}}/>
    </Stack>)
}