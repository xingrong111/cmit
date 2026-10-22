<script>
// #ifdef H5
import {go} from "./lib/navigation.js";
// #endif
export default {onLaunch(){
 // #ifdef H5
 window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='yingji-module-navigation'&&['home','people','timeline','me'].includes(e.data.page)){const page=e.data.page;if(page==='timeline')uni.navigateTo({url:'/pages/timeline/index'});else uni.switchTab({url:'/pages/'+page+'/index'});}if(e.data?.type==='yingji-discussion'&&/^(P[0-9]{3}|QQB|LYS|SZZ|LDY|JZY)$/.test(e.data.topicId))go('discussion',{topicId:e.data.topicId});if(e.data?.type==='yingji-learning-back'){const pages=getCurrentPages();if(pages.length>1)uni.navigateBack();else uni.switchTab({url:'/pages/people/index'});}if(e.data?.type==='yingji-learning-login'||e.data?.type==='yingji-auth'){uni.setStorageSync('yingji:account-intent',{mode:e.data.mode||'login',returnTo:e.data.returnTo||(e.data.type==='yingji-learning-login'?'learning':'')});uni.switchTab({url:'/pages/me/index'});}if(e.data?.type==='yingji-learning')uni.redirectTo({url:'/pages/learning/index'});if(e.data?.type==='yingji-wenchuang')uni.navigateTo({url:'/pages/wenchuang/index'});if(e.data?.type==='yingji-radar'&&/^P[0-9]{3}$/.test(e.data.id)){uni.setStorageSync('yingji:radar-person',e.data.id);uni.switchTab({url:'/pages/radar/index'});}if(e.data?.type==='yingji-reading')uni.switchTab({url:'/pages/me/index'});if(e.data?.type==='yingji-person'&&/^P[0-9]{3}$/.test(e.data.id))uni.navigateTo({url:'/pages/person/index?id='+e.data.id})});
 // #endif
}}
</script>
<style>
@import './styles/theme.css';
@import './styles/合并视觉.css';
@import './styles/页面精修.css';
@import './styles/时间长卷.css';
@import './styles/个人与学习.css';
@import './styles/使用引导.css';
@import './styles/山河三页.css';
@import './styles/随页山水.css';
@import './styles/v2-卡片.css';
/* #ifdef H5 */
@import './static/b-theme.css';
@import './static/v2-视觉.css';
/* #endif */
@import './styles/长卷配图.css';
</style>
