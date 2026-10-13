import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import next from "ultracite/oxlint/next";
import nextJsPlugins from "ultracite/oxlint/next/js-plugins";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import vitest from "ultracite/oxlint/vitest";

const jsPlugins = selectJsPlugins(["react-doctor"]);

export default defineConfig({
  extends: [
    core,
    react,
    next,
    vitest,
    nextJsPlugins,
    shadcn,
    antiSlop,
    jsPlugins,
  ],
  ignorePatterns: core.ignorePatterns,
  jsPlugins: [...(jsPlugins.jsPlugins ?? []), ...(shadcn.jsPlugins ?? [])],
  rules: {
    "anti-slop/require-safety-comment-for-type-assertion": "off",
    "eslint/complexity": "off",
    "react-doctor/effect-needs-cleanup": "off",
    "react-doctor/no-giant-component": "off",
    "react-doctor/no-tiny-text": "off",
    "react-doctor/no-transition-all": "off",
    "react-doctor/prefer-useReducer": "off",
    "react/purity": "off",
    "shadcn/no-arbitrary-values": "off",
    "shadcn/no-inline-styles": "off",
    "shadcn/no-raw-colors": "off",
    "shadcn/no-restyle": "off",
  },
  settings: jsPluginSettings,
});
