import { createRouter, createWebHistory } from 'vue-router'

const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')

// 第一層群組僅作分群，實際頁面皆為上方各 .vue 檔
const routes = [
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/dashboard/overview',
    children: [
      {
        path: 'dashboard',
        meta: { title: '儀表板', icon: 'Odometer', menu: true, order: 1 },
        children: [
          { path: 'overview', component: () => import('@/views/dashboard/Overview.vue'), meta: { title: '概覽' } },
        ],
      },

      {
        path: 'home-nav',
        meta: { title: '首頁與導覽', icon: 'HomeFilled', menu: true, order: 2 },
        children: [
          { path: 'blocks', component: () => import('@/views/homeNav/Blocks.vue'), meta: { title: '首頁區塊設定' } },
          { path: 'menus', component: () => import('@/views/homeNav/Menus.vue'), meta: { title: '主選單/側選單管理' } },
          { path: 'embeds', component: () => import('@/views/homeNav/Embeds.vue'), meta: { title: '首頁社群與外部嵌入' } },
        ],
      },

      {
        path: 'news-events',
        meta: { title: '消息與活動', icon: 'Bell', menu: true, order: 3 },
        children: [
          { path: 'latest', component: () => import('@/views/newsEvents/Latest.vue'), meta: { title: '最新消息' } },
          { path: 'press', component: () => import('@/views/newsEvents/Press.vue'), meta: { title: '新聞稿' } },
          { path: 'tenders', component: () => import('@/views/newsEvents/Tenders.vue'), meta: { title: '招標公告' } },
          { path: 'jobs', component: () => import('@/views/newsEvents/Jobs.vue'), meta: { title: '徵才公告' } },
          { path: 'activities', component: () => import('@/views/newsEvents/Activities.vue'), meta: { title: '活動訊息' } },
          { path: 'registrations', component: () => import('@/views/newsEvents/Registrations.vue'), meta: { title: '活動報名管理' } },
        ],
      },

      {
        path: 'about',
        meta: { title: '關於鹿谷', icon: 'InfoFilled', menu: true, order: 4 },
        children: [
          { path: 'intro', component: () => import('@/views/about/Intro.vue'), meta: { title: '鹿谷簡介' } },
          { path: 'township', component: () => import('@/views/about/Township.vue'), meta: { title: '公所介紹' } },
          { path: 'attractions', component: () => import('@/views/about/Attractions.vue'), meta: { title: '觀光景點' } },
          { path: 'extensions', component: () => import('@/views/about/Extensions.vue'), meta: { title: '課室分機' } },
          { path: 'specialties', component: () => import('@/views/about/Specialties.vue'), meta: { title: '特產介紹' } },
          { path: 'transport', component: () => import('@/views/about/Transport.vue'), meta: { title: '交通運輸' } },
          { path: 'districts', component: () => import('@/views/about/Districts.vue'), meta: { title: '行政區域' } },
        ],
      },

      {
        path: 'open-policy',
        meta: { title: '資訊公開與政策', icon: 'Document', menu: true, order: 5 },
        children: [
          { path: 'engineering', component: () => import('@/views/openPolicy/Engineering.vue'), meta: { title: '工程類' } },
          { path: 'budget', component: () => import('@/views/openPolicy/Budget.vue'), meta: { title: '經費類' } },
          { path: 'integrity', component: () => import('@/views/openPolicy/Integrity.vue'), meta: { title: '廉政類' } },
          { path: 'law', component: () => import('@/views/openPolicy/Law.vue'), meta: { title: '法治類' } },
          { path: 'plan', component: () => import('@/views/openPolicy/Plan.vue'), meta: { title: '施政計畫' } },
          { path: 'law-change', component: () => import('@/views/openPolicy/LawChange.vue'), meta: { title: '法規增修' } },
          { path: 'promotion', component: () => import('@/views/openPolicy/Promotion.vue'), meta: { title: '政策宣導' } },
          { path: 'lobby', component: () => import('@/views/openPolicy/Lobby.vue'), meta: { title: '遊說法專區' } },
          { path: 'year-budget', component: () => import('@/views/openPolicy/YearBudget.vue'), meta: { title: '年度經費' } },
          { path: 'approved', component: () => import('@/views/openPolicy/Approved.vue'), meta: { title: '核定計畫專區' } },
          { path: 'major', component: () => import('@/views/openPolicy/Major.vue'), meta: { title: '重大計畫' } },
          { path: 'construction', component: () => import('@/views/openPolicy/Construction.vue'), meta: { title: '施工工程' } },
          { path: 'post-disaster', component: () => import('@/views/openPolicy/PostDisaster.vue'), meta: { title: '災後復建審議' } },
          { path: 'pedestrian-safety', component: () => import('@/views/openPolicy/PedestrianSafety.vue'), meta: { title: '永續提升人行安全計畫' } },
        ],
      },

      {
        path: 'disaster',
        meta: { title: '防災專區', icon: 'Warning', menu: true, order: 6 },
        children: [
          { path: 'contacts', component: () => import('@/views/disaster/Contacts.vue'), meta: { title: '通報聯繫窗口' } },
          { path: 'shelters', component: () => import('@/views/disaster/Shelters.vue'), meta: { title: '收容場所' } },
          { path: 'preparedness', component: () => import('@/views/disaster/Preparedness.vue'), meta: { title: '防災整備與應變作為' } },
          { path: 'links', component: () => import('@/views/disaster/Links.vue'), meta: { title: '相關網站連結' } },
          { path: 'downloads', component: () => import('@/views/disaster/Downloads.vue'), meta: { title: '文件下載專區' } },
          { path: 'hazard-maps', component: () => import('@/views/disaster/HazardMaps.vue'), meta: { title: '災害潛勢與防災地圖' } },
        ],
      },

      {
        path: 'services',
        meta: { title: '便民服務', icon: 'Cherry', menu: true, order: 7 },
        children: [
          { path: 'welfare', component: () => import('@/views/services/Welfare.vue'), meta: { title: '社會福利' } },
          { path: 'kindergarten', component: () => import('@/views/services/Kindergarten.vue'), meta: { title: '鄉立幼兒園' } },
          { path: 'library', component: () => import('@/views/services/Library.vue'), meta: { title: '鹿谷鄉立圖書館' } },
          { path: 'conflict-of-interest', component: () => import('@/views/services/ConflictOfInterest.vue'), meta: { title: '利益衝突迴避法公開' } },
          { path: 'forms', component: () => import('@/views/services/Forms.vue'), meta: { title: '表單下載' } },
          { path: 'street-light', component: () => import('@/views/services/StreetLight.vue'), meta: { title: '路燈報修' } },
          { path: 'faq', component: () => import('@/views/services/Faq.vue'), meta: { title: '常見問題' } },
          { path: 'memorial', component: () => import('@/views/services/Memorial.vue'), meta: { title: '鹿谷鄉銘恩堂' } },
        ],
      },

      {
        path: 'council',
        meta: { title: '代表會專區', icon: 'OfficeBuilding', menu: true, order: 8 },
        children: [
          { path: 'chair', component: () => import('@/views/council/Chair.vue'), meta: { title: '主席介紹' } },
          { path: 'org', component: () => import('@/views/council/Org.vue'), meta: { title: '組織介紹/架構' } },
          { path: 'contacts', component: () => import('@/views/council/Contacts.vue'), meta: { title: '代表服務電話' } },
          { path: 'law-announce', component: () => import('@/views/council/LawAnnounce.vue'), meta: { title: '法規公告宣導' } },
          { path: 'overseas-report', component: () => import('@/views/council/OverseasReport.vue'), meta: { title: '出國考察報告' } },
          { path: 'activities', component: () => import('@/views/council/Activities.vue'), meta: { title: '代表會活動' } },
          { path: 'meetings', component: () => import('@/views/council/Meetings.vue'), meta: { title: '會議資訊' } },
        ],
      },

      {
        path: 'engagement',
        meta: { title: '互動參與', icon: 'ChatDotRound', menu: true, order: 9 },
        children: [
          { path: 'surveys', component: () => import('@/views/engagement/Surveys.vue'), meta: { title: '問卷管理' } },
          { path: 'votes', component: () => import('@/views/engagement/Votes.vue'), meta: { title: '投票管理' } },
          { path: 'qa', component: () => import('@/views/engagement/Qa.vue'), meta: { title: '問答管理' } },
        ],
      },

      {
        path: 'media',
        meta: { title: '媒體與相簿', icon: 'Picture', menu: true, order: 10 },
        children: [
          { path: 'album', component: () => import('@/views/media/Album.vue'), meta: { title: '影音像本' } },
          { path: 'youtube', component: () => import('@/views/media/Youtube.vue'), meta: { title: 'YouTube 來源管理' } },
          { path: 'social', component: () => import('@/views/media/Social.vue'), meta: { title: '社群連結管理' } },
        ],
      },

      {
        path: 'files',
        meta: { title: '檔案與下載', icon: 'Folder', menu: true, order: 11 },
        children: [
          { path: 'center', component: () => import('@/views/files/Center.vue'), meta: { title: '檔案中心' } },
          { path: 'download-page', component: () => import('@/views/files/DownloadPage.vue'), meta: { title: '下載清單頁設定' } },
        ],
      },

      {
        path: 'calendar',
        meta: { title: '行事曆與行程', icon: 'Calendar', menu: true, order: 12 },
        children: [
          { path: 'site', component: () => import('@/views/calendar/Site.vue'), meta: { title: '行事曆管理' } },
          { path: 'mayor', component: () => import('@/views/calendar/Mayor.vue'), meta: { title: '鄉長行程' } },
        ],
      },

      {
        path: 'progress',
        meta: { title: '進度查詢', icon: 'TrendCharts', menu: true, order: 13 },
        children: [
          { path: 'tracker', component: () => import('@/views/progress/Tracker.vue'), meta: { title: '進度查詢' } },
        ],
      },

      {
        path: 'internal',
        meta: { title: '內部公告', icon: 'MessageBox', menu: true, order: 14 },
        children: [
          { path: 'dept', component: () => import('@/views/internal/Dept.vue'), meta: { title: '各課室公告' } },
          { path: 'global', component: () => import('@/views/internal/Global.vue'), meta: { title: '總體公告' } },
        ],
      },

      {
        path: 'system',
        meta: { title: '系統管理', icon: 'Setting', menu: true, order: 15 },
        children: [
          { path: 'units', component: () => import('@/views/system/Units.vue'), meta: { title: '單位/課室管理' } },
          { path: 'district-admin', component: () => import('@/views/system/DistrictAdmin.vue'), meta: { title: '村里/行政區管理' } },
          { path: 'roles', component: () => import('@/views/system/Roles.vue'), meta: { title: '角色與權限' } },
          { path: 'accounts', component: () => import('@/views/system/Accounts.vue'), meta: { title: '帳號管理' } },
          { path: 'categories', component: () => import('@/views/system/Categories.vue'), meta: { title: '分類與標籤' } },
          { path: 'menus-pages', component: () => import('@/views/system/MenusPages.vue'), meta: { title: '選單與頁面樹' } },
          { path: 'workflow', component: () => import('@/views/system/Workflow.vue'), meta: { title: '審核流程設定' } },
          { path: 'site', component: () => import('@/views/system/Site.vue'), meta: { title: '站台設定' } },
          { path: 'friend-links', component: () => import('@/views/system/FriendLinks.vue'), meta: { title: '相關連結/友站管理' } },
          { path: 'banners', component: () => import('@/views/system/Banners.vue'), meta: { title: '橫幅/輪播管理' } },
          { path: 'audit', component: () => import('@/views/system/Audit.vue'), meta: { title: '操作日誌與稽核' } },
          { path: 'import-export', component: () => import('@/views/system/ImportExport.vue'), meta: { title: '匯入匯出工具' } },
        ],
      },
    ],
  },

  {
    path: '/auth',
    component: AuthLayout,
    children: [{ path: 'login', component: () => import('@/views/auth/Login.vue'), meta: { title: '登入' } }],
  },

  { path: '/:pathMatch(.*)*', component: () => import('@/views/system/NotFound.vue'), meta: { title: '找不到頁面' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})
export default router
