import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['storage', 'activeTab', 'tabs', 'offscreen'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Node Screenshot',
    },
    side_panel: {
      default_path: 'src/entrypoints/sidepanel/index.html',
    },
    offscreen: {
      page: 'src/entrypoints/offscreen/index.html',
    },
  },
});
