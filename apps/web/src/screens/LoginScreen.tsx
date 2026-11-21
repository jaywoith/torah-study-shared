import { useState } from 'react';
import { ApiRequestError, api } from '../api';
import { useText } from '../strings';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { strings } = useText();
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="login"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await api.login(passphrase);
          onLogin();
        } catch (err) {
          const status = err instanceof ApiRequestError ? err.status : 0;
          setError(
            status === 401 ? strings.auth.invalid : status === 429 ? strings.auth.tooMany : strings.common.errorGeneric
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <span className="brand">{strings.common.appName}</span>
      <h1>{strings.auth.title}</h1>
      <label className="stack-field">
        <span>{strings.auth.passphrase}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          autoFocus
          required
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn primary block" disabled={busy}>
        {strings.auth.submit}
      </button>
    </form>
  );
}
