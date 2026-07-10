export interface Project {
  slug: string;
  title: string;
  scope: string;
  location: string;
  year: string;
  /** Headline metric that conveys project scale. */
  metric: string;
  metricLabel: string;
  category: string;
}

export const projects: Project[] = [
  {
    slug: "ktz-astana",
    title: "Электроснабжение производственного корпуса КТЖ",
    scope: "Поставка силового кабеля, СИП и щитового оборудования",
    location: "Астана",
    year: "2025",
    metric: "42 км",
    metricLabel: "кабельных линий",
    category: "Транспорт",
  },
  {
    slug: "volkovgeologiya",
    title: "Модернизация распредсетей геологоразведки",
    scope: "Высоковольтное оборудование и муфты для подстанций",
    location: "Актюбинская обл.",
    year: "2025",
    metric: "6",
    metricLabel: "подстанций 10 кВ",
    category: "Энергетика",
  },
  {
    slug: "shymkent-agro",
    title: "Электрификация тепличного комплекса",
    scope: "Кабельная продукция и автоматика для АПК",
    location: "Шымкент",
    year: "2024",
    metric: "3,2 МВт",
    metricLabel: "подключённой мощности",
    category: "Промышленность",
  },
];
