// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "GlimmerLab",
  tagline: "GLIMMER",
  url: " https://glimmerlab.github.io/",
  baseUrl: "/",
  onBrokenLinks: "log",
  onBrokenMarkdownLinks: "log",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: '7wate', // Usually your GitHub org/user name.
  // projectName: 'wiki', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // editUrl: "https://git.7wate.com/zhouzhongping/wiki/src/branch/master",
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          breadcrumbs: false,
        },
        blog: {
          blogTitle: "GlimmerLab`s Wiki",
          blogDescription: "GlimmerLab 的点点滴滴",
          blogSidebarCount: 7,
          blogSidebarTitle: "近期文章",
          showReadingTime: true,
          // editUrl: "https://git.7wate.com/zhouzhongping/wiki/src/branch/master",
          feedOptions: {
            title: "GlimmerLab`s Wiki",
            description: "GlimmerLab`s Wiki",
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} GlimmerLab, Inc.`,
          },
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        sitemap: {
          changefreq: "weekly",
          priority: 0.5,
          filename: 'sitemap.xml',
        },
        googleAnalytics: {
          trackingID: "G-MHMEL0F832",
          anonymizeIP: true,
        },
        gtag: {
          trackingID: 'G-MHMEL0F832',
          anonymizeIP: true,
        },
      }),
    ],
  ],

  // -----------------------------------------------------------------------------------

  // -----------------------------------------------------------------------------------

  // -----------------------------------------------------------------------------------

  // -----------------------------------------------------------------------------------



  navbar: {
    title: "📚 GlimmerLab's Wiki",
    hideOnScroll: true,
    // logo: {
    //   alt: 'Site Logo',
    //   src: 'img/logo.svg',
    //   srcDark: 'img/logo_dark.svg',
    //   href: 'https://docusaurus.io/',
    //   target: '_self',
    //   width: 32,
    //   height: 32,
    // },
    items: [
      { to: "/projects", label: "👨🏻‍🌾 项目", position: "right" },

    ],
  },


  algolia: {
    apiKey: "59ecd12cf4f3a8b7313b2626c8d0344e",
    appId: "PV5TEG1FGV",
    indexName: "wiki",
  },

  footer: {
    style: "dark",
    copyright: `Copyright © ${new Date().getFullYear()
  } LJoson, Inc.Built with <a href="https://www.docusaurus.cn/" target="_blank" rel="noopener noreferrer">Docusaurus</a>.< br > Powered by < a href = "https://webify.cloudbase.net/" target = "_blank" rel = "noopener noreferrer" > CloudBase Webify</a > `,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        defaultLanguage: "markdown",
        additionalLanguages: ["java", "git","nginx","http"],
      },
      mermaid: {
        theme: {light: 'neutral', dark: 'forest'},
      },
    markdown: {
      mermaid: true,
    },
    themes: ['@docusaurus/theme-mermaid'],
};

module.exports = config;