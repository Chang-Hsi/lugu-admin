import { defineStore } from 'pinia'

export const usePermStore = defineStore('perm', {
  state: () => ({
    ready: false,
    rules: {},
    roleId: 'default',
  }),

  getters: {
    can: (state) => (path) => state.rules[path] !== false,
  },

  actions: {
    async load(roleId) {
      if (roleId) this.roleId = roleId
      try {
        const raw = localStorage.getItem('perm.rules.' + this.roleId)
        this.rules = raw ? JSON.parse(raw) : {}
      } catch {
        this.rules = {}
      } finally {
        this.ready = true
      }
    },

    async save(rules) {
      try {
        const toSave = rules || this.rules
        localStorage.setItem('perm.rules.' + this.roleId, JSON.stringify(toSave))
        this.rules = toSave
      } catch {}
    },

    // menuItems: [{ name: '群組名', subItems: [{ name: '子頁名', enabled: 0|1 }, ...] }, ...]
    setFromMenuItems(menuItems) {
      const map = {
        '儀表板/概覽': '/dashboard/overview',

        '首頁與導覽/首頁區塊設定': '/home-nav/blocks',
        '首頁與導覽/主選單/側選單管理': '/home-nav/menus',
        '首頁與導覽/首頁社群與外部嵌入': '/home-nav/embeds',

        '消息與活動/最新消息': '/news-events/latest',
        '消息與活動/新聞稿': '/news-events/press',
        '消息與活動/招標公告': '/news-events/tenders',
        '消息與活動/徵才公告': '/news-events/jobs',
        '消息與活動/活動訊息': '/news-events/activities',
        '消息與活動/活動報名管理': '/news-events/registrations',

        '關於鹿谷/鹿谷簡介': '/about/intro',
        '關於鹿谷/公所介紹': '/about/township',
        '關於鹿谷/觀光景點': '/about/attractions',
        '關於鹿谷/課室分機': '/about/extensions',
        '關於鹿谷/特產介紹': '/about/specialties',
        '關於鹿谷/交通運輸': '/about/transport',
        '關於鹿谷/行政區域': '/about/districts',

        '資訊公開與政策/工程類': '/open-policy/engineering',
        '資訊公開與政策/經費類': '/open-policy/budget',
        '資訊公開與政策/廉政類': '/open-policy/integrity',
        '資訊公開與政策/法治類': '/open-policy/law',
        '資訊公開與政策/施政計畫': '/open-policy/plan',
        '資訊公開與政策/法規增修': '/open-policy/law-change',
        '資訊公開與政策/政策宣導': '/open-policy/promotion',
        '資訊公開與政策/遊說法專區': '/open-policy/lobby',
        '資訊公開與政策/年度經費': '/open-policy/year-budget',
        '資訊公開與政策/核定計畫專區': '/open-policy/approved',
        '資訊公開與政策/重大計畫': '/open-policy/major',
        '資訊公開與政策/施工工程': '/open-policy/construction',
        '資訊公開與政策/災後復建審議': '/open-policy/post-disaster',
        '資訊公開與政策/人行安全計畫': '/open-policy/pedestrian-safety',

        '防災專區/通報聯繫窗口': '/disaster/contacts',
        '防災專區/收容場所': '/disaster/shelters',
        '防災專區/防災整備與應變作為': '/disaster/preparedness',
        '防災專區/相關網站連結': '/disaster/links',
        '防災專區/文件下載專區': '/disaster/downloads',
        '防災專區/災害潛勢與防災地圖': '/disaster/hazard-maps',

        '便民服務/社會福利': '/services/welfare',
        '便民服務/鄉立幼兒園': '/services/kindergarten',
        '便民服務/鹿谷鄉立圖書館': '/services/library',
        '便民服務/利益衝突迴避法公開': '/services/conflict-of-interest',
        '便民服務/表單下載': '/services/forms',
        '便民服務/路燈報修': '/services/street-light',
        '便民服務/常見問題': '/services/faq',
        '便民服務/鹿谷鄉銘恩堂': '/services/memorial',

        '代表會專區/主席介紹': '/council/chair',
        '代表會專區/出國考察報告': '/council/org',
        '代表會專區/代表會活動': '/council/contacts',
        '代表會專區/會議資訊': '/council/law-announce',
        '代表會專區/出國考察報告': '/council/overseas-report',
        '代表會專區/代表會活動': '/council/activities',
        '代表會專區/會議資訊': '/council/meetings',

        '互動參與/問卷管理': '/engagement/surveys',
        '互動參與/投票管理': '/engagement/votes',
        '互動參與/問答管理': '/engagement/qa',

        '媒體與相簿/影音像本': '/media/album',
        '媒體與相簿/YouTube 來源管理': '/media/youtube',
        '媒體與相簿/社群連結管理': '/media/social',

        '檔案與下載/檔案中心': '/files/center',
        '檔案與下載/下載清單頁設定': '/files/download-page',

        '行事曆與行程/行事曆管理': '/calendar/site',
        '行事曆與行程/鄉長行程': '/calendar/mayor',

        '進度查詢/進度查詢': '/progress/tracker',

        '內部公告/各課室公告': '/internal/dept',
        '內部公告/總體公告': '/internal/global',

        '系統管理/單位/課室管理': '/system/units',
        '系統管理/村里/行政區管理': '/system/district-admin',
        '系統管理/角色與權限': '/system/roles',
        '系統管理/帳號管理': '/system/accounts',
        '系統管理/推播設定': '/system/categories',
        '系統管理/選單與頁面樹': '/system/menus-pages',
        '系統管理/審核流程設定': '/system/workflow',
        '系統管理/站台設定': '/system/site',
        '系統管理/相關連結/友站管理': '/system/friend-links',
        '系統管理/橫幅/輪播管理': '/system/banners',
        '系統管理/操作日誌與稽核': '/system/audit',
        '系統管理/匯入匯出工具': '/system/import-export',
      }

      const rules = {}
      menuItems.forEach((group) => {
        group.subItems.forEach((si) => {
          const key = `${group.name}/${si.name}`
          if (map[key]) rules[map[key]] = si.enabled === 1
        })
      })

      this.rules = rules
      return rules
    },

    clearLocal() {
      try {
        localStorage.removeItem('perm.rules.' + this.roleId)
      } catch {}
      this.rules = {}
    },
  },
})
