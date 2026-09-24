import logo from '../assets/logo.png'

export default function Logo({ width = 150, className = '' }) {
  return (
    <img
      className={'app-logo ' + className}
      src={logo}
      alt="Broker OS"
      width={width}
      style={{ width }}
    />
  )
}
