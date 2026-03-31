import { useEffect, useState } from 'react';

import type { PreferredProvider, Settings } from '@/domain/types';
import { clearCache, clearHistory, getSettings, setSettings } from '@/infrastructure/messaging/client';

export function App(): JSX.Element {
  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState('loading...');

  useEffect(() => {
    async function load(): Promise<void> {
      const response = await getSettings();
      setLocalSettings(response.data.settings);
      setStatus('ready');
    }

    void load();
  }, []);

  async function save(next: Partial<Settings>): Promise<void> {
    const response = await setSettings({ settings: next });
    setLocalSettings(response.data.settings);
    setStatus('saved');
    setTimeout(() => setStatus('ready'), 900);
  }

  if (!settings) {
    return <main>Loading settings...</main>;
  }

  return (
    <main>
      <header>
        <h1>SigLens Settings</h1>
        <p>{status}</p>
      </header>

      <section>
        <label htmlFor="ttl-input">Cache TTL (days)</label>
        <input
          id="ttl-input"
          type="number"
          min={1}
          max={90}
          value={settings.cacheTtlDays}
          onChange={(event) =>
            setLocalSettings((current) =>
              current
                ? {
                    ...current,
                    cacheTtlDays: Number(event.target.value)
                  }
                : current
            )
          }
        />
        <button onClick={() => void save({ cacheTtlDays: Math.max(settings.cacheTtlDays, 1) })}>
          Save TTL
        </button>
      </section>

      <section>
        <label htmlFor="provider-select">Preferred provider</label>
        <select
          id="provider-select"
          value={settings.preferredProvider}
          onChange={(event) =>
            setLocalSettings((current) =>
              current
                ? {
                    ...current,
                    preferredProvider: event.target.value as PreferredProvider
                  }
                : current
            )
          }
        >
          <option value="auto">Auto (Sourcify -&gt; 4byte)</option>
          <option value="sourcify4byte">Sourcify first</option>
          <option value="4byteDirectory">4byte.directory first</option>
        </select>
        <button onClick={() => void save({ preferredProvider: settings.preferredProvider })}>
          Save Provider
        </button>
      </section>

      <section>
        <h2>Maintenance</h2>
        <div className="row">
          <button onClick={() => void clearCache()}>Clear Cache</button>
          <button onClick={() => void clearHistory()}>Clear History</button>
        </div>
      </section>

      <section>
        <h2>Explorer Enhancements</h2>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.enableExplorerEnhancements}
            onChange={(event) =>
              setLocalSettings((current) =>
                current
                  ? {
                      ...current,
                      enableExplorerEnhancements: event.target.checked
                    }
                  : current
              )
            }
          />
          Enable Etherscan/Blockscout selector hover lookup
        </label>
        <button
          onClick={() =>
            void save({ enableExplorerEnhancements: settings.enableExplorerEnhancements })
          }
        >
          Save Explorer Toggle
        </button>
      </section>
    </main>
  );
}
