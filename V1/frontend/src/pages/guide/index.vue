<template><AppShell>
 <view class="handbook-cover"><view><text class="eyebrow">山河有迹 / YOUR FIRST JOURNEY</text><text class="page-title">不必一次看遍山河，<text class="handbook-line">先从好奇的地方开始。</text></text><text class="muted">一份随时可以回来的使用指南。先体验，再慢慢深入。</text><button class="outline" @tap="replay">重看四步导览 ↗</button></view><view class="handbook-mark"><text>循迹</text><text>读人</text><text>见史</text></view></view>
 <view class="section-heading"><view><text class="eyebrow">01 / 选择第一段旅程</text><text class="section-title">你想先体验什么？</text></view><text class="small">公开阅读与全景无需先登录</text></view>
 <view class="handbook-journeys"><view v-for="item in journeys" :key="item.id" class="journey-card"><image :src="'/static/icons/'+item.icon+'.png'"/><text class="journey-title">{{item.title}}</text><text class="muted">{{item.copy}}</text><button class="primary" @tap="go(item.page,item.params)">{{item.button}} ↗</button></view></view>
 <view class="handbook-flow"><text>推荐顺序</text><view><text>找人物</text><text>→</text><text>读片段</text><text>→</text><text>看依据</text><text>→</text><text>做挑战</text></view><text class="small">也可以直接看全景或探索场馆。</text></view>
 <view class="section-heading"><view><text class="eyebrow">02 / 每个入口，怎么使用</text><text class="section-title">带着一个小目标去体验</text></view></view>
 <view class="handbook-features"><view v-for="feature in features" :key="feature.page" class="handbook-feature"><view class="feature-heading"><image :src="'/static/icons/'+feature.icon+'.png'"/><view><text class="feature-title">{{feature.title}}</text><text class="small">{{feature.tag}}</text></view></view><text class="feature-intro">{{feature.copy}}</text><view class="feature-steps"><view v-for="(step,i) in feature.steps" :key="step"><text>{{i+1}}</text><text>{{step}}</text></view></view><button class="text-button" @tap="go(feature.page)">{{feature.button}} ↗</button></view></view>
 <view class="handbook-special"><image src="/static/icons/book.png"/><view><text class="feature-title">想体验一个完整互动故事？</text><text class="muted">《针线里的黎明》通过人物对白、热点与分支展开。网页可全景阅读，小程序提供文字和配音；画面与对白不作为历史原话。</text><button class="outline" @tap="go('story')">进入江姐互动故事 ↗</button></view></view>
 <view class="section-heading"><view><text class="eyebrow">03 / 遇到疑问，再来这里</text><text class="section-title">第一次使用，常见的几个问题</text></view></view>
 <view class="handbook-faq"><view v-for="(item,i) in questions" :key="item.q" class="faq-item"><button :aria-expanded="opened===i" @tap="opened=opened===i?-1:i"><text>{{item.q}}</text><text>{{opened===i?'−':'＋'}}</text></button><text v-if="opened===i" class="faq-answer">{{item.a}}</text></view></view>
 <view class="handbook-bottom"><view><text class="feature-title">慢慢读，也是一种抵达。</text><text class="muted">本页一直保留在“我的 → 使用指南”。</text></view><button class="outline" @tap="go('home')">回到首页</button></view>
</AppShell></template>
<script setup>
import {ref} from 'vue';import AppShell from '../../components/AppShell.vue';import {go} from '../../lib/navigation.js';import {requestQuickGuide} from '../../lib/首次使用引导.js';import {features,questions,journeys} from '../../data/使用指南.js';
const opened=ref(0);
function replay(){requestQuickGuide();go('home');}
</script>
