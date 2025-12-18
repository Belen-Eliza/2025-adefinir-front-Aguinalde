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
            <Stack.Screen name='alumno_objetivos' options={{headerShown:false , presentation: "modal"}}   />
            
    </Stack>)
}