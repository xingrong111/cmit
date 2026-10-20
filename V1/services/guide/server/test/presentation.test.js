import test from 'node:test';
import assert from 'node:assert/strict';
import {present} from '../src/presentation.js';
test('资料回答保留原文出处且切分段落',()=>{const r=present({answer:'第一段\n第二段',mode:'sources',citations:[{id:'S1'}]});assert.equal(r.presentation.kind,'history');assert.deepEqual(r.presentation.paragraphs,['第一段','第二段']);assert.equal(r.citations[0].id,'S1');});
test('限流反馈可重试，普通聊天不变成史料指导',()=>{const r=present({answer:'稍后重试',mode:'chat_fallback',modelStatus:'unavailable'});assert.equal(r.presentation.kind,'chat');assert.equal(r.retryable,true);});

test('地点卡已有操作时删除重复按钮，保留路线入口',()=>{const r=present({answer:'建议',placeCards:[{id:'P1'}],actions:[{type:'place',id:'P1'},{type:'add',id:'P1'},{type:'route',label:'打开文化路线'}],modelStatus:'unavailable'});assert.deepEqual(r.actions,[{type:'route',label:'打开文化路线'}]);assert.equal(r.modelNotice,'模型暂不可用 · 基础回答');});
