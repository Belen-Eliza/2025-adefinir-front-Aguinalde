import { marcar_aprendida, marcar_aprendiendo, marcar_pendiente } from "@/conexiones/aprendidas";
import { sumar_acierto } from "@/conexiones/aprendidas";
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
        this.racha++;
        this.last_login= new Date();            
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
    cambiar_estado(id_alumno:number){
        this.estado.cambiar_estado(this,id_alumno)
    }
    setEstado(estado_nuevo:Estado_Senia){
        this.estado=estado_nuevo;
    }
    sumar_acierto(id_alumno:number){
        this.estado.sumar_acierto(id_alumno,this.info.id);
    }
}

abstract class Estado_Senia {
    abstract cambiar_estado(senia:Senia_Alumno,id_alumno:number):void
    sumar_acierto(id_alumno:number,id_senia:number){}
    abstract display_checkmark(): "flex" | "none"
    abstract esta_aprendiendo(): boolean
    abstract dominada(): boolean
}
class Estado_Pendiente extends Estado_Senia{
    dominada(): boolean {
        return false
    }
    esta_aprendiendo(): boolean {
        return false
    }
    display_checkmark(): "flex" | "none" {
        return "none"
    }
    cambiar_estado( senia: Senia_Alumno,id_alumno:number): void {
        senia.setEstado(new Estado_Aprendiendo(0));
        //conectar con db
        marcar_aprendiendo(senia.info.id,id_alumno)
    }    
    toString(){
        return "Pendiente"
    }
}
class Estado_Aprendiendo extends Estado_Senia{
    cant_aciertos:number;
    constructor(cant_aciertos:number){
        super();
        this.cant_aciertos=cant_aciertos
    }
    cambiar_estado( senia: Senia_Alumno,id_alumno:number): void {
        senia.setEstado(new Estado_Pendiente());
        //db
        marcar_pendiente(senia.info.id,id_alumno)
    }
    sumar_acierto(id_alumno:number,id_senia:number){
        this.cant_aciertos++
        sumar_acierto(id_alumno,id_senia);
        if (this.cant_aciertos>=10){
            //marcar como dominada
            marcar_aprendida(id_senia,id_alumno)
        }
    }
    toString(){
        return "Aprendiendo"
    }
    display_checkmark(): "flex" | "none" {
        return "none"
    }
    esta_aprendiendo(): boolean {
        return true
    }
    dominada(): boolean {
        return false
    }
}
class Estado_Dominada extends Estado_Senia{
    cambiar_estado( senia: Senia_Alumno): void {
        //nada
        alert("No se puede cambiar el estado de una seña dominada.")
    }
    toString(){
        return "¡Dominada! 🎉"
    }
    display_checkmark(): "flex" | "none" {
        return "flex"
    }
    esta_aprendiendo(): boolean {
        return false
    }
    dominada(): boolean {
        return true
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
type Insignia = {
  id: number;
  nombre: string;
  descripcion: string;
  image_url: string;
  motivo:number;
  ganada: boolean;
}

export {User,Logged_User, Logged_Profesor, Alumno, Profesor, Logged_Alumno, Senia,  Senia_Info, Modulo, icon_type, Calificaciones,
    Avatar, Senia_Alumno, Estado_Aprendiendo,Estado_Dominada,Estado_Pendiente,Estado_Senia,Insignia
}