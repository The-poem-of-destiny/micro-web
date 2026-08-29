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

  // 等 MVU 就绪后统一走 Mvu 接口：初次拉取 + 变量更新监听
  waitGlobalInitialized('Mvu').then(() => {
    // 初次拉取展示数据（此刻最新楼层的变量早已写回，可直接读取）
    useStatusStore(pinia).refresh();

    // 变量更新 → 刷新展示
    // 监听 BEFORE_MESSAGE_UPDATE 而非 VARIABLE_UPDATE_ENDED：
    // 两者触发时变量均未写回楼层，回调内重新读取只能得到旧数据；
    // 而 BEFORE_MESSAGE_UPDATE 携带最终 variables 引用，且在其他脚本的结算监听器（如 var_control 等级结算）之后触发
    eventOn(
      Mvu.events.BEFORE_MESSAGE_UPDATE,
      errorCatched(({ variables }) => useStatusStore(pinia).refresh(variables)),
    );
  });

  // 聊天切换 → 重载（消息变量随聊天变化）
  reloadOnChatChange();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
});
