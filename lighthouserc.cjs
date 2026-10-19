/**
 * Lighthouse CI 门禁配置
 * 阈值依据见 personal-site-github-pages-plan.md 第 7 节
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --port 4321',
      url: ['http://localhost:4321/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        // 首屏不应有 JavaScript 负担
        'resource-summary:script:size': ['warn', { maxNumericValue: 20000 }],
        'csp-xss': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
