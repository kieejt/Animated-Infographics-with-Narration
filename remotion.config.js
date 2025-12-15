import { Config } from '@remotion/cli/config';
import { viteBundler } from '@remotion/bundler-vite';

Config.setBundler(viteBundler());
