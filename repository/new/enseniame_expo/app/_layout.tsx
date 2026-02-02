import { Stack } from "expo-router";
import  UserContextProvider  from "@/context/UserContext";

export default function RootLayout() {
  return(
    <UserContextProvider>
    <Stack>
      <Stack.Screen name='index' options={{title:"Start",headerShown: false}}/>
      <Stack.Screen name='login' options={{title:"Login",headerShown: false}}/>
      <Stack.Screen name='signup_alumno' options={{title:"Crear cuenta",headerShown: false}}/>
      <Stack.Screen name='signup_profe' options={{title:"Crear cuenta",headerShown: false}}/>
      <Stack.Screen name='acc_recovery' options={{title:"Recuperar cuenta",headerShown: false}}/>
      {/* <Stack.Screen name='video_upload_form' options={{title:"Subir video",headerShown: false}}/> */}
      <Stack.Screen name='tabs' options={{headerShown: false}}/>
    </Stack>
    </UserContextProvider>
    );
}
