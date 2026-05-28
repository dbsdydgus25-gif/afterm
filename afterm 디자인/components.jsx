// components.jsx — atomic UI for afterm
// Shared by every screen. Tokens via colors_and_type.css; copy is Korean.

const { useState, useRef, useEffect } = React;

// ── icon helper (Lucide via CDN). Inherits color/size from parent.
function Icon({ name, size = 20, color, strokeWidth = 1.75, style = {} }) {
  // Render an <i data-lucide=...> and let lucide.createIcons() upgrade it.
  return (
    <i
      data-lucide={name}
      style={{
        width: size, height: size, color,
        strokeWidth, display: 'inline-flex',
        ...style,
      }}
    />
  );
}

// ── AFTERM wordmark
function AftermLogo({ size = 16, color = 'var(--color-primary-normal)' }) {
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: size,
      letterSpacing: '-0.01em',
      color,
      lineHeight: 1,
    }}>AFTERM</span>
  );
}

// ── service logo (squareish badge with initials)
function ServiceLogo({ service, size = 44, radius = 12 }) {
  if (!service) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: service.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700,
      fontSize: size * 0.36,
      fontFamily: 'var(--font-display)',
      letterSpacing: '-0.02em',
      flexShrink: 0,
    }}>{service.initials}</div>
  );
}

// ── Topbar with back + title (+ optional trailing)
function Topbar({ title, onBack, trailing, brand }) {
  return (
    <div className="topbar">
      {onBack ? (
        <div className="topbar-icon-btn" onClick={onBack}>
          <Icon name="chevron-left" size={24} />
        </div>
      ) : (
        <div style={{ width: 40, height: 40, paddingLeft: 8, display: 'flex', alignItems: 'center' }}>
          {brand && <AftermLogo />}
        </div>
      )}
      <div style={{
        flex: 1, textAlign: 'center',
        fontSize: 16, fontWeight: 600, letterSpacing: '-0.002em',
      }}>{title}</div>
      <div style={{ display: 'flex' }}>
        {trailing || <div style={{ width: 40, height: 40 }} />}
      </div>
    </div>
  );
}

// ── Bottom tab bar
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'home',     label: '홈',    icon: 'home' },
    { id: 'apply',    label: '신청',   icon: 'plus-circle' },
    { id: 'notify',   label: '알림',   icon: 'bell' },
    { id: 'mypage',   label: '마이',   icon: 'user' },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <div key={t.id}
          className={'tab' + (active === t.id ? ' active' : '')}
          onClick={() => onChange && onChange(t.id)}>
          <Icon name={t.icon} size={22} strokeWidth={t.id === active ? 2.2 : 1.7} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Button
function Button({ children, variant = 'primary', size = 'md', block, onClick, disabled, leadingIcon, trailingIcon }) {
  const className = [
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'secondary' && 'btn-secondary',
    variant === 'ghost' && 'btn-ghost',
    size === 'sm' && 'btn-sm',
    block && 'btn-block',
  ].filter(Boolean).join(' ');
  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {leadingIcon && <Icon name={leadingIcon} size={size === 'sm' ? 16 : 18} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}

// ── Step indicator — THREE VARIATIONS driven by stepStyle tweak
// stepStyle: 'number' | 'progress' | 'checklist'
function StepIndicator({ steps, current, style = 'number' }) {
  if (style === 'progress') return <StepProgressBar steps={steps} current={current} />;
  if (style === 'checklist') return <StepChecklist steps={steps} current={current} />;
  return <StepNumbered steps={steps} current={current} />;
}

function StepNumbered({ steps, current }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px 16px', gap: 8,
    }}>
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: done ? 'var(--color-primary-normal)' : active ? 'var(--color-primary-normal)' : '#fff',
                color: done || active ? '#fff' : 'var(--color-label-alternative)',
                border: done || active ? '0' : '1.5px solid var(--color-line-normal-normal)',
              }}>{done ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</div>
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: active ? 'var(--color-label-strong)' : 'var(--color-label-alternative)',
                letterSpacing: 0.025,
              }}>{s.label}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 1.5, borderRadius: 1,
                background: done ? 'var(--color-primary-normal)' : 'var(--color-line-normal-normal)',
                marginBottom: 18,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepProgressBar({ steps, current }) {
  const total = steps.length;
  const pct = ((current + 1) / total) * 100;
  return (
    <div style={{ padding: '12px 20px 16px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, fontWeight: 600,
        color: 'var(--color-label-alternative)',
        marginBottom: 8,
      }}>
        <span style={{ color: 'var(--color-primary-normal)' }}>
          STEP {String(current + 1).padStart(2, '0')} · {steps[current].label}
        </span>
        <span>{current + 1} / {total}</span>
      </div>
      <div style={{
        height: 6, borderRadius: 3,
        background: 'var(--color-coolNeutral-96)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: pct + '%',
          background: 'var(--color-primary-normal)',
          borderRadius: 3,
          transition: 'width 400ms ease',
        }} />
      </div>
    </div>
  );
}

function StepChecklist({ steps, current }) {
  return (
    <div style={{ padding: '8px 20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 0',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: done ? 'var(--color-primary-normal)' : active ? '#fff' : '#fff',
              border: done ? '0' : active ? '1.5px solid var(--color-primary-normal)' : '1.5px solid var(--color-line-normal-normal)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
            }}>
              {done && <Icon name="check" size={12} strokeWidth={3.5} />}
              {active && <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-primary-normal)' }} />}
            </div>
            <span style={{
              fontSize: 13, fontWeight: active ? 700 : 500,
              color: done ? 'var(--color-label-alternative)' : active ? 'var(--color-label-strong)' : 'var(--color-label-alternative)',
              textDecoration: done ? 'none' : 'none',
            }}>
              STEP {String(i + 1).padStart(2, '0')} · {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Section header (in body)
function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 20px 8px',
    }}>
      <div style={{
        fontSize: 15, fontWeight: 700,
        letterSpacing: '-0.012em',
        color: 'var(--color-label-strong)',
      }}>{title}</div>
      {action && (
        <button onClick={onAction} style={{
          border: 0, background: 'transparent',
          fontSize: 13, fontWeight: 600,
          color: 'var(--color-label-neutral)',
          letterSpacing: 0.025,
          display: 'inline-flex', alignItems: 'center', gap: 2,
          cursor: 'pointer',
        }}>
          {action}
          <Icon name="chevron-right" size={14} />
        </button>
      )}
    </div>
  );
}

// ── Status pip
function StatusPip({ state }) {
  const meta = STATE_META[state] || STATE_META.pending;
  return (
    <span className="pip" style={{ color: meta.color }}>
      <span className="pip-dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

// ── Empty/info row
function ServiceListRow({ service, state, note, updatedAt, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 20px',
      cursor: onClick ? 'pointer' : 'default',
      borderBottom: '1px solid var(--color-line-normal-normal)',
    }}>
      <ServiceLogo service={service} size={40} radius={10} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 600,
          color: 'var(--color-label-strong)',
          letterSpacing: '-0.002em',
        }}>{service.name}</div>
        <div style={{
          fontSize: 13, color: 'var(--color-label-alternative)',
          marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: 0.0145,
        }}>{note}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <StatusPip state={state} />
        {updatedAt && <span style={{ fontSize: 11, color: 'var(--color-label-alternative)' }}>{updatedAt}</span>}
      </div>
    </div>
  );
}

// ── Big stat (used on home & report)
function StatBlock({ label, value, valueColor, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: 'var(--color-label-alternative)',
        letterSpacing: 0.025,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28, fontWeight: 700,
        color: valueColor || 'var(--color-label-strong)',
        letterSpacing: '-0.023em',
        lineHeight: 1.1,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-label-alternative)' }}>{sub}</div>}
    </div>
  );
}

// ── Progress ring (SVG)
function ProgressRing({ value = 0, size = 120, stroke = 10, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} fill="none" className="ring-bg" />
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} fill="none" className="ring-fg"
          strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: size * 0.28, fontWeight: 700, letterSpacing: '-0.025em',
          color: 'var(--color-label-strong)',
          lineHeight: 1,
        }}>{label}</div>
        {sub && <div style={{
          fontSize: 11, marginTop: 4,
          color: 'var(--color-label-alternative)',
          letterSpacing: 0.031,
        }}>{sub}</div>}
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, AftermLogo, ServiceLogo, Topbar, TabBar, Button,
  StepIndicator, SectionHeader, StatusPip, ServiceListRow,
  StatBlock, ProgressRing,
});
