import { Dimensions, StyleSheet } from "react-native";


export const estilos = StyleSheet.create({
    centrado:{
    alignContent: "center",
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center"
  },
  shadow:{
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  thinGrayBottomBorder:{
      borderBottomColor:"lightgray",
      borderBottomWidth: 1
    },
  ver_debug: {
    backgroundColor: "blue",
    borderWidth: 3,
    borderColor: "red"
  }
})