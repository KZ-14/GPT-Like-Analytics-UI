import React, { useState, useEffect } from 'react';

const DynamicDropdown = ({ data, onSubmit }) => {
  const [selections, setSelections] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState({});

  const styles = {
    container: {
      width: '100%',
      maxWidth: '650px',
      margin: '0 auto',
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
    },
    dropdown: {
      position: 'relative',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      cursor: 'pointer',
      color: '#374151',
      fontSize: '14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dropdownLabel: {
      margin: '0',
      fontSize: '14px',
      fontWeight: 500,
    },
    dropdownIcon: {
      fontSize: '14px',
      color: '#6b7280',
      transform: 'rotate(0deg)',
      transition: 'transform 0.2s',
    },
    dropdownIconOpen: {
      transform: 'rotate(180deg)',
    },
    optionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      width: '100%',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      padding: '12px',
      maxHeight: '220px',
      overflowY: 'auto',
      zIndex: 1000,
    },
    option: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px',
      cursor: 'pointer',
      borderRadius: '4px',
      fontSize: '14px',
      color: '#374151',
    },
    checkbox: {
      marginRight: '8px',
    },
    selectAll: {
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#2563eb',
      cursor: 'pointer',
    },
    submitButton: {
      width: '100%',
      padding: '12px',
      marginTop: '16px',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    },
  };

  useEffect(() => {
    if (data?.user_input_required) {
      const initialSelections = {};
      Object.keys(data.user_input_required).forEach((key) => {
        initialSelections[key] = [];
      });
      setSelections(initialSelections);
    }
  }, [data]);

  const handleSelect = (field, value) => {
    setSelections((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const toggleDropdown = (field) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSelectAll = (field) => {
    const allSelected = selections[field]?.length === data.user_input_required[field].length;
    setSelections((prev) => ({
      ...prev,
      [field]: allSelected ? [] : [...data.user_input_required[field]],
    }));
  };

  const handleSubmit = () => {
    onSubmit({ user_input_required: selections });
  };

  if (!data?.user_input_required) return null;

  const formatFieldName = (field) =>
    field
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <div style={styles.container}>
      {Object.entries(data.user_input_required).map(([field, values]) => (
        <div key={field} style={{ marginBottom: '16px', position: 'relative' }}>
          <div
            style={styles.dropdown}
            onClick={() => toggleDropdown(field)}
          >
            <span style={styles.dropdownLabel}>{formatFieldName(field)}</span>
            <span
              style={{
                ...styles.dropdownIcon,
                ...(dropdownOpen[field] ? styles.dropdownIconOpen : {}),
              }}
            >
              ▼
            </span>
          </div>
          {dropdownOpen[field] && (
            <div style={styles.optionsContainer}>
              <div
                style={styles.selectAll}
                onClick={() => handleSelectAll(field)}
              >
                {selections[field]?.length === values.length ? 'Deselect All' : 'Select All'}
              </div>
              {values.map((value) => {
                const isSelected = selections[field]?.includes(value);
                return (
                  <div
                    key={value}
                    style={styles.option}
                    onClick={() => handleSelect(field, value)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={styles.checkbox}
                    />
                    <label>{value}</label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <button onClick={handleSubmit} style={styles.submitButton}>
        Submit Selections
      </button>
    </div>
  );
};

export default DynamicDropdown;

















// import React, { useState, useEffect, useRef } from 'react';

// const DynamicDropdown = ({ data, onSubmit }) => {
//   const [selections, setSelections] = useState({});
//   const [dropdownOpen, setDropdownOpen] = useState({});
//   const containerRef = useRef(null);

//   const styles = {
//     container: {
//       width: '100%',
//       maxWidth: '600px',
//       margin: '0 auto',
//       padding: '16px',
//       backgroundColor: '#ffffff',
//       borderRadius: '8px',
//       boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//       border: '1px solid #e5e7eb',
//     },
//     dropdown: {
//       position: 'relative',
//       padding: '10px',
//       borderRadius: '6px',
//       border: '1px solid #e5e7eb',
//       backgroundColor: '#f9fafb',
//       cursor: 'pointer',
//       color: '#374151',
//       fontSize: '14px',
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//     },
//     dropdownLabel: {
//       margin: '0',
//       fontSize: '14px',
//       fontWeight: 500,
//     },
//     dropdownIcon: {
//       fontSize: '14px',
//       color: '#6b7280',
//       transform: 'rotate(0deg)',
//       transition: 'transform 0.2s',
//     },
//     dropdownIconOpen: {
//       transform: 'rotate(180deg)',
//     },
//     optionsContainer: {
//       position: 'absolute',
//       top: '100%',
//       left: 0,
//       width: '100%',
//       backgroundColor: '#ffffff',
//       border: '1px solid #e5e7eb',
//       borderRadius: '6px',
//       boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
//       padding: '12px',
//       maxHeight: '200px',
//       overflowY: 'auto',
//       zIndex: 1000,
//     },
//     option: {
//       display: 'flex',
//       alignItems: 'center',
//       padding: '8px',
//       cursor: 'pointer',
//       borderRadius: '4px',
//       fontSize: '14px',
//       color: '#374151',
//     },
//     checkbox: {
//       marginRight: '8px',
//     },
//     submitButton: {
//       width: '100%',
//       padding: '12px',
//       marginTop: '16px',
//       backgroundColor: '#2563eb',
//       color: '#ffffff',
//       border: 'none',
//       borderRadius: '6px',
//       fontSize: '14px',
//       fontWeight: 500,
//       cursor: 'pointer',
//       transition: 'background-color 0.2s ease',
//     },
//   };

//   useEffect(() => {
//     if (data?.user_input_required) {
//       const initialSelections = {};
//       Object.keys(data.user_input_required).forEach((key) => {
//         initialSelections[key] = [];
//       });
//       setSelections(initialSelections);
//     }
//   }, [data]);

//   const handleSelect = (field, value) => {
//     setSelections((prev) => ({
//       ...prev,
//       [field]: prev[field].includes(value)
//         ? prev[field].filter((item) => item !== value)
//         : [...prev[field], value],
//     }));
//   };

//   const toggleDropdown = (field) => {
//     setDropdownOpen((prev) => ({
//       ...prev,
//       [field]: !prev[field],
//     }));
//   };

//   const handleSubmit = () => {
//     onSubmit({ user_input_required: selections });
//   };

//   if (!data?.user_input_required) return null;

//   const formatFieldName = (field) =>
//     field
//       .split('_')
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');

//   return (
//     <div style={styles.container} ref={containerRef}>
//       {Object.entries(data.user_input_required).map(([field, values]) => (
//         <div key={field} style={{ marginBottom: '16px', position: 'relative' }}>
//           <div
//             style={styles.dropdown}
//             onClick={() => toggleDropdown(field)}
//           >
//             <span style={styles.dropdownLabel}>{formatFieldName(field)}</span>
//             <span
//               style={{
//                 ...styles.dropdownIcon,
//                 ...(dropdownOpen[field] ? styles.dropdownIconOpen : {}),
//               }}
//             >
//               ▼
//             </span>
//           </div>
//           {dropdownOpen[field] && (
//             <div style={styles.optionsContainer}>
//               {values.map((value) => {
//                 const isSelected = selections[field]?.includes(value);
//                 return (
//                   <div
//                     key={value}
//                     style={styles.option}
//                     onClick={() => handleSelect(field, value)}
//                   >
//                     <input
//                       type="checkbox"
//                       checked={isSelected}
//                       readOnly
//                       style={styles.checkbox}
//                     />
//                     <label>{value}</label>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       ))}

//       <button onClick={handleSubmit} style={styles.submitButton}>
//         Submit Selections
//       </button>
//     </div>
//   );
// };

// export default DynamicDropdown;



// import React, { useState, useEffect } from 'react';

// const DynamicDropdown = ({ data, onSubmit }) => {
//   const [selections, setSelections] = useState({});

//   const styles = {
//     container: {
//       width: '100%',
//       maxWidth: '600px',
//       margin: '0 auto',
//       backgroundColor: '#ffffff',
//       borderRadius: '8px',
//       boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//       border: '1px solid #e5e7eb',
//       overflow: 'hidden'
//     },
//     header: {
//       padding: '16px 24px',
//       borderBottom: '1px solid #e5e7eb',
//       backgroundColor: '#f8fafc'
//     },
//     headerTitle: {
//       margin: 0,
//       fontSize: '18px',
//       fontWeight: 600,
//       color: '#1f2937'
//     },
//     content: {
//       padding: '24px'
//     },
//     fieldContainer: {
//       marginBottom: '24px'
//     },
//     fieldHeader: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: '12px'
//     },
//     label: {
//       fontSize: '14px',
//       fontWeight: 500,
//       color: '#374151'
//     },
//     selectAllButton: {
//       padding: '6px 12px',
//       fontSize: '12px',
//       fontWeight: 500,
//       borderRadius: '6px',
//       cursor: 'pointer',
//       transition: 'all 0.2s ease',
//       border: '1px solid #2563eb',
//       backgroundColor: 'transparent',
//       color: '#2563eb'
//     },
//     selectAllButtonSelected: {
//       backgroundColor: '#eff6ff',
//       borderColor: '#2563eb',
//       color: '#2563eb'
//     },
//     optionsGrid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(2, 1fr)',
//       gap: '12px'
//     },
//     option: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       padding: '10px 16px',
//       border: '1px solid #e5e7eb',
//       borderRadius: '6px',
//       cursor: 'pointer',
//       backgroundColor: '#ffffff',
//       transition: 'all 0.2s ease',
//       fontSize: '14px',
//       color: '#374151',
//       fontWeight: 400
//     },
//     selectedOption: {
//       backgroundColor: '#eff6ff',
//       borderColor: '#2563eb',
//       color: '#2563eb'
//     },
//     checkmark: {
//       fontSize: '16px',
//       color: '#2563eb'
//     },
//     submitButton: {
//       width: '100%',
//       padding: '12px',
//       backgroundColor: '#2563eb',
//       color: '#ffffff',
//       border: 'none',
//       borderRadius: '6px',
//       fontSize: '14px',
//       fontWeight: 500,
//       cursor: 'pointer',
//       transition: 'background-color 0.2s ease',
//       marginTop: '24px'
//     }
//   };

//   useEffect(() => {
//     if (data?.user_input_required) {
//       const initialSelections = {};
//       Object.keys(data.user_input_required).forEach(key => {
//         initialSelections[key] = [];
//       });
//       setSelections(initialSelections);
//     }
//   }, [data]);

//   const handleSelect = (field, value) => {
//     setSelections(prev => ({
//       ...prev,
//       [field]: prev[field].includes(value)
//         ? prev[field].filter(item => item !== value)
//         : [...prev[field], value]
//     }));
//   };

//   const handleSelectAll = (field, values) => {
//     setSelections(prev => ({
//       ...prev,
//       [field]: prev[field].length === values.length ? [] : [...values]
//     }));
//   };

//   const handleSubmit = () => {
//     onSubmit({ user_input_required: selections });
//   };

//   if (!data?.user_input_required) return null;

//   const formatFieldName = (field) => {
//     return field
//       .split('_')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.header}>
//         <h3 style={styles.headerTitle}>Select Options</h3>
//       </div>
//       <div style={styles.content}>
//         {Object.entries(data.user_input_required).map(([field, values]) => {
//           const isAllSelected = selections[field]?.length === values.length;
          
//           return (
//             <div key={field} style={styles.fieldContainer}>
//               <div style={styles.fieldHeader}>
//                 <label style={styles.label}>{formatFieldName(field)}</label>
//                 <button
//                   onClick={() => handleSelectAll(field, values)}
//                   style={{
//                     ...styles.selectAllButton,
//                     ...(isAllSelected ? styles.selectAllButtonSelected : {})
//                   }}
//                   onMouseOver={(e) => {
//                     e.target.style.backgroundColor = isAllSelected ? '#dbeafe' : '#eff6ff';
//                   }}
//                   onMouseOut={(e) => {
//                     e.target.style.backgroundColor = isAllSelected ? '#eff6ff' : 'transparent';
//                   }}
//                 >
//                   {isAllSelected ? 'Deselect All' : 'Select All'}
//                 </button>
//               </div>
              
//               <div style={styles.optionsGrid}>
//                 {Array.isArray(values) && values.map((value) => {
//                   const isSelected = selections[field]?.includes(value);
//                   return (
//                     <button
//                       key={value}
//                       onClick={() => handleSelect(field, value)}
//                       style={{
//                         ...styles.option,
//                         ...(isSelected ? styles.selectedOption : {})
//                       }}
//                       onMouseOver={(e) => {
//                         if (!isSelected) {
//                           e.target.style.backgroundColor = '#f9fafb';
//                           e.target.style.borderColor = '#d1d5db';
//                         }
//                       }}
//                       onMouseOut={(e) => {
//                         if (!isSelected) {
//                           e.target.style.backgroundColor = '#ffffff';
//                           e.target.style.borderColor = '#e5e7eb';
//                         }
//                       }}
//                     >
//                       <span>{value}</span>
//                       {isSelected && <span style={styles.checkmark}>✓</span>}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}
        
//         <button
//           onClick={handleSubmit}
//           style={styles.submitButton}
//           onMouseOver={(e) => {
//             e.target.style.backgroundColor = '#1d4ed8';
//           }}
//           onMouseOut={(e) => {
//             e.target.style.backgroundColor = '#2563eb';
//           }}
//         >
//           Submit Selections
//         </button>
//       </div>
//     </div>
//   );
// };

// export default DynamicDropdown;