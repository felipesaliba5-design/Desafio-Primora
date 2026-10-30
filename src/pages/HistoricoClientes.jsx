import React, { useState, useMemo, useEffect } from 'react';
import {
  Timeline,
  Typography,
  Row,
  Col,
  Statistic,
  Radio,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Popconfirm,
  Tooltip,
  Divider,
  message
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
  ShoppingCartOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import dayjs from 'dayjs';
import { formatarPercentual } from '../utils/metrics';
import { getRiskSemanticTokens } from '../utils/themeTokens';
import '../components/componentsCSS/HistoricoClientes.css';

function extrairNumeroTicket(ticketStr) {
  if (typeof ticketStr === 'number') return ticketStr;
  if (!ticketStr) return 35000;
  const limpo = String(ticketStr).replace(/[^\d]/g, '');
  const num = parseInt(limpo, 10);
  return isNaN(num) ? 35000 : Math.round(num / 100);
}

export default function HistoricoClientes({
  dataset,
  isMobile = false,
  selectedTenantId = 'todos',
  onSelectTenant,
  themeTokens,
  onAddCliente,
  onUpdateCliente,
  onDeleteCliente
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const todosClientes = dataset?.clientes || [];
  const tenants = dataset?.tenants || [];

  const clientesVisiveis = useMemo(() => {
    if (selectedTenantId === 'todos') return todosClientes;
    return todosClientes.filter((c) => c.tenantId === selectedTenantId);
  }, [todosClientes, selectedTenantId]);

  const [selectedClienteId, setSelectedClienteId] = useState(todosClientes[0]?.id || null);
  const [filtroCategoriaEvento, setFiltroCategoriaEvento] = useState('todos');

  useEffect(() => {
    if (clientesVisiveis.length > 0) {
      const exists = clientesVisiveis.some((c) => c.id === selectedClienteId);
      if (!exists) {
        setSelectedClienteId(clientesVisiveis[0].id);
      }
    }
  }, [clientesVisiveis, selectedClienteId]);

  const clienteSelecionado = useMemo(() => {
    return (
      clientesVisiveis.find((c) => c.id === selectedClienteId) ||
      todosClientes.find((c) => c.id === selectedClienteId) ||
      null
    );
  }, [clientesVisiveis, todosClientes, selectedClienteId]);

  const eventosOrdenados = useMemo(() => {
    if (!clienteSelecionado?.eventos) return [];
    let lista = [...clienteSelecionado.eventos];
    lista.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    if (filtroCategoriaEvento !== 'todos') {
      lista = lista.filter((e) => e.categoria === filtroCategoriaEvento);
    }
    return lista;
  }, [clienteSelecionado, filtroCategoriaEvento]);

  const getStatusTokens = (status) => getRiskSemanticTokens(status, themeTokens);

  const handleTabKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % todosClientes.length;
      const nextClient = todosClientes[nextIndex];
      setSelectedClienteId(nextClient.id);
      if (selectedTenantId !== 'todos' && selectedTenantId !== nextClient.tenantId) {
        onSelectTenant(nextClient.tenantId);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + todosClientes.length) % todosClientes.length;
      const prevClient = todosClientes[prevIndex];
      setSelectedClienteId(prevClient.id);
      if (selectedTenantId !== 'todos' && selectedTenantId !== prevClient.tenantId) {
        onSelectTenant(prevClient.tenantId);
      }
    }
  };

  const getEventoCategoryMeta = (categoria) => {
    switch (categoria) {
      case 'sucesso':
        return {
          label: 'SUCESSO',
          badgeClass: 'geo-badge--success',
          color: themeTokens.statusSuccess,
          symbol: '●'
        };
      case 'critico':
        return {
          label: 'CRÍTICO',
          badgeClass: 'geo-badge--critical',
          color: themeTokens.statusCritical,
          symbol: '▲'
        };
      case 'alerta':
        return {
          label: 'ALERTA',
          badgeClass: 'geo-badge--warning',
          color: themeTokens.statusWarning,
          symbol: '▲'
        };
      case 'operacional':
        return {
          label: 'OPERACIONAL',
          badgeClass: 'geo-badge--cyan',
          color: themeTokens.brandCyan,
          symbol: '●'
        };
      default:
        return {
          label: categoria.toUpperCase(),
          badgeClass: 'geo-badge--brand',
          color: themeTokens.brandPrimary,
          symbol: '●'
        };
    }
  };

  const getTimelineItemProps = (evt) => {
    const meta = getEventoCategoryMeta(evt.categoria);
    const dataFormatada = dayjs(evt.data).format('DD/MM/YYYY HH:mm');

    let color = 'blue';
    let dotIcon = <InfoCircleOutlined style={{ fontSize: 15 }} />;
    if (evt.categoria === 'sucesso') {
      color = 'green';
      dotIcon = <CheckCircleOutlined style={{ fontSize: 15 }} />;
    } else if (evt.categoria === 'critico') {
      color = 'red';
      dotIcon = <AlertOutlined style={{ fontSize: 15 }} />;
    } else if (evt.categoria === 'alerta') {
      color = 'orange';
      dotIcon = <ExclamationCircleOutlined style={{ fontSize: 15 }} />;
    } else if (evt.categoria === 'comercial') {
      color = 'cyan';
      dotIcon = <ShoppingCartOutlined style={{ fontSize: 15 }} />;
    }

    return {
      key: evt.id,
      color,
      dot: dotIcon,
      children: (
        <div className="antd-timeline-card">
          <div className="antd-timeline-card-header">
            <Typography.Text strong className="antd-timeline-title">
              {evt.tipo}
            </Typography.Text>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className={`geo-badge ${meta.badgeClass}`}>
                {meta.symbol} {meta.label}
              </span>
              <span className="antd-timeline-date">
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {dataFormatada}
              </span>
            </div>
          </div>
          <Typography.Paragraph type="secondary" className="antd-timeline-desc">
            {evt.descricao}
          </Typography.Paragraph>
        </div>
      )
    };
  };

  // Composição estatística dos eventos da conta para o Donut
  const mixEventosDonut = useMemo(() => {
    const evts = clienteSelecionado?.eventos || [];
    const total = evts.length;
    if (!total) return [];

    const grupos = {
      positivos: {
        name: 'Sucesso & Operação',
        value: 0,
        color: themeTokens.statusSuccess
      },
      comerciais: {
        name: 'Comercial & Suporte',
        value: 0,
        color: themeTokens.brandPrimary
      },
      alertas: {
        name: 'Alertas',
        value: 0,
        color: themeTokens.statusWarning
      },
      criticos: {
        name: 'Eventos Críticos',
        value: 0,
        color: themeTokens.statusCritical
      }
    };

    evts.forEach((e) => {
      if (e.categoria === 'sucesso' || e.categoria === 'operacional') {
        grupos.positivos.value += 1;
      } else if (e.categoria === 'alerta') {
        grupos.alertas.value += 1;
      } else if (e.categoria === 'critico') {
        grupos.criticos.value += 1;
      } else {
        grupos.comerciais.value += 1;
      }
    });

    return Object.values(grupos)
      .filter((g) => g.value > 0)
      .map((g) => ({
        ...g,
        pct: Number(((g.value / total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.value - a.value);
  }, [clienteSelecionado, themeTokens]);

  const handleSalvarNovoCliente = (values) => {
    const tenantObj = tenants.find((t) => t.id === values.tenantId);
    const score = Number(values.scoreSaudeAtual || 80);
    let status = values.statusSaude;
    if (!status) {
      if (score < 40) status = 'Crítico';
      else if (score < 60) status = 'Risco';
      else if (score < 75) status = 'Atenção';
      else status = 'Saudável';
    }

    const novoId = `CLI-${Date.now().toString().slice(-4)}`;
    const novo = {
      id: novoId,
      nome: values.nome,
      tenantId: values.tenantId,
      unidadeNome: tenantObj ? tenantObj.nome : 'Unidade',
      segmento: values.segmento || 'Supermercado Regional',
      statusSaude: status,
      scoreSaudeAtual: score,
      tempoContratoMeses: Number(values.tempoContratoMeses || 12),
      ticketMedioMensal: `R$ ${Number(values.ticketMedio || 35000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      isNovo: true,
      historicoScore: [
        { periodo: 'Mai/2026', score: Math.max(10, score - 8) },
        { periodo: 'Jun/2026', score: Math.max(10, score - 6) },
        { periodo: 'Jul/2026', score: Math.max(10, score - 4) },
        { periodo: 'Ago/2026', score: Math.max(10, score - 2) },
        { periodo: 'Set/2026', score: Math.max(10, score - 1) },
        { periodo: 'Out/2026', score }
      ],
      eventos: [
        {
          id: `EVT-${Date.now().toString().slice(-3)}`,
          data: new Date().toISOString(),
          tipo: 'Cadastro de Conta',
          categoria: 'comercial',
          descricao: `Conta ${values.nome} cadastrada no ecossistema comercial sob gestão da regional ${tenantObj ? tenantObj.nome : ''}.`
        }
      ]
    };

    if (onAddCliente) {
      onAddCliente(novo);
    }
    setSelectedClienteId(novoId);
    setModalOpen(false);
    form.resetFields();
    message.success(`Cliente "${novo.nome}" cadastrado com sucesso!`);
  };

  const handleAbrirEdicao = () => {
    if (!clienteSelecionado) return;
    editForm.setFieldsValue({
      nome: clienteSelecionado.nome,
      tenantId: clienteSelecionado.tenantId,
      segmento: clienteSelecionado.segmento,
      tempoContratoMeses: clienteSelecionado.tempoContratoMeses,
      ticketMedio: extrairNumeroTicket(clienteSelecionado.ticketMedioMensal),
      scoreSaudeAtual: clienteSelecionado.scoreSaudeAtual,
      statusSaude: clienteSelecionado.statusSaude
    });
    setEditModalOpen(true);
  };

  const handleSalvarEdicaoCliente = (values) => {
    if (!clienteSelecionado) return;
    const tenantObj = tenants.find((t) => t.id === values.tenantId);
    const score = Number(values.scoreSaudeAtual ?? clienteSelecionado.scoreSaudeAtual);
    let status = values.statusSaude;
    if (!status) {
      if (score < 40) status = 'Crítico';
      else if (score < 60) status = 'Risco';
      else if (score < 75) status = 'Atenção';
      else status = 'Saudável';
    }

    const hist = [...(clienteSelecionado.historicoScore || [])];
    if (hist.length > 0) {
      hist[hist.length - 1] = { ...hist[hist.length - 1], score };
    }

    const novosEventos = [
      ...(clienteSelecionado.eventos || []),
      {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        data: new Date().toISOString(),
        tipo: 'Atualização Cadastral',
        categoria: 'comercial',
        descricao: `Dados cadastrais da conta atualizados: Segmento "${values.segmento}", Regional "${tenantObj?.nome || clienteSelecionado.unidadeNome}" e Score ${score} pts.`
      }
    ];

    const clienteAtualizado = {
      ...clienteSelecionado,
      nome: values.nome,
      tenantId: values.tenantId,
      unidadeNome: tenantObj ? tenantObj.nome : clienteSelecionado.unidadeNome,
      segmento: values.segmento,
      statusSaude: status,
      scoreSaudeAtual: score,
      tempoContratoMeses: Number(values.tempoContratoMeses || clienteSelecionado.tempoContratoMeses),
      ticketMedioMensal: `R$ ${Number(values.ticketMedio || 35000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      historicoScore: hist,
      eventos: novosEventos
    };

    if (onUpdateCliente) {
      onUpdateCliente(clienteAtualizado);
    }
    setEditModalOpen(false);
    message.success(`Conta "${values.nome}" atualizada com sucesso!`);
  };

  const handleExcluirCliente = () => {
    if (!clienteSelecionado) return;
    const idParaExcluir = clienteSelecionado.id;
    const nomeExcluido = clienteSelecionado.nome;

    if (onDeleteCliente) {
      onDeleteCliente(idParaExcluir);
    }

    const restantes = todosClientes.filter((c) => c.id !== idParaExcluir);
    if (restantes.length > 0) {
      setSelectedClienteId(restantes[0].id);
    } else {
      setSelectedClienteId(null);
    }

    message.success(`Conta "${nomeExcluido}" excluída da carteira.`);
  };

  if (!todosClientes.length) {
    return (
      <div className="clientes-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <span className="flat-section-eyebrow">AUDITORIA DE CONTAS B2B</span>
            <h2 className="flat-card-title" style={{ margin: 0 }}>Jornada e Monitoramento de Clientes</h2>
          </div>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setModalOpen(true)}
          >
            + Adicionar Cliente
          </Button>
        </div>

        <div className="flat-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Empty
            description={
              <div>
                <Typography.Title level={5} style={{ color: 'var(--text-primary)', margin: '8px 0 4px' }}>
                  Nenhum cliente cadastrado no momento
                </Typography.Title>
                <Typography.Text type="secondary">
                  Todas as contas foram removidas ou o dataset está vazio. Cadastre uma nova conta para iniciar o monitoramento.
                </Typography.Text>
              </div>
            }
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            size="large"
            onClick={() => setModalOpen(true)}
            style={{ marginTop: 20 }}
          >
            Cadastrar Novo Cliente
          </Button>
        </div>

        {/* Modal para Adicionar Novo Cliente */}
        <Modal
          title="Cadastrar Nova Conta B2B à Carteira"
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText="Salvar Conta"
          cancelText="Cancelar"
          destroyOnHidden
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSalvarNovoCliente}
            initialValues={{
              tenantId: tenants[0]?.id || 'tenant-sudeste',
              segmento: 'Supermercado Regional',
              scoreSaudeAtual: 85,
              tempoContratoMeses: 12,
              ticketMedio: 35000
            }}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="nome"
              label="Razão Social / Nome Fantasia do Cliente"
              rules={[{ required: true, message: 'Por favor, informe o nome do cliente.' }]}
            >
              <Input placeholder="Ex: Hipermercados Brasil S/A" />
            </Form.Item>

            <Form.Item
              name="tenantId"
              label="Regional / Unidade Operacional"
              rules={[{ required: true }]}
            >
              <Select
                options={tenants.map((t) => ({
                  value: t.id,
                  label: `${t.nome} (Porte ${t.porte})`
                }))}
              />
            </Form.Item>

            <Form.Item
              name="segmento"
              label="Segmento de Mercado"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'Supermercado Regional', label: 'Supermercado Regional' },
                  { value: 'Atacarejo & Distribuição', label: 'Atacarejo & Distribuição' },
                  { value: 'Rede de Frigoríficos', label: 'Rede de Frigoríficos' },
                  { value: 'Conveniência & Varejo', label: 'Conveniência & Varejo' },
                  { value: 'Operador Logístico B2B', label: 'Operador Logístico B2B' }
                ]}
              />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item
                name="ticketMedio"
                label="Ticket Médio Mensal (R$)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(value) => value.replace(/R\$\s?|(\.*)/g, '')}
                />
              </Form.Item>

              <Form.Item
                name="tempoContratoMeses"
                label="Tempo de Contrato (Meses)"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={120} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item
              name="scoreSaudeAtual"
              label="Score de Saúde Inicial (0 a 100)"
              extra="Scores < 40 = Crítico, 40-59 = Risco, 60-74 = Atenção, >= 75 = Saudável."
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  if (selectedTenantId !== 'todos' && clientesVisiveis.length === 0) {
    const tenantAtual = tenants.find((t) => t.id === selectedTenantId);
    return (
      <div className="flat-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
        <Empty
          description={
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              A unidade <strong>{tenantAtual?.nome || selectedTenantId}</strong> não possui contas
              individuais na amostra atual.
            </span>
          }
        />
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className="flat-action-btn"
            onClick={() => onSelectTenant('todos')}
          >
            Exibir todas as contas monitoradas
          </button>
        </div>
      </div>
    );
  }

  const statusMeta = getStatusTokens(clienteSelecionado?.statusSaude);
  const histScore = clienteSelecionado?.historicoScore || [];
  const deltaScore =
    histScore.length >= 2
      ? histScore[histScore.length - 1].score - histScore[0].score
      : 0;

  return (
    <div className="clientes-container">
      {/* Barra de Ações Superior do Módulo de Clientes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <span className="flat-section-eyebrow">AUDITORIA DE CONTAS B2B</span>
          <h2 className="flat-card-title" style={{ margin: 0 }}>Jornada e Monitoramento de Clientes</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setModalOpen(true)}
          >
            + Adicionar Cliente
          </Button>
        </div>
      </div>

      {/* 1. SELETOR DIRETO DE CONTAS MONITORADAS */}
      <div className="client-tabs-bar" role="tablist" aria-label="Contas monitoradas">
        {todosClientes.map((c, idx) => {
          const active = c.id === clienteSelecionado?.id;
          const st = getStatusTokens(c.statusSaude);
          const h = c.historicoScore || [];
          const d = h.length >= 2 ? h[h.length - 1].score - h[0].score : 0;

          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => {
                setSelectedClienteId(c.id);
                if (selectedTenantId !== 'todos' && selectedTenantId !== c.tenantId) {
                  onSelectTenant(c.tenantId);
                }
              }}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={`client-tab-item ${active ? 'client-tab-item--active' : ''}`}
            >
              <div>
                <div className="client-tab-title-row">
                  <span className={`geo-dot ${st.dotClass}`} aria-hidden="true" />
                  <span>{c.nome}</span>
                  {(c.isNovo || !['CLI-001', 'CLI-002', 'CLI-003'].includes(c.id)) && (
                    <span className="badge-novo-cliente" style={{ fontSize: 9, padding: '1px 6px' }}>✨ Novo</span>
                  )}
                </div>
                <span className="client-tab-subtitle">
                  {c.unidadeNome.replace('Unidade ', '')} · {c.segmento}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  className="client-tab-score"
                  style={{ color: st.color }}
                >
                  {c.scoreSaudeAtual}/100
                </span>
                <span
                  className={`geo-delta ${
                    d >= 0 ? 'geo-delta--positive' : 'geo-delta--negative'
                  }`}
                >
                  {d >= 0 ? `▲ +${d}` : `▼ ${d}`} pts
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {clienteSelecionado && (
        <>
          {/* BARRA DE AÇÕES CRUD DO CLIENTE SELECIONADO (READ / UPDATE / DELETE) */}
          <div className="client-crud-bar">
            <div className="client-crud-status">
              <span className="geo-badge geo-badge--brand">
                <EyeOutlined style={{ marginRight: 4 }} /> Modo Consulta
              </span>
              <Typography.Text strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>
                {clienteSelecionado.nome}
              </Typography.Text>
              <span
                className={`geo-badge ${
                  clienteSelecionado.statusSaude === 'Saudável'
                    ? 'geo-badge--success'
                    : clienteSelecionado.statusSaude === 'Atenção'
                    ? 'geo-badge--warning'
                    : 'geo-badge--critical'
                }`}
              >
                {clienteSelecionado.statusSaude} ({clienteSelecionado.scoreSaudeAtual} pts)
              </span>
            </div>
          </div>

          {/* 2. FAIXA CONTÍNUA DE DADOS CONTRATUAIS E FINANCEIROS DA CONTA */}
          <section className="account-ledger-strip" aria-label="Indicadores contratuais da conta">
            <div className="account-ledger-cell">
              <span className="account-ledger-label">Razão Social · Código</span>
              <span className="account-ledger-val">
                {clienteSelecionado.nome}{' '}
                <span className="account-code-sub">
                  ({clienteSelecionado.id})
                </span>
              </span>
            </div>

            <div className="account-ledger-cell">
              <span className="account-ledger-label">Unidade Vinculada</span>
              <span className="account-ledger-val">
                {clienteSelecionado.unidadeNome.replace('Unidade ', '')}
              </span>
            </div>

            <div className="account-ledger-cell">
              <span className="account-ledger-label">Ticket Médio Mensal</span>
              <span className="account-ledger-val" style={{ color: 'var(--brand-primary)' }}>
                {clienteSelecionado.ticketMedioMensal}
              </span>
            </div>

            <div className="account-ledger-cell">
              <span className="account-ledger-label">Tempo de Contrato</span>
              <span className="account-ledger-val">
                {clienteSelecionado.tempoContratoMeses} meses
              </span>
            </div>

            <div className="account-ledger-cell">
              <span className="account-ledger-label">Score de Saúde</span>
              <span className="account-ledger-val" style={{ color: statusMeta.color }}>
                {statusMeta.symbol} {clienteSelecionado.scoreSaudeAtual} / 100 ({clienteSelecionado.statusSaude})
              </span>
            </div>

            <div className="account-ledger-cell">
              <span className="account-ledger-label">Variação (6m)</span>
              <span
                className="account-ledger-val"
                style={{
                  color: deltaScore >= 0 ? 'var(--status-success-text)' : 'var(--status-critical-text)'
                }}
              >
                {deltaScore >= 0 ? `▲ +${deltaScore} pts` : `▼ ${deltaScore} pts`}
              </span>
            </div>
          </section>

          {/* 3. WORKSPACE ANALÍTICO EM 2 COLUNAS: GRÁFICOS À ESQUERDA + TIMELINE À DIREITA */}
          <div className="client-Workspace-grid">
            <div className="client-left-stack">
              {/* Evolução do Score */}
              <section className="flat-card" aria-labelledby="score-trend-heading">
                <div className="flat-card-header">
                  <h2 id="score-trend-heading" className="flat-card-title">
                    Evolução do Score de Saúde (6m)
                  </h2>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Meta Saudável: &ge; 70 pts
                  </span>
                </div>

                <div style={{ height: isMobile ? 190 : 210, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={histScore}
                      margin={{ top: 8, right: 16, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke={themeTokens.chartGrid} />
                      <XAxis
                        dataKey="periodo"
                        stroke={themeTokens.chartAxis}
                        tick={{ fontSize: 11, fill: themeTokens.chartAxis }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke={themeTokens.chartAxis}
                        tick={{ fontSize: 11, fill: themeTokens.chartAxis }}
                      />
                      <ReferenceLine
                        y={70}
                        stroke={themeTokens.statusSuccess}
                        strokeDasharray="3 3"
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: themeTokens.chartTooltipBg,
                          border: `1px solid ${themeTokens.chartTooltipBorder}`,
                          borderRadius: 4,
                          boxShadow: 'none',
                          color: themeTokens.textPrimary,
                          fontSize: 12
                        }}
                        formatter={(val) => [`${val} pts`, 'Score']}
                      />
                      <Line
                        type="linear"
                        dataKey="score"
                        name="Score"
                        stroke={statusMeta.color}
                        strokeWidth={2}
                        dot={{ r: 4, fill: statusMeta.color, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: statusMeta.color, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Donut de Perfil de Eventos da Conta */}
              <section className="flat-card" aria-labelledby="events-mix-heading">
                <div className="flat-card-header">
                  <h2 id="events-mix-heading" className="flat-card-title">
                    Perfil de Interações da Conta
                  </h2>
                  <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {clienteSelecionado.eventos?.length || 0} eventos
                  </span>
                </div>

                <div className="regional-donut-layout">
                  <div className="regional-donut-box" style={{ width: 150, height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mixEventosDonut}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={64}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={1}
                          stroke={themeTokens.bgSurface}
                          strokeWidth={2}
                          isAnimationActive={false}
                        >
                          {mixEventosDonut.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: themeTokens.chartTooltipBg,
                            border: `1px solid ${themeTokens.chartTooltipBorder}`,
                            borderRadius: 4,
                            boxShadow: 'none',
                            color: themeTokens.textPrimary,
                            fontSize: 12
                          }}
                          formatter={(val, name, props) => [
                            `${val} eventos (${formatarPercentual(props.payload.pct)})`,
                            name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center-label">
                      <span className="donut-center-value" style={{ fontSize: 17 }}>
                        {clienteSelecionado.eventos?.length || 0}
                      </span>
                      <span className="donut-center-sub">Total</span>
                    </div>
                  </div>

                  <table className="regional-share-table">
                    <thead>
                      <tr>
                        <th>Natureza</th>
                        <th className="num-col">Qtd</th>
                        <th className="num-col">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mixEventosDonut.map((item) => (
                        <tr key={item.name}>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                              <span
                                className="geo-dot"
                                style={{ backgroundColor: item.color }}
                                aria-hidden="true"
                              />
                              <span>{item.name}</span>
                            </span>
                          </td>
                          <td className="num-col">{item.value}</td>
                          <td className="num-col" style={{ fontWeight: 700 }}>
                            {formatarPercentual(item.pct)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Direita: Linha do Tempo Cronológica Oficial Ant Design (Timeline - Sprint 2) */}
            <section className="flat-card" aria-labelledby="timeline-heading">
              <div className="flat-card-header">
                <div>
                  <span className="flat-section-eyebrow">HISTÓRICO DE EVENTOS B2B</span>
                  <h2 id="timeline-heading" className="flat-card-title">
                    Histórico Cronológico de Eventos
                  </h2>
                </div>

                <Radio.Group
                  value={filtroCategoriaEvento}
                  onChange={(e) => setFiltroCategoriaEvento(e.target.value)}
                  size="small"
                  buttonStyle="solid"
                >
                  <Radio.Button value="todos">Todos</Radio.Button>
                  <Radio.Button value="sucesso">Sucesso</Radio.Button>
                  <Radio.Button value="comercial">Comercial</Radio.Button>
                  <Radio.Button value="alerta">Alertas</Radio.Button>
                  <Radio.Button value="critico">Críticos</Radio.Button>
                </Radio.Group>
              </div>

              {eventosOrdenados.length === 0 ? (
                <div style={{ padding: '24px 0' }}>
                  <Empty description="Nenhum evento registrado para esta categoria." />
                </div>
              ) : (
                <div className="custom-timeline-container">
                  <Timeline
                    items={eventosOrdenados.map(getTimelineItemProps)}
                    className="antd-events-timeline"
                  />
                </div>
              )}
            </section>
          </div>

          {/* 3. AÇÕES DE GESTÃO DA CONTA (FIM DA PÁGINA) */}
          <div className="client-footer-actions-bar">
            <div className="client-footer-actions-info">
              <span className="client-footer-account-title">
                Gerenciamento da Conta: <strong>{clienteSelecionado.nome}</strong>
              </span>
              <span className="client-footer-account-sub">
                Código: {clienteSelecionado.id} · {clienteSelecionado.unidadeNome} · {clienteSelecionado.ticketMedioMensal}
              </span>
            </div>

            <Space wrap size="middle">
              <Button
                icon={<EditOutlined />}
                onClick={handleAbrirEdicao}
                size="middle"
              >
                Editar Conta
              </Button>

              <Popconfirm
                title="Excluir Conta B2B"
                description={`Tem certeza de que deseja remover "${clienteSelecionado.nome}" da carteira?`}
                onConfirm={handleExcluirCliente}
                okText="Sim, excluir"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} size="middle">
                  Excluir Conta
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </>
      )}

      {/* MODAL PARA ADICIONAR NOVO CLIENTE */}
      <Modal
        title="Adicionar Nova Conta B2B à Carteira"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Salvar Conta"
        cancelText="Cancelar"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSalvarNovoCliente}
          initialValues={{
            tenantId: tenants[0]?.id || 'tenant-sudeste',
            segmento: 'Supermercado Regional',
            scoreSaudeAtual: 85,
            tempoContratoMeses: 12,
            ticketMedio: 35000
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="nome"
            label="Razão Social / Nome Fantasia do Cliente"
            rules={[{ required: true, message: 'Por favor, informe o nome do cliente.' }]}
          >
            <Input placeholder="Ex: Hipermercados Brasil S/A" />
          </Form.Item>

          <Form.Item
            name="tenantId"
            label="Regional / Unidade Operacional"
            rules={[{ required: true }]}
          >
            <Select
              options={tenants.map((t) => ({
                value: t.id,
                label: `${t.nome} (Porte ${t.porte})`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="segmento"
            label="Segmento de Mercado"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'Supermercado Regional', label: 'Supermercado Regional' },
                { value: 'Atacarejo & Distribuição', label: 'Atacarejo & Distribuição' },
                { value: 'Rede de Frigoríficos', label: 'Rede de Frigoríficos' },
                { value: 'Conveniência & Varejo', label: 'Conveniência & Varejo' },
                { value: 'Operador Logístico B2B', label: 'Operador Logístico B2B' }
              ]}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="ticketMedio"
              label="Ticket Médio Mensal (R$)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => value.replace(/R\$\s?|(\.*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="tempoContratoMeses"
              label="Tempo de Contrato (Meses)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={120} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="scoreSaudeAtual"
            label="Score de Saúde Inicial (0 a 100)"
            extra="Scores < 40 = Crítico, 40-59 = Risco, 60-74 = Atenção, >= 75 = Saudável."
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL PARA EDITAR CONTA B2B EXISTENTE (UPDATE - CRUD) */}
      <Modal
        title={
          <div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              Editar Conta B2B: {clienteSelecionado?.nome || ''}
            </span>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
              Atualização de cadastro, porte, regional e score de saúde
            </div>
          </div>
        }
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Salvar Alterações"
        cancelText="Cancelar"
        destroyOnHidden
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSalvarEdicaoCliente}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="nome"
            label="Razão Social / Nome da Empresa"
            rules={[{ required: true, message: 'Por favor, informe a razão social.' }]}
          >
            <Input placeholder="Ex: Supermercado Alvorada Ltda" />
          </Form.Item>

          <Form.Item
            name="tenantId"
            label="Unidade Regional Vinculada"
            rules={[{ required: true }]}
          >
            <Select
              options={tenants.map((t) => ({
                value: t.id,
                label: `${t.nome} (Porte ${t.porte})`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="segmento"
            label="Segmento de Atuação Comercial"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'Supermercado Regional', label: 'Supermercado Regional' },
                { value: 'Atacarejo & Distribuição', label: 'Atacarejo & Distribuição' },
                { value: 'Rede de Frigoríficos', label: 'Rede de Frigoríficos' },
                { value: 'Conveniência & Varejo', label: 'Conveniência & Varejo' },
                { value: 'Operador Logístico B2B', label: 'Operador Logístico B2B' }
              ]}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="ticketMedio"
              label="Ticket Médio Mensal (R$)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => value.replace(/R\$\s?|(\.*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="tempoContratoMeses"
              label="Tempo de Contrato (Meses)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={180} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="scoreSaudeAtual"
              label="Score de Saúde Atual (0 a 100)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="statusSaude"
              label="Classificação de Saúde"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'Saudável', label: '● Saudável (Score >= 75)' },
                  { value: 'Atenção', label: '▲ Atenção (Score 60-74)' },
                  { value: 'Risco', label: '▲ Risco (Score 40-59)' },
                  { value: 'Crítico', label: '▲ Crítico (Score < 40)' }
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
