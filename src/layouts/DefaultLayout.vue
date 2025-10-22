<template>
  <el-config-provider :locale="elLocale">
    <el-container class="h-screen">
      <el-aside
        id="app-sidebar"
        :width="collapsed ? '64px' : '220px'"
        class="sidebar-aside"
      >
        <DefaultSidebar :collapsed="collapsed" @select="handleMenuSelect" />
      </el-aside>

      <el-container>
        <el-header id="app-header" class="header-bar">
          <DefaultHeader
            :collapsed="collapsed"
            :breadcrumb="breadcrumb"
            username="admin"
            @toggle="collapsed = !collapsed"
            @logout="handleLogout"
            @change-lang="handleChangeLang"
          />
        </el-header>

        <el-main class="main-area">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import DefaultHeader from "@/components/common/DefaultHeader.vue";
import DefaultSidebar from "@/components/common/DefaultSidebar.vue";
import zhTw from "element-plus/es/locale/lang/zh-tw";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";

const router = useRouter();
const route = useRoute();

const collapsed = ref(false);

// 僅用於 Element Plus 內建語系（你自訂文案已是繁中，不跟著切）
const lang = ref(localStorage.getItem("lang") || "zh-TW");
const elLocale = computed(() => {
  if (lang.value === "zh-CN") return zhCn;
  if (lang.value === "en-US") return en;
  return zhTw; // 預設繁中
});

// 產生麵包屑
const breadcrumb = computed(() => {
  const m = route.meta || {};

  // 若某頁自帶完整麵包屑陣列，可直接使用（選配）
  if (Array.isArray(m.breadcrumb) && m.breadcrumb.length) {
    return m.breadcrumb;
  }

  const list = [];
  // 有 parentTitle 且不等於自身 title 才放
  if (m.parentTitle && m.parentTitle !== m.title) {
    list.push(m.parentTitle);
  }
  if (m.title) {
    list.push(m.title);
  }
  return list;
});

// 事件
const handleMenuSelect = (key) => {
  if (!key || key === "#") return;
  router.push(key);
};
const handleLogout = () => {
  localStorage.removeItem("token");
  router.replace("/auth/login");
};
const handleChangeLang = (newLang) => {
  lang.value = newLang || "zh-TW";
  localStorage.setItem("lang", lang.value);
};

onMounted(() => {
  // 若有使用 dayjs，這裡可依 lang.value 同步切換 dayjs 語系（可選）
});
</script>

<style scoped>
.sidebar-aside {
  padding: 0;
  background: linear-gradient(180deg, #0f1d2e 0%, #0b1726 100%);
  color: #fff;
  border-right: 1px solid #0f2742;
  transition: width 0.2s ease;
}
.header-bar {
  height: 56px;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
}
.main-area {
  background: #f5f7fa;
  padding: 16px;
}
</style>
