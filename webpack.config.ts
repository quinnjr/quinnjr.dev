import { join } from 'path';
import glob from 'glob';
import {
  default as webpack,
  Configuration,
  DefinePlugin,
  IgnorePlugin,
  ProvidePlugin
} from 'webpack';
import {
  CustomWebpackBrowserSchema,
  TargetOptions
} from '@angular-builders/custom-webpack';
import SriPlugin from 'webpack-subresource-integrity';
// @ts-ignore
import ImageminMinimizerPlugin from 'image-minimizer-webpack-plugin';
import DotenvPlugin from 'dotenv-webpack';
import nodeExternals from 'webpack-node-externals';
import TerserPlugin from 'terser-webpack-plugin';
import * as pkg from './package.json';

const PurgeCSSPlugin = require('purgecss-webpack-plugin');

export default (
  config: Configuration,
  _options: CustomWebpackBrowserSchema,
  targetOptions: TargetOptions
) => {
  /* eslint @typescript-eslint/no-non-null-assertion: off */
  config.output!.crossOriginLoading = 'anonymous';

  config.plugins?.push(
    // new DotenvPlugin({
    //   safe: true,
    //   allowEmptyValues: true,
    //   systemvars: true
    // }),
    new DefinePlugin({
      /* eslint @typescript-eslint/naming-convention: off */
      APP_NAME: pkg.name,
      APP_VERSION: pkg.version
    })
  );

  if (targetOptions.target === 'browser') {
    config.module?.rules?.push(
      {
        test: /\.(eot|svg|ttf|woff2?)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '/assets/webfonts/[name].[ext]'
          }
        }
      },
      {
        test: /\.wasm$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '/wasm/[name].[ext]'
          }
        },
        type: 'javascript/auto'
      }
    );

    if (config.mode === 'production') {
      config.plugins?.push(
        // @ts-ignore
        new SriPlugin({
          hashFuncNames: ['sha256'],
          enabled: (process.env['ENV'] || 'development') === 'production'
        }),
        new ImageminMinimizerPlugin(),
        new PurgeCSSPlugin({
          paths: glob.sync(`${join(__dirname, 'src')}**/*.html`, {
            nodir: true
          })
        })
      );
    }
  }

  if (targetOptions.target === 'server') {
    config.resolve?.extensions?.push('.mjs', '.graphql', '.gql');

    config.module?.rules?.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto'
    });

    config.externalsPresets = { node: true };

    (config.externals as Array<any>).push(
      nodeExternals({
        allowlist: [/^(?!(livereload|concurrently|fsevents)).*/]
      })
    );

    config.optimization = {
      minimize: config.mode === 'production',
      minimizer: [
        (compiler) => {
          new TerserPlugin({
            terserOptions: {
              mangle: false,
              ecma: 2017,
              keep_classnames: true,
              toplevel: true,
              ie8: false
            }
          }).apply(compiler);
        }
      ],
      moduleIds: config.mode === 'production' ? 'deterministic' : 'named',
      chunkIds: config.mode === 'production' ? 'deterministic' : 'named',
      removeAvailableModules: true,
      mergeDuplicateChunks: true,
      mangleExports: false
    };

    config.plugins?.push(
      new IgnorePlugin({
        checkResource: (resource: string) => {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/microservices/microservices-module',
            '@nestjs/websockets/socket-module',
            'cache-manager',
            'class-validator',
            'class-transform',
            'apollo-server-fastify',
            'bufferutil',
            'utf-8-validate',
            'graphql-ws',
            'ws',
            'ts-morph'
          ];

          if (!lazyImports.includes(resource)) {
            return false;
          }

          try {
            require.resolve(resource);
          } catch (_err: any) {
            return true;
          }
          return false;
        }
      }),
      new ProvidePlugin({
        Promise: 'bluebird'
      })
    );
  }

  return config;
};
