


import React, { useState, useEffect,useRef} from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Check, X, Edit2 } from 'lucide-react';
import { getUserDetails, delete_user, grant_app_access, revoke_app_access,disable_all_access,give_all_access} from '../../Api';
import './datatable.scss';

function DataTable() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState({});
    const dataGridRef = useRef(null);


    const handleDlt = async (id) => {
        await delete_user(id);
        fetchData();
    };

    const handleDisable = async (id) => {
        await disable_all_access(id);
        fetchData();
    };

    const handleGrantAllAccess = async (id) => {
        await give_all_access(id);
        fetchData();
    };


    const handleEdit = (id) => {
        setEditMode((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAccessChange = async (id, appName, grant) => {
        console.log(id,appName)
        try {
            if (grant) {
                await grant_app_access(id, appName);
            } else {
                await revoke_app_access(id, appName);
            }
            await fetchData(); // Refresh data after update
        } catch (error) {
            console.error("Error updating access:", error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const userData = await getUserDetails();
            setData(userData);
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dataGridRef.current && !dataGridRef.current.contains(event.target)) {
                setEditMode({});
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                setEditMode({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dataGridRef]);
    // useEffect(() => {
    //     fetchData();
    // }, [editMode]);

    const renderAccessCell = (params) => {
        const isEditing = editMode[params.row.id];
        const value = params.value;

        if (isEditing) {
            return (
                <div>
                    {value ? (
                        <button style={{ padding: '5px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ff74b0f5', color: '#ff74b0f5', background: 'none' }} 
                        onClick={() => handleAccessChange(params.row.id, params.field, false)}>
                            Revoke
                        </button>
                    ) : (
                        <button style={{ padding: '5px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #20e7a2f5', color: '#20e7a2f5', background: 'none' }}
                        onClick={() => handleAccessChange(params.row.id, params.field, true)}>
                            Grant
                        </button>
                    )}
                </div>
            );
        }

        return value ? <Check color="green" /> : <X color="red" />;
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 250 },
        { field: 'Chat', headerName: 'Chat-AI', width: 150, renderCell: renderAccessCell },
        { field: 'Document', headerName: 'Doc-AI', width: 150, renderCell: renderAccessCell },
        { field: 'Image', headerName: 'Image-AI', width: 150, renderCell: renderAccessCell },
        { field: 'Audio', headerName: 'Audio-AI', width: 150, renderCell: renderAccessCell },
        { field: 'Query', headerName: 'Query-AI', width: 150, renderCell: renderAccessCell },
        { field: 'Legal', headerName: 'Legal-AI', width: 150, renderCell: renderAccessCell },
        {
            field: 'action',
            headerName: 'Actions',
            width: 500,
            renderCell: (params) => (
                <div className="actionn">
                    <button
                        type="button"
                        className="edit_btn"
                        onClick={() => handleEdit(params.row.id)}
                    >
                        {/* <Edit2 size={16} /> */}
                        Edit Access

                    </button>
                    <button
                        type="button"
                        className="delete_btn"
                        onClick={() => handleDisable(params.row.id)}
                    >
                        Disable All Access
                    </button>
                    <button
                        type="button"
                        className="grant_btn"
                        onClick={() => handleGrantAllAccess(params.row.id)}
                    >
                        Grant All Access
                    </button>
                    {/* <button
                        type="button"
                        className="delete_btn"
                        onClick={() => handleDlt(params.row.id)}
                    >
                        Delete user
                    </button> */}
                </div>
            ),
        },
    ];

    return (
        <div className="data_table" ref={dataGridRef}>
            {loading ? (
                <div>Loading...</div>
            ) : data.length > 0 ? (
                <DataGrid
                    className="data_grid"
                    rows={data}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    checkboxSelection
                />
            ) : (
                <div>No data available</div>
            )}
        </div>
    );
}

export default DataTable;

// /* eslint-disable jsx-a11y/img-redundant-alt */
// import { DataGrid } from '@mui/x-data-grid';
// import React, { useState,useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import man1 from '../../Images/man1.jpg';
// import man2 from '../../Images/man2.jpg';
// import man3 from '../../Images/man3.jpg';
// import man4 from '../../Images/man4.jpg';
// import woman1 from '../../Images/woman1.jpg';
// import woman2 from '../../Images/woman2.jpg';
// import './datatable.scss';
// import { getUserDetails } from '../../Api';
// import { delete_user } from '../../Api';
// // Replace this data with your own
// const userData = [
//     {
//         id: '630343eb94c2812e4cd7e45d',
//         username: 'Devid434',
//         email: 'devidbom232@gmail.com',
//         image: man1,
//         status: 'active',
//         age: '24',
//     },
//     {
//         id: '6303234eb94c2812e4cd7e45e',
//         username: 'Johnn434',
//         email: 'john03434@gmail.com',
//         image: man2,
//         status: 'passive',
//         age: '29',
//     },
//     {
//         id: 'e40343eb94c2812e4cd7e4233',
//         username: 'Dilvib1233',
//         email: 'dilvibhasanjohn1233@gmail.com',
//         image: man3,
//         status: 'active',
//         age: '20',
//     },
//     {
//         id: '930343eb94c2812e4cd7e45g',
//         username: 'DoeJelia88',
//         email: 'doejelia88@gmail.com',
//         image: woman1,
//         status: 'active',
//         age: '23',
//     },
//     {
//         id: '60443eb94c2812e4cd7e45ii',
//         username: 'Lucas0984',
//         email: 'lucashossel@gmail.com',
//         image: man4,
//         status: 'passive',
//         age: '30',
//     },
//     {
//         id: 'e23343eb94c2812e4cd7e45kk',
//         username: 'Annie765',
//         email: 'anniejhon@gmail.com',
//         image: woman2,
//         status: 'active',
//         age: '23',
//     },
//     {
//         id: '63asd34eb94c2812e4cd7e45e',
//         username: 'Johnn434',
//         email: 'john03434@gmail.com',
//         image: man2,
//         status: 'passive',
//         age: '29',
//     },
//     {
//         id: 'e40gfdeb94c2812e4cd7e4233',
//         username: 'Dilvib1233',
//         email: 'dilvibhasanjohn1233@gmail.com',
//         image: man3,
//         status: 'active',
//         age: '20',
//     },
//     {
//         id: '60443lkjc2812e4cd7e45ii',
//         username: 'Lucas0984',
//         email: 'lucashossel@gmail.com',
//         image: man4,
//         status: 'passive',
//         age: '30',
//     },
//     {
//         id: '930343eb9465512e4cd7e45g',
//         username: 'DoeJelia88',
//         email: 'doejelia88@gmail.com',
//         image: woman1,
//         status: 'active',
//         age: '23',
//     },
//     {
//         id: '60443eb94c8ui2e4cd7e45ii',
//         username: 'Lucas0984',
//         email: 'lucashossel@gmail.com',
//         image: man4,
//         status: 'passive',
//         age: '30',
//     },
//     {
//         id: '6303234eb9987812ed7e45e',
//         username: 'Johnn434',
//         email: 'john03434@gmail.com',
//         image: man2,
//         status: 'passive',
//         age: '29',
//     },
// ];

// function DataTable() {
//     // const [data, setData] = useState(userData);
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const handleDlt = async(id) => {
//         await delete_user(id)
//         const userData = await getUserDetails();
//         setData(userData);
//     };

//     const fetchData = async () => {
//         try {
//             setLoading(true);
//             const userData = await getUserDetails();
//             console.log(userData)
//             setData(userData);
//         } catch (error) {
//             console.error("Error fetching user data:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const columns = [
//         {
//             field: 'id',
//             headerName: 'ID',
//             width: 250,
//             renderCell: (param) => (
//                 <div className="userr">
//                     {/* <img src={param.row.image} alt="User Image" className="userr_image" /> */}
//                     {param.row.id}
//                 </div>
//             ),
//         },
//         // {
//         //     field: 'username',
//         //     headerName: 'Username',
//         //     width: 180,
//         // },
//         { field: 'Chat', headerName: 'Chat-AI', width: 150 },
//         { field: 'Document', headerName: 'Doc-AI', width: 150 },
//         { field: 'Image', headerName: 'Image-AI', width: 150 },
//         { field: 'Audio', headerName: 'Audio-AI', width: 150 },
//         { field: 'Legal', headerName: 'Legal-AI', width: 150 },
//         // { field: 'app_access', headerName: 'Accessed App', width: 280 },
//         // {
//         //     field: 'status',
//         //     headerName: 'Status',
//         //     width: 150,
//         //     renderCell: (param) => (
//         //         <div className={`status ${param.row.status}`}>{param.row.status}</div>
//         //     ),
//         // },
//         // { field: 'age', headerName: 'Age', width: 120 },
//         {
//             field: 'action',
//             headerName: 'Action',
//             width: 170,
//             renderCell: (params) => (
//                 <div className="actionn">
//                     {/* <Link to={params.row.id}>
//                         <button type="button" className="view_btn">
//                             View
//                         </button>
//                     </Link> */}
//                     <button
//                         type="button"
//                         className="delete_btn"
//                         onClick={() => handleDlt(params.row.id)}
//                     >
//                         Delete
//                     </button>
//                     {/* <button
//                         type="button"
//                         className="delete_btn"
//                         onClick={() => handleEdit(params.row.id)}
//                     >
//                         Edit
//                     </button> */}
//                 </div>
//             ),
//         },
//     ];

//     return (
//         <div className="data_table">
//             <DataGrid
//                 className="data_grid"
//                 rows={data}
//                 columns={columns}
//                 pageSize={10}
//                 rowsPerPageOptions={[10]}
//                 checkboxSelection
//             />
//         </div>
//     );
// }

// export default DataTable;
