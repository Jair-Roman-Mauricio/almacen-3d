import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  turbopack: { root: new URL('../..', import.meta.url).pathname },
};

export default config;
