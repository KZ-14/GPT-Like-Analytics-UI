// import React from 'react';
// import { Table, Button } from 'react-bootstrap';
// import { saveAs } from 'file-saver';
// import * as XLSX from 'xlsx';

// const DataFrameDisplay = ({ data }) => {
//   const downloadData = (format) => {
//     if (format === 'csv') {
//       const csvData = convertToCSV(data);
//       const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
//       saveAs(blob, 'data.csv');
//     } else if (format === 'excel') {
//       const workbook = XLSX.utils.book_new();
//       const worksheet = XLSX.utils.json_to_sheet(data);
//       XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
//       XLSX.writeFile(workbook, 'data.xlsx');
//     }
//   };

//   const convertToCSV = (data) => {
//     const csvRows = [];
//     const headers = Object.keys(data[0]);
//     csvRows.push(headers.join(','));

//     for (const row of data) {
//       const values = headers.map((header) => row[header]);
//       csvRows.push(values.join(','));
//     }

//     return csvRows.join('\n');
//   };

//   return (
//     <div>
//       <div className="table-responsive">
//         <Table striped bordered hover>
//           <thead>
//             <tr>
//               {Object.keys(data[0]).map((column) => (
//                 <th key={column}>{column}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {data.slice(0, 10).map((row, index) => (
//               <tr key={index}>
//                 {Object.values(row).map((value, colIndex) => (
//                   <td key={`${index}-${colIndex}`}>{value}</td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </Table>
//       </div>
//       <div className="d-flex justify-content-end mt-3">
//         <Button variant="primary" className="mr-2" onClick={() => downloadData('csv')}>
//           Download as CSV
//         </Button>
//         <Button variant="primary" onClick={() => downloadData('excel')}>
//           Download as Excel
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default DataFrameDisplay;
import React from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const DataFrameDisplay = ({ data }) => {
  const downloadData = (format) => {
    if (format === 'csv') {
      const csvData = convertToCSV(data);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, 'data.csv');
    } else if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, 'data.xlsx');
    }
  };

  const convertToCSV = (data) => {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map((header) => row[header]);
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  return (
    <div className="data-frame-container">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {Object.keys(data[0]).map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, colIndex) => (
                  <td key={`${index}-${colIndex}`}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="button-container">
        <button onClick={() => downloadData('csv')} className="download-button">
          Download as CSV
        </button>
        <button onClick={() => downloadData('excel')} className="download-button">
          Download as Excel
        </button>
      </div>
    </div>
  );
};

export default DataFrameDisplay;
