import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { appConfig } from '@/config/app.config';
import { openAppDatabase } from '@/core/db/client';
import { createLogger } from '@/core/logger/logger';

import { manifestLoaders } from './manifest-loaders';
import { startModules, type AppRuntime } from './start';

export type BootState =
  { status: 'loading' } | { status: 'ready'; runtime: AppRuntime } | { status: 'error'; message: string };

const logger = createLogger(__DEV__ ? appConfig.logger.devMinLevel : appConfig.logger.prodMinLevel);

/** Abre la BD, aplica migraciones, arranca los módulos y oculta el splash. */
export function useBoot(): BootState {
  const [state, setState] = useState<BootState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let runtime: AppRuntime | undefined;
    (async () => {
      try {
        const db = await openAppDatabase(appConfig.db);
        runtime = await startModules({ config: appConfig, db, logger, loaders: manifestLoaders });
        if (!cancelled) setState({ status: 'ready', runtime });
      } catch (error) {
        logger.error('boot failed');
        if (!cancelled) {
          setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
        }
      } finally {
        SplashScreen.setOptions({ fade: true, duration: appConfig.ui.splashFadeMs });
        await SplashScreen.hideAsync();
      }
    })();
    return () => {
      cancelled = true;
      runtime?.dispose();
    };
  }, []);

  return state;
}
