<template>
  <div class="p-2 md:p-4 space-y-2">
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">公所介紹</div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="t in TABS"
        :key="t"
        @click="active = t"
        :class="[
          'px-4 h-10 rounded-md text-white font-semibold shadow',
          active === t ? 'bg-emerald-700' : 'bg-emerald-600/90 hover:bg-emerald-700',
        ]"
      >
        {{ t }}
      </button>
    </div>

    <el-card shadow="never" class="border! border-gray-200!">
      <Schedule />
    </el-card>
  </div>
</template>

<script setup>
/* 修正重點：
   1) TABS 為字串陣列，模板用 {{ t }}，按鈕 key 用 t，點擊時 active = t。
   2) 新增 active，初始為「鄉長介紹」。
   3) 補上 saving 與 publish() 以避免模板找不到變數。
   4) 依需求：不論點哪個 Tab，仍顯示 <Schedule />。
*/
import { ref } from "vue";
import { ElMessage } from "element-plus";
import Schedule from "@/components/about/Schedule.vue";

const TABS = ["鄉長介紹", "組織架構", "為民服務項目", "公所位置", "國民外交", "鄉長行程"];
const active = ref("鄉長介紹"); // 初始 Tab
const saving = ref(false);

function publish() {
  saving.value = true;
  setTimeout(() => {
    saving.value = false;
    ElMessage.success(`已儲存（目前分頁：${active.value}）`);
  }, 400);
}
</script>
