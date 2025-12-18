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
}

class Logged_Alumno extends Logged_User {
    racha: number;
    racha_maxima: number;
    xp: number;
    coins:number;

    constructor(mail:string,name: string,pass:string,id:number,racha:number,racha_maxima:number,xp:number,coins:number,avatar?:string){
        super(mail,name,pass,id,avatar);
        this.racha=racha;
        this.racha_maxima= racha_maxima;
        this.xp=xp;
        this.coins=coins;
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
    Users: Logged_User| null,
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