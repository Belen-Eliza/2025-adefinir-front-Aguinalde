import { AntDesign, Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Text } from "react-native";
import { ThemedText } from "./ThemedText";
import { paleta } from "./colores";


function RatingStars (props: {puntaje:number, color:string}){
    return (
        <View style={{flexDirection:"row", marginVertical:15}}>
            <Ionicons name="star" size={24} color={props.color} />
            <Ionicons name={props.puntaje>=2 ? "star": "star-outline"} size={24} color={props.color}/>
            <Ionicons name={props.puntaje>=3 ? "star": "star-outline"} size={24} color={props.color} />
            <Ionicons name={props.puntaje>=4 ? "star": "star-outline"} size={24} color={props.color} />
            <Ionicons name={props.puntaje>=5 ? "star": "star-outline"} size={24} color={props.color} />
        </View>
    )
}

function AntDesignStars(props: {puntaje:number, color:string}){
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
      {[...Array(5)].map((_, i) => (
        <AntDesign
          key={i}
          name="star"
          size={20}
          color={props.puntaje >= i+1 ? props.color : "#E0E0E0"}
        />
      ))}
    </View>
  )
}

type Props = {
  nombre: string;
  rating: number;
  cant_reviews: number
};
function RatingCard({ nombre, rating, cant_reviews }: Props){
    if (rating==0) return <></>
    return (
    <View style={styles.card}>
        <ThemedText>
            <ThemedText style={styles.nombre}>{nombre}:</ThemedText>{' '}
            <ThemedText style={styles.badge}>{rating.toFixed(2)}</ThemedText>
        </ThemedText>
        <View style={styles.row}>            
            <RatingStars puntaje={rating} color={paleta.yellow}/>
            <ThemedText style={[{alignSelf:"flex-end"},styles.fecha]}>{cant_reviews} {cant_reviews==1 ? "calificación": "calificaciones"}</ThemedText>
        </View>
    </View>
    );
}
export {RatingStars, RatingCard, AntDesignStars}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    //backgroundColor: '#e6f7f2',
    color: '#20bfa9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: '600',
  },
  fecha: {
    color: '#555',
  },
});
