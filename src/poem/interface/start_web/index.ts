import { waitUntil } from 'async-wait-until';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './styles/app.scss';
import './styles/global.scss';

$(() => {
  errorCatched(async () => {
    // 等 MVU 与首楼变量初始化完成后挂载（开局表单依赖 stat_data 直写）
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'), { timeout: 30_000 });
    createApp(App).use(createPinia()).mount('#app');
  })();
});
