<template>
  <div class="w-full flex items-center justify-between">
    <div class="flex items-center gap-3">
      <el-button link @click="$emit('toggle')">
        <el-icon size="20">
          <component :is="collapsed ? Expand : Fold" />
        </el-icon>
      </el-button>

      <el-breadcrumb id="app-breadcrumb" separator="/">
        <el-breadcrumb-item v-for="(b, i) in breadcrumb" :key="i">{{
          b
        }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="flex items-center gap-2">
      <el-tooltip content="全螢幕" placement="bottom">
        <el-button id="app-fullscreen" link @click="toggleFull">
          <el-icon size="18"><FullScreen /></el-icon>
        </el-button>
      </el-tooltip>

      <el-dropdown id="app-user">
        <div class="flex items-center gap-2 cursor-pointer">
          <el-avatar
            :size="28"
            src="https://api.iconify.design/mdi:account-circle.svg?color=%239ca3af"
          />
          <span class="text-sm text-gray-700">{{ username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>個人中心</el-dropdown-item>
            <el-dropdown-item divided @click="$emit('logout')">退出登錄</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
// 變更說明：已移除 vue-i18n，所有文案改為繁中字串。
// 事件維持：toggle（側欄折疊）、change-lang（語言切換）、logout（登出）。
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Fold, Expand, FullScreen, ArrowDown, Menu } from "@element-plus/icons-vue";

defineProps({
  collapsed: { type: Boolean, default: false },
  breadcrumb: { type: Array, default: () => [] },
  username: { type: String, default: "admin" },
});

const isFull = ref(false);
const onFullChange = () => {
  isFull.value = !!document.fullscreenElement;
};

const toggleFull = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (e) {
    console.warn("[Header] Fullscreen 失敗：", e);
  }
};

onMounted(() => document.addEventListener("fullscreenchange", onFullChange));
onBeforeUnmount(() => document.removeEventListener("fullscreenchange", onFullChange));
</script>
