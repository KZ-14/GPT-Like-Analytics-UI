import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import { Tooltip } from '@mui/material';
import React, { useState, useEffect,useRef} from 'react';
import 'react-circular-progressbar/dist/styles.css';
import { Pie, PieChart, ResponsiveContainer } from 'recharts';
import { token_usage } from '../../Api';
// import css filr
import './progressBar.scss';

function ProgressBar() {
    const data01 = [
        { name: 'Users', value: 23 },
        { name: 'Hotels', value: 30 },
        { name: 'Rooms', value: 15 },
        { name: 'Blogs', value: 19 },
        { name: 'Balance', value: 20 },
    ];

    const [data,setData] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            const temp_data = await token_usage();
            console.log(temp_data)
            const formattedData = temp_data.map(item => ({
                Time: new Date(item.Time).toLocaleString(), // Format Time as needed
                Total_tokens: item.Total_tokens,
            }));
            setData(formattedData);
            console.log('Formatted Data:', formattedData); // Log the formatted data
        };
        
        fetchData();
    }, []);

    return (
        <div className="progress_bar">
            <div className="top">
                <p>Total Revenue</p>
                <MoreVertOutlinedIcon />
            </div>

            <div className="middle">
                <div className="progress">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart width={400} height={400}>
                            <Pie
                                dataKey="Total_tokens"
                                isAnimationActive={false}
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#536def"
                                label
                            />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <p>Total tokens used today.</p>
                <p className="price">
                    {/* <AttachMoneyOutlinedIcon style={{ fontSize: '32px' }} /> */}
                    ...
                </p>
            </div>

            {/* <div className="bottom">
                <p>Previous transection processing. Last payments may not be included.</p>

                <div className="botom_nested">
                    <div className="nested_nested">
                        <p>Last Week</p>
                        <p className="pricee">
                            <KeyboardArrowUpOutlinedIcon /> $11.9k
                        </p>
                    </div>
                    <div className="nested_nested">
                        <p>Last Month</p>
                        <p className="pricee decrese">
                            <KeyboardArrowUpOutlinedIcon /> $12.4k
                        </p>
                    </div>
                </div>
            </div> */}
        </div>
    );
}

export default ProgressBar;
