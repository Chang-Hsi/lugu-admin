<template>
  <div class="p-2 md:p-4 space-y-4">
    <!-- 操作列 -->
    <div class="flex items-center justify-between gap-2">
      <div class="text-lg font-bold text-slate-700">首頁區塊設定</div>
      <div class="flex items-center gap-2">
        <el-button @click="resetToDefault" :loading="loading" plain>還原預設</el-button>
        <el-button type="primary" @click="save" :loading="loading">儲存設定</el-button>
      </div>
    </div>

    <el-row :gutter="12">
      <!-- 左：區塊清單（可拖曳排序） -->
      <el-col :xs="24" :lg="13">
        <el-card shadow="never" class="border! border-gray-200!">
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold text-slate-700">顯示區塊（可拖曳排序）</div>
            <div class="text-[12px] text-slate-500">拖曳左側把手調整順序</div>
          </div>

          <draggable
            v-model="blocks"
            handle=".drag-handle"
            item-key="id"
            ghost-class="opacity-50"
          >
            <template #item="{ element, index }">
              <div class="mb-3 rounded-lg border border-slate-200">
                <div
                  class="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/70 border-b border-slate-200 rounded-t-lg"
                >
                  <div class="flex items-center gap-2">
                    <el-icon class="drag-handle cursor-move text-slate-400"
                      ><Rank
                    /></el-icon>
                    <span class="font-medium text-slate-700"
                      >{{ index + 1 }}. {{ element.title }}</span
                    >
                    <el-tag v-if="!element.enabled" size="small" type="info"
                      >已停用</el-tag
                    >
                  </div>
                  <div class="flex items-center gap-2">
                    <el-switch
                      v-model="element.enabled"
                      active-text="顯示"
                      inactive-text="隱藏"
                    />
                    <el-button text type="primary" @click="editId = element.id"
                      >編輯</el-button
                    >
                  </div>
                </div>

                <!-- 編輯表單 -->
                <div v-show="editId === element.id" class="p-3 space-y-3">
                  <el-form :model="element" label-width="110px" class="max-w-full">
                    <el-form-item label="顯示名稱">
                      <el-input v-model="element.title" />
                    </el-form-item>

                    <el-form-item label="資料來源">
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                        <el-select v-model="element.source.module" placeholder="模組">
                          <el-option
                            v-for="m in MODULES"
                            :key="m.value"
                            :label="m.label"
                            :value="m.value"
                          />
                        </el-select>
                        <el-select
                          v-model="element.source.filters.dept"
                          clearable
                          filterable
                          placeholder="課室"
                        >
                          <el-option v-for="d in DEPTS" :key="d" :label="d" :value="d" />
                        </el-select>
                        <el-select
                          v-model="element.source.filters.category"
                          clearable
                          filterable
                          placeholder="分類"
                        >
                          <el-option
                            v-for="c in CATEGORIES"
                            :key="c"
                            :label="c"
                            :value="c"
                          />
                        </el-select>
                      </div>
                    </el-form-item>

                    <el-form-item label="內容數量">
                      <el-input-number v-model="element.limit" :min="1" :max="24" />
                      <span class="text-xs text-slate-500 ml-2">前台顯示筆數</span>
                    </el-form-item>

                    <el-form-item label="排序規則">
                      <el-select v-model="element.sort" placeholder="排序">
                        <el-option
                          v-for="o in SORTS"
                          :key="o.value"
                          :label="o.label"
                          :value="o.value"
                        />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="版型樣式">
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                        <el-select v-model="element.layout.type">
                          <el-option label="卡片" value="cards" />
                          <el-option label="列表" value="list" />
                          <el-option label="輪播" value="carousel" />
                        </el-select>
                        <el-input-number
                          v-model="element.layout.columns"
                          :min="1"
                          :max="4"
                          :disabled="element.layout.type !== 'cards'"
                        />
                        <el-switch
                          v-model="element.layout.showMore"
                          active-text="顯示更多連結"
                        />
                      </div>
                    </el-form-item>

                    <el-form-item v-if="element.key === 'hero'" label="Hero 橫幅">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                        <el-input v-model="element.hero.title" placeholder="主標題" />
                        <el-input v-model="element.hero.subtitle" placeholder="副標題" />
                        <el-input v-model="element.hero.image" placeholder="圖片 URL" />
                        <el-input v-model="element.hero.link" placeholder="按鈕連結" />
                      </div>
                    </el-form-item>

                    <el-form-item v-if="element.key === 'social'" label="社群連結">
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                        <el-input
                          v-model="element.social.fb"
                          placeholder="Facebook 粉專網址"
                        />
                        <el-input
                          v-model="element.social.line"
                          placeholder="LINE 官方網址"
                        />
                        <el-input
                          v-model="element.social.youtube"
                          placeholder="YouTube 頻道或影片"
                        />
                      </div>
                    </el-form-item>

                    <el-form-item v-if="element.key === 'weather'" label="天氣來源">
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                        <el-input
                          v-model="element.weather.location"
                          placeholder="地點（例：鹿谷）"
                        />
                        <el-input
                          v-model="element.weather.api"
                          placeholder="天氣 API Key"
                        />
                        <el-select v-model="element.weather.unit">
                          <el-option label="°C" value="metric" />
                          <el-option label="°F" value="imperial" />
                        </el-select>
                      </div>
                    </el-form-item>

                    <el-form-item label="裝置 / 語系">
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                        <el-select
                          v-model="element.visible.device"
                          multiple
                          placeholder="裝置"
                        >
                          <el-option label="桌機" value="desktop" />
                          <el-option label="平板" value="tablet" />
                          <el-option label="手機" value="mobile" />
                        </el-select>
                        <el-select
                          v-model="element.visible.locale"
                          multiple
                          placeholder="語系"
                        >
                          <el-option label="繁中" value="zh-TW" />
                          <el-option label="English" value="en" />
                        </el-select>
                        <el-input-number
                          v-model="element.cacheTTL"
                          :min="0"
                          :max="86400"
                        />
                        <span class="text-xs text-slate-500">快取秒數（0=不快取）</span>
                      </div>
                    </el-form-item>

                    <el-form-item label="排程生效">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                        <el-date-picker
                          v-model="element.schedule.start"
                          type="datetime"
                          placeholder="開始時間（可留空）"
                          value-format="YYYY-MM-DD HH:mm:ss"
                        />
                        <el-date-picker
                          v-model="element.schedule.end"
                          type="datetime"
                          placeholder="結束時間（可留空）"
                          value-format="YYYY-MM-DD HH:mm:ss"
                        />
                      </div>
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </template>
          </draggable>
        </el-card>
      </el-col>

      <!-- 右：即時預覽（樣式僅示意） -->
      <el-col :xs="24" :lg="11">
        <el-card shadow="never" class="border! border-gray-200!">
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold text-slate-700">預覽（示意）</div>
            <el-select v-model="previewDevice" size="small" class="w-[120px]">
              <el-option label="桌機" value="desktop" />
              <el-option label="平板" value="tablet" />
              <el-option label="手機" value="mobile" />
            </el-select>
          </div>

          <div class="space-y-4">
            <template v-for="b in visibleBlocksForPreview" :key="b.id">
              <div class="rounded-lg border border-slate-200">
                <div
                  class="px-3 py-2 bg-slate-50/70 border-b border-slate-200 rounded-t-lg font-medium"
                >
                  {{ b.title }}
                </div>

                <!-- 極簡預覽：依版型不同展示 -->
                <div class="p-3">
                  <div v-if="b.key === 'hero'" class="flex items-center gap-3">
                    <img :src="b.hero.image" class="w-20 h-12 rounded object-cover" />
                    <div>
                      <div class="font-semibold">{{ b.hero.title }}</div>
                      <div class="text-xs text-slate-500">{{ b.hero.subtitle }}</div>
                    </div>
                  </div>

                  <div v-else-if="b.key === 'social'" class="text-sm space-y-1">
                    <div>
                      Facebook：<a
                        :href="b.social.fb"
                        class="text-blue-600 underline"
                        target="_blank"
                        >{{ b.social.fb }}</a
                      >
                    </div>
                    <div>
                      LINE：<a
                        :href="b.social.line"
                        class="text-green-600 underline"
                        target="_blank"
                        >{{ b.social.line }}</a
                      >
                    </div>
                    <div>
                      YouTube：<a
                        :href="b.social.youtube"
                        class="text-red-600 underline"
                        target="_blank"
                        >{{ b.social.youtube }}</a
                      >
                    </div>
                  </div>

                  <div v-else-if="b.key === 'weather'" class="text-sm space-y-1">
                    <div>地點：{{ b.weather.location }}</div>
                    <div>單位：{{ b.weather.unit === "metric" ? "°C" : "°F" }}</div>
                    <div class="text-xs text-slate-500">暫不呼叫 API，僅示意</div>
                  </div>

                  <div v-else>
                    <div
                      v-if="b.layout.type === 'cards'"
                      class="grid gap-2"
                      :class="gridCols(b.layout.columns)"
                    >
                      <div
                        v-for="i in b.limit"
                        :key="i"
                        class="p-2 border border-slate-200 rounded"
                      >
                        <div class="h-4 bg-slate-200/70 rounded mb-1"></div>
                        <div class="h-3 bg-slate-200/50 rounded w-2/3"></div>
                      </div>
                    </div>

                    <ul v-else-if="b.layout.type === 'list'" class="space-y-2">
                      <li
                        v-for="i in b.limit"
                        :key="i"
                        class="h-4 bg-slate-200/70 rounded"
                      ></li>
                    </ul>

                    <div v-else class="flex gap-2 overflow-x-auto">
                      <div
                        v-for="i in b.limit"
                        :key="i"
                        class="min-w-[160px] h-[90px] bg-slate-200/70 rounded"
                      ></div>
                    </div>

                    <div v-if="b.layout.showMore" class="mt-2 text-right">
                      <el-link type="primary">更多 &raquo;</el-link>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div
              v-if="visibleBlocksForPreview.length === 0"
              class="text-center text-slate-500 text-sm"
            >
              沒有可顯示的區塊（請檢查啟用與裝置可見設定）
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
/**
 * 這支檔案是完整可用的首頁區塊設定頁：
 * - 左側：區塊集合（支援拖曳排序、啟用/停用、資料來源、版型、排程、裝置/語系、快取）
 * - 右側：極簡預覽（不呼叫 API，僅根據設定顯示骨架）
 * - 假資料 blocks：直接可儲存，後端可依此 Schema 存取
 */

import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import draggable from "vuedraggable";
import { Rank } from "@element-plus/icons-vue";

/* 模組清單：對應你的後台模組 */
const MODULES = [
  { label: "最新消息", value: "news.latest" },
  { label: "新聞稿", value: "news.press" },
  { label: "招標公告", value: "news.tenders" },
  { label: "徵才公告", value: "news.jobs" },
  { label: "活動", value: "events.activities" },
  { label: "檔案下載", value: "files.center" },
  { label: "資訊公開（工程）", value: "open.engineering" },
  { label: "資訊公開（經費）", value: "open.budget" },
  { label: "代表會活動", value: "council.activities" },
  { label: "FAQ", value: "services.faq" },
];

/* 課室與分類（假資料，可替換） */
const DEPTS = ["民政課", "社福課", "人事室", "秘書室", "主計室"];
const CATEGORIES = ["公告", "活動", "政策", "旅遊", "教育"];

/* 排序規則 */
const SORTS = [
  { label: "最新發布（新→舊）", value: "publishedAt:desc" },
  { label: "發布時間（舊→新）", value: "publishedAt:asc" },
  { label: "置頂優先", value: "pin:desc,publishedAt:desc" },
  { label: "最多瀏覽", value: "views:desc" },
];

/* 假資料：首頁區塊設定（你可以直接儲存到後端） */
const blocks = ref([
  {
    id: "hero-1",
    key: "hero",
    title: "首頁橫幅",
    enabled: true,
    source: { module: "news.latest", filters: { dept: null, category: null, tag: null } },
    layout: { type: "cards", columns: 1, showMore: false },
    limit: 1,
    sort: "publishedAt:desc",
    cacheTTL: 300,
    visible: { device: ["desktop", "tablet", "mobile"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: {
      title: "鹿谷鄉政新訊",
      subtitle: "近期施政亮點彙整",
      image: "https://picsum.photos/640/360?random=10",
      link: "/news-events/latest",
    },
    social: null,
    weather: null,
  },
  {
    id: "hot-news-1",
    key: "hot-news",
    title: "熱門消息",
    enabled: true,
    source: {
      module: "news.latest",
      filters: { dept: null, category: "公告", tag: null },
    },
    layout: { type: "cards", columns: 3, showMore: true },
    limit: 6,
    sort: "pin:desc,publishedAt:desc",
    cacheTTL: 300,
    visible: { device: ["desktop", "tablet", "mobile"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: null,
    social: null,
    weather: null,
  },
  {
    id: "about-1",
    key: "about",
    title: "關於鹿谷",
    enabled: true,
    source: {
      module: "about.sections",
      filters: { dept: null, category: null, tag: null },
    },
    layout: { type: "cards", columns: 3, showMore: true },
    limit: 6,
    sort: "publishedAt:desc",
    cacheTTL: 1200,
    visible: { device: ["desktop", "tablet"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: null,
    social: null,
    weather: null,
  },
  {
    id: "open-1",
    key: "open",
    title: "資訊公開",
    enabled: true,
    source: {
      module: "open.engineering",
      filters: { dept: null, category: null, tag: null },
    },
    layout: { type: "list", columns: 1, showMore: true },
    limit: 8,
    sort: "publishedAt:desc",
    cacheTTL: 600,
    visible: { device: ["desktop", "tablet", "mobile"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: null,
    social: null,
    weather: null,
  },
  {
    id: "services-1",
    key: "services",
    title: "便民服務",
    enabled: true,
    source: {
      module: "services.entries",
      filters: { dept: null, category: null, tag: null },
    },
    layout: { type: "cards", columns: 4, showMore: true },
    limit: 8,
    sort: "publishedAt:desc",
    cacheTTL: 1800,
    visible: { device: ["desktop", "tablet", "mobile"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: null,
    social: null,
    weather: null,
  },
  {
    id: "council-1",
    key: "council",
    title: "代表會",
    enabled: true,
    source: {
      module: "council.activities",
      filters: { dept: null, category: null, tag: null },
    },
    layout: { type: "list", columns: 1, showMore: true },
    limit: 5,
    sort: "publishedAt:desc",
    cacheTTL: 900,
    visible: { device: ["desktop", "tablet", "mobile"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: null,
    social: null,
    weather: null,
  },
  {
    id: "links-1",
    key: "links",
    title: "相關連結",
    enabled: true,
    source: {
      module: "system.friend-links",
      filters: { dept: null, category: null, tag: null },
    },
    layout: { type: "carousel", columns: 1, showMore: false },
    limit: 10,
    sort: "publishedAt:desc",
    cacheTTL: 3600,
    visible: { device: ["desktop", "tablet", "mobile"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: null,
    social: null,
    weather: null,
  },
  {
    id: "social-1",
    key: "social",
    title: "社群嵌入",
    enabled: true,
    source: {
      module: "media.social",
      filters: { dept: null, category: null, tag: null },
    },
    layout: { type: "cards", columns: 3, showMore: false },
    limit: 3,
    sort: "publishedAt:desc",
    cacheTTL: 0,
    visible: { device: ["desktop", "tablet", "mobile"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: null,
    social: {
      fb: "https://www.facebook.com/",
      line: "https://line.me/",
      youtube: "https://www.youtube.com/",
    },
    weather: null,
  },
  {
    id: "weather-1",
    key: "weather",
    title: "天氣",
    enabled: true,
    source: {
      module: "site.weather",
      filters: { dept: null, category: null, tag: null },
    },
    layout: { type: "cards", columns: 1, showMore: false },
    limit: 1,
    sort: "publishedAt:desc",
    cacheTTL: 600,
    visible: { device: ["desktop", "tablet", "mobile"], locale: ["zh-TW"] },
    schedule: { start: null, end: null },
    hero: null,
    social: null,
    weather: { location: "鹿谷", api: "YOUR_WEATHER_API_KEY", unit: "metric" },
  },
]);

/* 預覽裝置切換 */
const previewDevice = ref("desktop");
const visibleBlocksForPreview = computed(() =>
  blocks.value.filter(
    (b) =>
      b.enabled &&
      (!b.visible?.device?.length || b.visible.device.includes(previewDevice.value))
  )
);

/* 工具：格線欄位數 */
const gridCols = (n) => {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  if (n === 3) return "grid-cols-3";
  return "grid-cols-4";
};

const loading = ref(false);

/* 儲存（可改成實際 API 呼叫） */
const save = async () => {
  try {
    loading.value = true;
    // 模擬呼叫
    await new Promise((r) => setTimeout(r, 600));
    // TODO: 送出 blocks.value 給後端
    // fetch('/api/home/blocks', { method: 'POST', body: JSON.stringify(blocks.value) })
    ElMessage.success("已儲存首頁區塊設定");
  } catch {
    ElMessage.error("儲存失敗");
  } finally {
    loading.value = false;
  }
};

/* 還原預設（你可以換成從後端 get default） */
const resetToDefault = async () => {
  try {
    loading.value = true;
    await new Promise((r) => setTimeout(r, 400));
    // 這裡為示例，實務可重新拉 /api/home/blocks/default
    blocks.value = JSON.parse(JSON.stringify(blocksDefault));
    ElMessage.success("已套用預設配置");
  } catch {
    ElMessage.error("操作失敗");
  } finally {
    loading.value = false;
  }
};

/* 預設快照（用於還原） */
const blocksDefault = JSON.parse(JSON.stringify(blocks.value));
</script>

<style scoped>
/* 拖曳時的過渡 */
.opacity-50 {
  opacity: 0.5;
}
</style>
