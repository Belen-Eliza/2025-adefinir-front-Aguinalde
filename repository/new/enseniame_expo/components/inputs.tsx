import { Ionicons } from "@expo/vector-icons";
import { TextInput, StyleSheet, KeyboardTypeOptions, StyleProp, ViewStyle, View, Pressable } from "react-native";
import { icon_type } from "./types";

type Icon = {
    Ionicon_name : icon_type
}


function IconTextInput (props: 
        {icon: Icon, value: string | undefined, bck_color: string,
        onChange: (text: string) => void, keyboardType:  KeyboardTypeOptions, 
        placeholder: string ,
    }){

    return (
        <View style={[styles.inputContainer,{backgroundColor:props.bck_color}]}>
            <Ionicons name={props.icon.Ionicon_name} size={24} color="#666" style={styles.inputIcon} />
            <TextInput
                style={[styles.textInput,{backgroundColor:props.bck_color}]}
                textContentType="name"
                keyboardType={props.keyboardType}
                onChangeText={props.onChange}
                value={props.value}
                placeholder={props.placeholder}
                placeholderTextColor="#999"
                autoCapitalize="none"
            />
        </View>
    )
}

function PasswordInput(props:
    { value: string | undefined, bck_color: string,
        onChange: (text: string) => void, 
        showPassword: boolean,
        setShowPassword: Function,
        placeholder: string
    }){

    return (
        <View style={[styles.inputContainer,{backgroundColor:props.bck_color}]}>
            <Ionicons name="lock-closed-outline" size={24} color="#666" style={[styles.inputIcon,{marginLeft:20}]} />
            <TextInput
                style={[styles.textInput,{backgroundColor:props.bck_color}]}
                secureTextEntry={!props.showPassword}
                textContentType="password"
                onChangeText={props.onChange}
                value={props.value}
                placeholder={props.placeholder}
                placeholderTextColor="#999"
            />
            <Pressable style={{position: "relative", left: -20}}  onPress={()=> {props.setShowPassword(!props.showPassword)}} >
                <Ionicons
                name= {props.showPassword ? "eye-outline" : "eye-off-outline"}
                size={24}
                color="#666"
                />
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        flex: 1,
        borderColor: "lightgray",
        borderRadius: 9,
        borderWidth: 1,
        justifyContent: 'center',
        maxHeight: 42,
        minHeight: 42,
        width: "100%"
  },
    inputIcon: {
        marginRight: 10,
        marginLeft: 10
    },
    textInput:{
        padding:8,
        fontSize:18,
        elevation: 1,
        minWidth: "80%",
        maxHeight: 40,
        minHeight: 40,
        borderRadius: 9,
        flex: 1,
        width: "80%"
  },
})


export {IconTextInput, PasswordInput}