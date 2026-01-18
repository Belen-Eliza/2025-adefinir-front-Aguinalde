import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

abstract class User {
    mail: string;
    username: string;
    hashed_password: string;
    is_prof:boolean

    constructor(mail:string,name: string,pass:string,is_prof:boolean){
        this.mail=mail;
        this.username=name;
        this.hashed_password=pass;
        this.is_prof=is_prof;
    }
    abstract goHome():void;

}
class Alumno extends User {

    constructor(mail:string,name: string,pass:string){
        super(mail,name,pass,false)
    }
    goHome(): void {
        router.push('/tabs/HomeStudent');
    }
}

class Profesor extends User  {
    institution: string    

    constructor(mail:string,name: string,pass:string, institucion:string){
        super(mail,name,pass,true);
        this.is_prof=true;
        this.institution=institucion;
    }

    goHome(): void {
        router.push('/tabs/HomeTeacher');
    }
    getUser(){
        return {mail:this.mail,username:this.username,is_prof:true,hashed_password:this.hashed_password}
    }
} 

 class Logged_User {
    mail: string;
    username: string;
    hashed_password: string;
    id:number;
    is_prof: boolean;
    avatar?:string    

    constructor(mail:string,name: string,pass:string,id:number,avatar?:string){
        this.mail=mail;
        this.username=name;
        this.hashed_password=pass;
        this.id=id;
        this.is_prof=false;
        this.avatar=avatar;
        //this.institution=""
    }
     goHome(){};
     gotToModules(){};
     gotToProfile(){};
     getRacha(){return 0}
     getRachaMax(){return 0}
     getXP(){return 0}
     getCoins(){return 0}
     getLevel(){return 0}
     getInstitucion(){return ""}
     getIsAdmin(){return false}
     getLastLogin(){return new Date()}
     sumarRacha(){};
     perderRacha(){};
}
class Logged_Profesor extends Logged_User {
    institution: string;
    is_prof: true;
    is_admin:boolean;

    constructor(mail:string,name: string,pass:string, institucion:string,id:number,is_admin:boolean,avatar?:string){
        super(mail,name,pass,id,avatar);
        this.institution=institucion;
        this.is_prof=true;
        this.is_admin=is_admin;
    }

    goHome(): void {
        router.push('/tabs/HomeTeacher');
    }
    gotToModules():void{
        router.push('/tabs/Modulos_Profe');
    }
    gotToProfile():void{
        router.push('/tabs/perfil');
    }
    getInstitucion(){
        return this.institution
    }
     getIsAdmin(){
        return this.is_admin
    }
}

class Logged_Alumno extends Logged_User {
    racha: number;
    racha_maxima: number;
    last_login:Date;
    xp: number;
    coins:number;
    nivel: number;

    constructor(mail:string,name: string,pass:string,id:number,racha:number,racha_maxima:number,xp:number,
                coins:number,last_login:Date,nivel:number,avatar?:string){
        super(mail,name,pass,id,avatar);
        this.racha=racha;
        this.racha_maxima= racha_maxima;
        this.xp=xp;
        this.coins=coins;        
        this.last_login= new Date(last_login);
        this.nivel = nivel;
    }
   
    goHome(): void {
            router.push('/tabs/HomeStudent');
    }
    gotToModules():void{
        router.navigate('/tabs/Modulos_Alumno');
    }
    gotToProfile():void{
        router.push('/tabs/PerfilAlumno');
    }
    getRacha(){
        return this.racha
    }
     getRachaMax(){
        return this.racha_maxima
    }
     getXP(){
        return this.xp
    }
     getCoins(){
        return this.coins
    }
     getLastLogin(){
        return this.last_login
    }
    getLevel(){
        return this.nivel
    }
    sumarRacha(){
        this.racha++
    };
    perderRacha(){
        this.racha=1;
        this.last_login= new Date();        
    };
}

type icon_type = keyof typeof Ionicons.glyphMap;

interface Senia {
  id: number;
  significado: string;
  video_url: string;
  id_autor: number | undefined;
  categoria: number | undefined
}

interface Senia_Info {
    Categorias: {nombre:string} ,
    Profesores: {Users: {username:string}} | null,
    id: number;
    significado: string;
    video_url: string;
  id_autor: number | undefined;
  categoria: number 
}

interface Senia_Info {
    Categorias: {nombre:string},
    Users: Logged_User| null,
    id: number;
    significado: string;
    video_url: string;
}

class Senia_Alumno {
    info: Senia_Info;
    estado:Estado_Senia;
    constructor (info: Senia_Info,estado:Estado_Senia){
        this.info=info;
        this.estado =estado
    }
    cambiar_estado(data:string){
        this.estado.cambiar_estado(data,this)
    }
    setEstado(estado_nuevo:Estado_Senia){
        this.estado=estado_nuevo;
    }
    sumar_acierto(){
        this.estado.sumar_acierto();
    }
}

abstract class Estado_Senia {
    abstract cambiar_estado(data:string,senia:Senia_Alumno):void
    sumar_acierto(){}
}
class Estado_Pendiente extends Estado_Senia{
    cambiar_estado(data: string, senia: Senia_Alumno): void {
        senia.setEstado(new Estado_Aprendiendo(0));
        //conectar con db
    }    
}
class Estado_Aprendiendo extends Estado_Senia{
    cant_aciertos:number;
    constructor(cant_aciertos:number){
        super();
        this.cant_aciertos=cant_aciertos
    }
    cambiar_estado(data: string, senia: Senia_Alumno): void {
        //revisar
    }
    sumar_acierto(){
        this.cant_aciertos++
    }
}
class Estado_Dominada extends Estado_Senia{
    cambiar_estado(data: string, senia: Senia_Alumno): void {
        //nada
    }
}

interface Modulo {
    id: number,
    autor: number | null,
    descripcion: String,
    icon: keyof typeof Ionicons.glyphMap,
    nombre: String
}
type Calificaciones = {
  id_alumno: number;
  Users: {username:string};
  id_modulo: number;
  puntaje: number;
  comentario? : string;
  created_at: string
}

type Avatar = {
  id: number;
  image_url: string;
  racha_desbloquear: number;
}

export {User,Logged_User, Logged_Profesor, Alumno, Profesor, Logged_Alumno, Senia,  Senia_Info, Modulo, icon_type, Calificaciones,
    Avatar
}