module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    require: ["step-definitions/*.ts"],
    requireModule: ["ts-node/register"],
    format: ["progress-bar", "html:reports/e2e-report.html"],
    parallel: 1,
  },
};
