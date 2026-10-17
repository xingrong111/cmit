export function accountKey(key){let id=uni.getStorageSync('yingji:user-id')||'';
// #ifdef H5
id=localStorage.getItem('yingji_user_id')||'';
// #endif
return id?key+':user:'+id:key}
