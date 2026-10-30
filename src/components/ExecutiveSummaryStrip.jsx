import React from 'react';
import { formatarNumero, formatarPercentual } from '../utils/metrics';
import './componentsCSS/ExecutiveSummaryStrip.css';

export default function ExecutiveSummaryStrip({
  unidadesClassificadas = [],
  clientes = [],
  selectedTenantId,
  onSelectTenant,
  onNavigateTab
}) {
  // 1. Unidades que merecem atenção agora (Taxa de risco proporcional >= 15%)
  const unidadesCriticas = unidadesClassificadas.filter((u) => u.taxaRiscoProporcional >= 15);

  // 2. Unidades estáveis / Benchmarks (Menor taxa de risco proporcional e maior conversão)
  const unidadesEstaveis = [...unidadesClassificadas]
    .filter((u) => u.taxaRiscoProporcional < 15)
    .sort((a, b) => b.taxaConversaoFunil - a.taxaConversaoFunil);

  // 3. Clientes ordenados por urgência de jornada (menor score primeiro)
  const clientesPrioritarios = [...clientes].sort(
    (a, b) => a.scoreSaudeAtual - b.scoreSaudeAtual
  );

  const getDeltaSemestral = (tenant) => {
    const hist = tenant?.historicoTendencia || [];
    if (hist.length < 2) return 0;
    return Number((hist[hist.length - 1].engajamento - hist[0].engajamento).toFixed(1));
  };

  return (
    <section
      aria-label="Síntese Executiva e Diretrizes Estratégicas"
      className="exec-summary-section"
    >
      {/* Grid com os 3 artigos resumidos */}
      <div className="exec-strip-grid">
        {/* ARTIGO 1: DECISÃO IMEDIATA — Unidades em Atenção Prioritária */}
        <article className="exec-pillar exec-pillar--blue-gleam">
          <div className="exec-pillar-card-top">
            <div className="exec-pillar-top">
              <span className="exec-eyebrow-mono">01 · DECISÃO IMEDIATA</span>
              <span className="exec-pill-tag">{unidadesCriticas.length} EM ALERTA</span>
            </div>
            <h4 className="exec-pillar-question">
              <em>Atenção</em> por risco proporcional
            </h4>
            <p className="exec-pillar-desc">
              Unidades onde a taxa relativa supera o limite seguro ({'>'}15%), exigindo intervenção prioritária.
            </p>
          </div>

          <div className="exec-pillar-rows">
            {unidadesCriticas.slice(0, 2).map((u) => {
              const delta = getDeltaSemestral(u);
              const isSelected = selectedTenantId === u.id;
              return (
                <div
                  key={u.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTenant(isSelected ? 'todos' : u.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTenant(isSelected ? 'todos' : u.id);
                    }
                  }}
                  className={`exec-item-row exec-item-row--on-blue ${
                    isSelected ? 'exec-item-row--selected' : ''
                  }`}
                  title="Clique para filtrar esta unidade"
                >
                  <div className="exec-item-main">
                    <span className="exec-item-title">{u.nome}</span>
                    <span className="exec-item-sub">
                      Porte {u.porte} · {formatarNumero(u.riscoAbsolutoCalculado)}/{formatarNumero(u.carteiraTotalClientes)} em risco
                    </span>
                  </div>
                  <div className="exec-item-metric">
                    <span className="exec-item-metric-val">
                      {formatarPercentual(u.taxaRiscoProporcional)}
                    </span>
                    <span className="exec-item-delta">
                      ▼ {delta > 0 ? `+${delta}` : delta} pts (6m)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="exec-pillar-footer">
            <span>Normalizado por carteira</span>
            <button
              type="button"
              className="exec-action-link"
              onClick={() => onNavigateTab('comparativo')}
            >
              Auditar ranking &rarr;
            </button>
          </div>
        </article>

        {/* ARTIGO 2: RETENÇÃO & JORNADA — Contas Monitoradas */}
        <article className="exec-pillar exec-pillar--deep-blue">
          <div className="exec-pillar-card-top">
            <div className="exec-pillar-top">
              <span className="exec-eyebrow-mono">02 · RETENÇÃO &amp; JORNADA</span>
              <span className="exec-pill-tag">{clientesPrioritarios.length} CONTAS</span>
            </div>
            <h4 className="exec-pillar-question">
              <em>Jornada</em> de contas monitoradas
            </h4>
            <p className="exec-pillar-desc">
              Acompanhamento de contas sensíveis com maior variação negativa no score de saúde B2B.
            </p>
          </div>

          <div className="exec-pillar-rows">
            {clientesPrioritarios.slice(0, 2).map((cli) => {
              const hist = cli.historicoScore || [];
              const deltaScore =
                hist.length >= 2 ? hist[hist.length - 1].score - hist[0].score : 0;

              return (
                <div
                  key={cli.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectTenant(cli.tenantId);
                    onNavigateTab('historico-clientes');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTenant(cli.tenantId);
                      onNavigateTab('historico-clientes');
                    }
                  }}
                  className="exec-item-row exec-item-row--on-blue"
                  title="Abrir linha do tempo deste cliente"
                >
                  <div className="exec-item-main">
                    <span className="exec-item-title">{cli.nome}</span>
                    <span className="exec-item-sub">
                      {cli.unidadeNome.replace('Unidade ', '')} · {cli.ticketMedioMensal}
                    </span>
                  </div>
                  <div className="exec-item-metric">
                    <span className="exec-item-metric-val">
                      {cli.scoreSaudeAtual}/100
                    </span>
                    <span className="exec-item-delta">
                      {deltaScore >= 0 ? `▲ +${deltaScore}` : `▼ ${deltaScore}`} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="exec-pillar-footer">
            <span>Linha do tempo auditável</span>
            <button
              type="button"
              className="exec-action-link"
              onClick={() => onNavigateTab('historico-clientes')}
            >
              Inspecionar contas &rarr;
            </button>
          </div>
        </article>

        {/* ARTIGO 3: BENCHMARK INTERNO — Referência de Conversão */}
        <article className="exec-pillar exec-pillar--silver-inverted">
          <div className="exec-pillar-card-top">
            <div className="exec-pillar-top">
              <span className="exec-eyebrow-mono">03 · BENCHMARK INTERNO</span>
              <span className="exec-pill-tag">OPERAÇÃO ESTÁVEL</span>
            </div>
            <h4 className="exec-pillar-question">
              <em>Referência</em> de conversão e escala
            </h4>
            <p className="exec-pillar-desc">
              Operações de alta eficiência em fechamento de funil comercial e risco sob controle.
            </p>
          </div>

          <div className="exec-pillar-rows">
            {unidadesEstaveis.slice(0, 2).map((u) => {
              const delta = getDeltaSemestral(u);
              const isSelected = selectedTenantId === u.id;
              const taxaSaudavel = Number(
                (((u.saudeCarteira?.saudavel || 0) / u.carteiraTotalClientes) * 100).toFixed(1)
              );
              return (
                <div
                  key={u.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTenant(isSelected ? 'todos' : u.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTenant(isSelected ? 'todos' : u.id);
                    }
                  }}
                  className={`exec-item-row exec-item-row--on-blue ${
                    isSelected ? 'exec-item-row--selected' : ''
                  }`}
                  title="Clique para filtrar esta unidade referência"
                >
                  <div className="exec-item-main">
                    <span className="exec-item-title">{u.nome}</span>
                    <span className="exec-item-sub">
                      {formatarPercentual(taxaSaudavel)} saudável · Risco {formatarPercentual(u.taxaRiscoProporcional)}
                    </span>
                  </div>
                  <div className="exec-item-metric">
                    <span className="exec-item-metric-val">
                      Funil {formatarPercentual(u.taxaConversaoFunil)}
                    </span>
                    <span className="exec-item-delta">
                      ▲ +{delta} pts engaj.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="exec-pillar-footer">
            <span>Benchmark da rede</span>
            {selectedTenantId !== 'todos' ? (
              <button
                type="button"
                className="exec-action-link"
                onClick={() => onSelectTenant('todos')}
              >
                Resetar filtro &rarr;
              </button>
            ) : (
              <button
                type="button"
                className="exec-action-link"
                onClick={() => onSelectTenant('tenant-sul')}
              >
                Filtrar benchmark &rarr;
              </button>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
