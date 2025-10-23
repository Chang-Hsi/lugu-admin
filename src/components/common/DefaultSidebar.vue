<template>
  <div class="h-full flex flex-col">
    <div id="app-logo" class="logo-wrap" :class="{ collapsed }">
      <div class="logo-icon">
        <el-icon size="20"><Menu /></el-icon>
      </div>
      <div class="logo-text" v-show="!collapsed">後台管理系統</div>
    </div>

    <el-scrollbar class="flex-1">
      <el-menu
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="transparent"
        text-color="#c8d3e1"
        active-text-color="#ffffff"
        class="el-menu-vertical-demo side-menu"
        :default-active="active"
        @select="onSelect"
      >
        <el-sub-menu index="dashboard" :disabled="groupDisabled('/dashboard/overview')">
          <template #title>
            <el-icon><Odometer /></el-icon>
            <span>儀表板</span>
          </template>
          <el-menu-item
            index="/dashboard/overview"
            :disabled="!can('/dashboard/overview')"
            >概覽</el-menu-item
          >
        </el-sub-menu>

        <el-sub-menu
          index="home-nav"
          :disabled="
            groupDisabled('/home-nav/blocks', '/home-nav/menus', '/home-nav/embeds')
          "
        >
          <template #title>
            <el-icon><HomeFilled /></el-icon>
            <span>首頁管理</span>
          </template>
          <el-menu-item index="/home-nav/blocks" :disabled="!can('/home-nav/blocks')"
            >首頁區塊設定</el-menu-item
          >
          <el-menu-item index="/home-nav/menus" :disabled="!can('/home-nav/menus')"
            >主選單/側選單管理</el-menu-item
          >
          <el-menu-item index="/home-nav/embeds" :disabled="!can('/home-nav/embeds')"
            >首頁社群與外部嵌入</el-menu-item
          >
        </el-sub-menu>

        <el-sub-menu
          index="news-events"
          :disabled="
            groupDisabled(
              '/news-events/latest',
              '/news-events/press',
              '/news-events/tenders',
              '/news-events/jobs',
              '/news-events/activities',
              '/news-events/registrations'
            )
          "
        >
          <template #title>
            <el-icon><Bell /></el-icon>
            <span>熱門消息</span>
          </template>
          <el-menu-item
            index="/news-events/latest"
            :disabled="!can('/news-events/latest')"
            >最新消息</el-menu-item
          >
          <el-menu-item index="/news-events/press" :disabled="!can('/news-events/press')"
            >新聞稿</el-menu-item
          >
          <el-menu-item
            index="/news-events/tenders"
            :disabled="!can('/news-events/tenders')"
            >招標公告</el-menu-item
          >
          <el-menu-item index="/news-events/jobs" :disabled="!can('/news-events/jobs')"
            >徵才公告</el-menu-item
          >
          <el-menu-item
            index="/news-events/activities"
            :disabled="!can('/news-events/activities')"
            >活動訊息</el-menu-item
          >
          <el-menu-item
            index="/news-events/registrations"
            :disabled="!can('/news-events/registrations')"
            >活動報名管理</el-menu-item
          >
        </el-sub-menu>

        <el-sub-menu
          index="about"
          :disabled="
            groupDisabled(
              '/about/intro',
              '/about/township',
              '/about/attractions',
              '/about/extensions',
              '/about/specialties',
              '/about/transport',
              '/about/districts'
            )
          "
        >
          <template #title>
            <el-icon><InfoFilled /></el-icon>
            <span>關於鹿谷</span>
          </template>
          <el-menu-item index="/about/intro" :disabled="!can('/about/intro')"
            >鹿谷簡介</el-menu-item
          >
          <el-menu-item index="/about/township" :disabled="!can('/about/township')"
            >公所介紹</el-menu-item
          >
          <el-menu-item index="/about/attractions" :disabled="!can('/about/attractions')"
            >觀光景點</el-menu-item
          >
          <el-menu-item index="/about/extensions" :disabled="!can('/about/extensions')"
            >課室分機</el-menu-item
          >
          <el-menu-item index="/about/specialties" :disabled="!can('/about/specialties')"
            >特產介紹</el-menu-item
          >
          <el-menu-item index="/about/transport" :disabled="!can('/about/transport')"
            >交通運輸</el-menu-item
          >
          <el-menu-item index="/about/districts" :disabled="!can('/about/districts')"
            >行政區域</el-menu-item
          >
        </el-sub-menu>

        <el-sub-menu
          index="open-policy"
          :disabled="
            groupDisabled(
              '/open-policy/engineering',
              '/open-policy/budget',
              '/open-policy/integrity',
              '/open-policy/law',
              '/open-policy/plan',
              '/open-policy/law-change',
              '/open-policy/promotion',
              '/open-policy/lobby',
              '/open-policy/year-budget',
              '/open-policy/approved',
              '/open-policy/major',
              '/open-policy/construction',
              '/open-policy/post-disaster',
              '/open-policy/pedestrian-safety'
            )
          "
        >
          <template #title>
            <el-icon><Document /></el-icon>
            <span>法規政策</span>
          </template>
          <el-menu-item index="/open-policy/plan" :disabled="!can('/open-policy/plan')"
            >政策相關</el-menu-item
          >
          <el-menu-item
            index="/open-policy/law-change"
            :disabled="!can('/open-policy/law-change')"
            >年度經費</el-menu-item
          >
          <el-menu-item
            index="/open-policy/promotion"
            :disabled="!can('/open-policy/promotion')"
            >資訊公開</el-menu-item
          >
          <el-menu-item index="/open-policy/lobby" :disabled="!can('/open-policy/lobby')"
            >廉政圖地</el-menu-item
          >
          <el-menu-item
            index="/open-policy/construction"
            :disabled="!can('/open-policy/construction')"
            >施工工程</el-menu-item
          >
          <el-menu-item
            index="/open-policy/post-disaster"
            :disabled="!can('/open-policy/post-disaster')"
            >災後復建審議</el-menu-item
          >
          <el-menu-item
            index="/open-policy/pedestrian-safety"
            :disabled="!can('/open-policy/pedestrian-safety')"
            >人行安全計畫</el-menu-item
          >
        </el-sub-menu>

        <el-sub-menu
          index="services"
          :disabled="
            groupDisabled(
              '/services/welfare',
              '/services/kindergarten',
              '/services/library',
              '/services/conflict-of-interest',
              '/services/forms',
              '/services/street-light',
              '/services/faq',
              '/services/memorial'
            )
          "
        >
          <template #title>
            <el-icon><Cherry /></el-icon>
            <span>便民服務</span>
          </template>
          <el-menu-item index="/services/welfare" :disabled="!can('/services/welfare')"
            >社會福利</el-menu-item
          >
          <el-menu-item index="/disaster/contacts" :disabled="!can('/disaster/contacts')"
            >防災專區</el-menu-item
          >
          <el-menu-item
            index="/services/kindergarten"
            :disabled="!can('/services/kindergarten')"
            >鄉立幼兒園</el-menu-item
          >
          <el-menu-item index="/services/library" :disabled="!can('/services/library')"
            >鹿谷鄉立圖書館</el-menu-item
          >
          <el-menu-item
            index="/services/conflict-of-interest"
            :disabled="!can('/services/conflict-of-interest')"
            >利益衝突迴避法公開</el-menu-item
          >
          <el-menu-item index="/services/forms" :disabled="!can('/services/forms')"
            >表單下載</el-menu-item
          >
          <el-menu-item
            index="/services/street-light"
            :disabled="!can('/services/street-light')"
            >路燈報修</el-menu-item
          >
          <el-menu-item index="/services/faq" :disabled="!can('/services/faq')"
            >常見問題</el-menu-item
          >
          <el-menu-item index="/services/memorial" :disabled="!can('/services/memorial')"
            >鹿谷鄉銘恩堂</el-menu-item
          >
        </el-sub-menu>

        <el-sub-menu
          index="council"
          :disabled="
            groupDisabled(
              '/council/chair',
              '/council/org',
              '/council/contacts',
              '/council/law-announce',
              '/council/overseas-report',
              '/council/activities',
              '/council/meetings'
            )
          "
        >
          <template #title>
            <el-icon><OfficeBuilding /></el-icon>
            <span>代表會管理</span>
          </template>
          <el-menu-item index="/council/chair" :disabled="!can('/council/chair')"
            >鄉民代表會</el-menu-item
          >
          <el-menu-item
            index="/council/overseas-report"
            :disabled="!can('/council/overseas-report')"
            >出國考察報告</el-menu-item
          >
          <el-menu-item
            index="/council/activities"
            :disabled="!can('/council/activities')"
            >代表會活動</el-menu-item
          >
          <el-menu-item index="/council/meetings" :disabled="!can('/council/meetings')"
            >會議資訊</el-menu-item
          >
        </el-sub-menu>

        <el-sub-menu
          index="engagement"
          :disabled="
            groupDisabled('/engagement/surveys', '/engagement/votes', '/engagement/qa')
          "
        >
          <template #title>
            <el-icon><ChatDotRound /></el-icon>
            <span>線上服務交流</span>
          </template>
          <el-menu-item
            index="/engagement/surveys"
            :disabled="!can('/engagement/surveys')"
            >問卷管理</el-menu-item
          >
          <el-menu-item index="/engagement/votes" :disabled="!can('/engagement/votes')"
            >投票管理</el-menu-item
          >
          <el-menu-item index="/engagement/qa" :disabled="!can('/engagement/qa')"
            >表單下載</el-menu-item
          >
        </el-sub-menu>

        <el-sub-menu
          index="system"
          :disabled="
            groupDisabled(
              '/system/units',
              '/system/district-admin',
              '/system/roles',
              '/system/accounts',
              '/system/categories',
              '/system/menus-pages',
              '/system/workflow',
              '/system/site',
              '/system/friend-links',
              '/system/banners',
              '/system/audit',
              '/system/import-export'
            )
          "
        >
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系統管理</span>
          </template>
          <el-menu-item
            index="/system/menus-pages"
            :disabled="!can('/system/menus-pages')"
            >選單與頁面樹</el-menu-item
          >
          <el-menu-item index="/system/roles" :disabled="!can('/system/roles')"
            >角色與權限</el-menu-item
          >
          <el-menu-item index="/system/accounts" :disabled="!can('/system/accounts')"
            >帳號管理</el-menu-item
          >
          <el-menu-item index="/system/categories" :disabled="!can('/system/categories')"
            >推播設定</el-menu-item
          >
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { usePermStore } from "@/stores/perm";
import {
  Menu,
  Odometer,
  HomeFilled,
  Bell,
  InfoFilled,
  Document,
  Warning,
  Cherry,
  OfficeBuilding,
  ChatDotRound,
  Picture,
  Folder,
  Calendar,
  TrendCharts,
  MessageBox,
  Setting,
} from "@element-plus/icons-vue";

const props = defineProps({ collapsed: { type: Boolean, default: false } });
const emit = defineEmits(["select"]);

const route = useRoute();
const active = ref(route.path || "/dashboard/overview");

const perm = usePermStore();
const can = (path) => (perm.can ? perm.can(path) : true);
const groupDisabled = (...paths) => paths.every((p) => !can(p));
const onSelect = (key) => emit("select", key);

watch(
  () => route.path,
  (p) => (active.value = p),
  { immediate: true }
);
onMounted(() => {
  active.value = route.path || "/dashboard/overview";
});
</script>

<style scoped>
.logo-wrap {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 10px;
  color: #e6eefc;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.logo-wrap.collapsed {
  justify-content: center;
}
.logo-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}
.logo-text {
  font-weight: 700;
  letter-spacing: 0.2px;
}
.side-menu {
  border-right: none;
  padding: 8px 6px 12px 6px;
}
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  border-radius: 6px;
  margin: 2px 6px;
}
:deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.12) !important;
}
</style>
