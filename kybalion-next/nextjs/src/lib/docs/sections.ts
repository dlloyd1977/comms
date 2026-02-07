export type DocSection = {
  key: string;
  title: string;
  description: string;
  prefix: string;
};

export const DOC_SECTIONS: DocSection[] = [
  {
    key: "general",
    title: "General",
    description: "Syllabus, program overview, and logistics.",
    prefix: "general/",
  },
  {
    key: "session-01",
    title: "Session 01",
    description: "Overview, worksheet, and slides.",
    prefix: "session-01/",
  },
  {
    key: "session-02",
    title: "Session 02",
    description: "Materials and assignments.",
    prefix: "session-02/",
  },
  {
    key: "session-03",
    title: "Session 03",
    description: "Materials and assignments.",
    prefix: "session-03/",
  },
  {
    key: "session-04",
    title: "Session 04",
    description: "Materials and assignments.",
    prefix: "session-04/",
  },
  {
    key: "session-05",
    title: "Session 05",
    description: "Materials and assignments.",
    prefix: "session-05/",
  },
  {
    key: "session-06",
    title: "Session 06",
    description: "Materials and assignments.",
    prefix: "session-06/",
  },
  {
    key: "session-07",
    title: "Session 07",
    description: "Materials and assignments.",
    prefix: "session-07/",
  },
  {
    key: "session-08",
    title: "Session 08",
    description: "Materials and assignments.",
    prefix: "session-08/",
  },
  {
    key: "session-09",
    title: "Session 09",
    description: "Materials and assignments.",
    prefix: "session-09/",
  },
  {
    key: "session-10",
    title: "Session 10",
    description: "Materials and assignments.",
    prefix: "session-10/",
  },
  {
    key: "session-11",
    title: "Session 11",
    description: "Materials and assignments.",
    prefix: "session-11/",
  },
  {
    key: "session-12",
    title: "Session 12",
    description: "Materials and assignments.",
    prefix: "session-12/",
  },
  {
    key: "templates",
    title: "Templates",
    description: "Reusable worksheets and facilitator templates.",
    prefix: "templates/",
  },
  {
    key: "assets",
    title: "Assets",
    description: "Images, logos, and supporting files.",
    prefix: "assets/",
  },
  {
    key: "master-docs",
    title: "Master Docs",
    description: "Source documents and master copies.",
    prefix: "master-docs/",
  },
];

export const getDocSection = (key: string) =>
  DOC_SECTIONS.find((section) => section.key === key);
