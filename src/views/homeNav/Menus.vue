<template>
  <div class="p-2 md:p-4 space-y-4">
    <!-- 操作列 -->
    <div class="flex items-center justify-between gap-2">
      <div class="text-lg font-bold text-slate-700">主選單 / 側選單管理</div>
      <div class="flex items-center gap-2">
        <el-input
          v-model="keyword"
          placeholder="搜尋選單項目…"
          clearable
          size="small"
          class="w-[220px]"
          @input="onFilter"
        />
        <el-button @click="expandAll(true)" plain>展開全部</el-button>
        <el-button @click="expandAll(false)" plain>收合全部</el-button>
        <el-button @click="addRoot" type="primary" plain>新增根節點</el-button>
        <el-dropdown>
          <el-button>
            匯入/匯出
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="exportJSON">匯出 JSON</el-dropdown-item>
              <el-dropdown-item>
                <label class="cursor-pointer block" for="importFile">從檔案匯入</label>
                <input
                  id="importFile"
                  type="file"
                  accept="application/json"
                  class="hidden"
                  @change="importJSON"
                />
              </el-dropdown-item>
              <el-dropdown-item divided @click="loadDefault">載入預設</el-dropdown-item>
              <el-dropdown-item @click="clearAll" divided>清空所有</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="save" :loading="saving">儲存</el-button>
      </div>
    </div>

    <el-row :gutter="12">
      <!-- 左：樹狀清單 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="border! border-gray-200!">
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold text-slate-700">
              選單結構（拖曳可調整排序與層級）
            </div>
            <div class="text-[12px] text-slate-500">
              拖曳到其它節點上可改成該節點的子項目
            </div>
          </div>

          <el-tree
            ref="treeRef"
            class="menu-tree"
            :data="treeData"
            node-key="id"
            :props="treeProps"
            :expand-on-click-node="false"
            highlight-current
            draggable
            :allow-drop="allowDrop"
            :allow-drag="() => true"
            :filter-node-method="filterNode"
            @node-click="onNodeClick"
          >
            <template #default="{ data }">
              <div class="flex items-center justify-between w-full pr-2">
                <div class="flex items-center gap-2">
                  <el-tag v-if="data.hidden" type="info" size="small">隱藏</el-tag>
                  <span class="font-medium">{{ data.title || "(未命名)" }}</span>
                  <span class="text-xs text-slate-500">
                    {{ data.type === "route" ? data.path : data.url }}
                  </span>
                  <el-tag v-if="data.badge" size="small" type="success">{{
                    data.badge
                  }}</el-tag>
                </div>
                <div class="flex items-center gap-1">
                  <el-tooltip content="新增子項" placement="top">
                    <el-button text size="small" @click.stop="addChild(data)">
                      <el-icon><Plus /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="刪除" placement="top">
                    <el-button
                      text
                      size="small"
                      type="danger"
                      @click.stop="removeNode(data)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右：表單編輯 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="border! border-gray-200!">
          <div class="font-semibold text-slate-700 mb-3">屬性設定</div>

          <div v-if="!current">
            <div class="text-slate-500 text-sm">請在左側選取一個項目進行編輯。</div>
          </div>

          <el-form v-else :model="current" label-width="110px" class="max-w-full">
            <el-form-item label="顯示名稱">
              <el-input v-model="current.title" />
            </el-form-item>

            <el-form-item label="顯示位置">
              <el-checkbox v-model="current.showIn.top">主選單</el-checkbox>
              <el-checkbox v-model="current.showIn.side">側選單</el-checkbox>
            </el-form-item>

            <el-form-item label="連結型態">
              <el-radio-group v-model="current.type">
                <el-radio-button label="route">內部路由</el-radio-button>
                <el-radio-button label="external">外部連結</el-radio-button>
                <el-radio-button label="none">僅分群</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <template v-if="current.type === 'route'">
              <el-form-item label="對應路由">
                <el-select
                  v-model="current.path"
                  filterable
                  clearable
                  placeholder="選擇路由"
                >
                  <el-option
                    v-for="r in ROUTE_OPTIONS"
                    :key="r.path"
                    :label="r.label"
                    :value="r.path"
                  />
                </el-select>
              </el-form-item>
            </template>

            <template v-else-if="current.type === 'external'">
              <el-form-item label="外部網址">
                <el-input v-model="current.url" placeholder="https://example.com" />
              </el-form-item>
              <el-form-item label="開啟方式">
                <el-switch
                  v-model="current.externalBlank"
                  active-text="新分頁"
                  inactive-text="同分頁"
                />
              </el-form-item>
              <el-form-item label="UTM 參數">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                  <el-input v-model="current.utm.source" placeholder="utm_source" />
                  <el-input v-model="current.utm.medium" placeholder="utm_medium" />
                  <el-input v-model="current.utm.campaign" placeholder="utm_campaign" />
                </div>
              </el-form-item>
            </template>

            <el-form-item label="圖示">
              <el-input
                v-model="current.icon"
                placeholder="Element Plus Icon 名稱，例如 Odometer"
              />
            </el-form-item>

            <el-form-item label="顯示條件">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                <el-select v-model="current.devices" multiple placeholder="裝置">
                  <el-option label="桌機" value="desktop" />
                  <el-option label="平板" value="tablet" />
                  <el-option label="手機" value="mobile" />
                </el-select>
                <el-select v-model="current.roles" multiple placeholder="角色限制">
                  <el-option v-for="r in ROLE_OPTIONS" :key="r" :label="r" :value="r" />
                </el-select>
                <el-switch v-model="current.requireLogin" active-text="需登入" />
              </div>
            </el-form-item>

            <el-form-item label="顯示控制">
              <el-switch v-model="current.hidden" active-text="隱藏此項" />
              <span class="text-xs text-slate-500 ml-2"
                >隱藏後不顯示於選單，仍可透過路由存取</span
              >
            </el-form-item>

            <el-form-item label="徽章（Badge）">
              <div class="flex gap-2 items-center">
                <el-input
                  v-model="current.badge"
                  placeholder="例如 NEW 或 99+"
                  class="w-[160px]"
                />
                <el-color-picker v-model="current.badgeColor" />
              </div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="save" :loading="saving">儲存</el-button>
              <el-button @click="reselect">取消選取</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown, Plus, Delete } from "@element-plus/icons-vue";

/**
 * 路由選項（前端固定表，方便選取）
 * 依你前面 router 的路徑整理而成
 */
const ROUTE_OPTIONS = [
  // 儀表板
  { label: "儀表板 / 概覽", path: "/dashboard/overview" },

  // 首頁與導覽
  { label: "首頁與導覽 / 首頁區塊設定", path: "/home-nav/blocks" },
  { label: "首頁與導覽 / 主選單/側選單管理", path: "/home-nav/menus" },
  { label: "首頁與導覽 / 首頁社群與外部嵌入", path: "/home-nav/embeds" },

  // 消息與活動
  { label: "消息與活動 / 最新消息", path: "/news-events/latest" },
  { label: "消息與活動 / 新聞稿", path: "/news-events/press" },
  { label: "消息與活動 / 招標公告", path: "/news-events/tenders" },
  { label: "消息與活動 / 徵才公告", path: "/news-events/jobs" },
  { label: "消息與活動 / 活動訊息", path: "/news-events/activities" },
  { label: "消息與活動 / 活動報名管理", path: "/news-events/registrations" },

  // 關於鹿谷
  { label: "關於鹿谷 / 鹿谷簡介", path: "/about/intro" },
  { label: "關於鹿谷 / 公所介紹", path: "/about/township" },
  { label: "關於鹿谷 / 觀光景點", path: "/about/attractions" },
  { label: "關於鹿谷 / 課室分機", path: "/about/extensions" },
  { label: "關於鹿谷 / 特產介紹", path: "/about/specialties" },
  { label: "關於鹿谷 / 交通運輸", path: "/about/transport" },
  { label: "關於鹿谷 / 行政區域", path: "/about/districts" },

  // 資訊公開與政策
  { label: "資訊公開與政策 / 政策相關", path: "/open-policy/plan" },
  { label: "資訊公開與政策 / 年度經費", path: "/open-policy/law-change" },
  { label: "資訊公開與政策 / 資訊公開", path: "/open-policy/promotion" },
  { label: "資訊公開與政策 / 廉政圖地", path: "/open-policy/lobby" },
  { label: "資訊公開與政策 / 年度經費", path: "/open-policy/year-budget" },
  { label: "資訊公開與政策 / 施工工程", path: "/open-policy/construction" },
  { label: "資訊公開與政策 / 災後復建審議", path: "/open-policy/post-disaster" },
  { label: "資訊公開與政策 / 人行安全計畫", path: "/open-policy/pedestrian-safety" },

  // 防災專區
  { label: "防災專區 / 通報聯繫窗口", path: "/disaster/contacts" },
  { label: "防災專區 / 收容場所", path: "/disaster/shelters" },
  { label: "防災專區 / 防災整備與應變作為", path: "/disaster/preparedness" },
  { label: "防災專區 / 相關網站連結", path: "/disaster/links" },
  { label: "防災專區 / 文件下載專區", path: "/disaster/downloads" },
  { label: "防災專區 / 災害潛勢與防災地圖", path: "/disaster/hazard-maps" },

  // 便民服務
  { label: "便民服務 / 社會福利", path: "/services/welfare" },
  { label: "便民服務 / 鄉立幼兒園", path: "/services/kindergarten" },
  { label: "便民服務 / 鹿谷鄉立圖書館", path: "/services/library" },
  { label: "便民服務 / 利益衝突迴避法公開", path: "/services/conflict-of-interest" },
  { label: "便民服務 / 表單下載", path: "/services/forms" },
  { label: "便民服務 / 路燈報修", path: "/services/street-light" },
  { label: "便民服務 / 常見問題", path: "/services/faq" },
  { label: "便民服務 / 鹿谷鄉銘恩堂", path: "/services/memorial" },

  // 代表會
  { label: "代表會專區 / 鄉民代表會", path: "/council/chair" },
  { label: "代表會專區 / 出國考察報告", path: "/council/org" },
  { label: "代表會專區 / 代表會活動", path: "/council/contacts" },
  { label: "代表會專區 / 會議資訊", path: "/council/law-announce" },
  { label: "代表會專區 / 出國考察報告", path: "/council/overseas-report" },
  { label: "代表會專區 / 代表會活動", path: "/council/activities" },
  { label: "代表會專區 / 會議資訊", path: "/council/meetings" },

  // 互動參與
  { label: "互動參與 / 問卷管理", path: "/engagement/surveys" },
  { label: "互動參與 / 投票管理", path: "/engagement/votes" },
  { label: "互動參與 / 問答管理", path: "/engagement/qa" },

  // 媒體
  { label: "媒體與相簿 / 影音像本", path: "/media/album" },
  { label: "媒體與相簿 / YouTube 來源管理", path: "/media/youtube" },
  { label: "媒體與相簿 / 社群連結管理", path: "/media/social" },

  // 檔案與下載
  { label: "檔案與下載 / 檔案中心", path: "/files/center" },
  { label: "檔案與下載 / 下載清單頁設定", path: "/files/download-page" },

  // 行事曆
  { label: "行事曆與行程 / 行事曆管理", path: "/calendar/site" },
  { label: "行事曆與行程 / 鄉長行程", path: "/calendar/mayor" },

  // 進度與內部公告
  { label: "進度查詢 / 進度查詢", path: "/progress/tracker" },
  { label: "內部公告 / 各課室公告", path: "/internal/dept" },
  { label: "內部公告 / 總體公告", path: "/internal/global" },

  // 系統管理
  { label: "系統管理 / 單位/課室管理", path: "/system/units" },
  { label: "系統管理 / 村里/行政區管理", path: "/system/district-admin" },
  { label: "系統管理 / 角色與權限", path: "/system/roles" },
  { label: "系統管理 / 帳號管理", path: "/system/accounts" },
  { label: "系統管理 / 推播設定", path: "/system/categories" },
  { label: "系統管理 / 選單與頁面樹", path: "/system/menus-pages" },
  { label: "系統管理 / 審核流程設定", path: "/system/workflow" },
  { label: "系統管理 / 站台設定", path: "/system/site" },
  { label: "系統管理 / 相關連結/友站管理", path: "/system/friend-links" },
  { label: "系統管理 / 橫幅/輪播管理", path: "/system/banners" },
  { label: "系統管理 / 操作日誌與稽核", path: "/system/audit" },
  { label: "系統管理 / 匯入匯出工具", path: "/system/import-export" },
];

const ROLE_OPTIONS = ["admin", "editor", "staff", "viewer"];

/** 預設樹 (假資料) — 你可以自由編輯後按「儲存」寫到 localStorage */
const DEFAULT_TREE = [
  {
    id: nid(),
    title: "儀表板",
    type: "route",
    path: "/dashboard/overview",
    url: "",
    icon: "Odometer",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#67c23a",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [],
  },
  {
    id: nid(),
    title: "首頁與導覽",
    type: "none",
    path: "",
    url: "",
    icon: "HomeFilled",
    showIn: { top: true, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#409eff",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("首頁區塊設定", "/home-nav/blocks"),
      nodeRoute("主選單/側選單管理", "/home-nav/menus"),
      nodeRoute("首頁社群與外部嵌入", "/home-nav/embeds"),
    ],
  },
  {
    id: nid(),
    title: "消息與活動",
    type: "none",
    path: "",
    url: "",
    icon: "Bell",
    showIn: { top: true, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#e6a23c",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("最新消息", "/news-events/latest"),
      nodeRoute("新聞稿", "/news-events/press"),
      nodeRoute("招標公告", "/news-events/tenders"),
      nodeRoute("徵才公告", "/news-events/jobs"),
      nodeRoute("活動訊息", "/news-events/activities"),
      nodeRoute("活動報名管理", "/news-events/registrations"),
    ],
  },
  {
    id: nid(),
    title: "關於鹿谷",
    type: "none",
    path: "",
    url: "",
    icon: "InfoFilled",
    showIn: { top: true, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#909399",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("鹿谷簡介", "/about/intro"),
      nodeRoute("公所介紹", "/about/township"),
      nodeRoute("觀光景點", "/about/attractions"),
      nodeRoute("課室分機", "/about/extensions"),
      nodeRoute("特產介紹", "/about/specialties"),
      nodeRoute("交通運輸", "/about/transport"),
      nodeRoute("行政區域", "/about/districts"),
    ],
  },
  {
    id: nid(),
    title: "資訊公開與政策",
    type: "none",
    icon: "Document",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#909399",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("政策相關", "/open-policy/plan"),
      nodeRoute("年度經費", "/open-policy/law-change"),
      nodeRoute("資訊公開", "/open-policy/promotion"),
      nodeRoute("廉政圖地", "/open-policy/lobby"),
      nodeRoute("年度經費", "/open-policy/year-budget"),
      nodeRoute("核定計畫專區", "/open-policy/approved"),
      nodeRoute("重大計畫", "/open-policy/major"),
      nodeRoute("施工工程", "/open-policy/construction"),
      nodeRoute("災後復建審議", "/open-policy/post-disaster"),
      nodeRoute("人行安全計畫", "/open-policy/pedestrian-safety"),
    ],
  },
  {
    id: nid(),
    title: "防災專區",
    type: "none",
    icon: "Warning",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#f56c6c",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("通報聯繫窗口", "/disaster/contacts"),
      nodeRoute("收容場所", "/disaster/shelters"),
      nodeRoute("防災整備與應變作為", "/disaster/preparedness"),
      nodeRoute("相關網站連結", "/disaster/links"),
      nodeRoute("文件下載專區", "/disaster/downloads"),
      nodeRoute("災害潛勢與防災地圖", "/disaster/hazard-maps"),
    ],
  },
  {
    id: nid(),
    title: "便民服務",
    type: "none",
    icon: "Cherry",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#67c23a",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("社會福利", "/services/welfare"),
      nodeRoute("鄉立幼兒園", "/services/kindergarten"),
      nodeRoute("鹿谷鄉立圖書館", "/services/library"),
      nodeRoute("利益衝突迴避法公開", "/services/conflict-of-interest"),
      nodeRoute("表單下載", "/services/forms"),
      nodeRoute("路燈報修", "/services/street-light"),
      nodeRoute("常見問題", "/services/faq"),
      nodeRoute("鹿谷鄉銘恩堂", "/services/memorial"),
    ],
  },
  {
    id: nid(),
    title: "代表會專區",
    type: "none",
    icon: "OfficeBuilding",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#409eff",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("鄉民代表會", "/council/chair"),
      nodeRoute("出國考察報告", "/council/org"),
      nodeRoute("代表會活動", "/council/contacts"),
      nodeRoute("會議資訊", "/council/law-announce"),
      nodeRoute("出國考察報告", "/council/overseas-report"),
      nodeRoute("代表會活動", "/council/activities"),
      nodeRoute("會議資訊", "/council/meetings"),
    ],
  },
  {
    id: nid(),
    title: "互動參與",
    type: "none",
    icon: "ChatDotRound",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#67c23a",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("問卷管理", "/engagement/surveys"),
      nodeRoute("投票管理", "/engagement/votes"),
      nodeRoute("問答管理", "/engagement/qa"),
    ],
  },
  {
    id: nid(),
    title: "媒體與相簿",
    type: "none",
    icon: "Picture",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#909399",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("影音像本", "/media/album"),
      nodeRoute("YouTube 來源管理", "/media/youtube"),
      nodeRoute("社群連結管理", "/media/social"),
    ],
  },
  {
    id: nid(),
    title: "檔案與下載",
    type: "none",
    icon: "Folder",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#909399",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("檔案中心", "/files/center"),
      nodeRoute("下載清單頁設定", "/files/download-page"),
    ],
  },
  {
    id: nid(),
    title: "行事曆與行程",
    type: "none",
    icon: "Calendar",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#67c23a",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("行事曆管理", "/calendar/site"),
      nodeRoute("鄉長行程", "/calendar/mayor"),
    ],
  },
  {
    id: nid(),
    title: "進度查詢",
    type: "none",
    icon: "TrendCharts",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#67c23a",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [nodeRoute("進度查詢", "/progress/tracker")],
  },
  {
    id: nid(),
    title: "內部公告",
    type: "none",
    icon: "MessageBox",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#e6a23c",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("各課室公告", "/internal/dept"),
      nodeRoute("總體公告", "/internal/global"),
    ],
  },
  {
    id: nid(),
    title: "系統管理",
    type: "none",
    icon: "Setting",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#909399",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [
      nodeRoute("單位/課室管理", "/system/units"),
      nodeRoute("村里/行政區管理", "/system/district-admin"),
      nodeRoute("角色與權限", "/system/roles"),
      nodeRoute("帳號管理", "/system/accounts"),
      nodeRoute("推播設定", "/system/categories"),
      nodeRoute("選單與頁面樹", "/system/menus-pages"),
      nodeRoute("審核流程設定", "/system/workflow"),
      nodeRoute("站台設定", "/system/site"),
      nodeRoute("相關連結/友站管理", "/system/friend-links"),
      nodeRoute("橫幅/輪播管理", "/system/banners"),
      nodeRoute("操作日誌與稽核", "/system/audit"),
      nodeRoute("匯入匯出工具", "/system/import-export"),
    ],
  },
];

/** --- 狀態 --- */
const LS_KEY = "menu.config.v1";
const treeData = ref(loadFromLS() || DEFAULT_TREE);
const treeRef = ref(null);
const current = ref(null);
const keyword = ref("");
const saving = ref(false);

/** Tree 基本設定 */
const treeProps = {
  children: "children",
  label: "title",
};

/** --- 方法區 --- */
function nid() {
  return "m_" + Math.random().toString(36).slice(2, 9);
}
function nodeRoute(title, path) {
  return {
    id: nid(),
    title,
    type: "route",
    path,
    url: "",
    icon: "",
    showIn: { top: false, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#67c23a",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [],
  };
}

/** Tree 節點拖放規則：允許成為任意節點的子節點或同層前/後 */
function allowDrop(draggingNode, dropNode, type) {
  // 禁止把節點拖進「route: none 的空資料？」— 不需要，全部允許
  return ["prev", "inner", "next"].includes(type);
}

/** 點選節點 */
function onNodeClick(data) {
  current.value = data;
}

/** 新增根節點 */
function addRoot() {
  treeData.value.push({
    id: nid(),
    title: "新群組",
    type: "none",
    path: "",
    url: "",
    icon: "",
    showIn: { top: true, side: true },
    hidden: false,
    requireLogin: true,
    devices: ["desktop", "tablet", "mobile"],
    roles: [],
    badge: "",
    badgeColor: "#67c23a",
    utm: { source: "", medium: "", campaign: "" },
    externalBlank: true,
    children: [],
  });
  nextTick(() => expandAll(true));
}

/** 新增子節點 */
function addChild(parent) {
  parent.children ||= [];
  parent.children.push(nodeRoute("新頁面", ""));
  nextTick(() => expandAll(true));
}

/** 刪除節點 */
async function removeNode(node) {
  await ElMessageBox.confirm(`確定要刪除「${node.title || "未命名"}」？`, "提示", {
    type: "warning",
  });
  const walk = (arr) => {
    const i = arr.findIndex((x) => x.id === node.id);
    if (i > -1) return arr.splice(i, 1);
    arr.forEach((x) => x.children && walk(x.children));
  };
  walk(treeData.value);
  if (current.value?.id === node.id) current.value = null;
  ElMessage.success("已刪除");
}

/** 展開/收合 */
function expandAll(open) {
  const tree = treeRef.value;
  if (!tree) return;
  const nodes = tree.store.nodesMap;
  Object.values(nodes).forEach((n) => (n.expanded = open));
}

/** 篩選 */
function onFilter() {
  treeRef.value && treeRef.value.filter(keyword.value);
}
function filterNode(val, data) {
  if (!val) return true;
  const v = val.toLowerCase();
  const str = `${data.title} ${data.path || ""} ${data.url || ""}`.toLowerCase();
  return str.includes(v);
}

/** 儲存到 localStorage */
async function save() {
  try {
    saving.value = true;
    localStorage.setItem(LS_KEY, JSON.stringify(treeData.value));
    ElMessage.success("已儲存選單設定到本機");
  } catch {
    ElMessage.error("儲存失敗");
  } finally {
    saving.value = false;
  }
}

/** 匯出 JSON */
function exportJSON() {
  const blob = new Blob([JSON.stringify(treeData.value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "menu-config.json";
  a.click();
  URL.revokeObjectURL(url);
}

/** 匯入 JSON */
function importJSON(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("格式錯誤");
      treeData.value = data;
      current.value = null;
      ElMessage.success("匯入成功");
    } catch {
      ElMessage.error("匯入失敗，請確認檔案格式");
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
}

/** 載入預設 */
function loadDefault() {
  treeData.value = DEFAULT_TREE;
  current.value = null;
  ElMessage.success("已載入預設內容（未自動儲存）");
}

/** 清空 */
function clearAll() {
  treeData.value = [];
  current.value = null;
  localStorage.removeItem(LS_KEY);
  ElMessage.success("已清空（本機）");
}

/** 讀取 localStorage */
function loadFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 取消選取 */
function reselect() {
  current.value = null;
}
</script>

<style scoped>
.menu-tree :deep(.el-tree-node__content) {
  height: 36px;
}
</style>
