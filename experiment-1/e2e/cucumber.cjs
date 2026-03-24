module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    require: ["step-definitions/*.ts", "support/*.ts"],
    requireModule: ["ts-node/register"],
    format: ["progress-bar", "progress:reports/report.txt"],
    parallel: 1,
  },
};
