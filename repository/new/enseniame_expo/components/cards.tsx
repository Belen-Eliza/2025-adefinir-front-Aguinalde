import { TouchableOpacity , StyleSheet, View} from "react-native"
import { ThemedText } from "./ThemedText"
import { estilos } from "./estilos"
import { icon_type } from "./types"
import { Ionicons } from "@expo/vector-icons"

function XPCard (props: {borderColor:string,bckColor: string,textColor:string,title:string,cant:number,icon?: icon_type,iconColor?:string}){
    return (
        <View style={[styles.card,estilos.centrado,{borderColor:props.borderColor}]}>
            <View style={[styles.cardTitleContainer,estilos.centrado,{backgroundColor:props.bckColor}]}>
                <ThemedText type="bold" lightColor={props.textColor}>{props.title}</ThemedText>
            </View>
            <View style={[styles.cardData,estilos.centrado]}>
                {props.icon && (
                    <Ionicons name={props.icon} style={styles.icon} color={props.iconColor? props.iconColor:props.bckColor} size={30} />
                )}
                <ThemedText style={styles.txt} type="defaultSemiBold">{props.cant}</ThemedText>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 6,
        borderWidth: 2,
        width: "90%"
    },
    cardTitleContainer:{
        width:"100%",
        padding: 10
    },
    cardData:{
        flexDirection:"row",
        padding: 20
    },
    txt:{
        fontSize: 25,
        textAlign: "center",
        alignSelf:"flex-end"
    },
    icon:{
        marginRight: 15,
        alignSelf:"center"
    }
})

export {XPCard}