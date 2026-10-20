<template><PeopleDirectory/></template>
<script setup>import PeopleDirectory from '../../components/人物目录.vue';import {onShareAppMessage} from '@dcloudio/uni-app';onShareAppMessage(()=>({title:'山河有迹 · 山河人物',path:'/pages/people/index'}));</script>
