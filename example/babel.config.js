module.exports = {
  presets: [require.resolve("@docusaurus/core/lib/babel/preset")],
  overrides: [
    {
      test: /\.tsx?$/,
      plugins: [
        [
          "@babel/plugin-transform-typescript",
          {
            onlyRemoveTypeImports: true,
          },
        ],
        ["@babel/plugin-proposal-decorators", { legacy: true }],
        ["@babel/plugin-proposal-class-properties", { loose: false }],
      ],
    },
  ],
};
