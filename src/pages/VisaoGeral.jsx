import React, { useMemo } from 'react';
import { Card, Statistic, Typography, Row, Col, Empty, Tooltip } from 'antd';
import {
  TeamOutlined,
  AlertOutlined,
  FunnelPlotOutlined,
  RiseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import {
  calcularRiscoAbsoluto,
  calcularTaxaRiscoProporcional,
  calcularTaxaConversaoFunil,
  calcularTaxaVisualizacaoFunil,
  classificarUnidadesPorRisco,
  formatarNumero,
  formatarPercentual
} from '../utils/metrics';
import { getRiskSemanticTokens } from '../utils/themeTokens';
import UnidadeCard from '../components/UnidadeCard';
import FlatFunnelHealth from '../components/FlatFunnelHealth';
import ExecutiveSummaryStrip from '../components/ExecutiveSummaryStrip';
import '../components/componentsCSS/VisaoGeral.css';

const { Title, Text, Paragraph } = Typography;

export default function VisaoGeral({
  dataset,
  isMobile = false,
  selectedTenantId = 'todos',
  onSelectTenant,
  onNavigateTab,
  themeTokens
}) {
  const tenants = dataset?.tenants || [];
  const clientes = dataset?.clientes || [];

  const unidadesClassificadas = useMemo(
    () => classificarUnidadesPorRisco(tenants),
    [tenants]
  );

  const contasPrioritarias = useMemo(() => {
    const criticasOuRisco = clientes.filter(
      (c) => c.statusSaude === 'Crítico' || c.statusSaude === 'Risco'
    );
    return criticasOuRisco.length > 0 ? criticasOuRisco.slice(0, 5) : clientes.slice(0, 5);
  }, [clientes]);

  const selectedTenant = useMemo(() => {
    if (selectedTenantId === 'todos') return null;
    return tenants.find((t) => t.id === selectedTenantId) || null;
  }, [selectedTenantId, tenants]);

  const estatisticasAgregadas = useMemo(() => {
    if (!tenants.length) return null;

    if (selectedTenant) {
      const riscoAbsoluto = calcularRiscoAbsoluto(selectedTenant.saudeCarteira);
      const taxaRisco = calcularTaxaRiscoProporcional(
        selectedTenant.saudeCarteira,
        selectedTenant.carteiraTotalClientes
      );
      const taxaConversao = calcularTaxaConversaoFunil(selectedTenant.funnel90d);
      const taxaVisualizacao = calcularTaxaVisualizacaoFunil(selectedTenant.funnel90d);
      const hist = selectedTenant.historicoTendencia || [];
      const deltaEngajamento =
        hist.length >= 2
          ? Number((hist[hist.length - 1].engajamento - hist[0].engajamento).toFixed(1))
          : 0;

      return {
        nome: selectedTenant.nome,
        porte: `Porte ${selectedTenant.porte}`,
        carteiraTotal: selectedTenant.carteiraTotalClientes,
        engajamento: selectedTenant.engajamentoMedio,
        deltaEngajamento,
        riscoAbsoluto,
        taxaRisco,
        saude: selectedTenant.saudeCarteira,
        funil: selectedTenant.funnel90d,
        taxaConversao,
        taxaVisualizacao,
        tendencias: hist
      };
    }

    const totalClientes = tenants.reduce((acc, t) => acc + (t.carteiraTotalClientes || 0), 0);
    const mediaEngajamento =
      tenants.reduce((acc, t) => acc + (t.engajamentoMedio || 0), 0) / tenants.length;

    const saudeConsolidada = tenants.reduce(
      (acc, t) => ({
        saudavel: acc.saudavel + (t.saudeCarteira?.saudavel || 0),
        atencao: acc.atencao + (t.saudeCarteira?.atencao || 0),
        risco: acc.risco + (t.saudeCarteira?.risco || 0),
        critico: acc.critico + (t.saudeCarteira?.critico || 0)
      }),
      { saudavel: 0, atencao: 0, risco: 0, critico: 0 }
    );

    const funilConsolidado = tenants.reduce(
      (acc, t) => ({
        gerada: acc.gerada + (t.funnel90d?.gerada || 0),
        vista: acc.vista + (t.funnel90d?.vista || 0),
        sucesso: acc.sucesso + (t.funnel90d?.sucesso || 0)
      }),
      { gerada: 0, vista: 0, sucesso: 0 }
    );

    const riscoAbsoluto = calcularRiscoAbsoluto(saudeConsolidada);
    const taxaRisco = calcularTaxaRiscoProporcional(saudeConsolidada, totalClientes);
    const taxaConversao = calcularTaxaConversaoFunil(funilConsolidado);
    const taxaVisualizacao = calcularTaxaVisualizacaoFunil(funilConsolidado);

    const meses = tenants[0]?.historicoTendencia?.map((h) => h.mes) || [];
    const tendenciasConsolidadas = meses.map((mes, idx) => {
      let somaEng = 0;
      let somaSucesso = 0;
      tenants.forEach((t) => {
        const item = t.historicoTendencia?.[idx];
        if (item) {
          somaEng += item.engajamento;
          somaSucesso += item.sucessoFunil;
        }
      });
      return {
        mes,
        engajamento: Number((somaEng / tenants.length).toFixed(1)),
        sucessoFunil: Number((somaSucesso / tenants.length).toFixed(1))
      };
    });

    const deltaEngajamento =
      tendenciasConsolidadas.length >= 2
        ? Number(
            (
              tendenciasConsolidadas[tendenciasConsolidadas.length - 1].engajamento -
              tendenciasConsolidadas[0].engajamento
            ).toFixed(1)
          )
        : 0;

    return {
      nome: 'Consolidado Nacional',
      porte: '4 Regionais',
      carteiraTotal: totalClientes,
      engajamento: Number(mediaEngajamento.toFixed(1)),
      deltaEngajamento,
      riscoAbsoluto,
      taxaRisco,
      saude: saudeConsolidada,
      funil: funilConsolidado,
      taxaConversao,
      taxaVisualizacao,
      tendencias: tendenciasConsolidadas
    };
  }, [tenants, selectedTenant]);

  if (!tenants.length || !estatisticasAgregadas) {
    return (
      <div className="flat-card">
        <Empty description="Nenhuma unidade regional encontrada no dataset." />
      </div>
    );
  }

  return (
    <div className="visao-geral-container">
      {/* BLOCO 1: FAIXA DE INDICADORES EXECUTIVOS CONSOLIDADOS (ANT DESIGN CARD + STATISTIC + TAG) */}
      <section aria-label="Indicadores executivos consolidados">
        <Row gutter={[16, 16]} className="kpi-ant-row" style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-ant-card">
              <Statistic
                title={<span className="stat-label">Carteira Ativa</span>}
                value={estatisticasAgregadas.carteiraTotal}
                formatter={(val) => formatarNumero(val)}
                suffix={<span className="stat-suffix">contas</span>}
                prefix={<TeamOutlined style={{ color: 'var(--brand-primary)' }} />}
              />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>{estatisticasAgregadas.nome}</Text>
                {selectedTenant ? (
                  <button type="button" className="flat-action-btn" onClick={() => onSelectTenant('todos')}>
                    Ver Consolidado
                  </button>
                ) : (
                  <span className="geo-badge">{estatisticasAgregadas.porte}</span>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-ant-card">
              <Statistic
                title={<span className="stat-label">Exposição a Risco</span>}
                value={estatisticasAgregadas.taxaRisco}
                precision={1}
                suffix="%"
                prefix={
                  <AlertOutlined
                    style={{
                      color:
                        estatisticasAgregadas.taxaRisco >= 20
                          ? 'var(--status-critical-text)'
                          : estatisticasAgregadas.taxaRisco >= 10
                          ? 'var(--status-warning-text)'
                          : 'var(--status-success-text)'
                    }}
                  />
                }
                valueStyle={{
                  color:
                    estatisticasAgregadas.taxaRisco >= 20
                      ? 'var(--status-critical-text)'
                      : estatisticasAgregadas.taxaRisco >= 10
                      ? 'var(--status-warning-text)'
                      : 'var(--status-success-text)'
                }}
              />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {formatarNumero(estatisticasAgregadas.riscoAbsoluto)} contas sob atenção/risco
                </Text>
                <span
                  className={`geo-badge ${
                    estatisticasAgregadas.taxaRisco >= 20
                      ? 'geo-badge--critical'
                      : estatisticasAgregadas.taxaRisco >= 10
                      ? 'geo-badge--warning'
                      : 'geo-badge--success'
                  }`}
                >
                  {estatisticasAgregadas.taxaRisco >= 20 ? '▲ Crítico' : estatisticasAgregadas.taxaRisco >= 10 ? '▲ Atenção' : '● Estável'}
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-ant-card">
              <Statistic
                title={<span className="stat-label">Conversão Funil (90d)</span>}
                value={estatisticasAgregadas.taxaConversao}
                precision={1}
                suffix="%"
                prefix={<FunnelPlotOutlined style={{ color: 'var(--brand-primary)' }} />}
                valueStyle={{ color: 'var(--brand-primary)' }}
              />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Visualização: {formatarPercentual(estatisticasAgregadas.taxaVisualizacao)}
                </Text>
                <span className="geo-badge geo-badge--cyan">
                  {formatarNumero(estatisticasAgregadas.funil.sucesso)}/{formatarNumero(estatisticasAgregadas.funil.gerada)}
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-ant-card">
              <Statistic
                title={<span className="stat-label">Engajamento Médio</span>}
                value={estatisticasAgregadas.engajamento}
                precision={1}
                suffix="%"
                prefix={<RiseOutlined style={{ color: 'var(--brand-cyan)' }} />}
                valueStyle={{ color: 'var(--brand-cyan)' }}
              />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Meta operacional: 75%
                </Text>
                <span
                  className={`geo-delta ${
                    estatisticasAgregadas.deltaEngajamento >= 0
                      ? 'geo-delta--positive'
                      : 'geo-delta--negative'
                  }`}
                >
                  {estatisticasAgregadas.deltaEngajamento >= 0 ? `▲ +${estatisticasAgregadas.deltaEngajamento}` : `▼ ${estatisticasAgregadas.deltaEngajamento}`} pts
                </span>
              </div>
            </Card>
          </Col>
        </Row>
      </section>

      {/* BLOCO 2: CARTÕES REUTILIZÁVEIS DAS QUATRO UNIDADES (ENTREGA OBRIGATÓRIA DA SPRINT 2) */}
      <section className="unidades-grid-section" aria-labelledby="unidades-cards-heading" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Title level={4} id="unidades-cards-heading" style={{ margin: 0, color: 'var(--text-primary)' }}>
              Unidades Regionais
            </Title>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="geo-badge geo-badge--brand">
              4 Unidades Ativas
            </span>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {tenants.map((u) => (
            <Col xs={24} md={12} key={u.id}>
              <UnidadeCard
                unidade={u}
                isSelected={selectedTenantId === u.id}
                onSelect={onSelectTenant}
                themeTokens={themeTokens}
              />
            </Col>
          ))}
        </Row>
      </section>

      {/* BLOCO 2: GRÁFICO DE PIZZA (DONUT FINANCEIRO) DE SAÚDE + FUNIL COMERCIAL */}
      <FlatFunnelHealth estatisticas={estatisticasAgregadas} themeTokens={themeTokens} />

      {/* BLOCO 4: QUADRO DIRETO DE UNIDADES (ATENÇÃO VS. BENCHMARK) + TENDÊNCIA SEMESTRAL */}
      <div className="bottom-summary-grid">
        {/* Esquerda: Resumo Direto das 4 Unidades Regionais */}
        <section className="flat-card" aria-labelledby="units-summary-heading">
          <div className="flat-card-header">
            <div>
              <span className="flat-section-eyebrow">MATRIZ DE UNIDADES</span>
              <h2 id="units-summary-heading" className="flat-card-title">
                Desempenho por Regional
              </h2>
            </div>
            <button
              type="button"
              className="flat-action-btn"
              onClick={() => onNavigateTab('comparativo')}
            >
              Análise Comparativa &rarr;
            </button>
          </div>

          {/* TABELA DESKTOP (>= 768px): Estrutura clássica de 6 colunas */}
          <div className="table-responsive-wrapper desktop-only-table" tabIndex={0} role="region" aria-label="Tabela de Desempenho por Regional">
            <table className="minimal-units-table">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Porte</th>
                  <th className="num-col">Carteira</th>
                  <th className="num-col">Risco Prop.</th>
                  <th className="num-col">Funil</th>
                  <th className="num-col">Status</th>
                </tr>
              </thead>
              <tbody>
                {unidadesClassificadas.map((u) => {
                  const active = selectedTenantId === u.id;
                  const sem = getRiskSemanticTokens(u.taxaRiscoProporcional, themeTokens);
                  return (
                    <tr
                      key={u.id}
                      className={active ? 'row-selected' : ''}
                      tabIndex={0}
                      role="button"
                      aria-pressed={active}
                      onClick={() => onSelectTenant(active ? 'todos' : u.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectTenant(active ? 'todos' : u.id);
                        }
                      }}
                      title="Clique ou pressione Enter para filtrar esta unidade"
                    >
                      <td>
                        <span className="units-table-unit-name">
                          {u.nome.replace('Unidade ', '')}
                        </span>
                      </td>
                      <td>
                        <span className="units-table-unit-porte">{u.porte}</span>
                      </td>
                      <td className="num-col">{formatarNumero(u.carteiraTotalClientes)}</td>
                      <td className="num-col" style={{ fontWeight: 600, color: sem.color }}>
                        {formatarPercentual(u.taxaRiscoProporcional)}
                        <span className="units-table-risk-sub">
                          ({u.riscoAbsolutoCalculado})
                        </span>
                      </td>
                      <td className="num-col">{formatarPercentual(u.taxaConversaoFunil)}</td>
                      <td className="num-col">
                        <span
                          className={`geo-badge ${
                            u.taxaRiscoProporcional >= 20
                              ? 'geo-badge--critical'
                              : u.taxaRiscoProporcional >= 10
                              ? 'geo-badge--warning'
                              : 'geo-badge--success'
                          }`}
                        >
                          {sem.symbol} {sem.level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* VISÃO MOBILE (< 768px): CARDS ESTRUTURADOS COM 100% DAS INFORMAÇÕES VISÍVEIS SEM NENHUM CORTE */}
          <div className="mobile-units-list mobile-only-cards" role="region" aria-label="Desempenho por Regional Mobile">
            {unidadesClassificadas.map((u) => {
              const active = selectedTenantId === u.id;
              const sem = getRiskSemanticTokens(u.taxaRiscoProporcional, themeTokens);
              return (
                <div
                  key={u.id}
                  className={`mobile-unit-card ${active ? 'mobile-unit-card--active' : ''}`}
                  onClick={() => onSelectTenant(active ? 'todos' : u.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTenant(active ? 'todos' : u.id);
                    }
                  }}
                  title="Toque para filtrar esta unidade"
                >
                  <div className="mobile-unit-card-header">
                    <div className="mobile-unit-title-group">
                      <span className="mobile-unit-name">
                        {u.nome.replace('Unidade ', '')}
                      </span>
                      {u.isMatriz && (
                        <span className="mobile-unit-matriz-tag">Matriz</span>
                      )}
                      <span className="mobile-unit-porte-badge">{u.porte}</span>
                    </div>
                    <span
                      className={`geo-badge ${
                        u.taxaRiscoProporcional >= 20
                          ? 'geo-badge--critical'
                          : u.taxaRiscoProporcional >= 10
                          ? 'geo-badge--warning'
                          : 'geo-badge--success'
                      }`}
                    >
                      {sem.symbol} {sem.level}
                    </span>
                  </div>

                  <div className="mobile-unit-metrics-row">
                    <div className="mobile-unit-metric-box">
                      <span className="mobile-unit-metric-label">CARTEIRA</span>
                      <span className="mobile-unit-metric-num">{formatarNumero(u.carteiraTotalClientes)}</span>
                    </div>
                    <div className="mobile-unit-metric-box">
                      <span className="mobile-unit-metric-label">RISCO PROP.</span>
                      <span className="mobile-unit-metric-num" style={{ color: sem.color, fontWeight: 700 }}>
                        {formatarPercentual(u.taxaRiscoProporcional)}
                        <span className="mobile-unit-metric-sub"> ({u.riscoAbsolutoCalculado})</span>
                      </span>
                    </div>
                    <div className="mobile-unit-metric-box">
                      <span className="mobile-unit-metric-label">FUNIL</span>
                      <span className="mobile-unit-metric-num">{formatarPercentual(u.taxaConversaoFunil)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Atalho Rápido para Contas Prioritárias (Jornada de Clientes) */}
          <div className="compact-clients-strip">
            <span className="clients-strip-label">
              Contas Prioritárias:
            </span>
            <div className="clients-strip-pills">
              {contasPrioritarias.map((c) => {
                const isCrit = c.statusSaude === 'Crítico';
                const isRisk = c.statusSaude === 'Risco';
                const dotCls = isCrit
                  ? 'geo-dot--critical'
                  : isRisk
                  ? 'geo-dot--risk'
                  : 'geo-dot--success';
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="compact-client-pill"
                    onClick={() => {
                      onSelectTenant(c.tenantId);
                      onNavigateTab('historico-clientes');
                    }}
                    title={`Ver histórico de ${c.nome}`}
                  >
                    <span className={`geo-dot ${dotCls}`} aria-hidden="true" />
                    <span>{c.nome.split(' ')[0]}</span>
                    <strong>{c.scoreSaudeAtual} pts</strong>
                  </button>
                );
              })}
              <button
                type="button"
                className="flat-action-btn"
                onClick={() => onNavigateTab('historico-clientes')}
              >
                Ver todas ({clientes.length}) &rarr;
              </button>
            </div>
          </div>
        </section>

        {/* Direita: Série Temporal Semestral — Cyan Signal (#00b3dd) + Bright Blue (#2970ff) */}
        <section className="flat-card" aria-labelledby="trend-chart-heading">
          <div className="flat-card-header">
            <div>
              <span className="flat-section-eyebrow">SINAIS DE TENDÊNCIA</span>
              <h2 id="trend-chart-heading" className="flat-card-title">
                Evolução Semestral (6m)
              </h2>
            </div>
            <span className="chart-card-subtitle">
              {selectedTenant ? selectedTenant.nome : 'Média Nacional'}
            </span>
          </div>

          <div className="chart-container-responsive" style={{ height: isMobile ? 220 : 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={estatisticasAgregadas.tendencias}
                margin={{ top: 8, right: isMobile ? 8 : 16, left: isMobile ? -24 : -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke={themeTokens.chartGrid} />
                <XAxis
                  dataKey="mes"
                  stroke={themeTokens.chartAxis}
                  tick={{ fontSize: 11, fill: themeTokens.chartAxis }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  stroke={themeTokens.chartAxis}
                  tick={{ fontSize: 11, fill: themeTokens.chartAxis }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: themeTokens.chartTooltipBg,
                    border: `1px solid ${themeTokens.chartTooltipBorder}`,
                    borderRadius: 8,
                    boxShadow: 'none',
                    color: themeTokens.textPrimary,
                    fontSize: 12
                  }}
                  formatter={(val, name) => [`${val}%`, name]}
                />
                <Legend
                  verticalAlign="top"
                  height={isMobile ? 34 : 28}
                  wrapperStyle={{
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 500,
                    fontFamily: 'var(--font-roboto-mono)',
                    paddingBottom: 4
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="engajamento"
                  name={isMobile ? 'Engajamento' : 'Engajamento (%)'}
                  stroke={themeTokens.brandPrimary}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: themeTokens.brandPrimary, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: themeTokens.brandPrimary, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="sucessoFunil"
                  name={isMobile ? 'Funil' : 'Sucesso Funil (%)'}
                  stroke={themeTokens.brandCyan}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: themeTokens.brandCyan, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: themeTokens.brandCyan, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* BLOCO FINAL: SÍNTESE EXECUTIVA & DIRETRIZES ESTRATÉGICAS (ARTICLES RESUMIDAS) */}
      <ExecutiveSummaryStrip
        unidadesClassificadas={unidadesClassificadas}
        clientes={clientes}
        selectedTenantId={selectedTenantId}
        onSelectTenant={onSelectTenant}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
}
