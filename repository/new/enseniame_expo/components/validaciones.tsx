

const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return {msj:'La contraseña debe tener al menos 8 caracteres y un carácter especial',status:false}
    } else {
        return {msj:"",status:true}
    }
};


const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {msj:'El formato del email no es válido',status:false}
    } else {
        return {msj:"",status:true}
    }
};

const validateInstitution = (institucion: string)=>{
    return  institucion!=""
}

const get_antiguedad = (date: string)=>{
    const ahora = new Date();
    const antes = new Date(date)
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = ahora.getTime() - antes.getTime();

    if (elapsed < msPerMinute) {
        let seg=Math.round(elapsed/1000);
         return 'Hace '+ seg + ' segundos';   
    }

    else if (elapsed < msPerHour) {
        let min= Math.round(elapsed/msPerMinute);
         return 'Hace '+ min + (min ==1 ? " minuto":' minutos');   
    }

    else if (elapsed < msPerDay ) {
        let hs= Math.round(elapsed/msPerHour ) ;
         return 'Hace '+ hs+ (hs==1 ? ' hora':' horas');   
    }

    else if (elapsed < msPerMonth) {
        let d = Math.round(elapsed/msPerDay);
        return 'Hace ' + d + (d==1 ? ' día' :' días');   
    }

    else if (elapsed < msPerYear) {
        let m= Math.round(elapsed/msPerMonth)
        return 'Hace ' + m + (m==1 ? ' mes' :' meses');   
    }

    else {
        let a = Math.round(elapsed/msPerYear );
        return 'Hace ' + a + (a==1 ? ' año' :' años');   
    }
  }

const now= ()=>{
    let ya = new Date();
    return ya.getFullYear().toString() +"-" + (ya.getMonth()+1).toString()+"-" + ya.getDate().toString()
}

const fue_ayer = (dia:Date)=>{
    let ayer = new Date();
    ayer.setDate(ayer.getDate()-1);      
    return (ayer.toDateString()==dia.toDateString())
}

const es_hoy=(dia:Date)=>{
    let hoy = new Date();
    return (hoy.toDateString()==dia.toDateString())
}
export {validatePassword, validateEmail, validateInstitution, get_antiguedad, now, fue_ayer, es_hoy}