import AppIcon from './AppIcon'

export default function PageHeader({
  icon = 'dashboard',
  eyebrow = 'Broker OS',
  title,
  description = '',
  action = null,
}) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        <div className="page-header-icon">
          <AppIcon name={icon} size={20} stroke={1.9} />
        </div>
        <div className="page-header-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  )
}
