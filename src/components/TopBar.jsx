import React from 'react';
import { Select, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  TeamOutlined,
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import './componentsCSS/TopBar.css';

export default function NavigationBar({
  currentTab,
  onTabChange,
  selectedTenantId,
  onTenantChange,
  tenants = [],
  themeMode,
  onToggleTheme
}) {
  const navItems = [
    {
      key: 'visao-geral',
      step: '01',
      label: 'Visão Executiva',
      shortLabel: 'Visão',
      icon: <AppstoreOutlined />
    },
    {
      key: 'comparativo',
      step: '02',
      label: 'Comparativo Regional',
      shortLabel: 'Comparativo',
      icon: <BarChartOutlined />
    },
    {
      key: 'historico-clientes',
      step: '03',
      label: 'Jornada de Clientes',
      shortLabel: 'Jornada',
      icon: <TeamOutlined />
    }
  ];

  const tenantOptions = [
    {
      value: 'todos',
      label: 'Todas as Unidades (Consolidado)'
    },
    ...tenants.map((t) => ({
      value: t.id,
      label: `${t.nome} · Porte ${t.porte}`
    }))
  ];

  const mobileTenantOptions = [
    {
      value: 'todos',
      label: 'Todas as Regionais'
    },
    ...tenants.map((t) => ({
      value: t.id,
      label: t.nome.replace('Unidade ', '')
    }))
  ];

  return (
    <>
      {/* =========================================================================
          DESKTOP SIDEBAR (>= 1024px)
          ========================================================================= */}
      <aside className="desktop-sidebar" aria-label="Navegação Lateral Principal">
        <div className="sidebar-top">
          {/* Brand Institucional */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('visao-geral');
            }}
            className="sidebar-brand"
          >
            <img
              src="/primora-logo-white.webp"
              alt="Primora Soluções"
              className="sidebar-logo primora-brand-img"
            />
            <div className="sidebar-brand-titles">
              <span className="sidebar-company-name">Distribuidora Vetor</span>
              <span className="sidebar-system-label">MULTI-TENANT INTELLIGENCE</span>
            </div>
          </a>

          {/* Seletor de Escopo / Tenant */}
          <div className="sidebar-tenant-section">
            <span className="sidebar-section-label">ESCOPO OPERACIONAL</span>
            <Select
              id="desktop-sidebar-tenant-select"
              value={selectedTenantId}
              onChange={onTenantChange}
              options={tenantOptions}
              className="sidebar-tenant-select"
              popupMatchSelectWidth={false}
            />
          </div>

          {/* Navegação Vertical */}
          <nav className="sidebar-nav" aria-label="Menu de Módulos">
            <span className="sidebar-section-label">MÓDULOS ANALÍTICOS</span>
            <div className="sidebar-nav-list">
              {navItems.map((item) => {
                const isActive = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onTabChange(item.key)}
                    className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="sidebar-item-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="sidebar-item-label">{item.label}</span>
                    <span className="sidebar-item-step">{item.step}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={onToggleTheme}
            className="sidebar-theme-btn"
            title="Alternar entre modo escuro e claro"
          >
            {themeMode === 'dark' ? <BulbFilled /> : <BulbOutlined />}
            <span>Tema: {themeMode === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
          </button>
          <div className="sidebar-system-info">
            <span>PRIMORA VETOR · V2.4</span>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE & TABLET COMPACT TOP HEADER (< 1024px)
          ========================================================================= */}
      <header className="mobile-top-bar" aria-label="Cabeçalho Compacto Mobile">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('visao-geral');
          }}
          className="mobile-top-brand"
        >
          <img
            src="/primora-logo-white.webp"
            alt="Primora"
            className="mobile-top-logo primora-brand-img"
          />
          <span className="mobile-top-brand-text">Vetor</span>
        </a>

        <div className="mobile-top-controls">
          <Select
            value={selectedTenantId}
            onChange={onTenantChange}
            options={mobileTenantOptions}
            size="small"
            className="mobile-tenant-select"
            popupMatchSelectWidth={false}
          />
          <button
            type="button"
            onClick={onToggleTheme}
            className="mobile-theme-toggle"
            aria-label="Alternar tema"
          >
            {themeMode === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          MOBILE & TABLET BOTTOM NAVIGATION BAR (< 1024px)
          ========================================================================= */}
      <nav className="mobile-bottom-nav" aria-label="Navegação Inferior Mobile">
        {navItems.map((item) => {
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className={`bottom-nav-item ${isActive ? 'bottom-nav-item--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="bottom-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bottom-nav-label">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
