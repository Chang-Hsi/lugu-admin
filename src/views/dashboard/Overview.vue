<template>
  <div class="space-y-4">
    <!-- KPI -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <el-card shadow="never" class="border! border-gray-200!">
        <div class="flex items-center justify-between py-4">
          <div class="flex items-center gap-3">
            <el-icon :size="24" class="text-blue-500"><EditPen /></el-icon>
            <div class="text-gray-500">草稿數</div>
          </div>
          <div class="text-2xl font-semibold">{{ fmt(kpis.draft) }}</div>
        </div>
      </el-card>

      <el-card shadow="never" class="border! border-gray-200!">
        <div class="flex items-center justify-between py-4">
          <div class="flex items-center gap-3">
            <el-icon :size="24" class="text-indigo-500"><Timer /></el-icon>
            <div class="text-gray-500">待審數</div>
          </div>
          <div class="text-2xl font-semibold">{{ fmt(kpis.pending) }}</div>
        </div>
      </el-card>

      <el-card shadow="never" class="border! border-gray-200!">
        <div class="flex items-center justify-between py-4">
          <div class="flex items-center gap-3">
            <el-icon :size="24" class="text-emerald-500"><CircleCheckFilled /></el-icon>
            <div class="text-gray-500">已發布</div>
          </div>
          <div class="text-2xl font-semibold">{{ fmt(kpis.published) }}</div>
        </div>
      </el-card>

      <el-card shadow="never" class="border! border-gray-200!">
        <div class="flex items-center justify-between py-4">
          <div class="flex items-center gap-3">
            <el-icon :size="24" class="text-rose-500"><Bell /></el-icon>
            <div class="text-gray-500">問答待回覆</div>
          </div>
          <div class="text-2xl font-semibold">{{ fmt(kpis.qaPending) }}</div>
        </div>
      </el-card>
    </div>

    <!-- 第一排圖表 -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <el-card shadow="never" class="border! border-gray-200!">
        <div class="text-gray-700 font-semibold mb-2">內容類型占比（當月）</div>
        <div ref="pieRef" class="w-full h-[320px]"></div>
      </el-card>

      <el-card shadow="never" class="border! border-gray-200!">
        <div class="text-gray-700 font-semibold mb-2">近 7 日發布量（按日）</div>
        <div ref="barRef" class="w-full h-[320px]"></div>
      </el-card>
    </div>

    <!-- 第二排圖表 -->
    <el-card shadow="never" class="border! border-gray-200!">
      <div class="text-center text-gray-700 font-semibold mb-2">近 12 個月發布趨勢</div>
      <div ref="lineRef" class="w-full h-[360px]"></div>
    </el-card>

    <!-- 第三排圖表（新增） -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <el-card shadow="never" class="border! border-gray-200!">
        <div class="text-gray-700 font-semibold mb-2">課室貢獻度（近 30 日）</div>
        <div ref="deptRef" class="w-full h-[320px]"></div>
      </el-card>

      <el-card shadow="never" class="border! border-gray-200!">
        <div class="text-gray-700 font-semibold mb-2">活動報名漏斗（近 30 日）</div>
        <div ref="funnelRef" class="w-full h-[320px]"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import { EditPen, Timer, CircleCheckFilled, Bell } from "@element-plus/icons-vue";

/**
 * 假資料（完全可替換）
 * 日後串接可改為 API 回傳格式：{ code, message, data }
 */

// KPI
const kpis = {
  draft: 12,
  pending: 5,
  published: 86,
  qaPending: 6,
};

// 圓餅：類型占比（當月）
const TYPE_LABELS = {
  latest: "最新消息",
  press: "新聞稿",
  tender: "招標公告",
  jobs: "徵才公告",
  event: "活動",
  file: "檔案",
};
const typeRatioData = [
  { key: "latest", value: 24 },
  { key: "press", value: 8 },
  { key: "tender", value: 3 },
  { key: "jobs", value: 2 },
  { key: "event", value: 7 },
  { key: "file", value: 18 },
];

// 近 7 日發布量（按日，堆疊）
const last7Days = (() => {
  // 產 7 天標籤（今天在最後）
  const now = new Date();
  const arr = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    arr.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return arr;
})();
const dailySeries = {
  news: [4, 2, 3, 5, 2, 3, 4], // 消息
  events: [1, 0, 2, 1, 0, 2, 1], // 活動
  files: [0, 1, 0, 2, 1, 0, 1], // 檔案
};

// 近 12 個月發布趨勢（折線）
const monthLabels = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];
const monthlyTrend = {
  news: [18, 15, 22, 26, 24, 21, 28, 30, 26, 24, 19, 20],
  events: [4, 3, 5, 6, 7, 5, 6, 8, 7, 6, 4, 5],
  files: [10, 8, 12, 11, 13, 12, 14, 15, 13, 12, 10, 11],
};

// 課室貢獻度（近 30 日）
const deptNames = ["民政課", "社福課", "人事室", "秘書室", "主計室"];
const deptContribution = {
  news: [12, 4, 2, 3, 1],
  events: [3, 2, 1, 1, 0],
  files: [6, 1, 0, 2, 1],
};

// 活動報名漏斗（近 30 日）
const eventFunnel = [
  { stage: "曝光", value: 12000 },
  { stage: "活動頁造訪", value: 3800 },
  { stage: "點擊報名", value: 1100 },
  { stage: "完成報名", value: 760 },
  { stage: "審核通過", value: 700 },
];

const pieRef = ref(null);
const barRef = ref(null);
const lineRef = ref(null);
const deptRef = ref(null);
const funnelRef = ref(null);

let pieChart, barChart, lineChart, deptChart, funnelChart;

const fmt = (n) => new Intl.NumberFormat("zh-TW").format(n);

const renderCharts = () => {
  // 圓餅：類型占比
  if (pieRef.value) {
    if (!pieChart) pieChart = echarts.init(pieRef.value);
    pieChart.setOption(
      {
        color: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"],
        tooltip: { trigger: "item" },
        legend: { orient: "vertical", left: 10, top: 10, textStyle: { color: "#666" } },
        series: [
          {
            name: "類型占比",
            type: "pie",
            radius: ["35%", "65%"],
            center: ["55%", "55%"],
            avoidLabelOverlap: false,
            label: { formatter: "{b}\n{d}%" },
            labelLine: { length: 12, length2: 8 },
            data: typeRatioData.map((d) => ({
              name: TYPE_LABELS[d.key],
              value: d.value,
            })),
          },
        ],
      },
      { replaceMerge: ["series", "legend"] }
    );
  }

  // 近 7 日發布量（堆疊條）
  if (barRef.value) {
    if (!barChart) barChart = echarts.init(barRef.value);
    barChart.setOption(
      {
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: 40, right: 20, top: 30, bottom: 30 },
        xAxis: { type: "category", data: last7Days, axisTick: { show: false } },
        yAxis: { type: "value", splitLine: { lineStyle: { color: "#eee" } } },
        legend: { data: ["消息", "活動", "檔案"], top: 0 },
        series: [
          {
            name: "消息",
            type: "bar",
            stack: "total",
            barWidth: "45%",
            data: dailySeries.news,
            itemStyle: { borderRadius: [4, 4, 0, 0] },
          },
          {
            name: "活動",
            type: "bar",
            stack: "total",
            data: dailySeries.events,
            itemStyle: { borderRadius: [4, 4, 0, 0] },
          },
          {
            name: "檔案",
            type: "bar",
            stack: "total",
            data: dailySeries.files,
            itemStyle: { borderRadius: [4, 4, 0, 0] },
          },
        ],
      },
      { replaceMerge: ["xAxis", "series", "legend"] }
    );
  }

  // 月度發布趨勢（折線）
  if (lineRef.value) {
    if (!lineChart) lineChart = echarts.init(lineRef.value);
    lineChart.setOption(
      {
        tooltip: { trigger: "axis" },
        legend: { data: ["消息", "活動", "檔案"], top: 0 },
        grid: { left: 40, right: 20, top: 40, bottom: 30 },
        xAxis: { type: "category", data: monthLabels, boundaryGap: false },
        yAxis: { type: "value", splitLine: { lineStyle: { color: "#eee" } } },
        series: [
          {
            name: "消息",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            data: monthlyTrend.news,
          },
          {
            name: "活動",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            data: monthlyTrend.events,
          },
          {
            name: "檔案",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            data: monthlyTrend.files,
          },
        ],
      },
      { replaceMerge: ["legend", "xAxis", "series"] }
    );
  }

  // 課室貢獻度（水平堆疊條）
  if (deptRef.value) {
    if (!deptChart) deptChart = echarts.init(deptRef.value);
    deptChart.setOption(
      {
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: 80, right: 20, top: 30, bottom: 20 },
        xAxis: { type: "value", splitLine: { lineStyle: { color: "#eee" } } },
        yAxis: { type: "category", data: deptNames, axisTick: { show: false } },
        legend: { data: ["消息", "活動", "檔案"], top: 0 },
        series: [
          { name: "消息", type: "bar", stack: "dept", data: deptContribution.news },
          { name: "活動", type: "bar", stack: "dept", data: deptContribution.events },
          { name: "檔案", type: "bar", stack: "dept", data: deptContribution.files },
        ],
      },
      { replaceMerge: ["series", "legend", "xAxis", "yAxis"] }
    );
  }

  // 活動報名漏斗
  if (funnelRef.value) {
    if (!funnelChart) funnelChart = echarts.init(funnelRef.value);
    funnelChart.setOption(
      {
        tooltip: { trigger: "item", formatter: "{b}: {c}" },
        series: [
          {
            type: "funnel",
            left: "10%",
            top: 20,
            bottom: 20,
            width: "80%",
            min: 0,
            max: eventFunnel[0].value,
            sort: "descending",
            gap: 6,
            label: { show: true, formatter: "{b}\n{c}" },
            labelLine: { length: 12, lineStyle: { width: 1 } },
            itemStyle: { borderColor: "#fff", borderWidth: 1 },
            data: eventFunnel.map((it) => ({ name: it.stage, value: it.value })),
          },
        ],
      },
      { replaceMerge: ["series"] }
    );
  }
};

const onResize = () => {
  pieChart && pieChart.resize();
  barChart && barChart.resize();
  lineChart && lineChart.resize();
  deptChart && deptChart.resize();
  funnelChart && funnelChart.resize();
};

onMounted(() => {
  renderCharts();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  pieChart && pieChart.dispose();
  barChart && barChart.dispose();
  lineChart && lineChart.dispose();
  deptChart && deptChart.dispose();
  funnelChart && funnelChart.dispose();
});
</script>
