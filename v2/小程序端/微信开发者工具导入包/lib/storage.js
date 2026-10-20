"use strict";const e=require("../common/vendor.js");exports.accountKey=function(n){let r=e.index.getStorageSync("yingji:user-id")||"";return r?n+":user:"+r:n};
