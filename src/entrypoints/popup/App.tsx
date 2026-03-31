import { useEffect, useMemo, useState } from 'react';
import { browser } from 'wxt/browser';

import type { HashEventResult, HashFunctionResult, HistoryItem, LookupResult, ParseResult } from '@/domain/types';
import { decodeCalldataWithSignature } from '@/features/calldata-decoder/decode-service';
import { toCsv, toMarkdown, toPlainText } from '@/features/interface-parser/export';
import {
  getHistory,
  hashSignature,
  lookupSelector,
  parseInterface,
  pingBackground
} from '@/infrastructure/messaging/client';
import { copyToClipboard } from '@/shared/clipboard';
import { shortDate } from '@/shared/normalization';
import { calldataSchema } from '@/shared/validation';

type TabId = 'lookup' | 'hash' | 'interface' | 'decode';

function TabButton(props: {
  id: TabId;
  active: TabId;
  onClick: (next: TabId) => void;
  children: string;
}): JSX.Element {
  const { id, active, onClick, children } = props;
  return (
    <button className={`tab-button ${active === id ? 'active' : ''}`} onClick={() => onClick(id)}>
      {children}
    </button>
  );
}

function LookupTab(props: { onHistoryChange: () => void }): JSX.Element {
  const { onHistoryChange } = props;
  const [input, setInput] = useState('0xa9059cbb');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function runLookup(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await lookupSelector({ selector: input });
      setResult(response.data.result);
      onHistoryChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup selector.');
    } finally {
      setLoading(false);
    }
  }

  async function copy(value: string, key: string): Promise<void> {
    const ok = await copyToClipboard(value);
    setCopied(ok ? key : 'copy-failed');
    setTimeout(() => setCopied(null), 1000);
  }

  const hasCollision = (result?.candidates.length ?? 0) > 1;

  return (
    <section className="panel">
      <label htmlFor="selector-input">Selector</label>
      <div className="input-row">
        <input
          id="selector-input"
          value={input}
          placeholder="0xa9059cbb"
          onChange={(event) => setInput(event.target.value)}
        />
        <button onClick={runLookup} disabled={loading}>
          {loading ? 'Looking up...' : 'Lookup'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-card">
          <p className="meta">providers: {result.providersTried.join(' -> ')}</p>
          <p className="meta">
            source: {result.fromCache ? 'cached' : 'live'} | {result.candidates.length} candidate(s)
          </p>

          {hasCollision && <p className="warning">Collision warning: multiple signatures match this selector.</p>}

          {result.candidates.length === 0 && <p>No candidates found.</p>}

          {result.candidates.map((candidate, index) => (
            <div key={`${candidate.textSignature}-${index}`} className="candidate-row">
              <div className="candidate-main">
                <p className="signature">{candidate.textSignature}</p>
                <p className="meta">{candidate.provider}</p>
              </div>
              <button className="copy-one" onClick={() => copy(candidate.textSignature, `sig-${index}`)}>
                Copy Sig
              </button>
            </div>
          ))}
          {copied && <p className="meta">{copied === 'copy-failed' ? 'Clipboard failed' : 'Copied'}</p>}
        </div>
      )}
    </section>
  );
}

function HashTab(props: { onHistoryChange: () => void }): JSX.Element {
  const { onHistoryChange } = props;
  const [mode, setMode] = useState<'function' | 'event'>('function');
  const [input, setInput] = useState('transfer(address,uint256)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HashFunctionResult | HashEventResult | null>(null);

  async function runHash(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await hashSignature({ mode, signature: input });
      setResult(response.data.result);
      onHistoryChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hash signature.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="segmented">
        <button className={mode === 'function' ? 'active' : ''} onClick={() => setMode('function')}>
          Function
        </button>
        <button className={mode === 'event' ? 'active' : ''} onClick={() => setMode('event')}>
          Event
        </button>
      </div>

      <label htmlFor="hash-input">Signature</label>
      <div className="input-row">
        <input
          id="hash-input"
          value={input}
          placeholder={mode === 'function' ? 'transfer(address,uint256)' : 'Transfer(address,address,uint256)'}
          onChange={(event) => setInput(event.target.value)}
        />
        <button onClick={runHash} disabled={loading}>
          {loading ? 'Hashing...' : 'Hash'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-card">
          <p className="signature">{result.canonicalSignature}</p>
          {'selector' in result ? (
            <>
              <p className="hash">selector: {result.selector}</p>
              <p className="hash">full hash: {result.fullHash}</p>
            </>
          ) : (
            <p className="hash">topic0: {result.topicHash}</p>
          )}
        </div>
      )}
    </section>
  );
}

const EXAMPLE_INTERFACE = `interface IERC20 {
  function transfer(address to, uint256 amount) external returns (bool);
  function approve(address spender, uint256 amount) external returns (bool);
  function balanceOf(address owner) external view returns (uint256);
}`;

function InterfaceTab(props: { onHistoryChange: () => void }): JSX.Element {
  const { onHistoryChange } = props;
  const [source, setSource] = useState(EXAMPLE_INTERFACE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const exportData = useMemo(() => {
    if (!result) {
      return null;
    }

    return {
      plain: toPlainText(result.functions),
      csv: toCsv(result.functions),
      markdown: toMarkdown(result.functions)
    };
  }, [result]);

  async function runParse(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await parseInterface({ source });
      setResult(response.data.result);
      onHistoryChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse interface.');
    } finally {
      setLoading(false);
    }
  }

  async function copyExport(value: string): Promise<void> {
    await copyToClipboard(value);
  }

  return (
    <section className="panel">
      <label htmlFor="interface-input">Interface or function declarations</label>
      <textarea
        id="interface-input"
        value={source}
        rows={9}
        onChange={(event) => setSource(event.target.value)}
      />
      <div className="button-row">
        <button onClick={runParse} disabled={loading}>
          {loading ? 'Parsing...' : 'Parse'}
        </button>
        <button onClick={() => setSource(EXAMPLE_INTERFACE)}>Example</button>
        <button onClick={() => setSource('')}>Clear</button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-card">
          <p className="meta">{result.functions.length} parsed function(s)</p>
          {result.errors.map((entry, index) => (
            <p key={`error-${index}`} className="error">
              {entry}
            </p>
          ))}
          {result.warnings.map((entry, index) => (
            <p key={`warning-${index}`} className="warning">
              {entry}
            </p>
          ))}

          {result.functions.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Function</th>
                  <th>Selector</th>
                </tr>
              </thead>
              <tbody>
                {result.functions.map((fn) => (
                  <tr key={fn.signature}>
                    <td>{fn.signature}</td>
                    <td>{fn.selector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {exportData && (
            <div className="button-row">
              <button onClick={() => copyExport(exportData.plain)}>Copy Plain</button>
              <button onClick={() => copyExport(exportData.csv)}>Copy CSV</button>
              <button onClick={() => copyExport(exportData.markdown)}>Copy Markdown</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DecodeTab(): JSX.Element {
  const [calldata, setCalldata] = useState(
    '0xa9059cbb0000000000000000000000001111111111111111111111111111111111111111' +
      '0000000000000000000000000000000000000000000000000000000000000032'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selector, setSelector] = useState<string>('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<ReturnType<typeof decodeCalldataWithSignature> | null>(null);

  function decodeWith(signature: string, normalizedCalldata: string): void {
    const result = decodeCalldataWithSignature(normalizedCalldata, signature);
    setDecoded(result);
    setSelectedSignature(signature);
  }

  async function runDecode(): Promise<void> {
    setLoading(true);
    setError(null);
    setDecoded(null);
    setLookup(null);

    try {
      const normalized = calldataSchema.parse(calldata);
      const extractedSelector = normalized.slice(0, 10);
      setSelector(extractedSelector);

      const response = await lookupSelector({ selector: extractedSelector });
      setLookup(response.data.result);

      const firstCandidate = response.data.result.candidates[0]?.textSignature ?? null;
      if (firstCandidate) {
        decodeWith(firstCandidate, normalized);
      } else {
        setSelectedSignature(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode calldata.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <label htmlFor="decode-input">Calldata (best effort decode)</label>
      <textarea
        id="decode-input"
        rows={7}
        value={calldata}
        onChange={(event) => setCalldata(event.target.value)}
      />
      <div className="button-row">
        <button onClick={runDecode} disabled={loading}>
          {loading ? 'Decoding...' : 'Decode'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {selector && <p className="meta">selector: {selector}</p>}

      {lookup && (
        <div className="result-card">
          <p className="warning">Best effort: results are candidate-based, not ABI-verified.</p>
          <p className="meta">{lookup.candidates.length} candidate signature(s)</p>

          <div className="decode-candidates">
            {lookup.candidates.map((candidate) => (
              <button
                key={candidate.textSignature}
                className={`decode-candidate ${selectedSignature === candidate.textSignature ? 'active' : ''}`}
                onClick={() => {
                  const normalized = calldataSchema.parse(calldata);
                  decodeWith(candidate.textSignature, normalized);
                }}
              >
                {candidate.textSignature}
              </button>
            ))}
          </div>
        </div>
      )}

      {decoded && (
        <div className="result-card">
          <p className="meta">decoded using: {selectedSignature}</p>
          {decoded.values.length === 0 && <p className="meta">No parameters in selected signature.</p>}
          {decoded.values.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {decoded.values.map((value) => (
                  <tr key={`${value.index}-${value.type}`}>
                    <td>{value.index}</td>
                    <td>{value.type}</td>
                    <td className="signature">{value.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}

export function App(): JSX.Element {
  const [tab, setTab] = useState<TabId>('lookup');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [status, setStatus] = useState('initializing...');

  async function refreshHistory(): Promise<void> {
    const response = await getHistory();
    setHistory(response.data.items.slice(0, 6));
  }

  useEffect(() => {
    let mounted = true;

    async function initOnce(): Promise<boolean> {
      try {
        await pingBackground();
        await refreshHistory();
        return true;
      } catch {
        return false;
      }
    }

    async function init(): Promise<void> {
      const firstTry = await initOnce();
      if (firstTry) {
        if (mounted) {
          setStatus('ready');
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      const secondTry = await initOnce();
      if (mounted) {
        setStatus(secondTry ? 'ready' : 'service worker offline');
      }
    }

    void init();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main>
      <div className="top-shell">
        <header>
          <div>
            <h1>SigLens</h1>
            <p>EVM selector and signature utility</p>
          </div>
          <button className="ghost" onClick={() => browser.runtime.openOptionsPage()}>
            Settings
          </button>
        </header>

        <nav className="tabs">
          <TabButton id="lookup" active={tab} onClick={setTab}>
            Lookup
          </TabButton>
          <TabButton id="hash" active={tab} onClick={setTab}>
            Hash
          </TabButton>
          <TabButton id="decode" active={tab} onClick={setTab}>
            Decode
          </TabButton>
          <TabButton id="interface" active={tab} onClick={setTab}>
            Interface
          </TabButton>
        </nav>
      </div>

      <div className="content-shell">
        {tab === 'lookup' && <LookupTab onHistoryChange={() => void refreshHistory()} />}
        {tab === 'hash' && <HashTab onHistoryChange={() => void refreshHistory()} />}
        {tab === 'decode' && <DecodeTab />}
        {tab === 'interface' && <InterfaceTab onHistoryChange={() => void refreshHistory()} />}

        <section className="history">
          <div className="history-head">
            <h2>Recent</h2>
            <span>{status}</span>
          </div>
          {history.length === 0 && <p className="meta">No recent items</p>}
          {history.map((item) => (
            <div key={item.id} className="history-row">
              <p>{item.summary}</p>
              <span>{shortDate(item.createdAt)}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
