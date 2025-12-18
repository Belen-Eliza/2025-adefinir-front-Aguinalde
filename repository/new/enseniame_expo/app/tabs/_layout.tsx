import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/TabBarBackground";
import { TabBarIcon } from "@/components/TabBarIcon";
import { Ionicons } from "@expo/vector-icons";
import { Stack, Tabs } from "expo-router";
import { Platform, StyleSheet, View , Text, TouchableOpacity} from "react-native";
import { UserContext, useUserContext } from "@/context/UserContext";

export default function RootLayout() {
  const contexto = useUserContext()
  
  return(
    
    <Tabs screenOptions={{
      tabBarStyle: styles.navBar,
      tabBarItemStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70, 
      },
  }}>
      <Tabs.Screen name='index'  options={() =>({title:"Home",
        tabBarButton: ((props) => 
          <TouchableOpacity onPress={() => {
            contexto.user.goHome()
          }} style={styles.navItem}>
            <Ionicons name="home" size={22} color="#fff" />
            <Text style={styles.navText}>Inicio</Text>
          </TouchableOpacity>
        ),
      })}
      />

      <Tabs.Screen name={contexto.user.is_prof ? 'Modulos_Profe' :'Modulos_Alumno' }  options={() =>({title:"Módulos", headerShown:false,     
          tabBarButton: ((props) => 
            <TouchableOpacity onPress={() => contexto.user.gotToModules()}  style={styles.navItem}>
              <Ionicons name="albums-outline" size={22} color="#fff" />
              <Text style={styles.navText}>Módulos</Text>
            </TouchableOpacity>
          ),
        })}
        />

      {!contexto.user.is_prof ? (
        <Tabs.Screen name='Dashboard_Alumno' options={({ navigation }) => ({ title: 'Dashboard', headerShown: false,
          tabBarButton: ((props) => (
            <TouchableOpacity onPress={() => navigation.navigate('Dashboard_Alumno')} style={styles.navItem}>
              <Ionicons name="stats-chart-outline" size={22} color="#fff" />
              <Text style={styles.navText}>Dashboard</Text>
            </TouchableOpacity>
          )),
        })} />
      ) :
    <Tabs.Screen name='Dashboard_Alumno'  options={{href:null}} />
    }

      {/* Alumno: mis objetivos tab */}
     {/*  {!contexto.user.is_prof ? (
        <Tabs.Screen name='alumno_objetivos' options={({ navigation }) => ({ title: 'Objetivos', headerShown: false,
          tabBarButton: ((props) => (
            <TouchableOpacity onPress={() => navigation.navigate('alumno_objetivos')} style={styles.navItem}>
              <Ionicons name="flag" size={22} color="#fff" />
              <Text style={styles.navText}>Objetivos</Text>
            </TouchableOpacity>
          )),
        })} />
      ) : <Tabs.Screen name='alumno_objetivos' options={{href:null}} />}
 */}
    <Tabs.Screen name='misiones/index' options={{href:null}} />

    <Tabs.Screen name='dashboard_alumno' options={{href:null}} />
    <Tabs.Screen name='leaderboard_grupo' options={{href:null, headerShown: false,}} />

      {contexto.user.is_prof ? (
        <Tabs.Screen name='Modulos_Alumno'  options={{href:null}} />
      ): <Tabs.Screen name='Modulos_Profe'  options={{href:null}} />}
      {contexto.user.is_prof ? <Tabs.Screen name='video_upload_form'   options={({ navigation }) =>({title:"Subir video", headerShown:false,
          tabBarButton: ((props) => 
            <TouchableOpacity onPress={() => navigation.navigate('video_upload_form')}  style={styles.fabButton}>
              <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
          ),
        })}
        /> :
        <Tabs.Screen name="video_upload_form" options={{href:null}}/>
      }

      <Tabs.Screen name='Diccionario'   options={({ navigation }) =>({title:"Diccionario", headerShown:false,
        tabBarButton: ((props) => 
          <TouchableOpacity onPress={() => navigation.navigate('Diccionario')}  style={styles.navItem}>
            <Ionicons name="search" size={22} color="#fff" />
            <Text style={styles.navText}>Diccionario</Text>
          </TouchableOpacity>
        ),
      })}
      />

      <Tabs.Screen name={contexto.user.is_prof ? 'perfil' :'PerfilAlumno' }   options={({ navigation }) =>({title:"Perfil", headerShown:false, 
        tabBarButton: ((props) => 
          <TouchableOpacity onPress={() => contexto.user.gotToProfile()}  style={styles.navItem}>
            <Ionicons name="person-circle-outline" size={22} color="#fff" />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        ),
      })}
      />
      {contexto.user.is_prof ? (
        <Tabs.Screen name='PerfilAlumno'  options={{href:null}} />
      ): <Tabs.Screen name='perfil'  options={{href:null}} />}      
      
      <Tabs.Screen name='cursos'  options={{href:null,headerShown:false}} />
      <Tabs.Screen name="HomeStudent" options={{href:null,title:"Home",headerShown:false}}/>
      <Tabs.Screen name="HomeTeacher" options={{href:null,title:"Home",headerShown:false}}/>
      
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#3e9f94ff',
    paddingVertical: 12,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    marginTop: 15
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  fabButton: {
    position: 'absolute',
    left: '50%',
    bottom: 1,
    transform: [{ translateX: -32 }, { translateY: -20 }],
    backgroundColor: '#8bcac0',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#f3e8ff',
    zIndex: 2,
  },
})