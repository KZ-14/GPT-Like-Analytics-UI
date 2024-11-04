function Loading(){
return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Spinner */}
        <div style={{
          width: '70px',
          height: '70px',
          border: '8px solid rgba(0, 0, 0, 0.1)',
          borderTop: '8px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s ease-in-out infinite',
        }}></div>

        {/* Loading text */}
        <div style={{
          marginTop: '20px',
          fontSize: '18px',
          color: '#555',
          letterSpacing: '1px',
          animation: 'fadeIn 1.5s ease-in-out infinite alternate',
        }}>
          Please wait...
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            0% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

export default Loading;