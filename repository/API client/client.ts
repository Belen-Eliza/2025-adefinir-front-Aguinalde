const myHeaders = new Headers();
myHeaders.append("apikey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwamVwbmljZXlmZ2hsYWRxcXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjE5NjcsImV4cCI6MjA3MzQzNzk2N30.gVnCO7ALvbF3Zol9k-R6k-CyPDh8-7KjJiqRuU5YVRk");

const requestOptions: RequestInit = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

fetch("https://apjepniceyfghladqqxg.supabase.co/rest/v1/get_modulos", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));