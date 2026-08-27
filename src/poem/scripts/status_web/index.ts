import { createScriptIdDiv, reloadOnChatChange, teleportStyle } from '@util/script';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { useStatusStore } from './store';
import './styles/index.scss';

$(() => {
  const pinia = createPinia();
  const app = createApp(App).use(pinia);

  // 非 iframe 挂载：直接挂酒馆 body（$ 即酒馆 jquery）。
  // 组件样式经 teleportStyle 复制到酒馆 head（scoped + stb- 前缀类，无类名冲突）。
  const $app = createScriptIdDiv().appendTo('body');
  const { destroy } = teleportStyle();
  app.mount($app[0]);

  console.info('[status_web] 挂载式状态栏已加载');

  // 初次拉取展示数据
  useStatusStore(pinia).refresh();

  // 变量更新结束 → 刷新展示（等待 MVU 就绪）
  waitGlobalInitialized('Mvu').then(() => {
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => useStatusStore(pinia).refresh());
  });

  // 聊天切换 → 重载（消息变量随聊天变化）
  reloadOnChatChange();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
});
