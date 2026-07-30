import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary global: captura erros de render na árvore de componentes e
 * exibe um fallback amigável em vez de derrubar a aplicação com tela branca.
 *
 * É o provider MAIS EXTERNO do app (ver `providers.tsx`), acima do
 * `ColorModeProvider`/`<Theme>` e do i18n — de propósito, para funcionar mesmo
 * que o próprio design system seja a origem do erro. Por isso a tela é HTML
 * PURO, sem componente do DS.
 *
 * Mas HTML puro não quer dizer estilo solto: as cores, a fonte e a ESCALA
 * tipográfica saem dos MESMOS tokens do tema (`--color-*`, `--font-*`,
 * `--text-*`), que são custom properties globais no `:root` e não dependem de
 * nenhum provider React. Assim a tela de erro fica no mesmo peso e na mesma
 * escala do resto do app — em vez das classes utilitárias herdadas
 * (`text-foreground`, `bg-primary`…) que não existem no bridge do Astryx e
 * caíam no estilo cru do navegador.
 */
const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--spacing-4, 16px)',
  padding: 'var(--spacing-6, 24px)',
  textAlign: 'center',
  backgroundColor: 'var(--color-background-body)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-family-body)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-family-heading)',
  fontSize: 'var(--text-heading-1-size)',
  fontWeight: 'var(--text-heading-1-weight)' as CSSProperties['fontWeight'],
  lineHeight: 'var(--text-heading-1-leading)',
  color: 'var(--color-text-primary)',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: '440px',
  fontSize: 'var(--text-supporting-size)',
  lineHeight: 'var(--text-supporting-leading)',
  color: 'var(--color-text-secondary)',
};

const messageStyle: CSSProperties = {
  margin: 0,
  maxWidth: '440px',
  maxHeight: '160px',
  overflow: 'auto',
  textAlign: 'left',
  padding: 'var(--spacing-3, 12px)',
  borderRadius: 'var(--radius-element, 8px)',
  backgroundColor: 'var(--color-background-muted)',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-family-code)',
  fontSize: 'var(--text-code-size)',
  lineHeight: 'var(--text-code-leading)',
};

const buttonBase: CSSProperties = {
  cursor: 'pointer',
  borderRadius: 'var(--radius-element, 8px)',
  padding: '8px 16px',
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--font-size-xs, 13px)',
  fontWeight: 'var(--font-weight-bold)' as CSSProperties['fontWeight'],
  lineHeight: 1.5,
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBase,
  border: 'var(--ds-border-width-thin, 1px) solid var(--color-border-emphasized)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-primary)',
};

const primaryButtonStyle: CSSProperties = {
  ...buttonBase,
  border: 0,
  backgroundColor: 'var(--color-accent)',
  color: 'var(--color-on-accent)',
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Ponto de integração para um serviço de monitoramento (Sentry, etc.).
    console.error('[ErrorBoundary] erro capturado:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div style={pageStyle}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-2, 8px)',
          }}
        >
          <h1 style={titleStyle}>Algo deu errado</h1>
          <p style={descriptionStyle}>
            Ocorreu um erro inesperado ao renderizar esta tela. Tente novamente ou
            recarregue a página.
          </p>
          {this.state.error?.message && (
            <pre style={messageStyle}>{this.state.error.message}</pre>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-3, 12px)' }}>
          <button type="button" onClick={this.handleReset} style={secondaryButtonStyle}>
            Tentar novamente
          </button>
          <button type="button" onClick={this.handleReload} style={primaryButtonStyle}>
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
}
