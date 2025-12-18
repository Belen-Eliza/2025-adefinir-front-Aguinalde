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
            <Stack.Screen name='objetivos_activos' options={{headerShown:false , presentation: "modal"}}   />
            <Stack.Screen name='reporte_historico' options={{headerShown:false , presentation: "modal"}}   />
            <Stack.Screen name='ranking' options={{headerShown:false , presentation: "modal"}}   />

    </Stack>)
}