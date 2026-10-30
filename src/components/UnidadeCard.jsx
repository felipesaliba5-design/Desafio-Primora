import React from 'react';
import { Card, Statistic, Typography, Row, Col } from 'antd';
import {
  TeamOutlined,
  RiseOutlined,
  FunnelPlotOutlined
} from '@ant-design/icons';
import { formatarNumero, formatarPercentual } from '../utils/metrics';
import './componentsCSS/UnidadeCard.css';

const { Text } = Typography;

/**
 * Componente Reutilizável: Cartão de Unidade Regional (Sprint 2)
 * Apresenta dados de uma unidade fictícia via props utilizando componentes Ant Design (Card, Statistic, Tag, Typography, Row, Col).
 *
 * @param {Object} props
 * @param {Object} props.unidade Dados da unidade regional (nome, porte, carteira, engajamento, funil, saude)
 * @param {boolean} [props.isSelected] Indica se a unidade está selecionada/ativa no filtro global
 * @param {Function} [props.onSelect] Callback disparado ao clicar no cartão
 * @param {Object} [props.themeTokens] Tokens semânticos do tema ativo
 */
export default function UnidadeCard({
  unidade,
  isSelected = false,
  onSelect,
  themeTokens
}) {
  if (!unidade) return null;

  const {
    id,
    nome,
    porte,
    regiao,
    carteiraTotalClientes = 0,
    engajamentoMedio = 0,
    funnel90d = { gerada: 0, vista: 0, sucesso: 0 },
    saudeCarteira = { saudavel: 0, atencao: 0, risco: 0, critico: 0 },
    riscoAbsoluto = 0
  } = unidade;

  // Cálculo da conversão do funil
  const taxaConversao =
    funnel90d.gerada > 0
      ? Number(((funnel90d.sucesso / funnel90d.gerada) * 100).toFixed(1))
      : 0;

  // Taxa de clientes em risco ou crítico
  const contasSobRisco = (saudeCarteira.risco || 0) + (saudeCarteira.critico || 0);
  const taxaRisco =
    carteiraTotalClientes > 0
      ? Number(((contasSobRisco / carteiraTotalClientes) * 100).toFixed(1))
      : 0;

  // Badge de status de risco compatível com DESIGN.md (.geo-badge)
  const getStatusBadgeClass = () => {
    if (taxaRisco >= 20) return 'geo-badge geo-badge--critical';
    if (taxaRisco >= 10) return 'geo-badge geo-badge--warning';
    return 'geo-badge geo-badge--success';
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={`unidade-card ${isSelected ? 'unidade-card--selected' : ''}`}
      hoverable
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={
        <div className="unidade-card-header">
          <div className="unidade-card-title-group">
            <Text strong className="unidade-card-name">
              {nome}
            </Text>
            {regiao && <span className="geo-badge geo-badge--region">{regiao}</span>}
          </div>
          <div className="unidade-card-badges">
            <span className="geo-badge">
              Porte {porte}
            </span>
            <span className={getStatusBadgeClass()}>
              {taxaRisco >= 20 ? (
                <>▲ Risco Alto ({taxaRisco}%)</>
              ) : taxaRisco >= 10 ? (
                <>▲ Atenção ({taxaRisco}%)</>
              ) : (
                <>● Estável ({taxaRisco}%)</>
              )}
            </span>
          </div>
        </div>
      }
    >
      {/* Grade de Estatísticas via Ant Design Statistic */}
      <Row gutter={[16, 16]} className="unidade-card-stats-row">
        <Col xs={24} sm={8}>
          <div className="unidade-stat-box">
            <Statistic
              title={<span className="stat-label">Carteira de Clientes</span>}
              value={carteiraTotalClientes}
              formatter={(val) => formatarNumero(val)}
              suffix={<span className="stat-suffix">contas</span>}
              prefix={<TeamOutlined className="stat-icon" />}
            />
            <Text type="secondary" className="stat-sub">
              {contasSobRisco} sob atenção/risco
            </Text>
          </div>
        </Col>

        <Col xs={12} sm={8}>
          <div className="unidade-stat-box">
            <Statistic
              title={<span className="stat-label">Engajamento Médio</span>}
              value={engajamentoMedio}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined className="stat-icon stat-icon--cyan" />}
              valueStyle={{ color: 'var(--brand-cyan, #00b3dd)' }}
            />
            <Text type="secondary" className="stat-sub">
              Meta: &ge; 75%
            </Text>
          </div>
        </Col>

        <Col xs={12} sm={8}>
          <div className="unidade-stat-box">
            <Statistic
              title={<span className="stat-label">Conversão Funil</span>}
              value={taxaConversao}
              precision={1}
              suffix="%"
              prefix={<FunnelPlotOutlined className="stat-icon stat-icon--blue" />}
              valueStyle={{ color: 'var(--brand-primary, #2970ff)' }}
            />
            <Text type="secondary" className="stat-sub">
              {funnel90d.sucesso} de {funnel90d.gerada} tarefas
            </Text>
          </div>
        </Col>
      </Row>

      {/* Mini-faixa de detalhamento do Funil e Distribuição de Saúde */}
      <div className="unidade-card-footer">
        <div className="unidade-funnel-stages">
          <Text type="secondary" className="stages-title">Funil 90d:</Text>
          <span className="stage-pill">Geradas: <strong>{funnel90d.gerada}</strong></span>
          <span className="stage-arrow">&rarr;</span>
          <span className="stage-pill">Vistas: <strong>{funnel90d.vista}</strong></span>
          <span className="stage-arrow">&rarr;</span>
          <span className="stage-pill stage-pill--highlight">Sucesso: <strong>{funnel90d.sucesso}</strong></span>
        </div>

        <div className="unidade-card-action-hint">
          <Text type="secondary" style={{ fontSize: 11 }}>
            {isSelected ? '● Unidade Ativa' : 'Clique para filtrar'}
          </Text>
        </div>
      </div>
    </Card>
  );
}
