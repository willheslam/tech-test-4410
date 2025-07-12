import { defineConfig } from "@rsbuild/core"
import { pluginReact } from "@rsbuild/plugin-react"

export default defineConfig({
  plugins: [pluginReact()],
  output: {
    distPath: {
      root: "docs",
    },
    assetPrefix: "/tech-test-4410/",
  },
})
