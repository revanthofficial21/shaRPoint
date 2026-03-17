export default function AnimatedBackground() {
  return (
    <>
      <div className="orb" style={{
        width: 600, height: 600,
        background: 'rgba(240,192,64,0.07)',
        top: '-15%', left: '-10%', animationDelay: '0s',
      }}/>
      <div className="orb" style={{
        width: 500, height: 500,
        background: 'rgba(37,99,235,0.07)',
        bottom: '-10%', right: '-5%', animationDelay: '-4s',
      }}/>
      <div className="orb" style={{
        width: 400, height: 400,
        background: 'rgba(124,58,237,0.05)',
        top: '40%', left: '40%', animationDelay: '-8s',
      }}/>
    </>
  )
}
