import { useEffect, useRef, useState } from "react";
import SuperApp from './SuperApp';

const PreviewVideo = () => {

//   const location = useLocation();
  const [isLeaving, setIsLeaving] = useState(false);
  const handleSuperAppNavigation = (isLeaving) => {
    setIsLeaving(isLeaving);

  };

  return (
    
    <div className = {`NoAccessApp ${isLeaving ? 'leaving' : ''}`} style={{
      fontFamily: "'Arial', sans-serif",
      margin: 0,
      padding: 0,
      backgroundColor: '#fff',
      color: '#333',
      overflow: 'hidden'
    }}>
        <SuperApp onNavigation={handleSuperAppNavigation} />
      <header style={{
        padding: '20px',
        backgroundColor: '#e1dfdd',
        color: '#333',
        textAlign: 'center',
        borderBottom: '1px solid #ccc',
        marginTop : '20%'
      }}>
        <h1>You do not have access to this application. Please contact the administrator</h1>
      </header>
      {/* <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '90vh'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '30px',
          alignItems: 'center',
          width: '90%'
        }}>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '30px',
            borderRadius: '12px',
            width: '30%',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3 style={{
              color: '#333',
              fontSize: '1.8em',
              marginBottom: '20px',
              textAlign: 'center'
            }}>Pros of ImageAI</h3>
            <div>
              <ul style={{ paddingLeft: '20px' }}>
                <li style={{
                  fontSize: '1.1em',
                  marginBottom: '10px',
                  lineHeight: 1.6,
                  color: '#333'
                }}>Powerful AI for image recognition</li>
                <li style={{
                  fontSize: '1.1em',
                  marginBottom: '10px',
                  lineHeight: 1.6,
                  color: '#333'
                }}>Seamless integration with other tools</li>
                <li style={{
                  fontSize: '1.1em',
                  marginBottom: '10px',
                  lineHeight: 1.6,
                  color: '#333'
                }}>Highly accurate models</li>
              </ul>
            </div>
          </div>
          <video controls style={{
            width: '70%',
            border: '3px solid #e1dfdd',
            borderRadius: '12px'
          }}>
            <source src="sample-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div> */}
    </div>
  );
};

export default PreviewVideo