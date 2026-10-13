import type { Locale } from "./i18n";
import type { Calendar, EventItem, TicketType } from "./types";

type TextPack = {
  title?: string;
  description?: string;
  location?: string;
  city?: string;
  host?: string;
  tags?: string[];
};

type CalPack = {
  name?: string;
  description?: string;
  city?: string;
};

const CITY_ZH: Record<string, string> = {
  Shanghai: "上海",
  Hangzhou: "杭州",
  Beijing: "北京",
  Shenzhen: "深圳",
  Guangzhou: "广州",
};

const TAG_ZH: Record<string, string> = {
  Design: "设计",
  Community: "社区",
  Startup: "创业",
  Demo: "演示",
  Film: "电影",
  Culture: "文化",
  Workshop: "工作坊",
  Music: "音乐",
  Social: "社交",
  Product: "产品",
  Critique: "点评",
};

const TICKET_ZH: Record<string, string> = {
  Standard: "标准票",
  "Demo Slot": "演示席位",
  Application: "申请席",
};

const EVENT_ZH: Record<string, TextPack> = {
  "midnight-design-salon": {
    title: "午夜设计沙龙",
    description: "面向产品设计师与创始人的小型夜晚聚会。短分享、轻音乐，以及那些不适合在 Slack 里展开的对话。",
    location: "静安 · The Quiet Floor",
    city: "上海",
    host: "Luva 工作室",
    tags: ["设计", "社区"],
  },
  "builders-breakfast": {
    title: "建造者早餐会",
    description: "咖啡、可颂，以及中午前的 Demo。带上原型，或只带着好奇心来。",
    location: "River Roastery",
    city: "上海",
    host: "Indie Lab",
    tags: ["创业", "演示"],
  },
  "film-night-neon": {
    title: "电影夜：霓虹城市",
    description: "精选关于夜色城市的短片放映，结束后在屋顶小聚。",
    location: "Laneway Cinema",
    city: "上海",
    host: "Night Frame",
    tags: ["电影", "文化"],
  },
  "type-and-tea": {
    title: "字体与茶",
    description: "字体工作坊，含活字印刷样品与下午茶。欢迎初学者。",
    location: "Paper Room",
    city: "杭州",
    host: "Luva 工作室",
    tags: ["工作坊", "设计"],
  },
  "summer-rooftop-session": {
    title: "夏日屋顶场",
    description: "上一季的日落聚会——记忆里仍在发光。",
    location: "Sky Deck",
    city: "上海",
    host: "Luva 工作室",
    tags: ["音乐", "社交"],
  },
  "product-critique-circle": {
    title: "产品点评会",
    description: "一场已结束的闭门场：团队带着半成品流程，接受犀利点评。",
    location: "Studio B",
    city: "北京",
    host: "Indie Lab",
    tags: ["产品", "点评"],
  },
  "real-approval-night": {
    title: "需审核之夜",
    description: "需要主办人审核才能参加的示例活动。",
    city: "上海",
  },
};

const CAL_ZH: Record<string, CalPack> = {
  "luva-studio": {
    name: "Luva 工作室",
    description: "设计沙龙、建造者早餐，以及城市里安静的夜晚。",
    city: "上海",
  },
  "indie-lab": {
    name: "Indie Lab",
    description: "中午前的原型，没有幻灯片的演示。",
    city: "上海",
  },
  "night-frame": {
    name: "Night Frame",
    description: "电影、霓虹与屋顶。",
    city: "上海",
  },
};

function localizeCity(city: string, locale: Locale) {
  if (locale !== "zh") return city;
  return CITY_ZH[city] || city;
}

function localizeTags(tags: string[], locale: Locale) {
  if (locale !== "zh") return tags;
  return tags.map((t) => TAG_ZH[t] || t);
}

function localizeTickets(tickets: TicketType[], locale: Locale): TicketType[] {
  if (locale !== "zh") return tickets;
  return tickets.map((t) => ({
    ...t,
    name: TICKET_ZH[t.name] || t.name,
  }));
}

export function localizeEvent(event: EventItem, locale: Locale): EventItem {
  if (locale !== "zh") {
    return {
      ...event,
      ticketTypes: event.ticketTypes.map((t) => ({ ...t })),
      tags: [...event.tags],
    };
  }
  const pack = EVENT_ZH[event.slug] || EVENT_ZH[event.id];
  return {
    ...event,
    title: pack?.title || event.title,
    description: pack?.description || event.description,
    location: pack?.location || event.location,
    city: pack?.city || localizeCity(event.city, locale),
    host: pack?.host || event.host,
    tags: pack?.tags || localizeTags(event.tags, locale),
    ticketTypes: localizeTickets(event.ticketTypes, locale),
  };
}

export function localizeCalendar(cal: Calendar, locale: Locale): Calendar {
  if (locale !== "zh") return { ...cal, followerIds: [...cal.followerIds] };
  const pack = CAL_ZH[cal.slug] || CAL_ZH[cal.id];
  return {
    ...cal,
    name: pack?.name || cal.name,
    description: pack?.description || cal.description,
    city: pack?.city || localizeCity(cal.city, locale),
    followerIds: [...cal.followerIds],
  };
}

export function localizePlain(text: string, locale: Locale) {
  if (locale !== "zh") return text;
  return CITY_ZH[text] || TAG_ZH[text] || TICKET_ZH[text] || text;
}
