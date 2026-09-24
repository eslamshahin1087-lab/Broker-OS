import AppIcon from './AppIcon'

export default function PageHeader({
  icon = 'dashboard',
  eyebrow = 'Broker OS',
  title,
  description = '',
  action = null,
}) {
  return (
    <header className="page-header-v2">
      <div className="page-header-v2-main">
        <div className="page-header-v2-icon">
          <AppIcon name={icon} size={20} stroke={1.85} />
        </div>
        <div className="page-header-v2-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {action && <div className="page-header-v2-action">{action}</div>}
    </header>
  )
}
