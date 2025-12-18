# Proyecto Integral de Desarrollo - Template

![GHA Status](https://github.com/uca-argentina/project-template/actions/workflows/GHA.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/uca-argentina/project-template/badge.svg?branch=master)](https://coveralls.io/github/uca-argentina/project-template?branch=master)

## Metacello

```smalltalk
Metacello new
   baseline: 'IngSoft2';
   githubUser: 'uca-argentina' project: 'project-template' commitish: 'master' path: 'repository';
   load: 'development'.
```


## Dependencias

* npx expo install expo-checkbox
* npm install --save react-native-toast-message
* npm i @emailjs/react-native
* npx expo install expo-crypto
* npx expo install @supabase/supabase-js @react-native-async-storage/async-storage @rneui/themed
* npm i @react-native-picker/picker
* npm install react-native-dropdown-picker
