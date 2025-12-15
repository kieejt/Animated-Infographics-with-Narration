import { AbsoluteFill } from "remotion";

export default function Subtitle({ text, settings }) {
    if (!text) return null;

    const {
        textColor = '#ffffff',
        backgroundColor = '#000000',
        fontSize = 24,
        marginBottom = 40,
        showBackground = true
    } = settings || {};

    return (
        <AbsoluteFill style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            paddingBottom: '3rem',
            pointerEvents: 'none'
        }}>
            <div
                style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    backgroundColor: showBackground ? backgroundColor : 'transparent',
                    backdropFilter: showBackground ? 'blur(4px)' : 'none',
                    boxShadow: showBackground ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                    maxWidth: '80%',
                    marginBottom: `${marginBottom}px`,
                    transition: 'all 0.3s'
                }}
            >
                <h2
                    style={{
                        fontWeight: '500',
                        lineHeight: '1.5',
                        letterSpacing: '0.025em',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        fontFamily: 'sans-serif',
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        margin: 0
                    }}
                >
                    {text}
                </h2>
            </div>
        </AbsoluteFill>
    );
}
