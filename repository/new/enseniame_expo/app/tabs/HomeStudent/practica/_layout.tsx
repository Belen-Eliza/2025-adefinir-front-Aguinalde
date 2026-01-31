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
            <Stack.Screen name='por_modulo' options={{headerShown:false}}/>
            <Stack.Screen name='por_categoria' options={{headerShown:false}}/>
            
    </Stack>)
}